import { useState, useRef, useCallback } from 'react';

export type StreamMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  displayedContent?: string;   // revealed letter-by-letter
  isStreaming?: boolean;       // collecting tokens from AI
  isRevealing?: boolean;       // letter-by-letter reveal synced with TTS
  isPreparing?: boolean;       // TTS being fetched, audio loading
  voiceMode?: boolean;         // this message uses TTS (hide text during stream)
  imageUrl?: string;           // for user-uploaded images
  generatedImageUrl?: string;  // for AI-generated images
  sources?: Array<{ title: string; url: string }>;
  fromCache?: boolean;
};

type StreamOptions = {
  model?: string;
  systemPrompt?: string;
  imageBase64?: string;
  imageMimeType?: string;
  useSearch?: boolean;
  voiceId?: string;
  conversationId?: string;
  onConversationId?: (id: string) => void;
  onSpeakStart?: () => void;
  onSpeakEnd?: () => void;
};

export function useStreamChat() {
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const revealIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAll = useCallback(() => {
    abortControllerRef.current?.abort();
    if (revealIntervalRef.current) clearInterval(revealIntervalRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsStreaming(false);
    setIsSpeaking(false);
  }, []);

  /**
   * Reveal text letter-by-letter perfectly synchronized with TTS audio.
   *
   * Flow:
   * 1. Call TTS API to synthesize audio file
   * 2. Load audio, wait for `loadedmetadata` → get REAL duration
   * 3. Call audio.play() → on `onplay` event: start reveal interval at exact same moment
   * 4. Both voice and text finish at the same instant
   */
  const revealWithTTS = useCallback(async (
    msgId: string,
    fullText: string,
    voiceId: string,
    onStart?: () => void,
    onEnd?: () => void,
  ) => {
    if (!fullText.trim()) return;

    try {
      // 1. Synthesize TTS (isPreparing shows a loading indicator in UI)
      const res = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullText.slice(0, 3000), voiceId }),
      });

      if (!res.ok) throw new Error('TTS synthesis failed');
      const { audioUrl } = await res.json();

      // 2. Create Audio element + wait for real duration via loadedmetadata
      const audio = new Audio(audioUrl);
      audio.preload = 'metadata';
      audioRef.current = audio;

      const realDuration = await new Promise<number>((resolve) => {
        const fallback = setTimeout(
          () => resolve(Math.max(1.5, fullText.split(' ').length * 0.38)),
          4000
        );
        audio.onloadedmetadata = () => {
          clearTimeout(fallback);
          resolve(audio.duration && isFinite(audio.duration) && audio.duration > 0
            ? audio.duration
            : Math.max(1.5, fullText.split(' ').length * 0.38));
        };
        audio.onerror = () => {
          clearTimeout(fallback);
          resolve(Math.max(1.5, fullText.split(' ').length * 0.38));
        };
      });

      const totalChars = fullText.length;
      const totalMs = realDuration * 1000;
      const msPerChar = Math.max(10, totalMs / totalChars);
      let charIdx = 0;

      // 3. When audio ACTUALLY starts playing → start reveal interval at same moment
      audio.onplay = () => {
        setIsSpeaking(true);
        onStart?.();

        // Transition: isPreparing → isRevealing, reset to empty so reveal starts fresh
        setMessages(prev => prev.map(m => m.id === msgId
          ? { ...m, displayedContent: '', isPreparing: false, isRevealing: true }
          : m
        ));

        if (revealIntervalRef.current) clearInterval(revealIntervalRef.current);
        charIdx = 0;
        revealIntervalRef.current = setInterval(() => {
          charIdx++;
          const shown = fullText.slice(0, charIdx);
          setMessages(prev => prev.map(m => m.id === msgId
            ? { ...m, displayedContent: shown }
            : m
          ));
          if (charIdx >= totalChars) {
            clearInterval(revealIntervalRef.current!);
            revealIntervalRef.current = null;
          }
        }, msPerChar);
      };

      audio.onended = () => {
        setIsSpeaking(false);
        onEnd?.();
        if (revealIntervalRef.current) {
          clearInterval(revealIntervalRef.current);
          revealIntervalRef.current = null;
        }
        // Ensure full text is shown when audio ends
        setMessages(prev => prev.map(m => m.id === msgId
          ? { ...m, displayedContent: fullText, isRevealing: false }
          : m
        ));
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        onEnd?.();
        setMessages(prev => prev.map(m => m.id === msgId
          ? { ...m, displayedContent: fullText, isPreparing: false, isRevealing: false }
          : m
        ));
      };

      // 4. Play → triggers onplay → both start at the exact same moment
      audio.play().catch(() => {
        // Autoplay blocked by browser → show full text without voice
        if (revealIntervalRef.current) clearInterval(revealIntervalRef.current);
        setMessages(prev => prev.map(m => m.id === msgId
          ? { ...m, displayedContent: fullText, isPreparing: false, isRevealing: false }
          : m
        ));
        onEnd?.();
      });

    } catch (_err) {
      // TTS failed → just show full text immediately
      setMessages(prev => prev.map(m => m.id === msgId
        ? { ...m, displayedContent: fullText, isPreparing: false, isRevealing: false }
        : m
      ));
      onEnd?.();
    }
  }, []);

  const sendMessage = useCallback(async (
    content: string,
    options: StreamOptions = {},
  ) => {
    const {
      model = 'groq',
      systemPrompt,
      imageBase64,
      imageMimeType,
      useSearch,
      voiceId,
      conversationId,
      onConversationId,
      onSpeakStart,
      onSpeakEnd,
    } = options;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const userMsgId = `${Date.now()}-user`;
    const asstMsgId = `${Date.now()}-asst`;
    const hasVoice = !!voiceId;

    const userMessage: StreamMessage = {
      id: userMsgId,
      role: 'user',
      content,
      displayedContent: content,
      imageUrl: imageBase64 ? `data:${imageMimeType || 'image/jpeg'};base64,${imageBase64}` : undefined,
    };

    const assistantMessage: StreamMessage = {
      id: asstMsgId,
      role: 'assistant',
      content: '',
      // With voice: keep hidden during streaming (dots shown), revealed only when TTS starts
      // Without voice: empty initially → shown token-by-token during stream
      displayedContent: '',
      isStreaming: true,
      voiceMode: hasVoice,
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setIsStreaming(true);

    let fullContent = '';
    let sources: Array<{ title: string; url: string }> = [];

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          model,
          systemPrompt,
          imageBase64,
          imageMimeType,
          useSearch,
          conversationId,
        }),
        signal: abortController.signal,
      });

      if (!res.ok) throw new Error('Stream failed');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let currentEvent = '';
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('event:')) {
              currentEvent = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              const dataStr = line.slice(5).trim();
              if (dataStr === '[DONE]') break;

              try {
                const parsed = JSON.parse(dataStr);
                if (currentEvent === 'start') {
                  if (parsed.conversationId) onConversationId?.(parsed.conversationId);
                } else if (currentEvent === 'token') {
                  const token = typeof parsed === 'string' ? parsed : (parsed.token || '');
                  fullContent += token;

                  if (hasVoice) {
                    // Voice mode: only update content (hidden), show dots in UI
                    setMessages(prev => prev.map(m => m.id === asstMsgId
                      ? { ...m, content: fullContent }
                      : m
                    ));
                  } else {
                    // No voice: show text as it arrives
                    setMessages(prev => prev.map(m => m.id === asstMsgId
                      ? { ...m, content: fullContent, displayedContent: fullContent }
                      : m
                    ));
                  }
                } else if (currentEvent === 'sources') {
                  sources = parsed.sources || [];
                }
              } catch (_) {
                // raw string token fallback
                fullContent += dataStr;
                if (!hasVoice) {
                  setMessages(prev => prev.map(m => m.id === asstMsgId
                    ? { ...m, content: fullContent, displayedContent: fullContent }
                    : m
                  ));
                }
              }
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Stream error:', err);
      }
    } finally {
      setIsStreaming(false);

      // Streaming done — finalize message
      setMessages(prev => prev.map(m => m.id === asstMsgId
        ? {
            ...m,
            content: fullContent,
            isStreaming: false,
            sources: sources.length > 0 ? sources : undefined,
            // If voice: keep displayedContent empty, set isPreparing while TTS loads
            // If no voice: displayedContent already set during streaming
            isPreparing: hasVoice && !!fullContent,
          }
        : m
      ));

      if (hasVoice && fullContent) {
        // Reveal text letter-by-letter perfectly synced with TTS audio
        await revealWithTTS(asstMsgId, fullContent, voiceId!, onSpeakStart, onSpeakEnd);
      }
    }
  }, [revealWithTTS]);

  return {
    messages,
    isStreaming,
    isSpeaking,
    sendMessage,
    stopAll,
    setMessages,
  };
}
