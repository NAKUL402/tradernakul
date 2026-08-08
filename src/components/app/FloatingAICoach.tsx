import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Bot, X, Maximize2, Minimize2 } from "lucide-react";
import { type ChatMessage, sendChatMessageToAI } from "@/lib/ai-coach-service";
import { fetchUserTrades, type Trade } from "@/lib/trades";
import { useLocation } from "@tanstack/react-router";

export function FloatingAICoach() {
  const location = useLocation();
  const isAICoachPage = location.pathname === "/ai-coach";
  const [isOpen, setIsOpen] = useState(false);
  const [userTrades, setUserTrades] = useState<Trade[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      role: "assistant",
      content:
        "Welcome! I am your live Groq AI Trading Coach. Ask me anything about trading concepts, strategy, math, or ask me to analyze your logged trade history.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchUserTrades().then((data) => setUserTrades(data));
  }, []);

  // Listen for custom event to open chat from anywhere
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener("open-ai-coach", handleOpenChat);
    return () => window.removeEventListener("open-ai-coach", handleOpenChat);
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading, isOpen]);

  const startCooldown = (seconds: number) => {
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    setRateLimitCooldown(seconds);
    cooldownTimerRef.current = setInterval(() => {
      setRateLimitCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownTimerRef.current!);
          cooldownTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading || rateLimitCooldown > 0) return;

    setApiError(null);
    setInputMessage("");

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const historyBeforeCurrentTurn = messages;
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const replyText = await sendChatMessageToAI(text, historyBeforeCurrentTurn, userTrades);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      const errDetail = err instanceof Error ? err.message : "Failed to communicate with AI Coach.";
      setApiError(errDetail);
      if (errDetail.includes("rate limit") || errDetail.includes("rate-limit") || errDetail.includes("429")) {
        startCooldown(60);
      }
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `⚠️ ${errDetail}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {isAICoachPage && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-accent text-primary-foreground shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 ${isOpen ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100 glow-primary"}`}
          aria-label="Open AI Coach"
        >
          <Bot className="size-6" />
        </button>
      )}

      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-[60] bg-background/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Premium Drawer Chat Window */}
      <div
        className={`fixed inset-y-0 right-0 z-[70] flex w-full flex-col border-l border-primary/20 bg-card/95 shadow-[0_0_50px_-12px_var(--color-primary)] backdrop-blur-2xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:w-[480px] lg:w-[550px] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-primary/10 bg-gradient-to-r from-primary/5 to-transparent px-6 py-5">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="flex items-center gap-4">
            <div className="grid size-10 place-items-center rounded-xl bg-primary shadow-lg shadow-primary/30 text-primary-foreground">
              <Bot className="size-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-foreground leading-none">TraderNakul AI Mentor</h3>
              <p className="mt-1 text-xs font-medium uppercase tracking-widest text-primary/80">Active Session</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="grid size-8 place-items-center rounded-full hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Chat Area */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : msg.isError
                      ? "bg-destructive/15 text-destructive border border-destructive/20 rounded-tl-sm"
                      : "bg-muted text-foreground rounded-tl-sm"
                }`}
              >
                {msg.content}
              </div>
              <span className="mt-1 text-[10px] text-muted-foreground px-1">{msg.timestamp}</span>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-xs">Thinking...</span>
            </div>
          )}
        </div>

        {/* Error and Rate Limit */}
        {rateLimitCooldown > 0 && (
          <div className="mx-4 mb-2 flex items-center gap-2 rounded-xl bg-amber-500/15 p-2 text-xs font-medium text-amber-600 border border-amber-500/30">
            <Loader2 className="size-3 shrink-0 animate-spin" />
            <span>Rate limit. Wait {rateLimitCooldown}s</span>
          </div>
        )}
        {apiError && rateLimitCooldown === 0 && (
          <div className="mx-4 mb-2 flex items-center gap-2 rounded-xl bg-destructive/15 p-2 text-xs font-medium text-destructive border border-destructive/30">
            <span>{apiError}</span>
          </div>
        )}

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 border-t border-border/50 bg-background/50 p-3"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask AI Coach..."
            disabled={loading}
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !inputMessage.trim() || rateLimitCooldown > 0}
            className="flex items-center justify-center rounded-xl bg-primary h-9 w-10 text-primary-foreground hover:opacity-90 transition disabled:opacity-50 shrink-0"
          >
            {loading || rateLimitCooldown > 0 ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        </form>
      </div>
    </>
  );
}
