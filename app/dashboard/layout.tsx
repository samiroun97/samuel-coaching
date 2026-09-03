"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { startStateSync, SYNC_STATUS_EVENT } from "@/lib/syncStorage";
import { isCoachUser, getMyCoachBusinessName, getMyOwnBusinessName } from "@/lib/coach";
import { apiPost } from "@/lib/apiClient";
import { Icon } from "@/components/Icon";
import { Home, UtensilsCrossed, Dumbbell, TrendingUp, Play, UserCircle, LogOut } from "@/lib/solarIcons";

const navItems = [
  { label: "Accueil",   href: "/dashboard",            icon: Home },
  { label: "Nutrition", href: "/dashboard/nutrition",  icon: UtensilsCrossed },
  { label: "Activité",  href: "/dashboard/programme",  icon: Dumbbell },
  { label: "Suivi",     href: "/dashboard/suivi",      icon: TrendingUp },
  { label: "Séance",    href: "/dashboard/programme/creer-ma-seance", icon: Play },
  { label: "Compte",    href: "/dashboard/profile",    icon: UserCircle },
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
  const [businessName, setBusinessName] = useState("Coaching");

  useEffect(() => {
    const onSyncStatus = (e: Event) => setSyncIssue(!(e as CustomEvent<{ ok: boolean }>).detail.ok);
    window.addEventListener(SYNC_STATUS_EVENT, onSyncStatus);
    return () => window.removeEventListener(SYNC_STATUS_EVENT, onSyncStatus);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/login"); return; }
      const email = data.user.email ?? "";

      // Inscription coach déposée sur /login (pending_coach_signup) : consommée une
      // seule fois au premier login (email confirmé) — voir app/api/coach/register.
      // Même schéma que pending_invite_code ci-dessous, mais un nouveau coach n'a
      // encore aucune ligne coaches/is_coach tant que cet appel n'a pas eu lieu.
      const pendingCoachSignup = localStorage.getItem("pending_coach_signup");
      if (pendingCoachSignup) {
        localStorage.removeItem("pending_coach_signup");
        try { await apiPost("/api/coach/register", { businessName: pendingCoachSignup }); } catch { /* ignore */ }
        router.push("/crm/clients");
        return;
      }

      const coach = await isCoachUser(data.user.id);
      setIsCoach(coach);
      setCurrentEmail(email);
      // Marque affichée dans le sidebar : celle du coach du client (multi-coachs), ou la
      // sienne propre quand c'est le coach lui-même en aperçu de son espace client.
      (coach ? getMyOwnBusinessName(data.user.id) : getMyCoachBusinessName(data.user.id))
        .then(name => { if (name) setBusinessName(name); });

      // Coach → CRM (sauf aperçu client explicite)
      // Le mode aperçu est persistant pour la session : il survit aux clics
      // sur les liens internes qui ne portent pas ?preview=1, et il est
      // effacé quand le coach retourne sur le CRM.
      if (coach) {
        if (window.location.search.includes("preview=1")) sessionStorage.setItem("client_preview", "1");
        const preview = sessionStorage.getItem("client_preview") === "1";
        setIsPreview(preview);
        if (!preview) { router.push("/crm/clients"); return; }
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
            className="text-[1.05rem] tracking-[0.2em] text-[var(--t-text)] hover:text-[var(--t-text-80)] transition-colors truncate block">
            {businessName}
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
                <Icon icon={icon} size={17}/>
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
            <Icon icon={LogOut} size={17}/>
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
      <nav className="md:hidden print:hidden fixed left-3 right-3 z-10 flex rounded-[1.25rem] bg-[var(--t-glass-bg)] backdrop-blur-xl border border-[var(--t-glass-border)] shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        style={{ bottom: "calc(0.9rem + env(safe-area-inset-bottom))" }}>
        {navItems.map(({ label, href, icon }) => {
          const active = pathname === href;
          const showBadge = href === "/dashboard/coach" && unread;
          const dest = isPreview ? `${href}?preview=1` : href;
          return (
            <Link key={href} href={dest}
              className="relative flex-1 flex flex-col items-center justify-center gap-1 py-2.5 min-w-0">
              {active && (
                <span className="absolute inset-x-1 top-1 bottom-1 rounded-xl bg-gradient-to-b from-[#c9a84c]/25 to-[#c9a84c]/[0.05] border border-[#c9a84c]/30 shadow-[0_0_16px_-2px_rgba(201,168,76,0.5)]"/>
              )}
              <div className={`relative transition-all duration-300 ${active ? "text-[#c9a84c] scale-110" : "text-[var(--t-text-30)]"}`}>
                <Icon icon={icon} size={active ? 21 : 18}/>
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
