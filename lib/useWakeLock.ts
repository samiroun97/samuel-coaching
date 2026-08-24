"use client";
import { useEffect, useRef } from "react";

type WakeLockSentinelLike = { release(): Promise<void> };
type NavigatorWithWakeLock = Navigator & { wakeLock?: { request(type: "screen"): Promise<WakeLockSentinelLike> } };

// Garde l'écran allumé pendant une séance en cours, pour ne pas avoir à déverrouiller le
// téléphone entre chaque série. Le système relâche le verrou dès que l'onglet passe en
// arrière-plan (écran éteint manuellement, changement d'app) — on le ré-acquiert au retour
// au premier plan tant que `active` reste vrai.
export function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinelLike | null>(null);

  useEffect(() => {
    const nav = typeof navigator === "undefined" ? undefined : (navigator as NavigatorWithWakeLock);
    if (!active || !nav?.wakeLock) return;

    let cancelled = false;
    const acquire = async () => {
      try {
        const lock = await nav.wakeLock!.request("screen");
        if (cancelled) { lock.release().catch(() => {}); return; }
        lockRef.current = lock;
      } catch { /* refusé (batterie faible, onglet caché...) — pas bloquant pour la séance */ }
    };
    acquire();

    const onVisible = () => { if (document.visibilityState === "visible") acquire(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      lockRef.current?.release().catch(() => {});
      lockRef.current = null;
    };
  }, [active]);
}
