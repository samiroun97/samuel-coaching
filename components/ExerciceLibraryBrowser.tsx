"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Model, { type IExerciseData } from "react-body-highlighter";
import { type CatalogueEntry } from "@/lib/exercicesCatalogue";
import { getRecentExerciceNoms, pushRecentExerciceNom } from "@/lib/recentExercices";
import { useDragScroll } from "@/lib/useDragScroll";
import { CIBLE_TO_LIB, LIB_TO_CIBLE, CATEGORY_ORDER, HIDDEN_CHIPS } from "@/lib/muscleCategories";
import { Icon } from "@/components/Icon";
import { ExerciceDetailView } from "@/components/ExerciceDetailView";
import { Filter, Dumbbell, X, LayoutGrid, PersonStanding } from "@/lib/solarIcons";

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
        <Icon icon={Filter} size={13} strokeWidth={2}/>
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

// Filtre par équipement (repris du schéma MoveKit) — un exercice peut cumuler plusieurs
// équipements ("poulie + élastique" en base) : on découpe sur " + " pour que la puce
// corresponde à chacun d'entre eux, pas seulement à la valeur exacte du champ.
const EQUIPMENT_ORDER = ["poids du corps", "haltère", "barre", "machine", "poulie", "kettlebell", "élastique"];
const HIDDEN_EQUIPMENT = new Set(["swiss ball", "corde ondulatoire", "traîneau", "vélo", "cardio", "étirement"]);

// Icône neutre pour les cartes sans photo (la grande majorité du catalogue) — un exercice sur
// une grille visuelle ne doit jamais rendre une case vide/cassée, même sans média.
function DumbbellIcon() {
  return (
    <Icon icon={Dumbbell} size={22} strokeWidth={1.6}/>
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
          <Icon icon={X} size={16} strokeWidth={2}/>
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
                <Icon icon={LayoutGrid} size={13} strokeWidth={2}/>
              </button>
              <button type="button" onClick={() => setViewMode("silhouette")} title="Vue silhouette"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${viewMode === "silhouette" ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black" : "text-[var(--t-text-30)] hover:text-[#c9a84c]"}`}>
                <Icon icon={PersonStanding} size={13} strokeWidth={2}/>
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

      {detailEntry ? (
        <ExerciceDetailView entry={detailEntry} onClose={() => setDetailEntry(null)}
          footer={
            <button type="button" onClick={() => handlePick(detailEntry)}
              className="w-full bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.7rem] font-bold tracking-[0.15em] uppercase py-3 rounded-2xl shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-[0.97] active:brightness-95 transition-all duration-200">
              Ajouter à ma séance
            </button>
          }/>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto p-5">
          {viewMode === "silhouette" ? (
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
                    <Icon icon={X} size={10} strokeWidth={3}/>
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
      )}
    </div>
  );
}
