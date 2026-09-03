"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { startStateSync, SYNC_STATUS_EVENT } from "@/lib/syncStorage";
import { isCoachUser, isCoachActive, isPlatformAdmin, getMyOwnBusinessName } from "@/lib/coach";
import ThemeToggle from "@/components/ThemeToggle";
import { Icon } from "@/components/Icon";
import { LayoutGrid, Users, Share2, MessageSquare, FileText, LogOut, Eye } from "@/lib/solarIcons";

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [ready,     setReady]     = useState(false);
  const [unreadSet, setUnreadSet] = useState<Set<string>>(new Set());
  const [syncIssue, setSyncIssue] = useState(false);
  const [myEmail,   setMyEmail]   = useState("");
  const [businessName, setBusinessName] = useState("");
  const [suspended, setSuspended] = useState(false);
  const [isAdmin,   setIsAdmin]   = useState(false);

  useEffect(() => {
    const onSyncStatus = (e: Event) => setSyncIssue(!(e as CustomEvent<{ ok: boolean }>).detail.ok);
    window.addEventListener(SYNC_STATUS_EVENT, onSyncStatus);
    return () => window.removeEventListener(SYNC_STATUS_EVENT, onSyncStatus);
  }, []);

  useEffect(() => {
    // De retour sur le CRM : on sort du mode aperçu client
    sessionStorage.removeItem("client_preview");
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !(await isCoachUser(user.id))) { router.push("/login"); return; }
      if (!(await isCoachActive(user.id))) { setSuspended(true); setReady(true); return; }
      const email = user.email ?? "";
      setMyEmail(email);
      getMyOwnBusinessName(user.id).then(name => setBusinessName(name ?? "Mon espace coach"));
      isPlatformAdmin(user.id).then(setIsAdmin);

      // Sync multi-appareils (conversations traitées, etc.)
      await startStateSync(user.id);

      // Conversations où le dernier message vient du client (pas de moi) et non marquées traitées.
      // RLS restreint déjà cette requête aux messages où je suis expéditeur ou destinataire.
      const { data: msgs } = await supabase.from("messages").select("id,from_email,to_email,content,created_at").order("created_at", { ascending: true });
      if (msgs) {
        let treated = new Set<string>();
        try { treated = new Set(JSON.parse(localStorage.getItem("crm_treated_convs") ?? "[]")); } catch { /* ignore */ }
        const last = new Map<string, string>();
        for (const m of msgs) {
          const client = m.from_email === email ? m.to_email : m.from_email;
          if (client !== email) last.set(client, m.from_email);
        }
        setUnreadSet(new Set([...last.entries()].filter(([client, from]) => from !== email && !treated.has(client)).map(([client]) => client)));
      }
      setReady(true);
    })();
  }, [pathname]);

  // Ecoute en temps réel : un nouveau message client doit faire apparaître le badge
  // immédiatement, même sur une conversation déjà "traitée" ou déjà ouverte.
  useEffect(() => {
    if (!myEmail) return;
    const ch = supabase.channel("crm_layout_messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, p => {
        const m = p.new as { from_email: string; to_email: string };
        if (m.from_email === myEmail) {
          setUnreadSet(prev => { if (!prev.has(m.to_email)) return prev; const next = new Set(prev); next.delete(m.to_email); return next; });
        } else {
          let treated = new Set<string>();
          try { treated = new Set(JSON.parse(localStorage.getItem("crm_treated_convs") ?? "[]")); } catch { /* ignore */ }
          treated.delete(m.from_email);
          localStorage.setItem("crm_treated_convs", JSON.stringify([...treated]));
          setUnreadSet(prev => { if (prev.has(m.from_email)) return prev; const next = new Set(prev); next.add(m.from_email); return next; });
        }
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [myEmail]);

  const unread = unreadSet.size;

  const nav = [
    { href: "/crm",            label: "Dashboard",  icon: LayoutGrid,    badge: 0 },
    { href: "/crm/clients",    label: "Clients",    icon: Users,         badge: 0 },
    { href: "/crm/programmes", label: "Programmes", icon: FileText,      badge: 0 },
    { href: "/crm/inbox",      label: "Inbox",      icon: MessageSquare, badge: unread },
  ];

  if (!ready) return (
    <div className="min-h-screen bg-[var(--t-bg2)] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  if (suspended) return (
    <div className="min-h-screen bg-[var(--t-bg2)] flex items-center justify-center p-6">
      <div className="max-w-sm text-center flex flex-col items-center gap-4">
        <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl tracking-wide text-[var(--t-text)]">Compte suspendu</p>
        <p className="text-sm text-[var(--t-text-40)]">Ton accès au CRM a été temporairement suspendu. Contacte l&apos;administrateur de la plateforme pour plus d&apos;informations.</p>
        <button onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
          className="text-[0.65rem] tracking-[0.15em] uppercase text-[#c9a84c] hover:text-[var(--t-text-60)] transition-colors">
          Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--t-bg2)] flex w-full overflow-x-hidden">
      <aside className="w-56 bg-[var(--t-bg)] border-r border-[var(--t-border-soft)] hidden md:flex flex-col fixed h-full z-10">
        <div className="px-5 pt-6 pb-5 border-b border-[var(--t-border-soft)]">
          <p style={{ fontFamily: "var(--font-bebas)" }} className="text-[0.85rem] tracking-[0.22em] text-[#c9a84c] leading-none truncate">{businessName.toUpperCase()}</p>
          <p className="text-[0.42rem] tracking-[0.3em] text-[var(--t-text-20)] uppercase mt-1.5">Plateforme coaching</p>
        </div>

        <nav className="flex-1 px-2 py-4 flex flex-col gap-0.5">
          {nav.map(({ href, label, icon, badge }) => {
            const active = pathname === href || (href !== "/crm" && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                className={`flex items-center justify-between px-3 py-2.5 text-[0.6rem] tracking-[0.1em] uppercase transition-all border-l-2 ${
                  active ? "text-[#c9a84c] bg-[#c9a84c]/5 border-[#c9a84c]" : "text-[var(--t-text-30)] hover:text-[var(--t-text-60)] hover:bg-[var(--t-glass-bg)] border-transparent"
                }`}>
                <div className="flex items-center gap-2.5"><Icon icon={icon} size={15}/>{label}</div>
                {badge > 0 && <span className="bg-[#e07070] text-white text-[0.4rem] font-bold px-1.5 py-0.5 rounded-full min-w-[1.1rem] text-center">{badge}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="px-2 py-3 border-t border-[var(--t-border-soft)] flex flex-col gap-2">
          {isAdmin && (
            <Link href="/operateur"
              className="flex items-center gap-2.5 px-3 py-2.5 text-[0.6rem] tracking-[0.1em] uppercase text-[#c9a84c] hover:text-[var(--t-text-70)] border-l-2 border-transparent hover:border-[#c9a84c] transition-all">
              <Icon icon={Share2} size={15}/>CRM
            </Link>
          )}
          <Link href="/dashboard?preview=1"
            className="flex items-center gap-2.5 px-3 py-2.5 text-[0.6rem] tracking-[0.1em] uppercase text-[var(--t-text-20)] hover:text-[var(--t-text-50)] border-l-2 border-transparent hover:border-[var(--t-border)] transition-all">
            <Icon icon={Eye} size={15}/>Mon espace perso
          </Link>
          <button onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
            className="flex items-center gap-2.5 px-3 py-2.5 text-[0.6rem] tracking-[0.1em] uppercase text-[var(--t-text-20)] hover:text-[var(--t-text-50)] border-l-2 border-transparent transition-all w-full">
            <Icon icon={LogOut} size={15}/>Déconnexion
          </button>
          <div className="px-3 pt-1">
            <ThemeToggle/>
          </div>
        </div>
      </aside>

      {/* Synchro multi-appareils interrompue — reste discret, les données sont conservées en local */}
      {syncIssue && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#e07070]/30 bg-[var(--t-bg)]/90 text-[#e07070] text-[0.45rem] tracking-[0.12em] uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#e07070] shrink-0"/>
          Synchro interrompue — données sauvegardées localement
        </div>
      )}

      <main className="ml-0 md:ml-56 flex-1 min-w-0 min-h-screen pb-16 md:pb-0">{children}</main>

      {/* Bottom nav — mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--t-bg)] border-t border-[var(--t-border-soft)] flex z-10 pb-[env(safe-area-inset-bottom)]">
        {nav.map(({ href, label, icon, badge }) => {
          const active = pathname === href || (href !== "/crm" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[0.45rem] tracking-[0.08em] uppercase transition-all ${
                active ? "text-[#c9a84c]" : "text-[var(--t-text-25)]"
              }`}>
              <div className="relative">
                <Icon icon={icon} size={15}/>
                {badge > 0 && <span className="absolute -top-1 -right-2 bg-[#e07070] text-white text-[0.4rem] font-bold px-1 py-px rounded-full min-w-[0.9rem] text-center">{badge}</span>}
              </div>
              {label}
            </Link>
          );
        })}
        <Link href="/dashboard?preview=1"
          className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[0.45rem] tracking-[0.08em] uppercase text-[var(--t-text-25)] transition-all">
          <Icon icon={Eye} size={15}/>
          Aperçu
        </Link>
        {isAdmin && (
          <Link href="/operateur"
            className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[0.45rem] tracking-[0.08em] uppercase text-[#c9a84c] transition-all">
            <Icon icon={Share2} size={15}/>
            CRM
          </Link>
        )}
      </nav>
    </div>
  );
}
