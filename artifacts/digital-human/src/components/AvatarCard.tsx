import { motion } from 'framer-motion';
import { Activity, BrainCircuit, Cpu, Ear, Laugh, MessageCircle, Radio, ShieldCheck, Sparkles, Wifi } from 'lucide-react';
import { VRMAvatar } from './VRMAvatar';

interface AvatarCardProps {
  isSpeaking: boolean;
  isStreaming: boolean;
  speechText?: string;
}

export function AvatarCard({ isSpeaking, isStreaming, speechText = '' }: AvatarCardProps) {
  const normalizedSpeech = speechText.toLowerCase();
  const isLaughing = normalizedSpeech.includes('*rire*');
  const isThinking = !isSpeaking && (isStreaming || normalizedSpeech.includes('*hmmmmm*'));
  const state = isLaughing ? 'laughing' : isSpeaking ? 'speaking' : isThinking ? 'thinking' : 'ready';
  const stateCopy = {
    laughing: 'ALI rit avec toi',
    speaking: 'ALI explique',
    thinking: 'ALI prépare la suite',
    ready: 'ALI est prêt',
  }[state];
  const stateDetail = {
    laughing: 'Un moment de complicité',
    speaking: 'Écoute la prochaine idée',
    thinking: 'Je relie les notions',
    ready: 'On avance à ton rythme',
  }[state];
  const cleanSpeech = speechText.replace(/\*[^*]+\*/g, '').trim();

  return (
    <section className="avatar-card relative flex flex-col items-center px-4 pb-5 pt-5 sm:px-6 sm:pt-7" aria-label="État d'ALI">
      <div className="pointer-events-none absolute inset-0 scanline opacity-30" />

      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-5 lg:flex-row lg:items-center lg:gap-7">
        <div className="relative flex-shrink-0">
          <motion.div
            className={`absolute -inset-2 rounded-[2rem] ${isLaughing ? 'avatar-laugh' : ''}`}
            style={{
              boxShadow: isSpeaking
                ? '0 0 0 1px rgba(96,225,255,0.92), 0 0 24px 5px rgba(48,205,234,0.28)'
                : isThinking
                  ? '0 0 0 1px rgba(241,154,130,0.82), 0 0 20px 4px rgba(241,154,130,0.18)'
                  : '0 0 0 1px rgba(96,225,255,0.35)',
            }}
            animate={isSpeaking || isThinking ? { scale: [1, 1.035, 1], opacity: [1, 0.82, 1] } : { scale: 1, opacity: 1 }}
            transition={{ duration: isThinking ? 1.4 : 0.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative h-36 w-36 overflow-hidden rounded-[1.75rem] border border-primary/35 bg-[#071927] shadow-[0_16px_50px_rgba(0,0,0,0.3)] sm:h-40 sm:w-40 lg:h-44 lg:w-44">
            <VRMAvatar isSpeaking={isSpeaking} speechText={speechText} />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: isSpeaking
                  ? 'radial-gradient(circle, rgba(96,225,255,0.12) 0%, transparent 70%)'
                  : isLaughing
                    ? 'radial-gradient(circle, rgba(241,154,130,0.15) 0%, transparent 72%)'
                  : 'transparent',
                transition: 'background 0.3s ease',
              }}
            />
          </div>
          <div className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-primary/25 bg-[#101827]/95 px-2.5 py-1 shadow-lg">
            <span className={`h-1.5 w-1.5 rounded-full ${isSpeaking ? 'bg-primary animate-pulse' : isThinking ? 'bg-secondary animate-pulse' : 'bg-accent'}`} />
            <span className="font-mono text-[9px] font-bold tracking-[0.18em] text-foreground/80">ALI</span>
          </div>
          {isSpeaking && (
            <div data-testid="status-avatar-waveform" className="absolute -bottom-5 left-1/2 flex h-4 -translate-x-1/2 items-end gap-[3px]" aria-label="ALI parle">
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  className="w-[3px] rounded-full bg-primary"
                  animate={{ height: ['4px', `${6 + i * 3}px`, '4px'] }}
                  transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.08 }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 text-center lg:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
            <span className="font-mono text-[10px] font-bold tracking-[0.24em] text-primary/70">PROF DE KINSHASA</span>
            <span className="rounded-full border border-secondary/25 bg-secondary/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-secondary">Leçon vivante</span>
          </div>
          <h1 data-testid="text-avatar-name" className="mt-2 text-3xl font-bold tracking-tight text-primary sm:text-4xl" style={{ textShadow: '0 0 18px rgba(96,225,255,0.25)' }}>
            ALI <span className="text-foreground/40">/</span> Zack
          </h1>
          <div data-testid="status-avatar-speech" className="mt-2 flex items-center justify-center gap-2 text-sm font-medium text-foreground/90 lg:justify-start">
            {state === 'speaking' && <MessageCircle className="h-4 w-4 text-primary" />}
            {state === 'thinking' && <BrainCircuit className="h-4 w-4 text-secondary" />}
            {state === 'laughing' && <Laugh className="h-4 w-4 text-secondary" />}
            {state === 'ready' && <Sparkles className="h-4 w-4 text-accent" />}
            <span>{stateCopy}</span>
          </div>
          <p data-testid="text-avatar-state-detail" className="mt-1 text-xs text-muted-foreground">{cleanSpeech ? cleanSpeech.slice(0, 96) : stateDetail}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-1.5 lg:justify-start">
            <span className="badge-status"><Cpu className="w-2.5 h-2.5" /> INTELLIGENT</span>
            <span className="badge-status badge-green"><Wifi className="w-2.5 h-2.5" /> CONNECTÉ</span>
            <span className="badge-status badge-purple"><ShieldCheck className="w-2.5 h-2.5" /> SÉCURISÉ</span>
          </div>
        </div>

        <div className="hidden w-52 flex-shrink-0 rounded-2xl border border-primary/15 bg-primary/[0.04] p-4 lg:block">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-primary/70"><Activity className="h-3.5 w-3.5" /> Progression</div>
          <div className="mt-3 flex items-end justify-between">
            <span className="text-sm font-semibold text-foreground/90">Leçon en cours</span>
            <span className="font-mono text-xs text-accent">01</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full w-1/3 rounded-full bg-gradient-to-r from-primary to-accent" /></div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">Une idée à la fois. On construit du solide.</p>
        </div>
      </div>

      <div className="relative z-10 mt-7 flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-primary/10 pt-3 text-[10px] font-mono text-muted-foreground/65">
        <span className="flex items-center gap-1">
          {state === 'speaking' ? <Radio className="h-3 w-3 text-primary" /> : state === 'thinking' ? <BrainCircuit className="h-3 w-3 text-secondary" /> : state === 'laughing' ? <Laugh className="h-3 w-3 text-secondary" /> : <Ear className="h-3 w-3 text-accent" />}
          <span data-testid="status-avatar-mode">{state === 'speaking' ? 'EN TRAIN DE PARLER' : state === 'thinking' ? 'EN TRAIN DE RÉFLÉCHIR' : state === 'laughing' ? 'MOMENT COMPLICE' : 'PRÊT À APPRENDRE'}</span>
        </span>
        <span className="text-secondary/65">ALI v3.0</span>
        <span className="hidden sm:inline">CONNECTÉ À TES AMBITIONS</span>
      </div>
    </section>
  );
}