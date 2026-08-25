"use client";
import { useMemo, useState } from "react";
import { type CatalogueEntry } from "@/lib/exercicesCatalogue";
import { MuscleFigure } from "@/components/MuscleFigure";

// Ordre d'affichage des catégories — du plus gros groupe musculaire au plus
// spécifique, plutôt que l'ordre alphabétique.
const CATEGORY_ORDER = ["pectoraux", "dos", "épaules", "bras", "avant-bras", "cuisses", "bas des jambes", "abdominaux", "cardio", "cou"];

export function ExerciceLibraryBrowser({ catalogue, onPick, onClose }: {
  catalogue: CatalogueEntry[];
  onPick: (entry: CatalogueEntry) => void;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"liste" | "silhouette">("silhouette");
  const [bodyView, setBodyView] = useState<"face" | "dos">("face");

  const categories = useMemo(() => {
    const present = new Set(catalogue.map(e => e.partie_corps).filter(Boolean) as string[]);
    const ordered = CATEGORY_ORDER.filter(c => present.has(c));
    const rest = [...present].filter(c => !CATEGORY_ORDER.includes(c)).sort();
    return [...ordered, ...rest];
  }, [catalogue]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalogue
      .filter(e => (!category || e.partie_corps === category) && (!q || e.nom.toLowerCase().includes(q)))
      .slice(0, 200);
  }, [catalogue, category, query]);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-[var(--t-bg)] border border-[var(--t-border)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--t-border-soft)] shrink-0">
          <p style={{ fontFamily: "var(--font-bebas)" }} className="text-lg tracking-wider text-[var(--t-text)]">Bibliothèque d&apos;exercices</p>
          <button onClick={onClose} className="text-[var(--t-text-30)] hover:text-[var(--t-text)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="px-5 py-3 border-b border-[var(--t-border-soft)] shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <input
              className="flex-1 bg-[var(--t-surface-2)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
              placeholder="Rechercher un exercice…" value={query} onChange={e => setQuery(e.target.value)} autoFocus
            />
            <div className="flex border border-[var(--t-border)] rounded-xl overflow-hidden shrink-0">
              <button type="button" onClick={() => setViewMode("silhouette")} title="Silhouette"
                className={`px-2.5 py-2.5 transition-colors ${viewMode === "silhouette" ? "bg-[#c9a84c]/15 text-[#c9a84c]" : "text-[var(--t-text-30)] hover:text-[var(--t-text-60)]"}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="6" r="3"/><path d="M6 21v-6a3 3 0 013-3h6a3 3 0 013 3v6"/><path d="M9 21v-4M15 21v-4"/></svg>
              </button>
              <button type="button" onClick={() => setViewMode("liste")} title="Liste"
                className={`px-2.5 py-2.5 border-l border-[var(--t-border)] transition-colors ${viewMode === "liste" ? "bg-[#c9a84c]/15 text-[#c9a84c]" : "text-[var(--t-text-30)] hover:text-[var(--t-text-60)]"}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
              </button>
            </div>
          </div>

          {viewMode === "silhouette" ? (
            <div className="flex flex-col items-center gap-3">
              <MuscleFigure view={bodyView} onViewChange={setBodyView} active={category} onSelect={c => setCategory(category === c ? null : c)} available={new Set(categories)}/>
              {categories.some(c => c === "cardio" || c === "cou") && (
                <div className="flex gap-1.5">
                  {categories.filter(c => c === "cardio" || c === "cou").map(c => (
                    <button key={c} type="button" onClick={() => setCategory(category === c ? null : c)}
                      className={`text-[0.6rem] tracking-wider uppercase px-3 py-1.5 rounded-full border capitalize transition-colors ${category === c ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black border-transparent" : "border-[var(--t-border)] text-[var(--t-text-40)] hover:border-[#c9a84c]/40"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              )}
              {category && (
                <button type="button" onClick={() => setCategory(null)} className="text-[0.58rem] tracking-wider uppercase text-[var(--t-text-25)] hover:text-[var(--t-text-50)] transition-colors">
                  ✕ Effacer le filtre ({category})
                </button>
              )}
            </div>
          ) : (
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button type="button" onClick={() => setCategory(null)}
                className={`shrink-0 text-[0.62rem] tracking-wider uppercase px-3 py-1.5 rounded-full border transition-colors ${!category ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black border-transparent" : "border-[var(--t-border)] text-[var(--t-text-40)] hover:border-[#c9a84c]/40"}`}>
                Tout
              </button>
              {categories.map(c => (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`shrink-0 text-[0.62rem] tracking-wider uppercase px-3 py-1.5 rounded-full border capitalize transition-colors ${category === c ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black border-transparent" : "border-[var(--t-border)] text-[var(--t-text-40)] hover:border-[#c9a84c]/40"}`}>
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {results.length === 0 ? (
            <p className="text-xs text-[var(--t-text-25)] text-center py-8">Aucun exercice trouvé.</p>
          ) : (
            results.map(e => (
              <button key={e.id} type="button" onClick={() => onPick(e)}
                className="w-full flex items-center justify-between gap-3 text-left px-3 py-2.5 rounded-xl hover:bg-[var(--t-glass-bg)] transition-colors">
                <span className="text-xs text-[var(--t-text-70)] capitalize">{e.nom}</span>
                {e.muscle_cible && <span className="text-[0.58rem] tracking-wider uppercase text-[var(--t-text-25)] shrink-0 capitalize">{e.muscle_cible}</span>}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
