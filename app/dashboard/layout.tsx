"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { startStateSync, SYNC_STATUS_EVENT } from "@/lib/syncStorage";
import { isCoachUser } from "@/lib/coach";
import { apiPost } from "@/lib/apiClient";

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
      return <svg {...p}><path d="M13.5 6.5c-.5-1.8.5-3.3 2-4"/><path d="M12.2 8.2c-1-1.2-3.2-1.7-4.5-.6-2.8 2.3-2.5 6.8-.8 10 1.2 2.3 2.8 4.2 4.6 4.4.9.1 1.6-.3 2-.3s1.1.4 2 .3c1.8-.2 3.4-2.1 4.6-4.4 1.7-3.2 2-7.7-.8-10-1.5-1.2-3.7-.7-4.7.5-.3.4-.9.4-1.2 0z"/></svg>;
    case "programme":
      return <svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
    case "suivi":
      return <svg {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
    case "coach":
      return <svg {...p}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>;
    case "admin":
      return <svg {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
    case "profile":
      return <svg {...p}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>;
    case "academy":
      return <svg {...p}><path d="M12 6.2c-1.6-1.1-4.3-1.6-6.5-1.1v13.4c2.2-.5 4.9 0 6.5 1.1 1.6-1.1 4.3-1.6 6.5-1.1V5.1c-2.2-.5-4.9 0-6.5 1.1z"/><path d="M12 6.2v13.4"/></svg>;
    default:
      return null;
  }
}

const navItems = [
  { label: "Accueil",   href: "/dashboard",            icon: "home" },
  { label: "Nutrition", href: "/dashboard/nutrition",  icon: "nutrition" },
  { label: "Activité",  href: "/dashboard/programme",  icon: "programme" },
  { label: "Suivi",     href: "/dashboard/suivi",      icon: "suivi" },
  { label: "Académie",  href: "/dashboard/academie",   icon: "academy" },
  { label: "Compte",    href: "/dashboard/profile",    icon: "profile" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
    const [ready,        setReady]        = useState(false);
  const [isCoach,      setIsCoach]      = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");
  const [unread,       setUnread]       = useState(false);
  const isOnboarding = pathname === "/dashboard/onboarding";
  const [isPreview, setIsPreview] = useState(false);
  const [syncIssue, setSyncIssue] = useState(false);

  useEffect(() => {
    const onSyncStatus = (e: Event) => setSyncIssue(!(e as CustomEvent<{ ok: boolean }>).detail.ok);
    window.addEventListener(SYNC_STATUS_EVENT, onSyncStatus);
    return () => window.removeEventListener(SYNC_STATUS_EVENT, onSyncStatus);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/login"); return; }
      const email = data.user.email ?? "";
      const coach = await isCoachUser(data.user.id);
      setIsCoach(coach);
      setCurrentEmail(email);

      // Coach → CRM (sauf aperçu client explicite)
      // Le mode aperçu est persistant pour la session : il survit aux clics
      // sur les liens internes qui ne portent pas ?preview=1, et il est
      // effacé quand le coach retourne sur le CRM.
      if (coach) {
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

      // Code d'invitation coach déposé sur /login (?invite=CODE) : le consommer
      // une seule fois — remplace le rattachement provisoire par le vrai coach.
      if (!coach) {
        const pending = localStorage.getItem("pending_invite_code");
        if (pending) {
          localStorage.removeItem("pending_invite_code");
          try { await apiPost("/api/coach/join", { code: pending }); } catch { /* ignore */ }
        }
      }

      // Sync multi-appareils : rapatrier l'état du compte avant d'afficher les pages
      await startStateSync(data.user.id);

      // Vérifier messages non lus (pour les adhérents, pas pour le coach)
      if (!coach) {
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
    if (!currentEmail || isCoach) return;
    const channel = supabase.channel(`unread_${currentEmail}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (p) => {
        if (p.new.to_email === currentEmail && pathname !== "/dashboard/coach") {
          setUnread(true);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentEmail, isCoach]);

  // Marquer comme lu quand on arrive sur la page Messages
  useEffect(() => {
    if (pathname === "/dashboard/coach" && currentEmail) {
      localStorage.setItem(`msg_seen_${currentEmail}`, new Date().toISOString());
      setUnread(false);
    }
  }, [pathname, currentEmail]);

  if (!ready) return (
    <div className="min-h-screen bg-[var(--t-bg)] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (isOnboarding) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[var(--t-bg)] flex w-full overflow-x-hidden">
      <aside className="w-52 border-r border-[var(--t-border-soft)] hidden md:flex flex-col fixed h-full z-10 bg-[var(--t-bg)] print:hidden">
        <div className="px-5 py-5 border-b border-[var(--t-border-soft)]">
          <Link href="/" style={{ fontFamily: "var(--font-bebas)" }}
            className="text-[1.05rem] tracking-[0.2em] text-[var(--t-text)] hover:text-[var(--t-text-80)] transition-colors">
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
                className={`flex items-center gap-3 px-3 py-2.5 text-[0.6rem] tracking-[0.12em] uppercase transition-all duration-150 border-l-2 ${
                  active
                    ? "text-[#c9a84c] bg-[#c9a84c]/5 border-[#c9a84c]"
                    : "text-[var(--t-text-30)] hover:text-[var(--t-text-60)] hover:bg-[var(--t-glass-bg)] border-transparent"
                }`}>
                <NavIcon name={icon}/>
                {label}
                {showBadge && <span className="ml-auto w-2 h-2 rounded-full bg-[#e07070] shrink-0"/>}
              </Link>
            );
          })}
        </nav>

        <div className="px-2 py-3 border-t border-[var(--t-border-soft)] flex flex-col gap-0.5">
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
            className="flex items-center gap-3 px-3 py-2.5 text-[0.6rem] tracking-[0.12em] uppercase text-[var(--t-text-20)] hover:text-[var(--t-text-40)] transition-colors w-full border-l-2 border-transparent">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="ml-0 md:ml-52 flex-1 min-w-0 w-full h-screen overflow-y-auto pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0 print:ml-0 print:h-auto print:overflow-visible print:pb-0">
        {children}
      </main>

      {/* Synchro multi-appareils interrompue — reste discret, les données sont conservées en local */}
      {syncIssue && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-3 py-1.5 border border-[#e07070]/30 bg-[var(--t-bg)]/90 rounded-full text-[#e07070] text-[0.45rem] tracking-[0.12em] uppercase print:hidden">
          <span className="w-1.5 h-1.5 rounded-full bg-[#e07070] shrink-0"/>
          Synchro interrompue — données sauvegardées localement
        </div>
      )}

      {/* Bottom nav — mobile only, flottante style verre */}
      <nav className="md:hidden print:hidden fixed left-3 right-3 z-10 flex rounded-[1.75rem] bg-[var(--t-glass-bg)] backdrop-blur-xl border border-[var(--t-glass-border)] shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        style={{ bottom: "calc(0.9rem + env(safe-area-inset-bottom))" }}>
        {navItems.map(({ label, href, icon }) => {
          const active = pathname === href;
          const showBadge = href === "/dashboard/coach" && unread;
          const dest = isPreview ? `${href}?preview=1` : href;
          return (
            <Link key={href} href={dest}
              className="relative flex-1 flex flex-col items-center justify-center gap-1 py-2.5 min-w-0">
              {active && (
                <span className="absolute inset-x-1 top-1 bottom-1 rounded-2xl bg-gradient-to-b from-[#c9a84c]/25 to-[#c9a84c]/[0.05] border border-[#c9a84c]/30 shadow-[0_0_16px_-2px_rgba(201,168,76,0.5)]"/>
              )}
              <div className={`relative transition-all duration-300 ${active ? "text-[#c9a84c] scale-110" : "text-[var(--t-text-30)]"}`}>
                <NavIcon name={icon} size={active ? 21 : 18}/>
                {showBadge && <span className="absolute -top-0.5 -right-1.5 w-2 h-2 rounded-full bg-[#e07070] ring-2 ring-[var(--t-bg)]"/>}
              </div>
              <span className={`relative w-full text-center truncate px-0.5 text-[0.4rem] tracking-[0.02em] uppercase transition-all duration-300 ${
                active ? "text-[#c9a84c] font-bold" : "text-[var(--t-text-30)]"
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
