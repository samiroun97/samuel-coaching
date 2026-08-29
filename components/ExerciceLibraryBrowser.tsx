"use client";
import { useMemo, useState, type ReactNode } from "react";
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
];
// Catégories volontairement masquées sous l'écorché (trop marginales comme filtre) — les
// exercices concernés restent trouvables via la recherche/liste, juste sans puce dédiée.
// "étirement" et "cardio" sont masquées ici aussi : elles ont leur propre puce, mise en
// avant en haut avec l'équipement plutôt que noyées dans les puces hors-corps sous le squelette.
const HIDDEN_CHIPS = new Set(["cou", "tibial antérieur", "étirement", "cardio"]);

// Filtre par équipement (repris du schéma MoveKit) — un exercice peut cumuler plusieurs
// équipements ("poulie + élastique" en base) : on découpe sur " + " pour que la puce
// corresponde à chacun d'entre eux, pas seulement à la valeur exacte du champ.
const EQUIPMENT_ORDER = ["poids du corps", "haltère", "barre", "machine", "poulie", "kettlebell", "élastique"];
// "swiss ball" n'a qu'un seul exercice, déjà regroupé dans la catégorie musculaire à part
// "étirement". "corde ondulatoire", "traîneau" et "vélo" sont déjà tous classés en
// muscle_cible = "cardio" en base — inutile de les dupliquer en puces équipement à part.
// "cardio" et "étirement" comme valeurs d'équipement (exercices au poids du corps
// reclassés pour sortir de la puce "poids du corps") sont déjà couverts par les
// puces dédiées Cardio/Étirement ci-dessous — même logique, pas de doublon de puce.
const HIDDEN_EQUIPMENT = new Set(["swiss ball", "corde ondulatoire", "traîneau", "vélo", "cardio", "étirement"]);

// Type de mouvement (biomécanique : push/pull/squat/hinge...) — axe de filtre distinct du
// groupe musculaire, issu de movementPattern MoveKit. "Cardio" et "Stretch" ne sont pas
// repris ici : déjà couverts par les puces Cardio/Étirement existantes.
const MOVEMENT_ORDER = ["push", "pull", "squat", "hinge", "fente", "isolation", "rotation", "gainage", "pliométrie", "mobilité", "abduction de hanche", "portage"];

// Icônes de sections de la fiche exercice, à la place des emojis. "Utilité" reste en
// icône trait (aucun visuel fourni pour cette section) ; les 4 autres utilisent les
// icônes couleur fournies — même famille que library.svg/bilan.svg déjà utilisés
// ailleurs dans l'app (ExerciceEditor.tsx, dashboard).
function IconSvg({ children }: { children: ReactNode }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}
function IconImg({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={15} height={15} className="shrink-0"/>
  );
}
const SECTION_ICONS: Record<"muscle" | "execution" | "utilite" | "aNoter" | "tags", ReactNode> = {
  muscle: <IconImg src="/icons/section-muscle.svg"/>,
  execution: <IconImg src="/icons/section-exec.svg"/>,
  utilite: (
    <IconSvg>
      <circle cx="12" cy="9" r="6"/>
      <line x1="10" y1="19" x2="14" y2="19"/>
      <line x1="10.5" y1="16" x2="13.5" y2="16"/>
    </IconSvg>
  ),
  aNoter: <IconImg src="/icons/section-notice.svg"/>,
  tags: <IconImg src="/icons/section-tags.svg"/>,
};

export function ExerciceLibraryBrowser({ catalogue, onPick, onClose }: {
  catalogue: CatalogueEntry[];
  onPick: (entry: CatalogueEntry) => void;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<string | null>(null);
  const [equipement, setEquipement] = useState<string | null>(null);
  const [mouvement, setMouvement] = useState<string | null>(null);
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
  const hasCardio = useMemo(() => catalogue.some(e => e.muscle_cible === "cardio"), [catalogue]);

  const equipements = useMemo(() => {
    const present = new Set<string>();
    catalogue.forEach(e => e.equipement?.split(" + ").forEach(x => present.add(x)));
    const ordered = EQUIPMENT_ORDER.filter(x => present.has(x) && !HIDDEN_EQUIPMENT.has(x));
    const rest = [...present].filter(x => !EQUIPMENT_ORDER.includes(x) && !HIDDEN_EQUIPMENT.has(x)).sort();
    return [...ordered, ...rest];
  }, [catalogue]);

  const mouvements = useMemo(() => {
    const present = new Set<string>();
    catalogue.forEach(e => e.mouvement?.forEach(m => present.add(m)));
    const ordered = MOVEMENT_ORDER.filter(m => present.has(m));
    const rest = [...present].filter(m => !MOVEMENT_ORDER.includes(m)).sort();
    return [...ordered, ...rest];
  }, [catalogue]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalogue
      .filter(e =>
        (!category || e.muscle_cible === category) &&
        (!equipement || (e.equipement?.split(" + ") ?? []).includes(equipement)) &&
        (!mouvement || (e.mouvement ?? []).includes(mouvement)) &&
        (!q || e.nom.toLowerCase().includes(q))
      )
      .slice(0, 200);
  }, [catalogue, category, equipement, mouvement, query]);

  const modelData: IExerciseData[] = category && CIBLE_TO_LIB[category]
    ? [{ name: "sélection", muscles: CIBLE_TO_LIB[category] }]
    : [];

  // Sur mobile, la liste des resultats reste masquee tant qu'aucune recherche/filtre n'est
  // actif — evite qu'elle occupe l'ecran par defaut. Toujours visible sur desktop (colonne
  // laterale fixe).
  const hasActiveFilter = Boolean(query.trim() || category || equipement || mouvement);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-[var(--t-bg)] border border-[var(--t-border)] sm:rounded-2xl w-full sm:w-[720px] sm:max-w-[92vw] h-[100dvh] sm:h-[620px] sm:max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
          <p style={{ fontFamily: "var(--font-bebas)" }} className="text-lg tracking-wider text-[var(--t-text)]">Bibliothèque d&apos;exercices</p>
          <button onClick={onClose} className="shrink-0 text-[var(--t-text-30)] hover:text-[var(--t-text)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="px-5 pb-3 border-b border-[var(--t-border-soft)] shrink-0">
          <input
            className="w-full bg-[var(--t-surface-2)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-sm px-3 py-2 focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
            placeholder="Rechercher…" value={query} onChange={e => setQuery(e.target.value)}
          />
        </div>

        <div className="flex-1 min-h-0 flex flex-col-reverse sm:flex-row overflow-hidden">
          {/* Colonne de gauche : liste défilante de tous les exercices (recherche déplacée
              en haut, avant le titre). Hauteur bornée quand ouverte (h-[45vh]) : sans ça,
              cette colonne n'a pas de hauteur propre dans le flex-col-reverse et grandit avec
              tout son contenu (jusqu'à 200 résultats), poussant la colonne principale
              (silhouette) hors de l'écran. Sur mobile, la liste reste masquée tant qu'aucun
              filtre/recherche n'est actif — toujours visible sur desktop. */}
          <div className={`w-full ${hasActiveFilter ? "h-[45vh]" : "h-0"} sm:h-auto sm:w-56 shrink-0 border-t sm:border-t-0 sm:border-r border-[var(--t-border-soft)] flex flex-col overflow-hidden`}>
            <div className={`${hasActiveFilter ? "flex" : "hidden"} sm:flex flex-1 min-h-0 overflow-y-auto p-2 flex-col gap-1.5`}>
              {results.length === 0 ? (
                <p className="text-xs text-[var(--t-text-25)] text-center py-8">Aucun exercice trouvé.</p>
              ) : (
                results.map(e => {
                  const active = detailEntry?.id === e.id;
                  return (
                    <button key={e.id} type="button" onClick={() => setDetailEntry(e)}
                      className={`w-full flex items-center gap-2 text-left p-2 rounded-r-xl rounded-l-md border-l-[3px] transition-colors ${
                        active
                          ? "border-[#c9a84c] bg-[#c9a84c]/10 text-[#c9a84c]"
                          : "border-transparent hover:border-[#c9a84c]/25 hover:bg-[var(--t-glass-bg)] text-[var(--t-text-70)] hover:text-[var(--t-text)]"
                      }`}>
                      {e.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={e.image_url} alt="" loading="lazy" className="w-8 h-8 rounded-lg object-cover shrink-0 bg-[var(--t-surface-2)] border border-[var(--t-border-soft)]"/>
                      ) : (
                        <div className="w-8 h-8 rounded-lg shrink-0 bg-[var(--t-surface-2)] border border-[var(--t-border-soft)]"/>
                      )}
                      <p className="text-xs cap-first truncate flex-1 min-w-0">{e.nom}</p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Colonne principale : detail de l'exercice selectionne, ou filtres (silhouette/liste) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-5">
            {detailEntry ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    {detailEntry.muscle_cible && (
                      <p className="text-[0.6rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-0.5">{detailEntry.muscle_cible}</p>
                    )}
                    <p style={{ fontFamily: "var(--font-bebas)" }} className="text-xl font-bold tracking-wide text-[var(--t-text)] cap-first">{detailEntry.nom}</p>
                  </div>
                  <button onClick={() => setDetailEntry(null)} className="shrink-0 text-[var(--t-text-25)] hover:text-[var(--t-text)] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>

                {(detailEntry.video_url || detailEntry.image_url) && (
                  <div className="rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)] bg-[radial-gradient(circle_at_center,var(--t-surface),var(--t-bg2))]">
                    {detailEntry.video_url ? (
                      // eslint-disable-next-line jsx-a11y/media-has-caption
                      <video key={detailEntry.id} src={detailEntry.video_url} poster={detailEntry.image_url ?? undefined}
                        controls loop playsInline className="w-full max-h-[40vh] object-contain mx-auto block"/>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={detailEntry.image_url!} alt="" className="w-full max-h-[40vh] object-contain mx-auto block"/>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {detailEntry.muscle_cible && (
                    <span className="text-[0.58rem] tracking-wider uppercase text-[#c9a84c] capitalize bg-[#c9a84c]/10 rounded-full px-2.5 py-1">{detailEntry.muscle_cible}</span>
                  )}
                  {detailEntry.equipement && (
                    <span className="text-[0.58rem] tracking-wider uppercase text-[#c9a84c] capitalize bg-[#c9a84c]/10 rounded-full px-2.5 py-1">{detailEntry.equipement}</span>
                  )}
                  {detailEntry.mouvement?.map(m => (
                    <span key={m} className="text-[0.58rem] tracking-wider uppercase text-[#c9a84c] capitalize bg-[#c9a84c]/10 rounded-full px-2.5 py-1">{m}</span>
                  ))}
                </div>

                {detailEntry.muscle_travaille || (detailEntry.execution && detailEntry.execution.length > 0) || detailEntry.utilite || (detailEntry.a_noter && detailEntry.a_noter.length > 0) || (detailEntry.tags && detailEntry.tags.length > 0) ? (
                  <div className="flex flex-col gap-3">
                    {detailEntry.muscle_travaille && (
                      <div className="flex flex-col gap-1.5 bg-[var(--t-surface)] border border-[var(--t-border-soft)] rounded-xl p-3">
                        <p className="flex items-center gap-1.5 text-[0.65rem] tracking-[0.15em] uppercase text-[#c9a84c]/80">{SECTION_ICONS.muscle} Muscle travaillé</p>
                        <p className="text-sm text-[var(--t-text-50)] leading-relaxed">{detailEntry.muscle_travaille}</p>
                      </div>
                    )}
                    {detailEntry.execution && detailEntry.execution.length > 0 && (
                      <div className="flex flex-col gap-1.5 bg-[var(--t-surface)] border border-[var(--t-border-soft)] rounded-xl p-3">
                        <p className="flex items-center gap-1.5 text-[0.65rem] tracking-[0.15em] uppercase text-[#c9a84c]/80">{SECTION_ICONS.execution} Exécution</p>
                        <ol className="flex flex-col gap-1.5">
                          {detailEntry.execution.map((step, i) => (
                            <li key={i} className="flex gap-2 text-sm text-[var(--t-text-50)] leading-relaxed">
                              <span className="shrink-0 text-[#c9a84c]/70 font-bold text-xs mt-0.5">{i + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {detailEntry.utilite && (
                      <div className="flex flex-col gap-1.5 bg-[var(--t-surface)] border border-[var(--t-border-soft)] rounded-xl p-3">
                        <p className="flex items-center gap-1.5 text-[0.65rem] tracking-[0.15em] uppercase text-[#c9a84c]/80">{SECTION_ICONS.utilite} Utilité</p>
                        <p className="text-sm text-[var(--t-text-50)] leading-relaxed">{detailEntry.utilite}</p>
                      </div>
                    )}
                    {detailEntry.a_noter && detailEntry.a_noter.length > 0 && (
                      <div className="flex flex-col gap-1.5 bg-[var(--t-surface)] border border-[var(--t-border-soft)] rounded-xl p-3">
                        <p className="flex items-center gap-1.5 text-[0.65rem] tracking-[0.15em] uppercase text-[#c9a84c]/80">{SECTION_ICONS.aNoter} À noter</p>
                        <ul className="flex flex-col gap-1.5">
                          {detailEntry.a_noter.map((mistake, i) => (
                            <li key={i} className="flex gap-2 text-sm text-[var(--t-text-50)] leading-relaxed">
                              <span className="shrink-0 text-[#c9a84c]/70 mt-1.5">•</span>
                              <span>{mistake}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {detailEntry.tags && detailEntry.tags.length > 0 && (
                      <div className="flex flex-col gap-1.5 bg-[var(--t-surface)] border border-[var(--t-border-soft)] rounded-xl p-3">
                        <p className="flex items-center gap-1.5 text-[0.65rem] tracking-[0.15em] uppercase text-[#c9a84c]/80">{SECTION_ICONS.tags} Tags</p>
                        <div className="flex flex-wrap gap-1.5">
                          {detailEntry.tags.map(tag => (
                            <span key={tag} className="text-[0.58rem] tracking-wider uppercase px-2.5 py-1 rounded-full bg-[#c9a84c]/10 text-[#c9a84c] capitalize">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  detailEntry.description && (
                    <p className="text-sm text-[var(--t-text-50)] leading-relaxed">{detailEntry.description}</p>
                  )
                )}

                {detailEntry.image_license && (
                  <p className="text-[0.5rem] text-[var(--t-text-15)]">Photo : {detailEntry.image_license_author || "?"} · {detailEntry.image_license}</p>
                )}

                <button type="button" onClick={() => onPick(detailEntry)}
                  className="w-full bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.7rem] font-bold tracking-[0.15em] uppercase py-3 rounded-2xl shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-[0.97] active:brightness-95 transition-all duration-200">
                  Ajouter à ma séance
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                {(equipements.length > 0 || hasStretch || hasCardio) && (
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
                      {hasCardio && (
                        <button type="button" onClick={() => setCategory(prev => (prev === "cardio" ? null : "cardio"))}
                          className={`text-[0.58rem] tracking-wider uppercase px-3 py-1.5 rounded-full border capitalize transition-colors ${category === "cardio" ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black border-transparent" : "border-[var(--t-border)] text-[var(--t-text-40)] hover:border-[#c9a84c]/40"}`}>
                          Cardio
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {mouvements.length > 0 && (
                  <div className="w-full flex flex-col items-center gap-1.5 pb-3 mb-1 border-b border-[var(--t-border-soft)]">
                    <p className="text-[0.6rem] tracking-[0.15em] uppercase text-[var(--t-text-25)]">Mouvement</p>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {mouvements.map(m => (
                        <button key={m} type="button" onClick={() => setMouvement(prev => (prev === m ? null : m))}
                          className={`text-[0.58rem] tracking-wider uppercase px-3 py-1.5 rounded-full border capitalize transition-colors ${mouvement === m ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black border-transparent" : "border-[var(--t-border)] text-[var(--t-text-40)] hover:border-[#c9a84c]/40"}`}>
                          {m}
                        </button>
                      ))}
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
                {(category || mouvement) && (
                  <div className="flex flex-wrap justify-center gap-3">
                    {category && (
                      <button type="button" onClick={() => setCategory(null)} className="text-[0.58rem] tracking-wider uppercase text-[var(--t-text-25)] hover:text-[var(--t-text-50)] transition-colors">
                        ✕ Effacer le filtre ({category})
                      </button>
                    )}
                    {mouvement && (
                      <button type="button" onClick={() => setMouvement(null)} className="text-[0.58rem] tracking-wider uppercase text-[var(--t-text-25)] hover:text-[var(--t-text-50)] transition-colors">
                        ✕ Effacer le filtre ({mouvement})
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
