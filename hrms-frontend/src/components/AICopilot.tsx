import React, { useState, useRef, useEffect } from "react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { MessageSquare, X, Send, Sparkles, AlertCircle, Bot, CornerDownLeft } from "lucide-react";

interface ChatMessage {
  sender: "user" | "bot";
  text: string;
  isError?: boolean;
}

const SUGGESTED_CHIPS = [
  "What is the total headcount?",
  "Who is on leave today?",
  "Who is clocked in?",
  "Tell me about David Vance"
];

interface AICopilotProps {
  onToggle?: (isOpen: boolean) => void;
}

export function AICopilot({ onToggle }: AICopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "bot",
      text: "Hello! I am your PulseHRMS AI Copilot. I can help you search the employee directory, check live attendance rates, and leaves status. Ask me anything!"
    }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleOpen = (value: boolean) => {
    setIsOpen(value);
    if (onToggle) onToggle(value);
  };

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg: ChatMessage = { sender: "user", text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputVal("");
    setIsTyping(true);

    try {
      const response = await api.post<{ reply: string }>("/ai/chat", { message: textToSend });
      setMessages(prev => [...prev, { sender: "bot", text: response.reply }]);
    } catch (err) {
      console.error("AI Copilot request failed:", err);
      setMessages(prev => [
        ...prev,
        {
          sender: "bot",
          text: "I experienced an issue connecting to the AI brain. Please check that the backend is active.",
          isError: true
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputVal);
  };

  return (
    <>
      {/* Floating Toggle Bubble */}
      <button
        onClick={() => toggleOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary hover:bg-primary/95 text-white flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95 duration-200 cursor-pointer group"
        title="Ask PulseHRMS AI"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <div className="relative">
            <Sparkles className="h-6 w-6 animate-pulse text-white" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
          </div>
        )}
      </button>

      {/* Expandable Chat Window Drawer */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 h-[480px] flex flex-col shadow-2xl border border-border/80 bg-card/90 backdrop-blur-lg rounded-2xl animate-fade-in transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary via-indigo-600 to-indigo-500 text-white p-4 rounded-t-2xl flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Bot className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-none font-heading tracking-wide">Pulse AI Assistant</h4>
                <span className="text-[9px] text-white/75 font-medium mt-1 block">Dynamic HR Database Agent</span>
              </div>
            </div>
            <button
              onClick={() => toggleOpen(false)}
              className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1 rounded-md transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {messages.map((msg, idx) => {
              const isBot = msg.sender === "bot";
              return (
                <div
                  key={idx}
                  className={`flex gap-2 items-start max-w-[85%] ${!isBot ? "ml-auto flex-row-reverse" : ""}`}
                >
                  {isBot && (
                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div
                    className={`rounded-xl p-3 text-xs leading-relaxed ${
                      isBot
                        ? msg.isError
                          ? "bg-destructive/10 text-destructive border border-destructive/20"
                          : "bg-muted/60 text-foreground"
                        : "bg-primary text-white font-medium shadow-sm"
                    }`}
                  >
                    {msg.text.split("\n").map((line, i) => (
                      <p key={i} className={i > 0 ? "mt-1.5" : ""}>{line}</p>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {/* Typing status loader */}
            {isTyping && (
              <div className="flex gap-2 items-start max-w-[80%]">
                <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div className="bg-muted/60 rounded-xl p-3 flex gap-1 items-center h-8">
                  <span className="h-1.5 w-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggested prompts chips */}
          <div className="px-4 py-2 shrink-0 border-t border-border/40 bg-muted/10 space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Suggested:</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {SUGGESTED_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSendMessage(chip)}
                  disabled={isTyping}
                  className="text-[10px] text-primary hover:text-white bg-primary/5 hover:bg-primary px-2 py-1 rounded-md border border-primary/15 transition-all text-left font-medium cursor-pointer shrink-0 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Input Area */}
          <form onSubmit={handleFormSubmit} className="p-3 border-t border-border/40 flex items-center gap-2 shrink-0 bg-card rounded-b-2xl">
            <input
              type="text"
              placeholder="Ask me about employee count, leaves today..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              disabled={isTyping}
              className="flex-1 h-9 px-3 text-xs bg-muted/40 hover:bg-muted/60 focus:bg-card border border-border/60 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg outline-none transition-all placeholder:text-muted-foreground/80 disabled:opacity-50"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isTyping || !inputVal.trim()}
              className="h-9 w-9 rounded-lg shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Card>
      )}
    </>
  );
}
