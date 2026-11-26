import React, { useEffect, useRef, useState } from "react";
import { useChoyFood } from "../context/SupabaseContext";
import { evaluateMathExpression } from "../lib/fees";
import { Loader2, MessageSquare, Send, X } from "lucide-react";

interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  "Best combo under ₱250?",
  "How does Choy Pro free delivery work?",
  "How are my KYC IDs protected?",
  "220 * 2 + 35",
];

export const AskChoyDrawer: React.FC = () => {
  const { dishes, cmsSettings, isAskChoyOpen, openAskChoy, closeAskChoy } = useChoyFood();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatTurn[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Kumusta! I am Ask Choy AI. Ask me for Filipino meal pairings, CHOY25 promo tips, Choy Pro free delivery, rider & store onboarding details, or quick bill math!",
    },
  ]);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, isAskChoyOpen]);

  const sendMessage = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;

    const userTurn: ChatTurn = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };

    const nextThread = [...messages, userTurn];
    setMessages(nextThread);
    setInput("");

    // Instant safe local arithmetic evaluation when pure math is asked
    const mathValue = evaluateMathExpression(text);
    if (mathValue !== null) {
      setMessages((prev) => [
        ...prev,
        {
          id: `math-${Date.now()}`,
          role: "assistant",
          content: `Calculated result: ${mathValue.toLocaleString("en-PH", {
            maximumFractionDigits: 4,
          })}`,
        },
      ]);
      return;
    }

    setLoading(true);

    try {
      const menuContext = dishes
        .slice(0, 12)
        .map((d) => `${d.name} (₱${d.price}, ${d.saleGroup}, ${d.storeName})`)
        .join("; ");

      const response = await fetch("/api/ask-choy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextThread.map((m) => ({ role: m.role, content: m.content })),
          menuContext,
          knowledgeBase: cmsSettings.aiKnowledgeBase,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Ask Choy AI is momentarily busy.");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.reply,
        },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content:
            error?.message ||
            "Sorry, I could not reach Ask Choy AI right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={openAskChoy}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 bg-[#1C1917] hover:bg-[#D12D11] text-white text-xs font-semibold px-4 py-3 rounded-full shadow-lg transition-colors whitespace-nowrap"
      >
        <MessageSquare className="w-4 h-4" />
        <span>Ask Choy AI</span>
      </button>

      {isAskChoyOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs">
          <aside className="w-full max-w-md bg-white h-full flex flex-col justify-between shadow-2xl border-l border-stone-200">
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-bold text-[#1C1917]">Ask Choy AI</h2>
                <p className="text-xs text-stone-500">Local menu, platform knowledge &amp; bill math</p>
              </div>
              <button
                onClick={closeAskChoy}
                aria-label="Close Ask Choy AI"
                className="p-1.5 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 text-sm">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-[88%] rounded-xl px-4 py-3 leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "ml-auto bg-[#D12D11] text-white"
                      : "bg-stone-100 text-[#1C1917] border border-stone-200"
                  }`}
                >
                  {msg.content}
                </div>
              ))}
              {loading && (
                <div className="inline-flex items-center gap-2 bg-stone-100 border border-stone-200 text-stone-600 text-xs px-3.5 py-2.5 rounded-xl">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D12D11]" />
                  <span>Ask Choy AI is typing...</span>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            <div className="px-5 py-2.5 border-t border-stone-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 whitespace-nowrap shrink-0 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="px-5 py-4 border-t border-stone-200 flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about combos, promos, or calculate e.g. 220*2..."
                className="flex-1 text-sm px-3.5 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#D12D11]/30 focus:border-[#D12D11]"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-label="Send message"
                className="bg-[#D12D11] hover:bg-[#A61F09] disabled:opacity-50 text-white p-2.5 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </aside>
        </div>
      )}
    </>
  );
};
