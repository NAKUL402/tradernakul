import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Sparkles, X, Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const QUICK_QUESTIONS = [
  "What is Edge Journal?",
  "Why should I use a trading journal?",
  "What can I track?",
  "What is AI Trade Analysis?",
  "What is the AI Coach?",
  "How does Analytics help me?",
  "How do I add a trade?",
  "How can Edge Journal help me improve?",
  "Is my trading data private?",
  "How does account approval work?",
];

const getResponse = (input: string): string => {
  const lowerInput = input.toLowerCase();
  
  const isHindi = lowerInput.includes("kya") || lowerInput.includes("kaise") || lowerInput.includes("kyu") || lowerInput.includes("hai") || lowerInput.includes("mujhe") || lowerInput.includes("mera") || lowerInput.includes("bhai");

  if (lowerInput.includes("what is edge journal") || (lowerInput.includes("edge journal") && lowerInput.includes("kya hai"))) {
    return isHindi 
      ? "Edge Journal ek premium trading journal hai jahan tum apne trades ko record, review aur analyze kar sakte ho."
      : "Edge Journal is a premium trading journal designed to help traders record, review, and analyze their trades in one place.";
  }
  if (lowerInput.includes("why should i use") || lowerInput.includes("help me improve") || lowerInput.includes("kyu use karni") || lowerInput.includes("fayda")) {
    return isHindi
      ? "Kyunki trading sirf trade lene ke baare mein nahi hai — ye apni mistakes se seekhne ke baare mein hai.\n\nEdge Journal tumhe decisions record karne, performance review karne, aur AI analysis ke through apne trades samajhne mein help karta hai."
      : "Because trading isn't only about taking trades — it's about learning from them.\n\nEdge Journal helps you record your decisions, review your performance, identify patterns, and use AI-assisted analysis to understand your trades better.\n\nInstead of relying on memory, you build a record of your trading process.";
  }
  if (lowerInput.includes("what can i track") || lowerInput.includes("add a trade") || lowerInput.includes("kaha add karna") || lowerInput.includes("kaise add")) {
    return isHindi
      ? "Tum apne trades ki saari important details record kar sakte ho jaise:\n\n- Pair/instrument\n- Entry/Exit\n- Lots & Side\n- Result & RRR\n- Setup\n- Mistakes\n- Reason\n- Date\n- Screenshot"
      : "You can record your trades and relevant information such as:\n\n- Pair/instrument\n- Entry information\n- Lots\n- Side\n- Result & RRR\n- Setup\n- Mistakes\n- Reason for trade\n- Date\n- Rating\n- Screenshot\n\nThis gives you a complete picture of every execution.";
  }
  if (lowerInput.includes("ai trade analysis") || (lowerInput.includes("ai") && lowerInput.includes("analysis"))) {
    return isHindi
      ? "Edge Journal AI ka use karke tumhare trades ko analyze karta hai aur batata hai ki tumhari strengths kya hain aur possible mistakes kahan hui hain. (Note: AI market predict nahi karta.)"
      : "Edge Journal provides an AI-assisted feature for analyzing your trades. It helps you identify strengths and potential mistakes in your recorded setups. (Note: AI does not predict the market or guarantee profits.)";
  }
  if (lowerInput.includes("ai coach")) {
    return isHindi
      ? "AI Coach tumhara personalized trading mentor hai. Tum apne logged trades ke baare mein isse chat kar sakte ho, feedback le sakte ho, aur apni trading discipline maintain rakhne ke liye advice le sakte ho."
      : "The AI Coach acts as your personalized trading mentor. You can chat with it about your logged trades, ask for feedback on your performance, and get objective insights to help maintain your trading discipline.";
  }
  if (lowerInput.includes("analytics")) {
    return isHindi
      ? "Analytics dashboard tumhari historical performance dikhata hai. Ye tumhara win rate, profit/loss curves, aur trading patterns track karta hai taaki tum samajh sako ki kya kaam kar raha hai."
      : "The Analytics dashboard helps you review your historical trading performance. It visually tracks your win rate, profit/loss curves, and identifies patterns to show you what's working and what isn't.";
  }
  if (lowerInput.includes("private") || lowerInput.includes("privacy") || lowerInput.includes("secure")) {
    return isHindi
      ? "Haan bilkul! Tumhara trading data 100% private aur secure hai. Ye sirf tumhare login karne ke baad tumhe hi dikhta hai."
      : "Yes! Your trading data is private and secured. It is only accessible to you when you are authenticated.";
  }
  if (lowerInput.includes("approval") || lowerInput.includes("account kaise")) {
    return isHindi
      ? "Naye accounts ko pehle administrator (Owner) se approval chahiye hota hai dashboard access karne ke liye. Approve hone ke baad tum journal use kar sakte ho."
      : "New accounts may require administrator approval before you can access the dashboard. Once approved by the Owner, you'll be able to log in and start journaling.";
  }
  if (lowerInput.includes("dashboard")) {
    return isHindi
      ? "Dashboard tumhe tumhari trading activity ka ek quick overview aur recent stats dikhata hai."
      : "The Dashboard provides a high-level overview of your trading activity, quick stats, and recent trades so you can instantly see where you stand.";
  }
  if (lowerInput.includes("profile") || lowerInput.includes("settings")) {
    return isHindi
      ? "Profile aur Settings se tum apni personal details aur preferences manage kar sakte ho."
      : "Your Profile and Settings allow you to manage your personal details, avatar, and customize your Edge Journal experience.";
  }
  
  return isHindi
    ? "Main yahan Edge Journal samajhne mein tumhari help karne ke liye hoon. Tum platform, features, ya apne trades ke baare mein kuch bhi pooch sakte ho."
    : "I'm here to help you understand Edge Journal and how to use it. Ask me anything about the platform, its features, or how it can help you journal and analyze your trades.";
};

export function LoginGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Hey 👋 Welcome to Edge Journal.\n\nMain tumhe Edge Journal ke features, trading journal aur AI tools ke baare mein explain kar sakta hoon. (I can help you understand Edge Journal's features).\n\nWhat would you like to know?"
        }
      ]);
    }
  }, [isOpen, messages.length]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI thinking delay
    setTimeout(() => {
      const response = getResponse(text);
      const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: response };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 500 + Math.random() * 400); // 500-900ms delay for realism
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputValue);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className={cn(
        "fixed bottom-6 right-6 z-50 transition-all duration-500",
        isOpen ? "translate-y-20 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
      )}>
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 rounded-full border border-primary/20 bg-background/80 px-4 py-3 text-sm font-semibold text-primary shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:border-primary/40 hover:bg-background hover:shadow-[0_0_20px_-5px_var(--color-primary)] active:scale-95"
        >
          <Sparkles className="size-4 transition-transform duration-300 group-hover:rotate-12" />
          <span>Ask Edge Guide</span>
        </button>
      </div>

      {/* Chat Window */}
      <div className={cn(
        "fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6 w-[calc(100vw-32px)] sm:w-[380px] transition-all duration-500 transform origin-bottom-right",
        isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 pointer-events-none translate-y-8"
      )}>
        <div className="flex h-[500px] max-h-[calc(100vh-100px)] flex-col overflow-hidden rounded-2xl border border-border/50 bg-background/90 shadow-2xl backdrop-blur-2xl">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 bg-card/50 px-4 py-3 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </div>
              <div>
                <h3 className="font-display text-sm font-semibold leading-none">Edge Journal Guide</h3>
                <p className="mt-1 text-[10px] text-muted-foreground">Learn how Edge Journal can improve your trading process.</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex w-full", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "relative max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-br-sm" 
                    : "bg-muted/50 border border-border/50 text-foreground rounded-bl-sm"
                )}>
                  {msg.content.split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      {i !== msg.content.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex w-full justify-start">
                <div className="bg-muted/50 border border-border/50 rounded-2xl rounded-bl-sm px-4 py-3.5">
                  <div className="flex gap-1">
                    <div className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                    <div className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
                    <div className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            
            {/* Quick Questions (only show if no user messages yet to keep UI clean, or always show if requested. We'll show at the end if the last message is from assistant) */}
            {messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && !isTyping && (
              <div className="flex flex-wrap gap-2 pt-2 animate-in fade-in duration-500">
                {QUICK_QUESTIONS.slice(0, 4).map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 active:scale-95"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border/50 bg-card/30 p-3 backdrop-blur-md">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about Edge Journal..."
                className="w-full rounded-full border border-border/50 bg-background/50 py-2.5 pl-4 pr-12 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
                disabled={isTyping}
              />
              <button
                onClick={() => handleSend(inputValue)}
                disabled={!inputValue.trim() || isTyping}
                className="absolute right-1.5 grid size-7 place-items-center rounded-full bg-primary text-primary-foreground transition-all hover:opacity-90 disabled:scale-90 disabled:opacity-50"
              >
                <Send className="size-3.5" />
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
}
