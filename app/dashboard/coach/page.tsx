"use client";
import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; content: string };

const WELCOME: Message = {
  role: "assistant",
  content: "Bonjour ! Je suis l'assistant IA de Samuel Coaching.\n\nJe peux répondre à tes questions sur ton alimentation, tes entraînements, ta composition corporelle ou l'utilisation de l'application.\n\nAttention : je suis programmé exclusivement pour le sport et la nutrition — je ne répondrai pas à des sujets hors de ce cadre.",
};

const WA_NUMBER = "41798617518";

export default function CoachPage() {
  const [tab,      setTab]      = useState<"ia" | "samuel">("ia");
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [waMsg,    setWaMsg]    = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const waRef     = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, tab]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Message = { role: "user", content: text };
    const history = [...messages.slice(1), userMsg];
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
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.error ? `Erreur : ${data.error}` : data.text,
      }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Une erreur est survenue. Réessaie dans un instant." }]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const openWhatsApp = () => {
    const encoded = encodeURIComponent(waMsg.trim() || "Bonjour Samuel,");
    window.open(`https://wa.me/${WA_NUMBER}?text=${encoded}`, "_blank");
  };

  return (
    <div className="flex flex-col h-screen">

      {/* ── Header ── */}
      <div className="border-b border-white/5 px-8 py-5 shrink-0">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-8 h-8 border border-[#c9a84c]/40 flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-xl tracking-wider text-white leading-none">MESSAGES</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border border-white/10">
          {(["ia", "samuel"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-[0.6rem] tracking-[0.15em] uppercase font-bold transition-colors flex items-center justify-center gap-2 ${
                tab === t
                  ? "bg-[#c9a84c] text-black"
                  : "text-white/30 hover:text-white/60 hover:bg-white/[0.03]"
              }`}>
              {t === "ia" ? (
                <>
                  <span style={{ fontFamily: "var(--font-bebas)" }} className="text-[0.7rem]">IA</span>
                  Assistant IA
                  {tab === "ia" && <div className="w-1.5 h-1.5 rounded-full bg-black/40 animate-pulse"/>}
                </>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.94v1.98z"/>
                  </svg>
                  Samuel
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Onglet IA ── */}
      {tab === "ia" && (
        <>
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
            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 border border-[#c9a84c]/30 bg-[#c9a84c]/5 flex items-center justify-center mr-2.5 mt-0.5 shrink-0">
                  <span style={{ fontFamily: "var(--font-bebas)" }} className="text-[0.6rem] text-[#c9a84c]">IA</span>
                </div>
                <div className="bg-[#111] border border-white/10 px-4 py-3 flex items-center gap-1.5">
                  {[0,1,2].map(j => (
                    <div key={j} className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: `${j * 0.15}s` }}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

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
        </>
      )}

      {/* ── Onglet Samuel ── */}
      {tab === "samuel" && (
        <div className="flex-1 overflow-y-auto px-8 py-8">

          {/* Profil Samuel */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 border border-[#c9a84c]/40 bg-[#c9a84c]/5 flex items-center justify-center">
              <span style={{ fontFamily: "var(--font-bebas)" }} className="text-lg text-[#c9a84c] tracking-wider">SW</span>
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-bebas)" }} className="text-lg tracking-wider text-white leading-none">SAMUEL WAELTI</p>
              <p className="text-[0.55rem] tracking-wider text-white/30 mt-0.5">Coach personnel · disponible sur WhatsApp</p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#7eb8a0]"/>
                <span className="text-[0.45rem] tracking-wider text-[#7eb8a0] uppercase">Répond généralement sous 24h</span>
              </div>
            </div>
          </div>

          {/* Zone de message */}
          <div className="border border-white/10 bg-[#111] p-5 mb-4">
            <p className="text-[0.55rem] tracking-[0.15em] uppercase text-[#c9a84c] mb-3">Ton message</p>
            <textarea
              ref={waRef}
              rows={5}
              placeholder="Écris ton message à Samuel ici…"
              className="w-full bg-[#0a0a0a] border border-white/10 text-white placeholder-white/20 text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/40 transition-colors resize-none"
              value={waMsg}
              onChange={e => setWaMsg(e.target.value)}
            />
          </div>

          <button
            onClick={openWhatsApp}
            className="w-full bg-[#25D366] text-white text-[0.65rem] font-bold tracking-[0.2em] uppercase py-4 hover:bg-[#1ebe5a] transition-colors flex items-center justify-center gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Envoyer sur WhatsApp
          </button>

          <p className="text-center text-[0.45rem] text-white/15 tracking-wider mt-4">
            Tu seras redirigé vers WhatsApp avec ton message pré-rempli
          </p>
        </div>
      )}

    </div>
  );
}
