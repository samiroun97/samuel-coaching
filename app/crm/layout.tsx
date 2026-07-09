"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const SAMUEL_EMAIL = "sam97waelti@gmail.com";

function Icon({ name }: { name: string }) {
  const p = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "grid":   return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>;
    case "users":  return <svg {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
    case "flow":   return <svg {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49"/></svg>;
    case "chat":   return <svg {...p}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>;
    case "doc":    return <svg {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
    case "logout": return <svg {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
    case "eye":    return <svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
    default: return null;
  }
}

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [ready,   setReady]   = useState(false);
  const [unread,  setUnread]  = useState(0);

  useEffect(() => {
    // De retour sur le CRM : on sort du mode aperçu client
    sessionStorage.removeItem("client_preview");
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== SAMUEL_EMAIL) { router.push("/login"); return; }

      // Count conversations where last message is from client (not Samuel)
      const { data: msgs } = await supabase.from("messages").select("from_email,to_email,created_at").order("created_at", { ascending: true });
      if (msgs) {
        const last = new Map<string, string>();
        for (const m of msgs) {
          const client = m.from_email === SAMUEL_EMAIL ? m.to_email : m.from_email;
          if (client !== SAMUEL_EMAIL) last.set(client, m.from_email);
        }
        setUnread([...last.values()].filter(f => f !== SAMUEL_EMAIL).length);
      }
      setReady(true);
    })();
  }, [pathname]);

  const nav = [
    { href: "/crm",            label: "Dashboard",  icon: "grid",  badge: 0 },
    { href: "/crm/clients",    label: "Clients",    icon: "users", badge: 0 },
    { href: "/crm/programmes", label: "Programmes", icon: "doc",   badge: 0 },
    { href: "/crm/inbox",      label: "Inbox",      icon: "chat",  badge: unread },
  ];

  if (!ready) return (
    <div className="min-h-screen bg-[#060606] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#060606] flex w-full overflow-x-hidden">
      <aside className="w-56 bg-[#0a0a0a] border-r border-white/5 hidden md:flex flex-col fixed h-full z-10">
        <div className="px-5 pt-6 pb-5 border-b border-white/5">
          <p style={{ fontFamily: "var(--font-bebas)" }} className="text-[0.85rem] tracking-[0.22em] text-[#c9a84c] leading-none">SAMUEL.COACHING</p>
          <p className="text-[0.42rem] tracking-[0.3em] text-white/20 uppercase mt-1.5">Espace Coach — CRM</p>
        </div>

        <nav className="flex-1 px-2 py-4 flex flex-col gap-0.5">
          {nav.map(({ href, label, icon, badge }) => {
            const active = pathname === href || (href !== "/crm" && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                className={`flex items-center justify-between px-3 py-2.5 text-[0.6rem] tracking-[0.1em] uppercase transition-all border-l-2 ${
                  active ? "text-[#c9a84c] bg-[#c9a84c]/5 border-[#c9a84c]" : "text-white/30 hover:text-white/60 hover:bg-white/[0.02] border-transparent"
                }`}>
                <div className="flex items-center gap-2.5"><Icon name={icon}/>{label}</div>
                {badge > 0 && <span className="bg-[#e07070] text-white text-[0.4rem] font-bold px-1.5 py-0.5 rounded-full min-w-[1.1rem] text-center">{badge}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="px-2 py-3 border-t border-white/5 flex flex-col gap-0.5">
          <Link href="/dashboard?preview=1"
            className="flex items-center gap-2.5 px-3 py-2.5 text-[0.6rem] tracking-[0.1em] uppercase text-white/20 hover:text-white/50 border-l-2 border-transparent hover:border-white/10 transition-all">
            <Icon name="eye"/>Aperçu client
          </Link>
          <button onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
            className="flex items-center gap-2.5 px-3 py-2.5 text-[0.6rem] tracking-[0.1em] uppercase text-white/20 hover:text-white/50 border-l-2 border-transparent transition-all w-full">
            <Icon name="logout"/>Déconnexion
          </button>
        </div>
      </aside>

      <main className="ml-0 md:ml-56 flex-1 min-w-0 min-h-screen pb-16 md:pb-0">{children}</main>

      {/* Bottom nav — mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-white/5 flex z-10 pb-[env(safe-area-inset-bottom)]">
        {nav.map(({ href, label, icon, badge }) => {
          const active = pathname === href || (href !== "/crm" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[0.45rem] tracking-[0.08em] uppercase transition-all ${
                active ? "text-[#c9a84c]" : "text-white/25"
              }`}>
              <div className="relative">
                <Icon name={icon}/>
                {badge > 0 && <span className="absolute -top-1 -right-2 bg-[#e07070] text-white text-[0.4rem] font-bold px-1 py-px rounded-full min-w-[0.9rem] text-center">{badge}</span>}
              </div>
              {label}
            </Link>
          );
        })}
        <Link href="/dashboard?preview=1"
          className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[0.45rem] tracking-[0.08em] uppercase text-white/25 transition-all">
          <Icon name="eye"/>
          Aperçu
        </Link>
      </nav>
    </div>
  );
}
