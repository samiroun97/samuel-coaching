"use client";
import { useMemo, useState } from "react";
import Model, { type IExerciseData, type Muscle } from "react-body-highlighter";
import { type CatalogueEntry } from "@/lib/exercicesCatalogue";

// On filtre par muscle_cible (plus précis que partie_corps, ~19 valeurs) plutôt que par
// partie_corps (~10, trop large pour une silhouette détaillée) — voir supabase/exercices_catalogue_migration.sql.
// Correspondance avec les clés de react-body-highlighter (licence MIT, github.com/giavinh79/react-body-highlighter) :
// certains muscle_cible n'ont pas d'équivalent sur la silhouette (colonne vertébrale, élévateur de
// la scapula, grand dentelé, système cardiovasculaire) — ils restent accessibles via des puces à part.
const CIBLE_TO_LIB: Record<string, Muscle[]> = {
  "pectoraux": ["chest"],
  "haut du dos": ["upper-back"],
  "grand dorsal": ["lower-back"],
  "trapèzes": ["trapezius"],
  "deltoïdes": ["front-deltoids", "back-deltoids"],
  "biceps": ["biceps"],
  "triceps": ["triceps"],
  "avant-bras": ["forearm"],
  "abdominaux": ["abs", "obliques"],
  "quadriceps": ["quadriceps"],
  "ischio-jambiers": ["hamstring"],
  "adducteurs": ["adductor"],
  "abducteurs": ["abductors"],
  "fessiers": ["gluteal"],
  "mollets": ["calves", "left-soleus", "right-soleus"],
};
const LIB_TO_CIBLE: Record<string, string> = Object.fromEntries(
  Object.entries(CIBLE_TO_LIB).flatMap(([cible, libs]) => libs.map(l => [l, cible]))
);
// Ordre d'affichage des puces — du plus gros groupe musculaire au plus spécifique.
const CATEGORY_ORDER = [
  "pectoraux", "haut du dos", "grand dorsal", "trapèzes", "deltoïdes", "biceps", "triceps", "avant-bras",
  "abdominaux", "quadriceps", "ischio-jambiers", "adducteurs", "abducteurs", "fessiers", "mollets",
  "colonne vertébrale", "élévateur de la scapula", "grand dentelé", "système cardiovasculaire",
];
// Catégories volontairement masquées sous l'écorché (trop marginales comme filtre) — les
// exercices concernés restent trouvables via la recherche/liste, juste sans puce dédiée.
const HIDDEN_CHIPS = new Set(["système cardiovasculaire", "cou", "tibial antérieur"]);

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
    const present = new Set(catalogue.map(e => e.muscle_cible).filter(Boolean) as string[]);
    const ordered = CATEGORY_ORDER.filter(c => present.has(c) && !HIDDEN_CHIPS.has(c));
    const rest = [...present].filter(c => !CATEGORY_ORDER.includes(c) && !HIDDEN_CHIPS.has(c)).sort();
    return [...ordered, ...rest];
  }, [catalogue]);

  const offBody = useMemo(() => categories.filter(c => !CIBLE_TO_LIB[c]), [categories]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalogue
      .filter(e => (!category || e.muscle_cible === category) && (!q || e.nom.toLowerCase().includes(q)))
      .slice(0, 200);
  }, [catalogue, category, query]);

  const modelData: IExerciseData[] = category && CIBLE_TO_LIB[category]
    ? [{ name: "sélection", muscles: CIBLE_TO_LIB[category] }]
    : [];

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
            <div className="flex border border-[var(--t-border)] rounded-full p-0.5 shrink-0">
              <button type="button" onClick={() => setViewMode("silhouette")} title="Silhouette"
                className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${viewMode === "silhouette" ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black" : "text-[var(--t-text-30)] hover:text-[var(--t-text-60)]"}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="6" r="3"/><path d="M6 21v-6a3 3 0 013-3h6a3 3 0 013 3v6"/><path d="M9 21v-4M15 21v-4"/></svg>
              </button>
              <button type="button" onClick={() => setViewMode("liste")} title="Liste"
                className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${viewMode === "liste" ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black" : "text-[var(--t-text-30)] hover:text-[var(--t-text-60)]"}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
              </button>
            </div>
          </div>

          {viewMode === "silhouette" ? (
            <div className="flex flex-col items-center gap-3">
              <p className="text-[0.68rem] text-[var(--t-text-40)] text-center">Quel groupe musculaire veux-tu travailler ?</p>
              <div className="flex border border-[var(--t-border)] rounded-full p-0.5">
                {(["face", "dos"] as const).map(v => (
                  <button key={v} type="button" onClick={() => setBodyView(v)}
                    className={`text-[0.55rem] tracking-[0.15em] uppercase px-4 py-1.5 rounded-full transition-colors ${bodyView === v ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black" : "text-[var(--t-text-40)]"}`}>
                    {v}
                  </button>
                ))}
              </div>

              <Model
                type={bodyView === "face" ? "anterior" : "posterior"}
                data={modelData}
                bodyColor="var(--t-glass-bg)"
                highlightedColors={["#c9a84c"]}
                onClick={({ muscle }) => {
                  const cible = LIB_TO_CIBLE[muscle];
                  if (cible) setCategory(prev => (prev === cible ? null : cible));
                }}
                style={{ width: "170px" }}
                svgStyle={{ filter: "drop-shadow(0 0 0 transparent)" }}
              />

              {offBody.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5">
                  {offBody.map(c => (
                    <button key={c} type="button" onClick={() => setCategory(prev => (prev === c ? null : c))}
                      className={`text-[0.58rem] tracking-wider uppercase px-3 py-1.5 rounded-full border capitalize transition-colors ${category === c ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black border-transparent" : "border-[var(--t-border)] text-[var(--t-text-40)] hover:border-[#c9a84c]/40"}`}>
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

        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1.5">
          {results.length === 0 ? (
            <p className="text-xs text-[var(--t-text-25)] text-center py-8">Aucun exercice trouvé.</p>
          ) : (
            results.map(e => (
              <button key={e.id} type="button" onClick={() => onPick(e)}
                className="w-full flex items-center gap-3 text-left px-3.5 py-3 rounded-xl border border-[var(--t-text-8)] bg-[var(--t-glass-bg)] hover:border-[#c9a84c]/30 hover:bg-[#c9a84c]/5 transition-colors">
                {e.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.image_url} alt="" loading="lazy"
                    className="w-11 h-11 rounded-lg object-cover shrink-0 border border-[var(--t-border)]"/>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--t-text-70)] capitalize truncate">{e.nom}</p>
                  {e.image_license && (
                    <p className="text-[0.5rem] text-[var(--t-text-15)] mt-0.5 truncate">
                      Photo : {e.image_license_author || "?"} · {e.image_license}
                    </p>
                  )}
                </div>
                {e.muscle_cible && <span className="text-[0.58rem] tracking-wider uppercase text-[#c9a84c]/70 shrink-0 capitalize border border-[#c9a84c]/20 rounded-full px-2 py-0.5">{e.muscle_cible}</span>}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
