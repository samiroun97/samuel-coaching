"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { isPushSupported, subscribeToPush } from "@/lib/push";
import { apiPost } from "@/lib/apiClient";
import { mondayISOOf, todayISO } from "@/lib/planning";
import { RichIcon } from "@/components/RichIcon";
import { isCoachUser } from "@/lib/coach";

// Relances en tête du dashboard client, pour les deux gestes qui font vivre le suivi et
// que personne ne faisait (audit du 28.09.2026 : 0 abonné aux rappels, 0 check-in) :
//  • activer les notifications (rappels repas + check-in) — l'option n'existait que dans
//    Profil › Préférences ; masquable 14 jours ;
//  • envoyer le check-in de la semaine s'il manque — lien direct vers le formulaire.
const DISMISS_KEY = "push_prompt_dismissed_until";

// Sur iPhone/iPad, les notifications web n'existent que dans l'app installée sur l'écran
// d'accueil (iOS 16.4+) : dans Safari, PushManager est absent et la relance "Activer"
// ne s'affichait jamais. On y montre à la place la marche à suivre pour installer l'app.
function isIosBrowserTab() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia("(display-mode: standalone)").matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return ios && !standalone;
}

export function ClientNudges({ userId }: { userId: string }) {
  const [showPush, setShowPush] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [pushState, setPushState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [pushError, setPushError] = useState("");
  const [needsCheckin, setNeedsCheckin] = useState(false);

  useEffect(() => {
    (async () => {
      // Relances réservées aux clients : le coach en aperçu de l'espace client ne fait pas
      // de check-in (formulaire masqué pour lui dans Suivi) et reçoit déjà ses propres alertes.
      if (await isCoachUser(userId)) return;
      // Notifications : proposées si le navigateur les gère, pas encore accordées/abonnées,
      // et pas masquées récemment.
      let dismissedUntil = 0;
      try { dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) ?? 0); } catch { /* ignore */ }
      if (isIosBrowserTab()) {
        if (Date.now() > dismissedUntil) setShowInstall(true);
      } else if (isPushSupported()) {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        if (sub) {
          // Abonnement présent côté navigateur : on le renvoie au serveur (idempotent, upsert
          // sur endpoint). Jusqu'au 28.09.2026 la table push_subscriptions n'avait pas le bon
          // format — les clients ayant cliqué "Activer" avant ont un abonnement navigateur mais
          // aucune ligne en base, donc ne recevaient rien sans que la relance ne réapparaisse.
          const json = sub.toJSON();
          apiPost("/api/push/subscribe", { endpoint: json.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth }).catch(() => {});
        } else if (Date.now() > dismissedUntil && Notification.permission !== "denied") {
          setShowPush(true);
        }
      }
      // Check-in de la semaine en cours (lundi, heure locale).
      const { data } = await supabase.from("weekly_checkins").select("week_date")
        .eq("client_id", userId).eq("week_date", mondayISOOf(todayISO())).limit(1);
      if (!data?.length) setNeedsCheckin(true);
    })().catch(() => {});
  }, [userId]);

  const enablePush = async () => {
    setPushState("busy"); setPushError("");
    try {
      await subscribeToPush();
      setPushState("done");
      setTimeout(() => setShowPush(false), 2500);
    } catch (e: unknown) {
      setPushState("error");
      setPushError(e instanceof Error ? e.message : "Impossible d'activer les notifications.");
    }
  };
  const dismissPush = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now() + 14 * 86400000)); } catch { /* ignore */ }
    setShowPush(false); setShowInstall(false);
  };

  if (!showPush && !showInstall && !needsCheckin) return null;

  return (
    <div className="flex flex-col gap-3 mb-6">
      {needsCheckin && (
        <Link href="/dashboard/suivi#checkin"
          className="group flex items-center gap-4 rounded-2xl border border-[#c9a84c]/35 bg-[var(--t-surface)] px-4 py-3.5 shadow-[0_6px_24px_-14px_rgba(201,168,76,0.6)] hover:-translate-y-0.5 transition-all">
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <div className="absolute inset-1 rounded-full blur-md bg-[#c9a84c] opacity-20"/>
            <RichIcon name="checkin" size={46} className="relative"/>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[0.9rem] font-semibold text-[var(--t-text)]">Ton check-in de la semaine</p>
            <p className="text-[0.75rem] text-[var(--t-text-50)] mt-0.5">2 minutes pour faire le point avec ton coach : poids, énergie, ressenti.</p>
          </div>
          <span className="shrink-0 px-3.5 py-2 rounded-xl bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-on-gold text-[0.72rem] font-bold group-hover:shadow-[0_6px_18px_-6px_rgba(201,168,76,0.8)] transition-shadow">Faire</span>
        </Link>
      )}

      {showInstall && (
        <div className="flex items-center gap-4 rounded-2xl border border-[var(--t-border-soft)] bg-[var(--t-surface)] px-4 py-3.5 shadow-[0_2px_14px_-8px_rgba(0,0,0,0.18)]">
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <div className="absolute inset-1 rounded-full blur-md bg-[#c9a84c] opacity-15"/>
            <RichIcon name="chrono" size={44} className="relative"/>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[0.9rem] font-semibold text-[var(--t-text)]">Installe l&apos;app pour recevoir tes rappels</p>
            <p className="text-[0.75rem] text-[var(--t-text-50)] mt-0.5">
              Dans Safari : bouton Partager, puis « Sur l&apos;écran d&apos;accueil ». Ouvre ensuite l&apos;app depuis son icône pour activer les notifications.
            </p>
          </div>
          <button onClick={dismissPush} className="shrink-0 px-2 py-1 text-[0.68rem] text-[var(--t-text-40)] hover:text-[var(--t-text-70)] transition-colors">Plus tard</button>
        </div>
      )}

      {showPush && (
        <div className="flex items-center gap-4 rounded-2xl border border-[var(--t-border-soft)] bg-[var(--t-surface)] px-4 py-3.5 shadow-[0_2px_14px_-8px_rgba(0,0,0,0.18)]">
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <div className="absolute inset-1 rounded-full blur-md bg-[#c9a84c] opacity-15"/>
            <RichIcon name="uiBell" size={44} className="relative"/>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[0.9rem] font-semibold text-[var(--t-text)]">
              {pushState === "done" ? "Rappels activés ✓" : "Active tes rappels"}
            </p>
            <p className={`text-[0.75rem] mt-0.5 ${pushState === "error" ? "text-[#e07070]" : "text-[var(--t-text-50)]"}`}>
              {pushState === "error" ? pushError : pushState === "done" ? "Tu recevras un rappel aux repas et pour ton check-in." : "Un petit rappel à midi, le soir et le dimanche pour ton check-in. Désactivable à tout moment."}
            </p>
          </div>
          {pushState !== "done" && (
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
              <button onClick={enablePush} disabled={pushState === "busy"}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-on-gold text-[0.72rem] font-bold disabled:opacity-50">
                {pushState === "busy" ? "…" : "Activer"}
              </button>
              <button onClick={dismissPush} className="px-2 py-1 text-[0.68rem] text-[var(--t-text-40)] hover:text-[var(--t-text-70)] transition-colors">Plus tard</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
