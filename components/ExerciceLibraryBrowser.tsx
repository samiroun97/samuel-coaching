"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Model, { type IExerciseData, type Muscle } from "react-body-highlighter";
import { type CatalogueEntry } from "@/lib/exercicesCatalogue";
import { getRecentExerciceNoms, pushRecentExerciceNom } from "@/lib/recentExercices";
import { useDragScroll } from "@/lib/useDragScroll";

// Bouton icône seul (pas de texte visible) avec pastille dorée quand un filtre est actif —
// plus discret qu'un menu déroulant classique et plus proche des conventions mobiles
// (icône de filtre en haut à droite d'une barre de recherche, cf. Mail, Fichiers, etc.).
function FilterDropdown({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const active = Boolean(value);
  return (
    <div ref={ref} className="relative shrink-0">
      <button type="button" onClick={() => setOpen(o => !o)} title="Équipement"
        className={`relative w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${active ? "border-[#c9a84c]/50 text-[#c9a84c] bg-[#c9a84c]/10" : "border-[var(--t-border)] text-[var(--t-text-30)] hover:border-[#c9a84c]/40 hover:text-[#c9a84c]"}`}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
        {active && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#c9a84c] ring-2 ring-[var(--t-bg)]"/>}
      </button>
      {open && (
        <div className="absolute right-0 mt-1.5 z-[100] border border-[var(--t-border)] bg-[var(--t-surface)] rounded-xl shadow-[0_16px_40px_-8px_rgba(0,0,0,0.6)] py-1 min-w-[10rem] max-h-64 overflow-y-auto">
          <button type="button" onClick={() => { onChange(""); setOpen(false); }}
            className={`w-full text-left px-3 py-2 text-xs transition-colors whitespace-nowrap ${!value ? "text-[#c9a84c] bg-[#c9a84c]/10" : "text-[var(--t-text-25)] hover:bg-[var(--t-glass-bg)]"}`}>
            Tous équipements
          </button>
          {options.map(o => (
            <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs capitalize transition-colors whitespace-nowrap ${o.value === value ? "text-[#c9a84c] bg-[#c9a84c]/10" : "text-[var(--t-text-60)] hover:bg-[var(--t-glass-bg)]"}`}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// On filtre par muscle_cible (plus précis que partie_corps, ~19 valeurs) plutôt que par
// partie_corps (~10, trop large pour une silhouette détaillée) — voir supabase/exercices_catalogue_migration.sql.
// Correspondance avec les clés de react-body-highlighter (licence MIT, github.com/giavinh79/react-body-highlighter) :
// certains muscle_cible n'ont pas d'équivalent sur la silhouette (colonne vertébrale, élévateur de
// la scapula, grand dentelé, système cardiovasculaire) — ils restent accessibles via les chips/la recherche.
const CIBLE_TO_LIB: Record<string, Muscle[]> = {
  "pectoraux": ["chest"],
  "grand dorsal": ["upper-back"],
  "lombaires": ["lower-back"],
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
// Vue (face/dos) à afficher pour la mini-silhouette de la fiche exercice — certains muscles
// existent dans les deux vues de la librairie, on choisit celle où ils sont le plus lisibles.
const CIBLE_VIEW: Record<string, "anterior" | "posterior"> = {
  "pectoraux": "anterior", "grand dorsal": "posterior", "lombaires": "posterior",
  "trapèzes": "posterior", "deltoïdes": "anterior", "biceps": "anterior", "triceps": "posterior",
  "avant-bras": "anterior", "abdominaux": "anterior", "quadriceps": "anterior",
  "ischio-jambiers": "posterior", "adducteurs": "posterior", "abducteurs": "anterior",
  "fessiers": "posterior", "mollets": "posterior",
};
// Ordre d'affichage des chips — du plus gros groupe musculaire au plus spécifique.
const CATEGORY_ORDER = [
  "pectoraux", "grand dorsal", "trapèzes", "lombaires", "deltoïdes", "biceps", "triceps", "avant-bras",
  "abdominaux", "quadriceps", "ischio-jambiers", "adducteurs", "abducteurs", "fessiers", "mollets",
];
// Catégories volontairement masquées de la liste de chips (trop marginales comme filtre) — les
// exercices concernés restent trouvables via la recherche, juste sans chip dédiée.
const HIDDEN_CHIPS = new Set(["cou", "tibial antérieur"]);

// Filtre par équipement (repris du schéma MoveKit) — un exercice peut cumuler plusieurs
// équipements ("poulie + élastique" en base) : on découpe sur " + " pour que la puce
// corresponde à chacun d'entre eux, pas seulement à la valeur exacte du champ.
const EQUIPMENT_ORDER = ["poids du corps", "haltère", "barre", "machine", "poulie", "kettlebell", "élastique"];
const HIDDEN_EQUIPMENT = new Set(["swiss ball", "corde ondulatoire", "traîneau", "vélo", "cardio", "étirement"]);

// Icône neutre pour les cartes sans photo (la grande majorité du catalogue) — un exercice sur
// une grille visuelle ne doit jamais rendre une case vide/cassée, même sans média.
function DumbbellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5h11a2 2 0 012 2v7a2 2 0 01-2 2h-11a2 2 0 01-2-2v-7a2 2 0 012-2zM2 9v6M22 9v6"/>
    </svg>
  );
}

function ExerciceCard({ entry, onOpen }: { entry: CatalogueEntry; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen}
      className="group flex flex-col text-left border border-[var(--t-border-soft)] bg-[var(--t-surface)] rounded-xl overflow-hidden hover:border-[#c9a84c]/40 transition-colors">
      <div className="aspect-square w-full bg-[var(--t-surface-2)] flex items-center justify-center overflow-hidden">
        {entry.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={entry.image_url} alt="" loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
        ) : (
          <div className="text-[var(--t-text-15)] group-hover:text-[#c9a84c]/50 transition-colors"><DumbbellIcon/></div>
        )}
      </div>
      <div className="px-2 py-1.5 flex flex-col gap-0.5">
        <p className="text-[0.65rem] leading-snug text-[var(--t-text-70)] cap-first line-clamp-2">{entry.nom}</p>
        {entry.muscle_cible && <p className="text-[0.52rem] tracking-wider uppercase text-[#c9a84c]/70 capitalize truncate">{entry.muscle_cible}</p>}
      </div>
    </button>
  );
}

export function ExerciceLibraryBrowser({ catalogue, onPick, onClose }: {
  catalogue: CatalogueEntry[];
  onPick: (entry: CatalogueEntry) => void;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<string | null>(null);
  const [equipement, setEquipement] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [detailEntry, setDetailEntry] = useState<CatalogueEntry | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "silhouette">("grid");
  // localStorage n'existe pas côté serveur : lu en effet plutôt qu'en initialiseur de useState
  // pour ne jamais faire diverger le HTML serveur (toujours vide) du premier rendu client
  // (potentiellement rempli) et provoquer une erreur d'hydratation React.
  const [recentNoms, setRecentNoms] = useState<string[]>([]);
  useEffect(() => { setRecentNoms(getRecentExerciceNoms()); }, []);
  const categoryScrollRef = useDragScroll<HTMLDivElement>();
  const recentScrollRef = useDragScroll<HTMLDivElement>();

  const handlePick = (entry: CatalogueEntry) => {
    pushRecentExerciceNom(entry.nom);
    setRecentNoms(getRecentExerciceNoms());
    onPick(entry);
  };

  const categories = useMemo(() => {
    const present = new Set(catalogue.map(e => e.muscle_cible).filter(Boolean) as string[]);
    const ordered = CATEGORY_ORDER.filter(c => present.has(c) && !HIDDEN_CHIPS.has(c));
    const rest = [...present].filter(c => !CATEGORY_ORDER.includes(c) && !HIDDEN_CHIPS.has(c)).sort();
    return [...ordered, ...rest];
  }, [catalogue]);

  const equipements = useMemo(() => {
    const present = new Set<string>();
    catalogue.forEach(e => e.equipement?.split(" + ").forEach(x => present.add(x)));
    const ordered = EQUIPMENT_ORDER.filter(x => present.has(x) && !HIDDEN_EQUIPMENT.has(x));
    const rest = [...present].filter(x => !EQUIPMENT_ORDER.includes(x) && !HIDDEN_EQUIPMENT.has(x)).sort();
    return [...ordered, ...rest];
  }, [catalogue]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalogue.filter(e =>
      (!category || e.muscle_cible === category) &&
      (!equipement || (e.equipement?.split(" + ") ?? []).includes(equipement)) &&
      (!q || e.nom.toLowerCase().includes(q))
    );
  }, [catalogue, category, equipement, query]);

  const recentEntries = useMemo(() => {
    if (query.trim() || category || equipement) return [];
    return recentNoms.map(nom => catalogue.find(e => e.nom === nom)).filter((e): e is CatalogueEntry => !!e);
  }, [recentNoms, catalogue, query, category, equipement]);

  const modelData: IExerciseData[] = category && CIBLE_TO_LIB[category]
    ? [{ name: "sélection", muscles: CIBLE_TO_LIB[category] }]
    : [];

  return (
    <div className="border border-[var(--t-border)] bg-[var(--t-bg)] rounded-2xl w-full max-h-[80vh] sm:max-h-[700px] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
        <div className="min-w-0">
          <p style={{ fontFamily: "var(--font-bebas)" }} className="text-lg tracking-wider text-[var(--t-text)]">Bibliothèque d&apos;exercices</p>
          {!detailEntry && <p className="text-[0.6rem] text-[var(--t-text-25)] tracking-wider">{results.length} exercice{results.length > 1 ? "s" : ""}</p>}
        </div>
        <button onClick={onClose} className="shrink-0 text-[var(--t-text-30)] hover:text-[var(--t-text)] transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {!detailEntry && (
        <>
          <div className="px-5 pb-3 shrink-0 flex items-center gap-2">
            <input
              className="flex-1 min-w-0 bg-[var(--t-surface-2)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-sm px-3 py-2 focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
              placeholder="Rechercher un exercice…" value={query} onChange={e => setQuery(e.target.value)}
            />
            {equipements.length > 0 && <FilterDropdown value={equipement ?? ""} onChange={v => setEquipement(v || null)} options={equipements.map(eq => ({ value: eq, label: eq }))}/>}
            <div className="shrink-0 flex border border-[var(--t-border)] rounded-full p-0.5">
              <button type="button" onClick={() => setViewMode("grid")} title="Vue grille"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${viewMode === "grid" ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black" : "text-[var(--t-text-30)] hover:text-[#c9a84c]"}`}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
              </button>
              <button type="button" onClick={() => setViewMode("silhouette")} title="Vue silhouette"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${viewMode === "silhouette" ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black" : "text-[var(--t-text-30)] hover:text-[#c9a84c]"}`}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2.5"/><path d="M12 8v6M9 22l1.5-8M15 22l-1.5-8M8 12l4-1 4 1"/></svg>
              </button>
            </div>
          </div>

          {/* Chips de catégories — scroll horizontal, filtre principal toujours visible plutôt
              que caché derrière un tap sur la silhouette. */}
          <div ref={categoryScrollRef} className="pb-3 border-b border-[var(--t-border-soft)] shrink-0 flex gap-1.5 overflow-x-auto px-5 no-scrollbar h-scroll-snap cursor-grab active:cursor-grabbing select-none">
            <button type="button" onClick={() => setCategory(null)}
              className={`shrink-0 text-[0.6rem] tracking-wider uppercase px-3 py-1.5 rounded-full border transition-colors ${!category ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black border-transparent" : "border-[var(--t-border)] text-[var(--t-text-40)] hover:border-[#c9a84c]/40"}`}>
              Tout
            </button>
            {categories.map(c => (
              <button key={c} type="button" onClick={() => setCategory(prev => (prev === c ? null : c))}
                className={`shrink-0 text-[0.6rem] tracking-wider uppercase px-3 py-1.5 rounded-full border capitalize transition-colors ${category === c ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black border-transparent" : "border-[var(--t-border)] text-[var(--t-text-40)] hover:border-[#c9a84c]/40"}`}>
                {c}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto p-5">
        {detailEntry ? (
          <div className="flex flex-col gap-4 pb-16 -m-5">
            {/* Hero : média plein cadre avec titre incrusté façon fiche produit, ou
                simple en-tête texte quand l'exercice n'a pas encore de photo/vidéo. */}
            <div className="relative shrink-0">
              <button onClick={() => setDetailEntry(null)}
                className={`absolute z-10 flex items-center justify-center transition-colors ${
                  detailEntry.video_url || detailEntry.image_url
                    ? "top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70"
                    : "top-4 right-5 text-[var(--t-text-25)] hover:text-[var(--t-text)]"
                }`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              {detailEntry.video_url || detailEntry.image_url ? (
                <div className="relative bg-[radial-gradient(circle_at_center,var(--t-surface),var(--t-bg2))]">
                  {detailEntry.video_url ? (
                    <video key={detailEntry.id} src={detailEntry.video_url} poster={detailEntry.image_url ?? undefined}
                      controls loop playsInline className="w-full max-h-[34vh] object-contain mx-auto block"/>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={detailEntry.image_url!} alt="" className="w-full max-h-[34vh] object-contain mx-auto block"/>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pt-12 pb-3 px-5 pointer-events-none">
                    {detailEntry.muscle_cible && (
                      <p className="text-[0.6rem] tracking-[0.2em] uppercase text-[#e2c97e] mb-0.5">{detailEntry.muscle_cible}</p>
                    )}
                    <p style={{ fontFamily: "var(--font-bebas)" }} className="text-xl font-bold tracking-wide text-white cap-first">{detailEntry.nom}</p>
                  </div>
                </div>
              ) : (
                <div className="px-5 pt-1">
                  {detailEntry.muscle_cible && (
                    <p className="text-[0.6rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-0.5">{detailEntry.muscle_cible}</p>
                  )}
                  <p style={{ fontFamily: "var(--font-bebas)" }} className="text-xl font-bold tracking-wide text-[var(--t-text)] cap-first pr-10">{detailEntry.nom}</p>
                </div>
              )}
            </div>

            <div className="px-5 flex flex-col gap-4">
              {(detailEntry.equipement || (detailEntry.tags && detailEntry.tags.length > 0)) && (
                <div className="flex flex-wrap gap-1.5">
                  {detailEntry.equipement && (
                    <span className="text-[0.58rem] tracking-wider uppercase text-[#c9a84c] capitalize bg-[#c9a84c]/10 rounded-full px-2.5 py-1">{detailEntry.equipement}</span>
                  )}
                  {detailEntry.tags?.map(tag => (
                    <span key={tag} className="text-[0.58rem] tracking-wider uppercase text-[var(--t-text-35)] capitalize border border-[var(--t-border)] rounded-full px-2.5 py-1">{tag}</span>
                  ))}
                </div>
              )}

              {/* Mini-silhouette : réutilise l'écorché de la bibliothèque pour repérer le
                  muscle principal en un coup d'œil, plutôt qu'un simple mot dans une puce. */}
              {detailEntry.muscle_cible && CIBLE_TO_LIB[detailEntry.muscle_cible] && (
                <div className="flex items-center gap-4 bg-[var(--t-surface)] border border-[var(--t-border-soft)] rounded-xl p-3">
                  <div className="shrink-0 pointer-events-none">
                    <Model
                      type={CIBLE_VIEW[detailEntry.muscle_cible] ?? "anterior"}
                      data={[{ name: "cible", muscles: CIBLE_TO_LIB[detailEntry.muscle_cible] }]}
                      bodyColor="var(--t-glass-bg)"
                      highlightedColors={["#c9a84c"]}
                      style={{ width: "56px" }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[var(--t-text-25)] mb-0.5">Muscle principal</p>
                    <p className="text-sm font-bold text-[var(--t-text)] capitalize">{detailEntry.muscle_cible}</p>
                  </div>
                </div>
              )}

              {(detailEntry.execution && detailEntry.execution.length > 0) || detailEntry.utilite || (detailEntry.a_noter && detailEntry.a_noter.length > 0) ? (
                <div className="flex flex-col gap-4">
                  {detailEntry.execution && detailEntry.execution.length > 0 && (
                    <div className="flex flex-col gap-2.5 bg-[var(--t-surface)] border border-[var(--t-border-soft)] rounded-xl p-4">
                      <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c]">Exécution</p>
                      <ol className="flex flex-col gap-2.5">
                        {detailEntry.execution.map((step, i) => (
                          <li key={i} className="flex gap-2.5 text-sm text-[var(--t-text-50)] leading-relaxed">
                            <span className="shrink-0 w-5 h-5 rounded-full bg-[#c9a84c]/15 text-[#c9a84c] text-[0.65rem] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                            <span className="pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {detailEntry.utilite && (
                    <div className="flex flex-col gap-1">
                      <p className="text-[0.6rem] tracking-[0.2em] uppercase text-[var(--t-text-25)]">Utilité</p>
                      <p className="text-sm text-[var(--t-text-50)] leading-relaxed">{detailEntry.utilite}</p>
                    </div>
                  )}
                  {detailEntry.a_noter && detailEntry.a_noter.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <p className="text-[0.6rem] tracking-[0.2em] uppercase text-[var(--t-text-25)]">À noter</p>
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
                </div>
              ) : (
                detailEntry.description && (
                  <p className="text-sm text-[var(--t-text-50)] leading-relaxed">{detailEntry.description}</p>
                )
              )}

              {detailEntry.image_license && (
                <p className="text-[0.5rem] text-[var(--t-text-15)]">Photo : {detailEntry.image_license_author || "?"} · {detailEntry.image_license}</p>
              )}
            </div>
          </div>
        ) : viewMode === "silhouette" ? (
          <div className="flex flex-col items-center gap-6">
            <div className="w-full flex flex-col items-center gap-6 bg-[radial-gradient(circle_at_center,var(--t-surface),var(--t-bg2))] border border-[var(--t-border-soft)] rounded-2xl p-6">
              <p className="text-[0.62rem] tracking-[0.25em] uppercase text-[var(--t-text-30)]">Quel groupe musculaire veux-tu travailler ?</p>
              <div className="flex items-start justify-center gap-10 sm:gap-14">
                {(["anterior", "posterior"] as const).map(type => (
                  <div key={type} className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-0.5 w-20 h-3 -z-10 rounded-[50%] bg-black/40 blur-md pointer-events-none"/>
                      <Model
                        type={type}
                        data={modelData}
                        bodyColor="var(--t-glass-bg)"
                        highlightedColors={["#e2c97e"]}
                        onClick={({ muscle }) => {
                          const cible = LIB_TO_CIBLE[muscle];
                          if (cible) setCategory(prev => (prev === cible ? null : cible));
                        }}
                        style={{ width: "184px" }}
                        svgStyle={{ cursor: "pointer" }}
                      />
                    </div>
                    <span className="text-[0.55rem] tracking-[0.2em] uppercase text-[var(--t-text-30)] border border-[var(--t-border-soft)] rounded-full px-2.5 py-1">{type === "anterior" ? "Face" : "Dos"}</span>
                  </div>
                ))}
              </div>
              {category && (
                <button type="button" onClick={() => setCategory(null)}
                  className="flex items-center gap-1.5 text-[0.6rem] font-bold tracking-[0.15em] uppercase capitalize text-black bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] rounded-full pl-3.5 pr-2.5 py-1.5 shadow-[0_3px_14px_-4px_rgba(201,168,76,0.6)] hover:shadow-[0_4px_18px_-3px_rgba(201,168,76,0.8)] transition-shadow">
                  {category}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
            {category && (
              <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {results.map(e => <ExerciceCard key={e.id} entry={e} onOpen={() => setDetailEntry(e)}/>)}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {recentEntries.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-[0.58rem] tracking-[0.2em] uppercase text-[var(--t-text-25)]">Récemment utilisés</p>
                <div ref={recentScrollRef} className="flex gap-2.5 overflow-x-auto no-scrollbar h-scroll-snap pb-1 cursor-grab active:cursor-grabbing select-none">
                  {recentEntries.map(e => (
                    <button key={e.id} type="button" onClick={() => setDetailEntry(e)}
                      className="shrink-0 w-24 flex flex-col text-left border border-[var(--t-border-soft)] bg-[var(--t-surface)] rounded-xl overflow-hidden hover:border-[#c9a84c]/40 transition-colors">
                      <div className="aspect-square w-full bg-[var(--t-surface-2)] flex items-center justify-center overflow-hidden">
                        {e.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={e.image_url} alt="" loading="lazy" className="w-full h-full object-cover"/>
                        ) : (
                          <div className="text-[var(--t-text-15)]"><DumbbellIcon/></div>
                        )}
                      </div>
                      <p className="px-1.5 py-1.5 text-[0.6rem] leading-snug text-[var(--t-text-60)] cap-first line-clamp-2">{e.nom}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {results.length === 0 ? (
              <p className="text-xs text-[var(--t-text-25)] text-center py-12">Aucun exercice trouvé.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {results.map(e => <ExerciceCard key={e.id} entry={e} onOpen={() => setDetailEntry(e)}/>)}
              </div>
            )}
          </div>
        )}
      </div>

      {detailEntry && (
        <div className="shrink-0 border-t border-[var(--t-border-soft)] p-4">
          <button type="button" onClick={() => handlePick(detailEntry)}
            className="w-full bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.7rem] font-bold tracking-[0.15em] uppercase py-3 rounded-2xl shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-[0.97] active:brightness-95 transition-all duration-200">
            Ajouter à ma séance
          </button>
        </div>
      )}
    </div>
  );
}
