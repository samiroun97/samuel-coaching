"use client";
import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; content: string };

const WELCOME: Message = {
  role: "assistant",
  content: "Bonjour ! Je suis l'assistant IA de Samuel Coaching.\n\nJe peux répondre à tes questions sur ton alimentation, tes entraînements, ta composition corporelle ou l'utilisation de l'application.\n\nAttention : je suis programmé exclusivement pour le sport et la nutrition — je ne répondrai pas à des sujets hors de ce cadre.",
};

export default function CoachPage() {
  const [messages, setMessages]   = useState<Message[]>([WELCOME]);
  const [input,    setInput]      = useState("");
  const [loading,  setLoading]    = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const history = [...messages.slice(1), userMsg]; // strip welcome from API context
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      const reply: Message = {
        role: "assistant",
        content: data.error ? `Erreur : ${data.error}` : data.text,
      };
      setMessages(prev => [...prev, reply]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Une erreur est survenue. Réessaie dans un instant." }]);
    }

    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div className="flex flex-col h-screen">

      {/* ── Header ── */}
      <div className="border-b border-white/5 px-8 py-5 flex items-center gap-4 shrink-0">
        <div className="w-8 h-8 border border-[#c9a84c]/40 flex items-center justify-center">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
        </div>
        <div>
          <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-xl tracking-wider text-white leading-none">MESSAGES</h1>
          <p className="text-white/30 text-[0.55rem] tracking-wider mt-0.5">Assistant IA · sport & nutrition uniquement</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#7eb8a0] animate-pulse"/>
          <span className="text-[0.5rem] tracking-wider text-white/20 uppercase">En ligne</span>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-6 h-6 border border-[#c9a84c]/30 bg-[#c9a84c]/5 flex items-center justify-center mr-2.5 mt-0.5 shrink-0">
                <span style={{ fontFamily: "var(--font-bebas)" }} className="text-[0.6rem] text-[#c9a84c]">IA</span>
              </div>
            )}
            <div className={`max-w-sm px-4 py-3 text-xs leading-relaxed whitespace-pre-line ${
              m.role === "user"
                ? "bg-[#c9a84c] text-black"
                : "bg-[#111] border border-white/10 text-white/60"
            }`}>
              {m.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="w-6 h-6 border border-[#c9a84c]/30 bg-[#c9a84c]/5 flex items-center justify-center mr-2.5 mt-0.5 shrink-0">
              <span style={{ fontFamily: "var(--font-bebas)" }} className="text-[0.6rem] text-[#c9a84c]">IA</span>
            </div>
            <div className="bg-[#111] border border-white/10 px-4 py-3 flex items-center gap-1.5">
              {[0, 1, 2].map(j => (
                <div key={j} className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: `${j * 0.15}s` }}/>
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="border-t border-white/5 px-8 py-4 flex gap-3 shrink-0">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Pose ta question sur ton entraînement ou ta nutrition…"
          disabled={loading}
          className="flex-1 bg-[#111] border border-white/10 text-white placeholder-white/20 text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/40 transition-colors disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          className="bg-[#c9a84c] text-black px-6 py-3 text-[0.6rem] font-bold tracking-[0.15em] uppercase hover:bg-[#e2c97e] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          Envoyer
        </button>
      </div>

    </div>
  );
}
