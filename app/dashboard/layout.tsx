"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const SAMUEL_EMAIL = "sam97waelti@gmail.com";

function NavIcon({ name }: { name: string }) {
  const p = {
    width: 17, height: 17, viewBox: "0 0 24 24", fill: "none",
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
  const isOnboarding = pathname === "/dashboard/onboarding";

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/login"); return; }
      const email = data.user.email ?? "";
      setIsSamuel(email === SAMUEL_EMAIL);
      setCurrentEmail(email);

      if (!isOnboarding) {
        const { data: profile } = await supabase
          .from("profiles").select("prenom").eq("id", data.user.id).single();
        if (!profile?.prenom) { router.push("/dashboard/onboarding"); return; }
      }

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

  if (isOnboarding) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <aside className="w-52 border-r border-white/5 flex flex-col fixed h-full z-10 bg-[#0a0a0a]">
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
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 text-[0.6rem] tracking-[0.12em] uppercase transition-all duration-150 border-l-2 ${
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
          {isSamuel && (
            <Link href="/dashboard/admin"
              className={`flex items-center gap-3 px-3 py-2.5 text-[0.6rem] tracking-[0.12em] uppercase transition-all duration-150 border-l-2 mt-2 ${
                pathname === "/dashboard/admin"
                  ? "text-[#c9a84c] bg-[#c9a84c]/5 border-[#c9a84c]"
                  : "text-white/30 hover:text-white/60 hover:bg-white/[0.03] border-transparent"
              }`}>
              <NavIcon name="admin"/>
              Clients
            </Link>
          )}
        </nav>

        <div className="px-2 py-3 border-t border-white/5 flex flex-col gap-0.5">
          <Link href="/dashboard/profile"
            className={`flex items-center gap-3 px-3 py-2.5 text-[0.6rem] tracking-[0.12em] uppercase transition-all duration-150 border-l-2 ${
              pathname === "/dashboard/profile"
                ? "text-[#c9a84c] bg-[#c9a84c]/5 border-[#c9a84c]"
                : "text-white/20 hover:text-white/40 hover:bg-white/[0.03] border-transparent"
            }`}>
            <NavIcon name="profile"/>
            Mon profil
          </Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
            className="flex items-center gap-3 px-3 py-2.5 text-[0.6rem] tracking-[0.12em] uppercase text-white/20 hover:text-white/40 transition-colors w-full border-l-2 border-transparent">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="ml-52 flex-1 h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
