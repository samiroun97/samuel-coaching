"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

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
    default:
      return null;
  }
}

const navItems = [
  { label: "Accueil", href: "/dashboard", icon: "home" },
  { label: "Nutrition", href: "/dashboard/nutrition", icon: "nutrition" },
  { label: "Programme", href: "/dashboard/programme", icon: "programme" },
  { label: "Suivi", href: "/dashboard/suivi", icon: "suivi" },
  { label: "Coach IA", href: "/dashboard/coach", icon: "coach" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const isOnboarding = pathname === "/dashboard/onboarding";

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/login"); return; }
      if (!isOnboarding) {
        const { data: profile } = await supabase
          .from("profiles").select("prenom").eq("id", data.user.id).single();
        if (!profile?.prenom) { router.push("/dashboard/onboarding"); return; }
      }
      setReady(true);
    });
  }, [pathname]);

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
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 text-[0.6rem] tracking-[0.12em] uppercase transition-all duration-150 border-l-2 ${
                  active
                    ? "text-[#c9a84c] bg-[#c9a84c]/5 border-[#c9a84c]"
                    : "text-white/30 hover:text-white/60 hover:bg-white/[0.03] border-transparent"
                }`}>
                <NavIcon name={icon} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-2 py-4 border-t border-white/5">
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
            className="flex items-center gap-3 px-3 py-2.5 text-[0.6rem] tracking-[0.12em] uppercase text-white/20 hover:text-white/40 transition-colors w-full">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="ml-52 flex-1 min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
