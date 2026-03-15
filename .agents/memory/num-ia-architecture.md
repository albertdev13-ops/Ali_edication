---
name: NUM_IA Architecture
description: Key architectural decisions for the Humain Numérique app (NUM_IA)
---

## Avatar and identity
- The product identity is **ALI**, always described as a Humain Numérique; the old NUM_IA/video presentation must not return in user-facing UI.
- Zack's VRM is the canonical avatar asset. The UI keeps a 2D preview fallback because some preview sandboxes have no WebGL context.
- VRM expressions and gesture markers are driven from the same response text that is sent to Edge TTS.

**Why:** The app needs a stable character identity and must remain usable in GPU-less previews while using the full 3D experience in normal browsers.

## TTS and lip-sync
- `use-stream-chat.ts` buffers the complete response, waits for real audio metadata, then starts the audio and character reveal from the same `onplay` event.
- The browser mouth animation uses a 70 ms viseme scheduler and emotional markers; `rhubarb-lip-sync` is installed for a future server-side phoneme pass because its package is Node/CLI-oriented rather than browser-safe.

**Why:** Browser-side audio duration is more reliable than the approximate server duration, and the animation must not make the text finish before the voice.

## Letter-by-letter TTS sync
- After AI streaming completes, `revealWithTTS()` in `use-stream-chat.ts` is called
- Fetches TTS `/api/tts/synthesize` → gets `{ audioUrl, duration }`
- Calculates `msPerChar = (duration * 1000) / totalChars`
- Starts audio + setInterval reveal simultaneously → both finish at the same time
- `displayedContent` (revealed) vs `content` (full buffered text) are separate fields

## Image handling
- Image upload in chat → base64 encoded → sent to `/api/chat/stream` with `imageBase64` + `imageMimeType`
- Forces `model: "gemini"` when image attached (Groq doesn't support vision)
- Image generation: `POST /api/images/generate` → Gemini `gemini-2.0-flash-preview-image-generation`
- Image understanding: `POST /api/images/understand` → Gemini Vision

## Web search
- `POST /api/search` uses Gemini with `tools: [{ googleSearch: {} }]`
- Returns grounding sources from `groundingMetadata.groundingChunks`
- In `/api/chat/stream`, `useSearch: true` adds Google Search tool to Gemini request
- Sources emitted as `event: sources` SSE event, stored in message.sources

## Personality
- `NUM_IA_PERSONALITY` is the backend constant name for compatibility, but its actual character is ALI: Prof de Kinshasa, emotionally aware, memory-aware, and with `Boss` in every sentence.
- Passed as `systemInstruction` to Gemini, as `system` role to Groq
- The backend combines the character prompt with saved settings instead of letting the settings prompt replace the character.

**Why:** The system prompt defines the entire character. Must not be overridden by user settings unless explicitly set.

## Vercel deploy prompt detection
- After streaming completes, checks if response contains code + deployment indicators
- Shows a prompt card offering Vercel deployment
- User clicks → auto-fills input with deploy request

## archiver import
- `archiver` is a CJS module, must use `createRequire` + `_require("archiver")` — NOT `import archiver from "archiver"`
- Added to `build.mjs` externals list alongside `pdfkit` and `msedge-tts`

## Runtime dependencies
- Groq model IDs can be retired independently of the SDK; keep the active model in one backend constant and verify it against the live model inventory when requests return `model_not_found`.
- The web artifact has a manual service worker and manifest so the shell and Zack asset can open offline; API/AI requests still require connectivity.

## Local-first learning state
- IndexedDB via Dexie is the safe local-first layer for profile onboarding, Prof setup, progress, and local quiz challenges.
- PostgreSQL remains intact until a user-approved migration and sync/conflict policy exist; local learning state must not silently replace shared server history.

**Why:** The squad specification asks for offline-first behavior, but deleting the current server history would be destructive and the existing backend is not user-scoped.

## Preview cache
- The development preview must unregister service workers while `import.meta.env.DEV` is true; production registers a versioned worker and uses network-first for HTML/JS/CSS.

**Why:** A cache-first worker can keep old Vite bundles and old UI visible across workflow restarts, making a correct code change appear not to apply.

## Route guards after local mutations
- Route guards must re-read persisted onboarding state after navigation rather than relying on a separate hook snapshot; async local saves can otherwise redirect a successfully completed flow back to its final screen.

**Why:** The onboarding page and the app shell each own a hook instance, so the shell can still hold `firstRunCompleted: false` after the onboarding page has saved completion.
