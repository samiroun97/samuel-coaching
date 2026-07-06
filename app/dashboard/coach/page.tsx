"use client";
import { useState, useRef, useEffect } from "react";

type Message = { from: "user" | "ai"; text: string };

const initialMessages: Message[] = [
  {
    from: "ai",
    text: "Bonjour ! Je suis ton coach IA. Je serai bientôt connecté pour répondre à tes questions sur l'entraînement, la nutrition et la récupération. En attendant, contacte Samuel directement sur WhatsApp.",
  },
];

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          from: "ai",
          text: "Je suis en cours de développement. Pour toutes tes questions, contacte Samuel directement sur WhatsApp — il te répondra rapidement !",
        },
      ]);
    }, 600);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b border-white/5 px-8 py-5 flex items-center gap-4 shrink-0">
        <div className="w-8 h-8 border border-[#c9a84c]/40 flex items-center justify-center">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
        </div>
        <div>
          <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-xl tracking-wider text-white leading-none">COACH IA</h1>
          <p className="text-white/30 text-[0.55rem] tracking-wider mt-0.5">Assistant fitness personnel</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]/40 animate-pulse"/>
          <span className="text-[0.5rem] tracking-wider text-white/20 uppercase">Bientôt disponible</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
            {m.from === "ai" && (
              <div className="w-6 h-6 border border-[#c9a84c]/30 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                <span style={{ fontFamily: "var(--font-bebas)" }} className="text-[0.6rem] text-[#c9a84c]">IA</span>
              </div>
            )}
            <div className={`max-w-sm px-4 py-3 text-xs leading-relaxed ${
              m.from === "user"
                ? "bg-[#c9a84c] text-black"
                : "bg-[#111] border border-white/10 text-white/60"
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/5 px-8 py-4 flex gap-3 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Pose ta question..."
          className="flex-1 bg-[#111] border border-white/10 text-white placeholder-white/20 text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
        />
        <button
          onClick={send}
          className="bg-[#c9a84c] text-black px-6 py-3 text-[0.6rem] font-bold tracking-[0.15em] uppercase hover:bg-[#e2c97e] transition-colors">
          Envoyer
        </button>
      </div>
    </div>
  );
}
