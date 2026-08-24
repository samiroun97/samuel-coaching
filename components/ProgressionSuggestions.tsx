"use client";
import { useEffect, useState } from "react";
import {
  loadRecentExerciceNoms, loadExerciceSessionOutcomes, suggestProgression,
  type ProgressionSuggestion,
} from "@/lib/progression";

const ACTION_CFG: Record<ProgressionSuggestion["action"], { label: string; color: string }> = {
  increase: { label: "Augmenter", color: "#7eb8a0" },
  repeat:   { label: "Reproposer", color: "#c9a84c" },
  deload:   { label: "Deload",     color: "#e09070" },
  none:     { label: "—",          color: "var(--t-text-20)" },
};

type Row = { nom: string; suggestion: ProgressionSuggestion };

// Suggestions de charge pour la prochaine séance de chaque client, basées sur ce qu'il a
// réellement loggué (evaluateSet côté lib/workoutLog.ts). Purement informatif : le coach
// lit, décide, et tape lui-même la valeur dans la séance qu'il rédige — rien n'est appliqué
// automatiquement.
export function ProgressionSuggestions({ clientId }: { clientId: string }) {
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [rows, setRows]           = useState<Row[] | null>(null);
  const [open, setOpen]           = useState(false);

  // Évite d'afficher un instant les suggestions du client précédent quand le coach en
  // sélectionne un nouveau — ajustement pendant le rendu plutôt que dans l'effet ci-dessous.
  if (loadedFor !== clientId) {
    setLoadedFor(clientId);
    setRows(null);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const noms = await loadRecentExerciceNoms(clientId);
      if (cancelled || noms.length === 0) { if (!cancelled) setRows([]); return; }
      const results = await Promise.all(noms.map(async nom => {
        const history = await loadExerciceSessionOutcomes(clientId, nom);
        return { nom, suggestion: suggestProgression(history) };
      }));
      if (!cancelled) setRows(results.filter(r => r.suggestion.action !== "none"));
    })();
    return () => { cancelled = true; };
  }, [clientId]);

  if (rows === null || rows.length === 0) return null;

  return (
    <div className="border border-[#c9a84c]/20 bg-[var(--t-surface-gold)] rounded-xl">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left">
        <p style={{ fontFamily: "var(--font-bebas)" }} className="text-sm tracking-wider text-[#c9a84c]">
          Suggestions de charge · {rows.length}
        </p>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          className={`text-[var(--t-text-25)] shrink-0 transition-transform ${open ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div className="px-4 pb-3 flex flex-col gap-2">
          {rows.map(({ nom, suggestion }) => {
            const cfg = ACTION_CFG[suggestion.action];
            return (
              <div key={nom} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--t-border-soft)] bg-[var(--t-bg)] px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs text-[var(--t-text-70)] truncate">{nom}</p>
                  <p className="text-[0.6rem] text-[var(--t-text-25)] mt-0.5 leading-relaxed">{suggestion.basis}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[0.55rem] tracking-[0.1em] uppercase" style={{ color: cfg.color }}>{cfg.label}</span>
                  {suggestion.suggestedWeight != null && (
                    <p style={{ fontFamily: "var(--font-bebas)" }} className="text-lg text-[var(--t-text)] tracking-wide leading-none mt-0.5">
                      {suggestion.suggestedWeight} <span className="text-[0.55rem] text-[var(--t-text-25)]">kg</span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
