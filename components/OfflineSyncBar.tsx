"use client";
import { useEffect, useState } from "react";
import { flushQueue, pendingOps, QUEUE_EVENT } from "@/lib/offlineQueue";

// Bandeau fin en haut de la séance live : visible seulement sans réseau ou quand des séries
// attendent d'être envoyées (voir lib/offlineQueue.ts). Rassure le client : ses séries sont
// gardées sur le téléphone, rien n'est perdu.
export function OfflineSyncBar() {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const refresh = () => { setOnline(navigator.onLine); setPending(pendingOps().length); };
    refresh();
    // Filet de sécurité : "online" n'est pas toujours émis (réseau de salle instable) —
    // on retente l'envoi toutes les 20 s tant qu'il reste quelque chose en attente.
    const t = setInterval(() => { if (pendingOps().length) flushQueue().then(refresh); }, 20000);
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    window.addEventListener(QUEUE_EVENT, refresh);
    return () => {
      clearInterval(t);
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      window.removeEventListener(QUEUE_EVENT, refresh);
    };
  }, []);

  if (online && pending === 0) return null;

  return (
    <div className={`shrink-0 px-4 py-1.5 text-center text-[0.68rem] font-medium ${online ? "bg-[#c9a84c]/15 text-[#a8893a]" : "bg-[#e0a070]/15 text-[#c07a45]"}`}>
      {!online
        ? `Hors ligne — ${pending > 0 ? `${pending} action${pending > 1 ? "s" : ""} gardée${pending > 1 ? "s" : ""} sur ton téléphone, ` : "tes séries sont gardées sur ton téléphone, "}envoi automatique au retour du réseau`
        : `Synchronisation de ${pending} action${pending > 1 ? "s" : ""}…`}
    </div>
  );
}
