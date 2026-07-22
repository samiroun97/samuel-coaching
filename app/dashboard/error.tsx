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
        <h2 style={{ fontFamily: "var(--font-bebas)" }} className="text-3xl text-white tracking-wide mb-3">
          Un problème est survenu
        </h2>
        <p className="text-sm text-white/40 mb-6 leading-relaxed">
          Cette page n&apos;a pas pu s&apos;afficher. Vérifie ta connexion et réessaie.
        </p>
        <button
          onClick={() => unstable_retry()}
          className="bg-[#c9a84c] text-black text-[0.7rem] font-bold tracking-[0.15em] uppercase px-6 py-3 hover:bg-[#e2c97e] hover:shadow-[0_4px_16px_-4px_rgba(201,168,76,0.5)] hover:-translate-y-px transition-all duration-200"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
