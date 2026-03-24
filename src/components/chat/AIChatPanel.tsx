/* eslint-disable @typescript-eslint/no-explicit-any */

import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Mic, MicOff, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  createChatSession,
  sendChatMessage,
  getMe,
  getFullProfile,
  getMyPortfolio,
  type PortfolioDetail,
} from "@/lib/api";
import ReactMarkdown from "react-markdown";

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  embedded?: boolean;
  chatFirst?: boolean;
  onVoiceOnboard?: () => void;
  completionMessage?: string;
  onCompletionShown?: () => void;
}

interface Message {
  role: "user" | "ai";
  content: string;
}

type MicState = "idle" | "listening" | "processing";

const suggestedQuestions = [
  "Best performing asset?",
  "How should I rebalance?",
];

const formatTimestamp = () => {
  const now = new Date();
  const hours = now.getHours();
  const mins = now.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  return `Today, ${h}:${mins} ${ampm}`;
};

const MarkdownMessage = ({ text }: { text: string }) => {
  const isLong = text.length > 600;

  return (
    <div className={isLong ? "prose-doc" : "prose-chat"}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="text-[15px] font-bold text-foreground mt-3 mb-1.5">{children}</h1>,
          h2: ({ children }) => <h2 className="text-[14px] font-bold text-foreground mt-3 mb-1">{children}</h2>,
          h3: ({ children }) => <h3 className="text-[13px] font-semibold text-foreground mt-2.5 mb-1">{children}</h3>,
          p: ({ children }) => <p className="text-[12px] leading-relaxed mb-2">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="text-muted-foreground">{children}</em>,
          ul: ({ children }) => <ul className="list-disc list-outside pl-4 mb-2 space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-outside pl-4 mb-2 space-y-0.5">{children}</ol>,
          li: ({ children }) => <li className="text-[12px] leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/40 pl-3 my-2 text-[12px] text-foreground/80 italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-border/60" />,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
};

const TillyAvatar = () => (
  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary">
    <Sparkles className="h-2.5 w-2.5 text-primary-foreground" />
  </div>
);

const AIChatPanel = ({ isOpen, onClose, embedded = false, chatFirst = false, onVoiceOnboard, completionMessage, onCompletionShown }: AIChatPanelProps) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [micState, setMicState] = useState<MicState>("idle");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [showFirstUseHint, setShowFirstUseHint] = useState(true);
  const [micError, setMicError] = useState(false);
  const [clientContext, setClientContext] = useState<Record<string, unknown> | null>(null);
  const [chatStartTime] = useState(formatTimestamp);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, interimTranscript]);

  // Inject completion message from voice onboarding
  useEffect(() => {
    if (completionMessage) {
      setMessages((prev) => [...prev, { role: "ai", content: completionMessage }]);
      onCompletionShown?.();
    }
  }, [completionMessage, onCompletionShown]);
  useEffect(() => {
    let mounted = true;
    const loadContext = async () => {
      try {
        const [me, profile, portfolio] = await Promise.all([
          getMe(),
          getFullProfile(),
          getMyPortfolio().catch(() => null),
        ]);
        if (!mounted) return;
        setClientContext({
          user: {
            id: me.id,
            first_name: me.first_name,
            last_name: me.last_name,
            is_onboarding_complete: me.is_onboarding_complete,
          },
          profile,
          portfolio,
        });
      } catch {
        if (mounted) setClientContext(null);
      }
    };
    loadContext();
    return () => {
      mounted = false;
    };
  }, []);

  const tillyInsight = (() => {
    const p = clientContext?.portfolio as PortfolioDetail | null | undefined;
    if (!p || p.total_value <= 0) {
      return "Connect your profile and portfolio to get personalised insights here.";
    }
    const fmt = (n: number) =>
      n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${Math.round(n).toLocaleString("en-IN")}`;
    if (!p.allocations.length) {
      return `Your portfolio is valued at ${fmt(p.total_value)}. Add allocation details for richer guidance.`;
    }
    const top = [...p.allocations].sort((a, b) => b.allocation_percentage - a.allocation_percentage)[0];
    return `Your portfolio is ${fmt(p.total_value)}. Top sleeve: ${top.asset_class} (~${top.allocation_percentage.toFixed(0)}%). Ask me how to rebalance or align with your goals.`;
  })();

  const ensureSession = useCallback(async (): Promise<string> => {
    if (sessionIdRef.current) return sessionIdRef.current;
    const session = await createChatSession("Tilly Chat");
    sessionIdRef.current = session.id;
    return session.id;
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    const trimmed = text.trim();
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setInterimTranscript("");
    setIsTyping(true);
    setShowFirstUseHint(false);

    try {
      const sid = await ensureSession();
      const resp = await sendChatMessage(sid, trimmed, clientContext ?? undefined);
      setIsTyping(false);
      setMessages((prev) => [...prev, { role: "ai", content: resp.assistant_message.content }]);
    } catch (err: any) {
      setIsTyping(false);
      const fallback = err?.message?.includes("401") || err?.message?.includes("Not authenticated")
        ? "Please log in to use the chat."
        : (err?.message ? `Request failed: ${err.message}` : "Sorry, something went wrong. Please try again.");
      setMessages((prev) => [...prev, { role: "ai", content: fallback }]);
    }
  }, [ensureSession, clientContext]);

  const toggleListening = useCallback(() => {
    setMicError(false);

    if (micState === "listening") {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setMicError(true);
      setTimeout(() => setMicError(false), 3000);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (final) {
        setMicState("processing");
        setInterimTranscript("");
        recognition.stop();
        setTimeout(() => {
          sendMessage(final);
          setMicState("idle");
        }, 600);
      } else {
        setInterimTranscript(interim);
      }
    };

    recognition.onerror = () => {
      setMicState("idle");
      setInterimTranscript("");
      setMicError(true);
      setTimeout(() => setMicError(false), 3000);
    };

    recognition.onend = () => {
      setMicState((prev) => (prev === "listening" ? "idle" : prev));
      setInterimTranscript((prev) => (prev ? "" : prev));
    };

    recognitionRef.current = recognition;
    recognition.start();
    setMicState("listening");
    setShowFirstUseHint(false);
  }, [micState, sendMessage]);

  const embeddedSuggestions = chatFirst
    ? ["Review my portfolio", "Life update", "Discover"]
    : ["Why is my portfolio up today?"];

  const hasMessages = messages.length > 0 || isTyping;

  /* ── Shared message renderer ── */
  const renderMessages = () => (
    <>
      {messages.length > 0 && (
        <p className="text-center text-[10px] text-muted-foreground/50 mb-2">{chatStartTime}</p>
      )}

      {messages.map((msg, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {msg.role === "user" ? (
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-tr-sm px-3 py-2 text-[12px] leading-relaxed text-primary-foreground"
                style={{ backgroundColor: "hsl(var(--user-bubble) / 0.85)" }}
              >
                {msg.content}
              </div>
            </div>
          ) : (
            <div className={`flex gap-2 items-start ${msg.content.length > 600 ? "max-w-[95%]" : "max-w-[88%]"}`}>
              <TillyAvatar />
              <div
                className={`rounded-2xl rounded-tl-sm px-3 py-2 text-[12px] leading-relaxed text-foreground/90 ${
                  msg.content.length > 600
                    ? "max-h-[60vh] overflow-y-auto border border-border/40 shadow-sm"
                    : ""
                }`}
                style={{
                  backgroundColor: "hsl(var(--tilly-bubble))",
                  borderLeft: "2px solid hsla(38, 45%, 54%, 0.3)",
                }}
              >
                <MarkdownMessage text={msg.content} />
              </div>
            </div>
          )}
        </motion.div>
      ))}

      {interimTranscript && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-muted/60 border border-border/30 px-3 py-2 text-[12px] text-muted-foreground italic">
            {interimTranscript}
          </div>
        </motion.div>
      )}

      {isTyping && (
        <div className="flex gap-2 items-start">
          <TillyAvatar />
          <div className="flex gap-1.5 px-3 py-2.5 rounded-2xl" style={{ backgroundColor: "hsl(var(--tilly-bubble))" }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );

  /* ── EMBEDDED MODE (home screen / chat page) ── */
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning.";
    if (h < 17) return "Good afternoon.";
    return "Good evening.";
  };

  if (embedded) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-background">
        <AnimatePresence mode="wait">
          {!hasMessages ? (
            <motion.div
              key="default-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col items-center px-6 pt-24"
            >
              <h2 className="font-display text-2xl font-semibold text-foreground text-center">Ask Tilly anything.</h2>
              <p className="mt-1 text-center text-[12px] text-muted-foreground/60">What would you like to work on today?</p>

              <div className="mt-5 flex w-full max-w-[90%] items-start gap-2">
                <TillyAvatar />
                <div
                  className="rounded-2xl rounded-tl-sm px-3 py-1.5 text-left text-[12px] leading-relaxed text-foreground/90"
                  style={{
                    backgroundColor: "hsl(var(--tilly-bubble))",
                    borderLeft: "2px solid hsla(38, 45%, 54%, 0.45)",
                  }}
                >
                  <p className="mb-0.5 text-[10px] font-semibold" style={{ color: "hsl(38, 45%, 54%)" }}>💡 Tilly Insight</p>
                  {tillyInsight}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="active-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="px-4 pb-1 pt-3">
                <p className="text-[13px] font-medium text-muted-foreground/50">Ask Tilly</p>
              </div>
              <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-2 pb-4">
                {renderMessages()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input bar — always anchored at bottom */}
        <div className="mt-auto shrink-0">
          {(!hasMessages && !chatFirst) ? (
            <div className="flex flex-col items-center gap-3 px-4 pb-2">
              <button
                type="button"
                onClick={toggleListening}
                className={`flex h-12 w-12 items-center justify-center rounded-full shadow-md transition-all ${
                  micState === "listening"
                    ? "bg-accent text-accent-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {micState === "listening" ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
              </button>
              <div className="flex items-center gap-2 overflow-x-auto">
                {onVoiceOnboard && (
                  <button
                    onClick={onVoiceOnboard}
                    className="shrink-0 whitespace-nowrap rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary shadow-sm transition-colors hover:bg-primary/20 flex items-center gap-1.5"
                  >
                    <Mic className="h-3 w-3" /> Voice onboarding
                  </button>
                )}
                {embeddedSuggestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="shrink-0 whitespace-nowrap rounded-full border border-border/50 bg-card px-3 py-1.5 text-[11px] font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted/60"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto px-4 pb-1.5">
              {onVoiceOnboard && (
                <button
                  onClick={onVoiceOnboard}
                  className="shrink-0 whitespace-nowrap rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary shadow-sm transition-colors hover:bg-primary/20 flex items-center gap-1.5"
                >
                  <Mic className="h-3 w-3" /> Voice onboarding
                </button>
              )}
              {embeddedSuggestions.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="shrink-0 whitespace-nowrap rounded-full border border-border/50 bg-card px-3 py-1.5 text-[11px] font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted/60"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex items-center gap-2 px-4 pt-2 pb-4"
          >
            <div className="flex flex-1 items-center rounded-full border border-border/60 bg-card px-4 py-2 shadow-[0_1px_4px_0_hsl(var(--wealth-card-shadow)/0.15)]">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Tilly…"
                className="flex-1 bg-transparent text-[12px] text-foreground outline-none placeholder:text-muted-foreground/40"
              />
            </div>
            <div className="relative flex shrink-0 items-center justify-center">
              {micState !== "listening" && (
                <span className="absolute inset-0 rounded-full bg-primary/30 animate-[pulse_2.5s_cubic-bezier(0.4,0,0.6,1)_infinite]" style={{ transform: "scale(1.5)" }} />
              )}
              <button
                type="button"
                onClick={toggleListening}
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-all ${
                  micState === "listening"
                    ? "bg-accent text-accent-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {micState === "listening" ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              </button>
            </div>
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all disabled:opacity-20"
            >
              <Send className="h-3 w-3" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ── FULL-PAGE MODE (non-embedded, unused currently) ── */
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed inset-0 bottom-16 z-40 flex flex-col bg-background"
        >
          <div className="flex items-center justify-between px-5 py-4" />

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
            {!hasMessages && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center text-center pt-8"
              >
                <h3 className="font-display text-3xl text-foreground mb-1">Ask Tilly anything</h3>
                <p className="text-sm text-muted-foreground">by speaking or typing</p>
              </motion.div>
            )}

            {hasMessages && renderMessages()}

            <AnimatePresence>
              {micError && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="max-w-[85%] rounded-2xl rounded-tl-sm bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-[12px] text-destructive"
                >
                  Didn't catch that. Try again?
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-1.5 px-5 py-1">
            <AlertCircle className="h-3 w-3 text-muted-foreground/40" />
            <p className="text-[10px] text-muted-foreground/40">For informational purposes only.</p>
          </div>

          <div className="px-5 pt-2 pb-4">
            <div className="flex flex-col items-center mb-4">
              <AnimatePresence mode="wait">
                {micState === "listening" && (
                  <motion.p key="listening" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="text-xs font-medium text-accent mb-3">
                    Listening…
                  </motion.p>
                )}
                {micState === "processing" && (
                  <motion.p key="processing" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="text-xs font-medium text-muted-foreground mb-3">
                    Transcribing your question…
                  </motion.p>
                )}
                {micState === "idle" && showFirstUseHint && messages.length === 0 && (
                  <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-muted-foreground/60 mb-3">
                    Tap and speak your question
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="relative">
                {micState === "listening" && (
                  <>
                    <motion.div className="absolute inset-0 rounded-full bg-accent/20" animate={{ scale: [1, 1.6], opacity: [0.4, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }} />
                    <motion.div className="absolute inset-0 rounded-full bg-accent/15" animate={{ scale: [1, 2], opacity: [0.3, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.3 }} />
                  </>
                )}
                {micState === "processing" && (
                  <motion.div className="absolute -inset-1 rounded-full border-2 border-transparent border-t-accent" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                )}
                <motion.button
                  type="button"
                  onClick={toggleListening}
                  animate={micError ? { x: [0, -4, 4, -4, 4, 0] } : {}}
                  transition={micError ? { duration: 0.4 } : {}}
                  className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-all ${
                    micState === "listening" ? "bg-accent text-accent-foreground shadow-accent/30"
                    : micState === "processing" ? "bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground shadow-primary/20"
                  }`}
                >
                  {micState === "processing" ? <Loader2 className="h-6 w-6 animate-spin" /> : micState === "listening" ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </motion.button>

                {micState === "listening" && (
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <motion.span key={i} className="w-1 rounded-full bg-accent" animate={{ height: [4, 12, 4] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }} />
                    ))}
                  </div>
                )}
              </div>

              <p className="text-[10px] text-muted-foreground/40 mt-8">
                {micState === "listening" ? "Tap again to stop" : ""}
              </p>

              <AnimatePresence>
                {micState === "listening" && interimTranscript && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 px-4 py-2 rounded-xl bg-muted/50 border border-border/40 max-w-[90%] text-center">
                    <p className="text-xs text-muted-foreground italic">{interimTranscript}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {micState === "idle" && messages.length === 0 && !isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="flex flex-wrap justify-center gap-1.5 mb-3">
                  {suggestedQuestions.map((q) => (
                    <button key={q} onClick={() => sendMessage(q)} className="rounded-full border border-border/50 px-3 py-1.5 text-[11px] text-muted-foreground/70 hover:bg-muted/40 transition-colors">
                      {q}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex items-center gap-2">
              <div className="flex flex-1 items-center rounded-full border border-border/60 bg-card px-4 py-2 shadow-[0_1px_4px_0_hsl(var(--wealth-card-shadow)/0.15)]">
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type instead…" className="flex-1 bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/40 outline-none" />
              </div>
              <button
                type="button"
                onClick={toggleListening}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all ${
                  micState === "listening"
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {micState === "listening" ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              </button>
              <button type="submit" disabled={!input.trim()} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all disabled:opacity-20">
                <Send className="h-3 w-3" />
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIChatPanel;
