"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { startStateSync } from "@/lib/syncStorage";

const SAMUEL_EMAIL = "sam97waelti@gmail.com";

function NavIcon({ name, size = 17 }: { name: string; size?: number }) {
  const p = {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.5,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "home":
      return <svg {...p}><path d="M3 9L12 2l9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path d="M9 22V12h6v10"/></svg>;
    case "nutrition":
      return <svg {...p}><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>;
    case "programme":
      return <svg {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;
    case "suivi":
      return <svg {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
    case "coach":
      return <svg {...p}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>;
    case "admin":
      return <svg {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
    case "profile":
      return <svg {...p}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>;
    default:
      return null;
  }
}

const navItems = [
  { label: "Accueil",   href: "/dashboard",            icon: "home" },
  { label: "Nutrition", href: "/dashboard/nutrition",  icon: "nutrition" },
  { label: "Programme", href: "/dashboard/programme",  icon: "programme" },
  { label: "Suivi",     href: "/dashboard/suivi",      icon: "suivi" },
  { label: "Messages",  href: "/dashboard/coach",      icon: "coach" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
    const [ready,        setReady]        = useState(false);
  const [isSamuel,     setIsSamuel]     = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");
  const [unread,       setUnread]       = useState(false);
  const [fbOpen,       setFbOpen]       = useState(false);
  const [fbType,       setFbType]       = useState<"bug"|"suggestion"|"idee">("suggestion");
  const [fbMsg,        setFbMsg]        = useState("");
  const [fbSending,    setFbSending]    = useState(false);
  const [fbDone,       setFbDone]       = useState(false);
  const isOnboarding = pathname === "/dashboard/onboarding";
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/login"); return; }
      const email = data.user.email ?? "";
      setIsSamuel(email === SAMUEL_EMAIL);
      setCurrentEmail(email);

      // Samuel → CRM (sauf aperçu client explicite)
      // Le mode aperçu est persistant pour la session : il survit aux clics
      // sur les liens internes qui ne portent pas ?preview=1, et il est
      // effacé quand Samuel retourne sur le CRM.
      if (email === SAMUEL_EMAIL) {
        if (window.location.search.includes("preview=1")) sessionStorage.setItem("client_preview", "1");
        const preview = sessionStorage.getItem("client_preview") === "1";
        setIsPreview(preview);
        if (!preview) { router.push("/crm"); return; }
      }

      if (!isOnboarding) {
        const { data: profile } = await supabase
          .from("profiles").select("prenom").eq("id", data.user.id).single();
        if (!profile?.prenom) { router.push("/dashboard/onboarding"); return; }
      }

      // Sync multi-appareils : rapatrier l'état du compte avant d'afficher les pages
      await startStateSync(data.user.id);

      // Vérifier messages non lus (pour clients, pas pour Samuel)
      if (email !== SAMUEL_EMAIL) {
        const lastSeen = localStorage.getItem(`msg_seen_${email}`) ?? "1970-01-01";
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("to_email", email)
          .gt("created_at", lastSeen);
        if ((count ?? 0) > 0) setUnread(true);
      }

      setReady(true);
    });
  }, [pathname]);

  // Subscription aux nouveaux messages
  useEffect(() => {
    if (!currentEmail || currentEmail === SAMUEL_EMAIL) return;
    const channel = supabase.channel(`unread_${currentEmail}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (p) => {
        if (p.new.to_email === currentEmail && pathname !== "/dashboard/coach") {
          setUnread(true);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentEmail]);

  // Marquer comme lu quand on arrive sur la page Messages
  useEffect(() => {
    if (pathname === "/dashboard/coach" && currentEmail) {
      localStorage.setItem(`msg_seen_${currentEmail}`, new Date().toISOString());
      setUnread(false);
    }
  }, [pathname, currentEmail]);

  if (!ready) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const sendFeedback = async () => {
    if (!fbMsg.trim() || fbSending) return;
    setFbSending(true);
    const content = `[FEEDBACK:${fbType}]\n${fbMsg.trim()}`;
    await supabase.from("messages").insert({ from_email: currentEmail, to_email: SAMUEL_EMAIL, content });
    setFbSending(false); setFbDone(true); setFbMsg("");
    setTimeout(() => { setFbOpen(false); setFbDone(false); }, 1800);
  };

  const FB_LABELS: Record<string, string> = { bug: "🐛 Bug", suggestion: "💡 Suggestion", idee: "✨ Idée" };

  if (isOnboarding) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex w-full overflow-x-hidden">
      <aside className="w-52 border-r border-white/5 hidden md:flex flex-col fixed h-full z-10 bg-[#0a0a0a]">
        <div className="px-5 py-5 border-b border-white/5">
          <Link href="/" style={{ fontFamily: "var(--font-bebas)" }}
            className="text-[1.05rem] tracking-[0.2em] text-white hover:text-white/80 transition-colors">
            SAMUEL<span className="text-[#c9a84c]">.</span><span className="text-[#c9a84c]">COACHING</span>
          </Link>
        </div>

        <nav className="flex-1 px-2 py-4 flex flex-col gap-0.5">
          {navItems.map(({ label, href, icon }) => {
            const active = pathname === href;
            const showBadge = href === "/dashboard/coach" && unread;
            const dest = isPreview ? `${href}?preview=1` : href;
            return (
              <Link key={href} href={dest}
                className={`flex items-center gap-3 px-3 py-2.5 text-[0.7rem] tracking-[0.12em] uppercase transition-all duration-150 border-l-2 ${
                  active
                    ? "text-[#c9a84c] bg-[#c9a84c]/5 border-[#c9a84c]"
                    : "text-white/30 hover:text-white/60 hover:bg-white/[0.03] border-transparent"
                }`}>
                <NavIcon name={icon}/>
                {label}
                {showBadge && <span className="ml-auto w-2 h-2 rounded-full bg-[#e07070] shrink-0"/>}
              </Link>
            );
          })}
        </nav>

        <div className="px-2 py-3 border-t border-white/5 flex flex-col gap-0.5">
          <Link href="/dashboard/profile"
            className={`flex items-center gap-3 px-3 py-2.5 text-[0.7rem] tracking-[0.12em] uppercase transition-all duration-150 border-l-2 ${
              pathname === "/dashboard/profile"
                ? "text-[#c9a84c] bg-[#c9a84c]/5 border-[#c9a84c]"
                : "text-white/20 hover:text-white/40 hover:bg-white/[0.03] border-transparent"
            }`}>
            <NavIcon name="profile"/>
            Mon profil
          </Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
            className="flex items-center gap-3 px-3 py-2.5 text-[0.7rem] tracking-[0.12em] uppercase text-white/20 hover:text-white/40 transition-colors w-full border-l-2 border-transparent">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="ml-0 md:ml-52 flex-1 min-w-0 w-full h-screen overflow-y-auto pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>

      {/* Retour CRM — Samuel en mode aperçu */}
      {isSamuel && isPreview && (
        <Link href="/crm"
          className="fixed top-4 left-4 md:left-56 z-40 flex items-center gap-1.5 px-3 py-1.5 border border-white/15 bg-[#0a0a0a]/90 text-white/50 hover:text-white/80 hover:border-white/30 transition-all text-[0.62rem] tracking-[0.15em] uppercase">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Retour CRM
        </Link>
      )}

      {/* Feedback button — clients + preview mode */}
      {(!isSamuel || isPreview) && (
        <>
          <button onClick={() => setFbOpen(true)}
            className="fixed top-4 right-4 z-40 flex items-center gap-1.5 px-3 py-1.5 border transition-all text-[0.62rem] tracking-[0.15em] uppercase"
            style={{ backgroundColor: "#c9a84c15", borderColor: "#c9a84c50", color: "#c9a84c", boxShadow: "0 0 12px #c9a84c25" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Feedback
          </button>

          {fbOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
              onClick={() => setFbOpen(false)}>
              <div className="bg-[#0f0f0f] border border-white/10 w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                <h3 style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-white tracking-wide mb-1">Feedback</h3>
                <p className="text-[0.62rem] text-white/30 tracking-wider mb-5">Remonte un bug ou une suggestion sur l'app</p>

                {/* Type selector */}
                <div className="flex gap-2 mb-4">
                  {(["bug", "suggestion", "idee"] as const).map(t => (
                    <button key={t} onClick={() => setFbType(t)}
                      className={`flex-1 py-2 text-[0.62rem] tracking-[0.12em] uppercase border transition-all ${
                        fbType === t ? "border-[#c9a84c] text-[#c9a84c] bg-[#c9a84c]/5" : "border-white/10 text-white/30 hover:border-white/20"
                      }`}>
                      {FB_LABELS[t]}
                    </button>
                  ))}
                </div>

                <textarea value={fbMsg} onChange={e => setFbMsg(e.target.value)}
                  placeholder="Décris le problème ou ton idée…"
                  rows={4}
                  className="w-full bg-[#0a0a0a] border border-white/10 text-white/70 placeholder-white/20 text-xs px-4 py-3 resize-none focus:outline-none focus:border-[#c9a84c]/40 transition-colors mb-4"/>

                {fbDone ? (
                  <div className="text-center py-2 text-[#7eb8a0] text-xs tracking-wider">Merci, c'est envoyé ✓</div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setFbOpen(false)}
                      className="flex-1 py-2.5 border border-white/10 text-white/30 text-[0.62rem] tracking-wider uppercase hover:border-white/20 transition-colors">
                      Annuler
                    </button>
                    <button onClick={sendFeedback} disabled={!fbMsg.trim() || fbSending}
                      className="flex-1 py-2.5 bg-[#c9a84c] text-black text-[0.62rem] font-bold tracking-[0.15em] uppercase hover:bg-[#e2c97e] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                      {fbSending ? "Envoi…" : "Envoyer"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Bottom nav — mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-white/8 flex z-10 pb-[env(safe-area-inset-bottom)]">
        {navItems.map(({ label, href, icon }) => {
          const active = pathname === href;
          const showBadge = href === "/dashboard/coach" && unread;
          const dest = isPreview ? `${href}?preview=1` : href;
          return (
            <Link key={href} href={dest}
              className="relative flex-1 flex flex-col items-center justify-center gap-1 py-3">
              {active && (
                <span className="absolute inset-x-2 top-1.5 bottom-1.5 rounded-2xl bg-gradient-to-b from-[#c9a84c]/20 to-[#c9a84c]/[0.04] border border-[#c9a84c]/25 shadow-[0_0_16px_-2px_rgba(201,168,76,0.4)]"/>
              )}
              <div className={`relative transition-all duration-300 ${active ? "text-[#c9a84c] scale-110" : "text-white/30"}`}>
                <NavIcon name={icon} size={active ? 22 : 19}/>
                {showBadge && <span className="absolute -top-0.5 -right-1.5 w-2 h-2 rounded-full bg-[#e07070] ring-2 ring-[#0a0a0a]"/>}
              </div>
              <span className={`relative text-[0.64rem] tracking-[0.08em] uppercase transition-all duration-300 ${
                active ? "text-[#c9a84c] font-bold" : "text-white/30"
              }`}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
