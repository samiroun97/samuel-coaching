"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-sm text-center">
        <p className="text-[0.7rem] tracking-[0.3em] text-[#e07070] uppercase mb-2">Erreur</p>
        <h2 style={{ fontFamily: "var(--font-bebas)" }} className="text-3xl text-[var(--t-text)] tracking-wide mb-3">
          Un problème est survenu
        </h2>
        <p className="text-sm text-[var(--t-text-40)] mb-6 leading-relaxed">
          Cette page n&apos;a pas pu s&apos;afficher. Vérifie ta connexion et réessaie.
        </p>
        <button
          onClick={() => unstable_retry()}
          className="bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.7rem] font-bold tracking-[0.15em] uppercase px-6 py-3 shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 rounded-xl"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
