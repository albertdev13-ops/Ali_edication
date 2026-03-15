import { useState, useRef, useEffect, useCallback } from 'react';
import {
  useListConversations,
  useCreateConversation,
  useGetChatHistory,
  getGetChatHistoryQueryKey,
  useGetSettings,
  getListConversationsQueryKey
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useStreamChat } from '@/hooks/use-stream-chat';
import { AvatarCard } from '@/components/AvatarCard';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Mic, Paperclip, Globe, Image, Plus, Trash2, ChevronDown, X, ExternalLink, Zap, Sparkles, Radio, Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ----- Types -----
type AttachedImage = { base64: string; mimeType: string; preview: string };

export default function ChatPage() {
  const queryClient = useQueryClient();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null);
  const [useSearch, setUseSearch] = useState(false);
  const [showConvPanel, setShowConvPanel] = useState(false);
  const [vercelPrompt, setVercelPrompt] = useState<string | null>(null);
  const [genImgLoading, setGenImgLoading] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const liveModeRef = useRef(false);

  const { data: settings } = useGetSettings();
  const { data: conversations } = useListConversations();
  const { data: history } = useGetChatHistory(
    { conversationId: activeConvId || undefined },
    {
      query: {
        queryKey: getGetChatHistoryQueryKey({ conversationId: activeConvId || undefined }),
        enabled: !!activeConvId,
      },
    }
  );

  const createConv = useCreateConversation();
  const { messages, isStreaming, isSpeaking, sendMessage, stopAll, setMessages } = useStreamChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Set first conversation on load
  useEffect(() => {
    if (conversations?.length && !activeConvId) {
      setActiveConvId(conversations[0].id);
    }
  }, [conversations, activeConvId]);

  // Load history
  useEffect(() => {
    if (history) {
      setMessages(history.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        displayedContent: m.content,
      })));
    } else if (!activeConvId) {
      setMessages([]);
    }
  }, [history, activeConvId, setMessages]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Detect if AI generated code → offer Vercel deploy
  useEffect(() => {
    if (!isStreaming && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'assistant' && !vercelPrompt) {
        const hasCode = lastMsg.content.includes('```') && (
          lastMsg.content.includes('package.json') ||
          lastMsg.content.includes('import React') ||
          lastMsg.content.includes('export default') ||
          lastMsg.content.includes('app.js') ||
          lastMsg.content.includes('index.html')
        );
        if (hasCode) {
          setVercelPrompt(lastMsg.id);
        }
      }
    }
  }, [isStreaming, messages, vercelPrompt]);

  const handleImageAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setAttachedImage({ base64, mimeType: file.type, preview: result });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleGenerateImage = async () => {
    const prompt = inputValue.trim() || 'Génère une belle image créative';
    setInputValue('');
    setGenImgLoading(true);

    // Add user message
    const userMsgId = `${Date.now()}-user`;
    const asstMsgId = `${Date.now()}-asst`;
    setMessages(prev => [
      ...prev,
      { id: userMsgId, role: 'user', content: `🎨 Génère une image: ${prompt}`, displayedContent: `🎨 Génère une image: ${prompt}` },
      { id: asstMsgId, role: 'assistant', content: '', displayedContent: '🖼️ Génération en cours...', isStreaming: true },
    ]);

    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        setMessages(prev => prev.map(m => m.id === asstMsgId
          ? { ...m, content: data.caption || prompt, displayedContent: data.caption || `Image générée pour: "${prompt}"`, isStreaming: false, generatedImageUrl: data.imageUrl }
          : m
        ));
      } else {
        setMessages(prev => prev.map(m => m.id === asstMsgId
          ? { ...m, content: '❌ Génération échouée', displayedContent: '❌ Désolé, la génération d\'image a échoué. Essaie de reformuler.', isStreaming: false }
          : m
        ));
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === asstMsgId
        ? { ...m, content: 'Erreur', displayedContent: '❌ Erreur de connexion.', isStreaming: false }
        : m
      ));
    }
    setGenImgLoading(false);
  };

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text && !attachedImage) return;
    if (isStreaming) return;

    setInputValue('');
    const img = attachedImage;
    setAttachedImage(null);
    setVercelPrompt(null);

    const model = settings?.defaultModel || 'groq';
    const voiceId = settings?.defaultVoiceId;
    const sysPrompt = settings?.systemPrompt || '';

    await sendMessage(text || 'Analyse cette image', {
      model: img ? 'gemini' : model,
      systemPrompt: sysPrompt,
      imageBase64: img?.base64,
      imageMimeType: img?.mimeType,
      useSearch,
      voiceId: voiceId || undefined,
      conversationId: activeConvId || undefined,
      onConversationId: (id: string) => {
        setActiveConvId(id);
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
      },
    });
  }, [inputValue, attachedImage, isStreaming, settings, activeConvId, useSearch, sendMessage, queryClient]);

  const toggleLiveMode = useCallback(() => {
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) {
      setInputValue('Le mode Live nécessite Chrome ou Edge pour la reconnaissance vocale.');
      return;
    }

    if (liveMode) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      liveModeRef.current = false;
      setLiveMode(false);
      setIsListening(false);
      return;
    }

    const recognition = new Recognition();
    recognition.lang = navigator.language || 'fr-FR';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      if (liveModeRef.current && recognitionRef.current === recognition) {
        try { recognition.start(); } catch { /* browser is already restarting */ }
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) finalText += transcript;
        else interimText += transcript;
      }
      setInputValue(finalText || interimText);
      if (finalText.trim() && !isStreaming) {
        setTimeout(() => {
          setInputValue('');
          void sendMessage(finalText.trim(), {
            model: settings?.defaultModel || 'groq',
            voiceId: settings?.defaultVoiceId || 'fr-FR-HenriNeural',
            conversationId: activeConvId || undefined,
            onConversationId: (id: string) => {
              setActiveConvId(id);
              queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
            },
          });
        }, 120);
      }
    };
    recognitionRef.current = recognition;
    liveModeRef.current = true;
    setLiveMode(true);
    try { recognition.start(); } catch { setIsListening(false); }
  }, [liveMode, isStreaming, settings, activeConvId, sendMessage, queryClient]);

  useEffect(() => () => {
    liveModeRef.current = false;
    recognitionRef.current?.stop();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputValue]);

  return (
    <div className="flex flex-col h-full relative">
      {/* Avatar Card */}
      <AvatarCard
        isSpeaking={isSpeaking}
        isStreaming={isStreaming}
        speechText={messages.filter((message) => message.role === 'assistant').at(-1)?.content || ''}
      />

      {/* Conversations toggle */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-background/80 border-b border-border/30 backdrop-blur-sm">
        <button
          onClick={() => setShowConvPanel(!showConvPanel)}
          className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-cyan-400 transition-colors"
        >
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showConvPanel && "rotate-180")} />
          {conversations?.length || 0} SESSION{(conversations?.length || 0) !== 1 ? 'S' : ''}
        </button>
        <button
          onClick={() => {
            createConv.mutate({ data: { title: 'Nouvelle session' } }, {
              onSuccess: (c) => {
                queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
                setActiveConvId(c.id);
                setMessages([]);
                setShowConvPanel(false);
              }
            });
          }}
          className="flex items-center gap-1 text-xs font-mono text-cyan-500 hover:text-cyan-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Nouvelle
        </button>
      </div>

      {/* Conversation panel dropdown */}
      <AnimatePresence>
        {showConvPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border/30 bg-card/80 backdrop-blur-sm"
          >
            <div className="max-h-40 overflow-y-auto p-2 space-y-1">
              {(conversations || []).map(conv => (
                <div
                  key={conv.id}
                  onClick={() => { setActiveConvId(conv.id); setShowConvPanel(false); }}
                  className={cn(
                    "group flex justify-between items-center px-3 py-2 rounded-lg cursor-pointer text-sm transition-all",
                    activeConvId === conv.id
                      ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-300"
                      : "hover:bg-muted/50 text-foreground/70"
                  )}
                >
                  <span className="truncate font-mono text-xs">{conv.title}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); }}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {(!conversations || conversations.length === 0) && (
                <p className="text-center text-xs text-muted-foreground py-4 font-mono">Aucune session</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 scroll-smooth">
        <div className="max-w-2xl mx-auto space-y-4 pb-4">
          {/* Welcome message */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-3"
            >
              {/* AI greeting bubble */}
              <div className="flex gap-2.5 items-end">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mb-1 border border-cyan-500/40" style={{ boxShadow: '0 0 8px rgba(0,212,255,0.3)' }}>
                  <img src="/avatars/zack-preview.png" alt="ALI" className="w-full h-full object-cover" />
                </div>
                <div className="chat-bubble-ai">
                  <p className="text-sm leading-relaxed">
                    <span className="font-semibold text-cyan-300">Bonjour Boss ! 👋 Moi c'est ALI</span>, ton Humain Numérique 🤖✨
                  </p>
                  <p className="text-sm leading-relaxed mt-2 text-foreground/80">
                    Boss, je génère des images 🎨, je code 💻, j'analyse des photos 📸, je recherche sur internet 🌐, et je peux t'apprendre n'importe quoi !
                  </p>
                  <p className="text-[10px] text-cyan-400/50 font-mono mt-2">ALI • maintenant</p>
                </div>
              </div>

              {/* Quick action chips */}
              <div className="ml-11 flex flex-wrap gap-2">
                {[
                  { label: '🌐 Actualités maintenant', action: () => { setInputValue("Quelles sont les dernières nouvelles importantes du monde ?"); setUseSearch(true); } },
                  { label: '🎨 Génère une image', action: () => setInputValue("génère une image d'une ville futuriste néon") },
                  { label: '💻 Crée un projet', action: () => setInputValue("Crée-moi une landing page React moderne complète") },
                  { label: '🤝 Aide entreprise', action: () => setInputValue("Je veux créer une entreprise, par où commencer ?") },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    onClick={chip.action}
                    className="text-xs px-3 py-1.5 rounded-full border border-cyan-500/30 text-cyan-400/80 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all font-mono"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={msg.id || idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {msg.role === 'user' ? (
                  // USER bubble (right)
                  <div className="flex justify-end gap-2.5 items-end">
                    <div className="chat-bubble-user max-w-[80%]">
                      {msg.imageUrl && (
                        <img src={msg.imageUrl} alt="Uploaded" className="rounded-xl mb-2 max-w-full max-h-48 object-contain" />
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-[10px] text-purple-300/50 font-mono mt-1 text-right">Toi • maintenant</p>
                    </div>
                  </div>
                ) : (
                  // AI bubble (left)
                  <div className="flex gap-2.5 items-end">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mb-1 border border-cyan-500/40 flex-shrink-0" style={{ boxShadow: '0 0 8px rgba(0,212,255,0.3)' }}>
                      <img src="/avatars/zack-preview.png" alt="ALI" className="w-full h-full object-cover" />
                    </div>
                    <div className="chat-bubble-ai max-w-[85%]">
                      {/* Generated image */}
                      {msg.generatedImageUrl && (
                        <img
                          src={msg.generatedImageUrl}
                          alt="Generated"
                          className="rounded-xl mb-3 max-w-full"
                        />
                      )}

                      {/* Text content — handles all states */}
                      {msg.isPreparing ? (
                        /* TTS is loading — voice is about to start */
                        <div className="flex items-center gap-2 py-1">
                          <motion.span
                            animate={{ scale: [1, 1.25, 1] }}
                            transition={{ duration: 0.9, repeat: Infinity }}
                            className="text-base"
                          >🎙️</motion.span>
                          <span className="text-xs text-cyan-400/80 font-mono">Préparation vocale...</span>
                          <div className="flex gap-0.5 items-end h-4">
                            {[0, 1, 2, 3].map(i => (
                              <motion.div
                                key={i}
                                className="w-0.5 bg-cyan-400/70 rounded-full"
                                animate={{ height: ['6px', '14px', '6px'] }}
                                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
                              />
                            ))}
                          </div>
                        </div>
                      ) : (msg.isStreaming && msg.voiceMode) ? (
                        /* Voice mode — AI is generating, hide text until TTS is ready */
                        <div className="flex gap-1 items-center py-1">
                          <motion.div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                          <motion.div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }} />
                          <motion.div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }} />
                        </div>
                      ) : (msg.displayedContent || msg.content) ? (
                        /* Normal display — streaming text or fully revealed */
                        <div className={cn(
                          "text-sm leading-relaxed",
                          msg.isRevealing && "after:content-['|'] after:animate-pulse after:text-cyan-400 after:ml-0.5"
                        )}>
                          <MarkdownRenderer
                            content={
                              msg.isStreaming
                                ? (msg.content || '...')
                                : msg.isRevealing
                                  ? (msg.displayedContent || '')
                                  : (msg.displayedContent || msg.content || '')
                            }
                          />
                        </div>
                      ) : (
                        /* Empty — thinking dots */
                        <div className="flex gap-1 items-center py-1">
                          <motion.div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                          <motion.div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }} />
                          <motion.div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }} />
                        </div>
                      )}

                      {/* Web search sources */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-cyan-500/20">
                          <p className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Globe className="w-3 h-3" /> Sources internet
                          </p>
                          <div className="space-y-1">
                            {msg.sources.slice(0, 5).map((src, i) => (
                              <a
                                key={i}
                                href={src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors group"
                              >
                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate group-hover:underline">{src.title}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-1.5">
                         <p className="text-[10px] text-cyan-400/40 font-mono">ALI • maintenant</p>
                        {msg.fromCache && (
                          <span className="text-[9px] font-mono text-green-400/60 flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5" /> CACHE
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Vercel deploy prompt */}
          <AnimatePresence>
            {vercelPrompt && !isStreaming && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="ml-11 flex items-center gap-3 p-3 rounded-xl border border-purple-500/30 bg-purple-500/5"
              >
                <Zap className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-purple-300 font-mono">Déployer sur Vercel ?</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">J'ai détecté du code — veux-tu le déployer ?</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setInputValue("Oui, déploie ce projet sur Vercel s'il te plaît"); setVercelPrompt(null); }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-400/40 text-purple-300 hover:bg-purple-500/30 transition-all font-mono"
                  >
                    Oui !
                  </button>
                  <button onClick={() => setVercelPrompt(null)} className="text-xs text-muted-foreground hover:text-foreground p-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 border-t border-border/40 bg-background/95 backdrop-blur-sm p-3">
        {/* Image preview */}
        <AnimatePresence>
          {attachedImage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2 relative inline-block"
            >
              <img src={attachedImage.preview} alt="Attached" className="h-16 rounded-lg border border-cyan-500/30 object-contain" />
              <button
                onClick={() => setAttachedImage(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Options row */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setUseSearch(!useSearch)}
            className={cn(
              "flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full border transition-all",
              useSearch
                ? "border-cyan-400 text-cyan-400 bg-cyan-400/10"
                : "border-border/40 text-muted-foreground hover:border-cyan-400/50"
            )}
          >
            <Globe className="w-3 h-3" />
            Internet
          </button>
          <button
            onClick={handleGenerateImage}
            disabled={genImgLoading || isStreaming}
            className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full border border-border/40 text-muted-foreground hover:border-purple-400/50 hover:text-purple-400 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3" />
            Image IA
          </button>
          <button
            onClick={toggleLiveMode}
            className={cn(
              "flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full border transition-all",
              liveMode
                ? "border-red-400 text-red-300 bg-red-400/10"
                : "border-border/40 text-muted-foreground hover:border-cyan-400/50"
            )}
          >
            <Radio className={cn("w-3 h-3", isListening && "animate-pulse")} />
            {liveMode ? (isListening ? 'Live actif' : 'Live pause') : 'Live'}
          </button>
        </div>

        {/* Main input row */}
        <div className="flex items-end gap-2 bg-card/50 rounded-2xl border border-input focus-within:border-cyan-500/50 transition-all px-3 py-2" style={{ boxShadow: 'inset 0 0 0 1px transparent' }}>
          {/* Attach image */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 text-muted-foreground hover:text-cyan-400 transition-colors p-1 mb-1"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageAttach}
            className="hidden"
          />

          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écris un message..."
            className="flex-1 bg-transparent border-0 resize-none text-sm placeholder:text-muted-foreground/50 focus:ring-0 outline-none py-1 min-h-[36px] max-h-[120px] leading-relaxed"
            rows={1}
          />

          {/* Mic */}
          <button onClick={toggleLiveMode} className={cn("flex-shrink-0 transition-colors p-1 mb-1", liveMode ? "text-red-300" : "text-muted-foreground hover:text-cyan-400")}>
            <Mic className="w-5 h-5" />
          </button>

          {/* Send */}
          <button
            onClick={isStreaming ? stopAll : handleSend}
            disabled={!isStreaming && !inputValue.trim() && !attachedImage}
            className={cn(
              "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0 mb-0.5",
              isStreaming
                ? "bg-red-500/80 text-white hover:bg-red-500"
                : (inputValue.trim() || attachedImage)
                  ? "bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_12px_rgba(0,212,255,0.5)]"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {isStreaming
              ? <X className="w-4 h-4" />
              : <Send className="w-4 h-4" />}
          </button>
        </div>

        {/* Bottom safe area tag */}
        <p className="text-center text-[9px] font-mono text-muted-foreground/30 tracking-widest mt-2 uppercase">
          Connexion neurale sécurisée • ALI v3.0
        </p>
      </div>
    </div>
  );
}
