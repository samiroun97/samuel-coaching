"use client";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { apiPost } from "@/lib/apiClient";

const SAMUEL_EMAIL = "sam97waelti@gmail.com";

type AiMessage  = { role: "user" | "assistant"; content: string };
type DirectMsg  = { id: string; from_email: string; to_email: string; content: string; created_at: string };

const WELCOME: AiMessage = {
  role: "assistant",
  content: "Bonjour ! Je suis l'assistant IA de Samuel Coaching.\n\nJe peux répondre à tes questions sur ton alimentation, tes entraînements, ta composition corporelle ou l'utilisation de l'application.\n\nAttention : je suis programmé exclusivement pour le sport et la nutrition — je ne répondrai pas à des sujets hors de ce cadre.",
};

export default function CoachPage() {
  const [tab,       setTab]       = useState<"ia" | "samuel">("ia");
  const [userEmail, setUserEmail] = useState("");

  // IA chat
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([WELCOME]);
  const [aiInput,    setAiInput]    = useState("");
  const [aiLoading,  setAiLoading]  = useState(false);
  const aiBottom  = useRef<HTMLDivElement>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);

  // Direct messages
  const [dirMsgs,   setDirMsgs]   = useState<DirectMsg[]>([]);
  const [dirInput,  setDirInput]  = useState("");
  const [dirLoading, setDirLoading] = useState(false);
  const dirBottom  = useRef<HTMLDivElement>(null);
  const dirInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;
      setUserEmail(user.email);
      loadDirectMessages(user.email);
    })();
  }, []);

  const loadDirectMessages = async (email: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`from_email.eq.${email},to_email.eq.${email}`)
      .order("created_at", { ascending: true });
    setDirMsgs((data ?? []) as DirectMsg[]);
  };

  useEffect(() => {
    if (!userEmail) return;
    const channel = supabase.channel("direct_messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, payload => {
        const msg = payload.new as DirectMsg;
        if (msg.from_email === userEmail || msg.to_email === userEmail) {
          setDirMsgs(prev => [...prev, msg]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userEmail]);

  useEffect(() => { aiBottom.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMessages]);
  useEffect(() => { dirBottom.current?.scrollIntoView({ behavior: "smooth" }); }, [dirMsgs, tab]);

  const sendAi = async () => {
    const text = aiInput.trim();
    if (!text || aiLoading) return;
    const userMsg: AiMessage = { role: "user", content: text };
    const history = [...aiMessages.slice(1), userMsg];
    setAiMessages(prev => [...prev, userMsg]);
    setAiInput("");
    setAiLoading(true);
    try {
      const res = await apiPost("/api/coach", { messages: history });
      const data = await res.json();
      setAiMessages(prev => [...prev, { role: "assistant", content: data.error ? `Erreur : ${data.error}` : data.text }]);
    } catch {
      setAiMessages(prev => [...prev, { role: "assistant", content: "Une erreur est survenue. Réessaie dans un instant." }]);
    }
    setAiLoading(false);
    setTimeout(() => aiInputRef.current?.focus(), 50);
  };

  const sendDirect = async () => {
    const text = dirInput.trim();
    if (!text || dirLoading || !userEmail) return;
    setDirLoading(true);
    setDirInput("");
    const { error } = await supabase.from("messages").insert({
      from_email: userEmail,
      to_email: SAMUEL_EMAIL,
      content: text,
    });
    if (error) setDirInput(text);
    setDirLoading(false);
    setTimeout(() => dirInputRef.current?.focus(), 50);
  };

  return (
    <div className="flex flex-col h-full">

      {/* ── Header + Tabs ── */}
      <div className="border-b border-white/5 px-8 py-5 shrink-0">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-8 h-8 border border-[#c9a84c]/40 flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-xl tracking-wider text-white leading-none">MESSAGES</h1>
        </div>
        <div className="flex gap-0 border border-white/10">
          {(["ia", "samuel"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-[0.7rem] tracking-[0.15em] uppercase font-bold transition-colors flex items-center justify-center gap-2 ${
                tab === t ? "bg-[#c9a84c] text-black" : "text-white/30 hover:text-white/60 hover:bg-white/[0.03]"
              }`}>
              {t === "ia" ? (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V7"/><circle cx="12" cy="5" r="2"/><line x1="8" y1="15" x2="8" y2="15"/><line x1="12" y1="15" x2="12" y2="15"/><line x1="16" y1="15" x2="16" y2="15"/>
                  </svg>
                  Assistant IA
                </>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
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
            {aiMessages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-6 h-6 border border-[#c9a84c]/30 bg-[#c9a84c]/5 flex items-center justify-center mr-2.5 mt-0.5 shrink-0">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V7"/><circle cx="12" cy="5" r="2"/><line x1="8" y1="15" x2="8" y2="15"/><line x1="12" y1="15" x2="12" y2="15"/><line x1="16" y1="15" x2="16" y2="15"/>
                    </svg>
                  </div>
                )}
                <div className={`max-w-sm px-4 py-3 text-xs leading-relaxed whitespace-pre-line ${
                  m.role === "user" ? "bg-[#c9a84c] text-black" : "bg-[#111] border border-white/10 text-white/60"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 border border-[#c9a84c]/30 bg-[#c9a84c]/5 flex items-center justify-center mr-2.5 mt-0.5 shrink-0">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V7"/><circle cx="12" cy="5" r="2"/><line x1="8" y1="15" x2="8" y2="15"/><line x1="12" y1="15" x2="12" y2="15"/><line x1="16" y1="15" x2="16" y2="15"/>
                  </svg>
                </div>
                <div className="bg-[#111] border border-white/10 px-4 py-3 flex items-center gap-1.5">
                  {[0,1,2].map(j => <div key={j} className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: `${j*0.15}s` }}/>)}
                </div>
              </div>
            )}
            <div ref={aiBottom}/>
          </div>
          <div className="border-t border-white/5 px-8 py-4 flex gap-3 shrink-0">
            <input ref={aiInputRef} value={aiInput} onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAi(); } }}
              placeholder="Pose ta question sur ton entraînement ou ta nutrition…"
              disabled={aiLoading}
              className="flex-1 bg-[#111] border border-white/10 text-white placeholder-white/20 text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/40 transition-colors disabled:opacity-50"/>
            <button onClick={sendAi} disabled={!aiInput.trim() || aiLoading}
              className="bg-[#c9a84c] text-black px-6 py-3 text-[0.7rem] font-bold tracking-[0.15em] uppercase hover:bg-[#e2c97e] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              Envoyer
            </button>
          </div>
        </>
      )}

      {/* ── Onglet Samuel ── */}
      {tab === "samuel" && (
        <>
          <div className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-3">
            {dirMsgs.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-10 h-10 border border-white/10 flex items-center justify-center mx-auto mb-4">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                  </div>
                  <p className="text-white/20 text-xs">Aucun message pour l&apos;instant</p>
                  <p className="text-white/10 text-[0.68rem] mt-1">Envoie un message à Samuel ci-dessous</p>
                </div>
              </div>
            )}
            {dirMsgs.map(m => {
              const isMe = m.from_email === userEmail;
              return (
                <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  {!isMe && (
                    <div className="w-6 h-6 border border-[#c9a84c]/30 bg-[#c9a84c]/5 flex items-center justify-center mr-2.5 mt-0.5 shrink-0">
                      <span style={{ fontFamily: "var(--font-bebas)" }} className="text-[0.68rem] text-[#c9a84c]">SW</span>
                    </div>
                  )}
                  <div className="max-w-sm">
                    <div className={`px-4 py-3 text-xs leading-relaxed whitespace-pre-line ${
                      isMe ? "bg-[#c9a84c] text-black" : "bg-[#111] border border-white/10 text-white/60"
                    }`}>
                      {m.content}
                    </div>
                    <p className={`text-[0.6rem] text-white/15 mt-1 tracking-wider ${isMe ? "text-right" : ""}`}>
                      {new Date(m.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={dirBottom}/>
          </div>
          <div className="border-t border-white/5 px-8 py-4 flex gap-3 shrink-0">
            <input ref={dirInputRef} value={dirInput} onChange={e => setDirInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendDirect(); } }}
              placeholder="Envoie un message à Samuel…"
              disabled={dirLoading}
              className="flex-1 bg-[#111] border border-white/10 text-white placeholder-white/20 text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/40 transition-colors disabled:opacity-50"/>
            <button onClick={sendDirect} disabled={!dirInput.trim() || dirLoading}
              className="bg-[#c9a84c] text-black px-6 py-3 text-[0.7rem] font-bold tracking-[0.15em] uppercase hover:bg-[#e2c97e] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              Envoyer
            </button>
          </div>
        </>
      )}
    </div>
  );
}
