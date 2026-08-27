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
// "étirement" est masquée ici aussi : elle a sa propre puce, mise en avant en haut avec
// l'équipement plutôt que noyée dans les puces hors-corps sous le squelette.
const HIDDEN_CHIPS = new Set(["système cardiovasculaire", "cou", "tibial antérieur", "étirement"]);

// Filtre par équipement (repris du schéma MoveKit) — un exercice peut cumuler plusieurs
// équipements ("poulie + élastique" en base) : on découpe sur " + " pour que la puce
// corresponde à chacun d'entre eux, pas seulement à la valeur exacte du champ.
const EQUIPMENT_ORDER = ["poids du corps", "haltère", "barre", "machine à levier", "poulie", "kettlebell", "élastique"];
// "swiss ball" n'a qu'un seul exercice, déjà regroupé dans la catégorie musculaire à part
// "étirement" (voir muscle_cible en base) — pas besoin d'une puce équipement dédiée en plus.
const HIDDEN_EQUIPMENT = new Set(["swiss ball"]);

export function ExerciceLibraryBrowser({ catalogue, onPick, onClose }: {
  catalogue: CatalogueEntry[];
  onPick: (entry: CatalogueEntry) => void;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<string | null>(null);
  const [equipement, setEquipement] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [bodyView, setBodyView] = useState<"face" | "dos">("face");
  const [detailEntry, setDetailEntry] = useState<CatalogueEntry | null>(null);

  const categories = useMemo(() => {
    const present = new Set(catalogue.map(e => e.muscle_cible).filter(Boolean) as string[]);
    const ordered = CATEGORY_ORDER.filter(c => present.has(c) && !HIDDEN_CHIPS.has(c));
    const rest = [...present].filter(c => !CATEGORY_ORDER.includes(c) && !HIDDEN_CHIPS.has(c)).sort();
    return [...ordered, ...rest];
  }, [catalogue]);

  const offBody = useMemo(() => categories.filter(c => !CIBLE_TO_LIB[c]), [categories]);

  const hasStretch = useMemo(() => catalogue.some(e => e.muscle_cible === "étirement"), [catalogue]);

  const equipements = useMemo(() => {
    const present = new Set<string>();
    catalogue.forEach(e => e.equipement?.split(" + ").forEach(x => present.add(x)));
    const ordered = EQUIPMENT_ORDER.filter(x => present.has(x) && !HIDDEN_EQUIPMENT.has(x));
    const rest = [...present].filter(x => !EQUIPMENT_ORDER.includes(x) && !HIDDEN_EQUIPMENT.has(x)).sort();
    return [...ordered, ...rest];
  }, [catalogue]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalogue
      .filter(e =>
        (!category || e.muscle_cible === category) &&
        (!equipement || (e.equipement?.split(" + ") ?? []).includes(equipement)) &&
        (!q || e.nom.toLowerCase().includes(q))
      )
      .slice(0, 200);
  }, [catalogue, category, equipement, query]);

  const modelData: IExerciseData[] = category && CIBLE_TO_LIB[category]
    ? [{ name: "sélection", muscles: CIBLE_TO_LIB[category] }]
    : [];

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-[var(--t-bg)] border border-[var(--t-border)] rounded-t-2xl sm:rounded-2xl w-full sm:w-[720px] sm:max-w-[92vw] h-[92dvh] sm:h-[620px] sm:max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--t-border-soft)] shrink-0">
          <p style={{ fontFamily: "var(--font-bebas)" }} className="text-lg tracking-wider text-[var(--t-text)]">Bibliothèque d&apos;exercices</p>
          <button onClick={onClose} className="shrink-0 text-[var(--t-text-30)] hover:text-[var(--t-text)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="flex-1 flex flex-col-reverse sm:flex-row overflow-hidden">
          {/* Colonne de gauche : petit moteur de recherche + liste défilante de tous les exercices */}
          <div className="w-full sm:w-56 shrink-0 border-t sm:border-t-0 sm:border-r border-[var(--t-border-soft)] flex flex-col overflow-hidden">
            <div className="p-3 border-b border-[var(--t-border-soft)] shrink-0">
              <input
                className="w-full bg-[var(--t-surface-2)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-sm px-3 py-2 focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
                placeholder="Rechercher…" value={query} onChange={e => setQuery(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 min-h-[8rem]">
              {results.length === 0 ? (
                <p className="text-xs text-[var(--t-text-25)] text-center py-8">Aucun exercice trouvé.</p>
              ) : (
                results.map(e => (
                  <button key={e.id} type="button" onClick={() => setDetailEntry(e)}
                    className={`w-full flex items-center gap-2 text-left p-2 rounded-xl transition-colors ${detailEntry?.id === e.id ? "bg-[#c9a84c]/10 text-[#c9a84c]" : "hover:bg-[var(--t-glass-bg)] text-[var(--t-text-70)]"}`}>
                    {e.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.image_url} alt="" loading="lazy" className="w-8 h-8 rounded-lg object-cover shrink-0 bg-[var(--t-surface-2)]"/>
                    ) : (
                      <div className="w-8 h-8 rounded-lg shrink-0 bg-[var(--t-surface-2)]"/>
                    )}
                    <p className="text-xs capitalize truncate flex-1 min-w-0">{e.nom}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Colonne principale : detail de l'exercice selectionne, ou filtres (silhouette/liste) */}
          <div className="flex-1 overflow-y-auto p-5">
            {detailEntry ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p style={{ fontFamily: "var(--font-bebas)" }} className="text-xl tracking-wide text-[var(--t-text)] capitalize">{detailEntry.nom}</p>
                  <button onClick={() => setDetailEntry(null)} className="shrink-0 text-[var(--t-text-25)] hover:text-[var(--t-text)] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>

                {detailEntry.video_url ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video key={detailEntry.id} src={detailEntry.video_url} poster={detailEntry.image_url ?? undefined}
                    controls loop playsInline className="w-full max-h-[40vh] rounded-2xl bg-black object-contain mx-auto"/>
                ) : detailEntry.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={detailEntry.image_url} alt="" className="w-full max-h-[40vh] rounded-2xl object-contain mx-auto bg-[var(--t-surface-2)]"/>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {detailEntry.muscle_cible && (
                    <span className="text-[0.58rem] tracking-wider uppercase text-[#c9a84c]/70 capitalize border border-[#c9a84c]/20 rounded-full px-2.5 py-1">{detailEntry.muscle_cible}</span>
                  )}
                  {detailEntry.equipement && (
                    <span className="text-[0.58rem] tracking-wider uppercase text-[var(--t-text-30)] capitalize border border-[var(--t-border)] rounded-full px-2.5 py-1">{detailEntry.equipement}</span>
                  )}
                </div>

                {detailEntry.description && (
                  <p className="text-sm text-[var(--t-text-50)] leading-relaxed">{detailEntry.description}</p>
                )}

                {detailEntry.image_license && (
                  <p className="text-[0.5rem] text-[var(--t-text-15)]">Photo : {detailEntry.image_license_author || "?"} · {detailEntry.image_license}</p>
                )}

                <button type="button" onClick={() => onPick(detailEntry)}
                  className="w-full bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.7rem] font-bold tracking-[0.15em] uppercase py-3 rounded-2xl shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
                  Ajouter à ma séance
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                {(equipements.length > 0 || hasStretch) && (
                  <div className="w-full flex flex-col items-center gap-1.5 pb-3 mb-1 border-b border-[var(--t-border-soft)]">
                    <p className="text-[0.6rem] tracking-[0.15em] uppercase text-[var(--t-text-25)]">Équipement</p>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {equipements.map(eq => (
                        <button key={eq} type="button" onClick={() => setEquipement(prev => (prev === eq ? null : eq))}
                          className={`text-[0.58rem] tracking-wider uppercase px-3 py-1.5 rounded-full border capitalize transition-colors ${equipement === eq ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black border-transparent" : "border-[var(--t-border)] text-[var(--t-text-40)] hover:border-[#c9a84c]/40"}`}>
                          {eq}
                        </button>
                      ))}
                      {hasStretch && (
                        <button type="button" onClick={() => setCategory(prev => (prev === "étirement" ? null : "étirement"))}
                          className={`text-[0.58rem] tracking-wider uppercase px-3 py-1.5 rounded-full border capitalize transition-colors ${category === "étirement" ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black border-transparent" : "border-[var(--t-border)] text-[var(--t-text-40)] hover:border-[#c9a84c]/40"}`}>
                          Étirement
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <p className="text-[0.65rem] text-[var(--t-text-40)] text-center">Quel groupe musculaire veux-tu travailler ?</p>
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
                  style={{ width: "190px" }}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
