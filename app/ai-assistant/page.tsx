"use client";

import { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Send, Bot, User, Sparkles, Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm MUETBot, your academic AI assistant. How can I help you with your studies today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch response");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    "Help me understand Operating Systems concepts",
    "What topics are important for Digital Logic Design?",
    "Tips for MUET final exams",
    "Explain the OSI model simply"
  ];

  const handleClearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Hello! I'm MUETBot, your academic AI assistant. How can I help you with your studies today?"
      }
    ]);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="flex-1 container mx-auto px-4 py-8 flex flex-col max-w-4xl h-[calc(100vh-80px)]">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold font-syne text-gradient inline-flex items-center gap-2">
            <Bot className="w-8 h-8 text-primary" /> MUETBot
          </h1>
          <p className="text-text-muted mt-2 text-sm">Your intelligent academic assistant for all engineering subjects.</p>
        </div>

        {/* Chat Area */}
        <div className="flex-1 glassmorphism rounded-2xl border border-white/10 overflow-hidden flex flex-col relative shadow-glow">
          
          <div className="absolute top-4 right-4 z-10">
            <button 
              onClick={handleClearChat}
              className="p-2 bg-surface/50 hover:bg-danger/20 hover:text-danger rounded-lg transition-colors border border-white/5 text-text-muted flex items-center gap-2 text-xs"
              title="Clear Chat"
            >
              <Trash2 className="w-4 h-4" /> Clear
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' ? 'bg-primary' : 'bg-surface-2 border border-white/10'
                }`}>
                  {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-6 h-6 text-accent" />}
                </div>
                
                <div className={`p-4 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-surface-2 border border-white/5 text-text rounded-tl-none'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-4 max-w-[85%] mr-auto">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-surface-2 border border-white/10">
                  <Bot className="w-6 h-6 text-accent" />
                </div>
                <div className="p-4 rounded-2xl bg-surface-2 border border-white/5 text-text rounded-tl-none flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-text-muted">MUETBot is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="p-6 pb-2 pt-0 grid grid-cols-1 md:grid-cols-2 gap-2">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setInput(suggestion)}
                  className="text-left p-3 rounded-xl border border-white/5 bg-surface/50 hover:bg-surface-2 hover:border-primary/50 transition-all text-sm text-text-muted hover:text-white flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-accent flex-shrink-0" />
                  <span className="truncate">{suggestion}</span>
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-white/10 bg-surface/80 backdrop-blur-md">
            <div className="relative flex items-center">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about a concept, past paper, or exam tips... (Press Enter to send)"
                className="w-full pl-4 pr-16 py-4 rounded-xl bg-surface-2 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none max-h-32 text-white placeholder-text-muted"
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="absolute right-2 p-3 bg-primary hover:bg-primary-dark disabled:bg-surface-2 disabled:text-text-muted text-white rounded-lg transition-colors flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center mt-3 text-xs text-text-muted flex items-center justify-center gap-1">
              Powered by <span className="text-accent font-medium">Claude</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
