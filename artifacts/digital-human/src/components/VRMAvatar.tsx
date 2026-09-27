import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

type VRMAvatarProps = {
  isSpeaking: boolean;
  speechText?: string;
};

type Runtime = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  vrm: any;
  frame: number;
  lastTime: number;
};

const MOUTH_EXPRESSIONS = ['aa', 'ih', 'ou', 'ee', 'oh'];

function getEmotion(text: string) {
  const normalized = text.toLowerCase();
  if (normalized.includes('*rire*')) return 'happy';
  if (normalized.includes('*sourire*')) return 'happy';
  if (normalized.includes('*oups*')) return 'surprised';
  if (normalized.includes('*sérieux*') || normalized.includes('*serieux*')) return 'angry';
  if (normalized.includes('*hmmmmm*')) return 'thinking';
  return 'neutral';
}

function resetExpression(manager: any, name: string) {
  try {
    manager.setValue(name, 0);
  } catch {
    // Some VRM models do not expose every optional expression.
  }
}

function setExpression(manager: any, name: string, value: number) {
  try {
    manager.setValue(name, value);
  } catch {
    // Some VRM models use a different expression set.
  }
}

function applyMouth(manager: any, text: string, elapsedMs: number) {
  MOUTH_EXPRESSIONS.forEach((name) => resetExpression(manager, name));
  if (!text) return;

  // Rhubarb uses phonemes/visemes. This 70 ms scheduler keeps the same
  // contract in the browser: one viseme is selected every 70 ms and is
  // applied before the next animation frame.
  const character = text[Math.max(0, Math.floor((elapsedMs - 70) / 70)) % text.length].toLowerCase();
  const viseme = /[aouâà]/.test(character)
    ? 'aa'
    : /[iîy]/.test(character)
      ? 'ih'
      : /[eéèê]/.test(character)
        ? 'ee'
        : /[ouùû]/.test(character)
          ? 'ou'
          : /[bmp]/.test(character)
            ? 'oh'
            : MOUTH_EXPRESSIONS[Math.floor(elapsedMs / 140) % MOUTH_EXPRESSIONS.length];
  setExpression(manager, viseme, 0.75);
}

function applyBodyGesture(vrm: any, text: string, elapsedMs: number) {
  const humanoid = vrm.humanoid;
  if (!humanoid) return;

  const seconds = elapsedMs / 1000;
  const rightHand = humanoid.getNormalizedBoneNode?.('rightHand');
  const rightUpperArm = humanoid.getNormalizedBoneNode?.('rightUpperArm');
  const leftUpperArm = humanoid.getNormalizedBoneNode?.('leftUpperArm');
  const neck = humanoid.getNormalizedBoneNode?.('neck');
  const isLaughing = text.toLowerCase().includes('*rire*');
  const isThinking = text.toLowerCase().includes('*hmmmmm*');
  const isChalk = text.toLowerCase().includes('*son de craie*');
  const isSnap = text.toLowerCase().includes('*claquement de doigts*');
  const laughMotion = isLaughing ? Math.sin(seconds * 9) : 0;

  if (rightHand) {
    rightHand.rotation.z = isSnap ? Math.sin(seconds * 18) * 0.22 : 0;
  }
  if (rightUpperArm) {
    rightUpperArm.rotation.z = isChalk ? Math.sin(seconds * 4) * 0.4 : 0;
  }
  if (leftUpperArm) {
    leftUpperArm.rotation.z = isLaughing ? Math.sin(seconds * 8) * 0.08 : 0;
  }
  if (neck) {
    neck.rotation.z = isThinking ? -0.12 : isLaughing ? Math.sin(seconds * 8) * 0.035 : 0;
  }
  if (vrm.scene) {
    vrm.scene.rotation.x = isLaughing ? laughMotion * 0.018 : 0;
    vrm.scene.rotation.z = isLaughing ? laughMotion * 0.012 : 0;
    vrm.scene.position.y = -1.14 + (isLaughing ? Math.max(0, laughMotion) * 0.018 : 0);
  }
}

function renderFallbackAvatar(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d');
  const image = new Image();
  image.src = '/avatars/zack-preview.png';
  const draw = () => {
    if (!context) return;
    const width = canvas.clientWidth || 96;
    const height = canvas.clientHeight || 96;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#061525';
    context.fillRect(0, 0, width, height);
    if (image.complete) {
      const size = Math.min(width, height);
      context.drawImage(image, (width - size) / 2, (height - size) / 2, size, size);
    }
  };
  image.onload = draw;
  draw();
  return () => { image.onload = null; };
}

export function VRMAvatar({ isSpeaking, speechText = '' }: VRMAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isSpeakingRef = useRef(isSpeaking);
  const speechTextRef = useRef(speechText);
  const speechStartRef = useRef(0);

  useEffect(() => {
    const wasSpeaking = isSpeakingRef.current;
    isSpeakingRef.current = isSpeaking;
    speechTextRef.current = speechText;
    if (isSpeaking && !wasSpeaking) speechStartRef.current = performance.now();
  }, [isSpeaking, speechText]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    camera.position.set(0, 1.05, 3.5);

    let hasWebGL = false;
    try {
      hasWebGL = Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch {
      hasWebGL = false;
    }
    if (!hasWebGL) return renderFallbackAvatar(canvas);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      // Keep the interface usable on browsers without GPU/WebGL support.
      return renderFallbackAvatar(canvas);
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x061525, 0);

    scene.add(new THREE.HemisphereLight(0x84eaff, 0x08111e, 1.6));
    const keyLight = new THREE.DirectionalLight(0x8be9ff, 2.4);
    keyLight.position.set(1.5, 2.5, 2.5);
    scene.add(keyLight);
    const fillLight = new THREE.PointLight(0x6c4bff, 2.2, 8);
    fillLight.position.set(-2, 1, 2);
    scene.add(fillLight);

    const runtime: Runtime = { renderer, scene, camera, vrm: null, frame: 0, lastTime: performance.now() };
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    loader.load(
      '/avatars/zack.vrm',
      (gltf) => {
        const vrm = gltf.userData.vrm;
        if (!vrm) return;
        VRMUtils.removeUnnecessaryVertices(gltf.scene);
        VRMUtils.combineSkeletons(gltf.scene);
        vrm.scene.rotation.y = Math.PI;
        vrm.scene.position.y = -1.14;
        runtime.vrm = vrm;
        scene.add(vrm.scene);
      },
      undefined,
      (error) => console.error('ALI avatar load failed', error),
    );

    const resize = () => {
      const width = canvas.clientWidth || 320;
      const height = canvas.clientHeight || 320;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    const animate = (now: number) => {
      const delta = Math.min((now - runtime.lastTime) / 1000, 0.05);
      runtime.lastTime = now;
      const vrm = runtime.vrm;

      if (vrm) {
        vrm.update(delta);
        const manager = vrm.expressionManager;
        const text = speechTextRef.current;
        const elapsedMs = isSpeakingRef.current ? now - speechStartRef.current : 0;
        const emotion = getEmotion(text);

        if (manager) {
          MOUTH_EXPRESSIONS.forEach((name) => resetExpression(manager, name));
          if (isSpeakingRef.current) applyMouth(manager, text, elapsedMs);
          setExpression(manager, emotion, emotion === 'neutral' ? 0 : 0.7);
          setExpression(manager, 'blink', Math.max(0, Math.sin(now / 4000 * Math.PI * 2)) ** 16);
        }

        applyBodyGesture(vrm, text, elapsedMs);
        if (vrm.lookAt) {
          vrm.lookAt.target = camera;
        }
      }

      renderer.render(scene, camera);
      runtime.frame = requestAnimationFrame(animate);
    };
    runtime.frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(runtime.frame);
      resizeObserver.disconnect();
      runtime.vrm?.scene && scene.remove(runtime.vrm.scene);
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Avatar 3D de Zack, l'Humain Numérique ALI"
      className="h-full w-full"
    />
  );
}