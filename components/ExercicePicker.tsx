"use client";
import { useEffect, useMemo, useState } from "react";
import { type CatalogueEntry } from "@/lib/exercicesCatalogue";
import { getRecentExerciceNoms, pushRecentExerciceNom } from "@/lib/recentExercices";
import { useDragScroll } from "@/lib/useDragScroll";
import { CATEGORY_ORDER, HIDDEN_CHIPS } from "@/lib/muscleCategories";
import { Icon } from "@/components/Icon";
import { ExerciceDetailView } from "@/components/ExerciceDetailView";
import { Dumbbell, X, Plus, AlertCircle } from "@/lib/solarIcons";

// Sélecteur d'exercice épuré, dédié au client (SeanceBuilder) — contrairement à
// ExerciceLibraryBrowser (CRM coach : grille de vignettes + vue silhouette + filtre
// équipement), ici une liste plein écran, une rangée pleine largeur par exercice, un tap
// ajoute et ferme directement. Pas d'étape intermédiaire pour le cas courant ; le détail
// (exécution, silhouette…) reste accessible via le petit ⓘ pour qui le veut.
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`shrink-0 text-[0.6rem] tracking-wider uppercase px-3 py-1.5 rounded-full border capitalize transition-colors ${
        active ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black border-transparent" : "border-[var(--t-border)] text-[var(--t-text-40)] hover:border-[#c9a84c]/40"}`}>
      {children}
    </button>
  );
}

function Row({ entry, onAdd, onInfo }: { entry: CatalogueEntry; onAdd: () => void; onInfo: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-xl hover:bg-[var(--t-glass-bg)] transition-colors">
      <button type="button" onClick={onAdd} className="flex items-center gap-3 flex-1 min-w-0 text-left px-2 py-2">
        <span className="shrink-0 w-11 h-11 rounded-lg overflow-hidden bg-[var(--t-surface-2)] flex items-center justify-center">
          {entry.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={entry.image_url} alt="" loading="lazy" className="w-full h-full object-cover"/>
          ) : (
            <Icon icon={Dumbbell} size={16} strokeWidth={1.6} className="text-[var(--t-text-15)]"/>
          )}
        </span>
        <span className="min-w-0">
          <span className="block text-sm text-[var(--t-text-80)] cap-first truncate">{entry.nom}</span>
          {entry.muscle_cible && <span className="block text-[0.6rem] tracking-wider uppercase text-[#c9a84c]/70 capitalize truncate">{entry.muscle_cible}</span>}
        </span>
      </button>
      <button type="button" onClick={onInfo} aria-label="Détails" title="Voir la fiche"
        className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-[var(--t-text-25)] hover:text-[var(--t-text)] hover:bg-[var(--t-track)] transition-colors">
        <Icon icon={AlertCircle} size={15} strokeWidth={2}/>
      </button>
      <button type="button" onClick={onAdd} aria-label="Ajouter" title="Ajouter à ma séance"
        className="shrink-0 mr-1 w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black">
        <Icon icon={Plus} size={16} strokeWidth={2.5}/>
      </button>
    </div>
  );
}

export function ExercicePicker({ catalogue, onPick, onClose }: {
  catalogue: CatalogueEntry[];
  onPick: (nom: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [detail, setDetail] = useState<CatalogueEntry | null>(null);
  // localStorage n'existe pas côté serveur : lu en effet plutôt qu'en initialiseur de
  // useState pour ne jamais faire diverger le HTML serveur du premier rendu client
  // (même garde d'hydratation qu'ExerciceLibraryBrowser).
  const [recentNoms, setRecentNoms] = useState<string[]>([]);
  useEffect(() => { setRecentNoms(getRecentExerciceNoms()); }, []);
  const categoryScrollRef = useDragScroll<HTMLDivElement>();

  const handlePick = (entry: CatalogueEntry) => {
    pushRecentExerciceNom(entry.nom);
    onPick(entry.nom);
  };

  const categories = useMemo(() => {
    const present = new Set(catalogue.map(e => e.muscle_cible).filter(Boolean) as string[]);
    const ordered = CATEGORY_ORDER.filter(c => present.has(c) && !HIDDEN_CHIPS.has(c));
    const rest = [...present].filter(c => !CATEGORY_ORDER.includes(c) && !HIDDEN_CHIPS.has(c)).sort();
    return [...ordered, ...rest];
  }, [catalogue]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalogue.filter(e => (!category || e.muscle_cible === category) && (!q || e.nom.toLowerCase().includes(q)));
  }, [catalogue, category, query]);

  const recentEntries = useMemo(() => {
    if (query.trim() || category) return [];
    return recentNoms.map(nom => catalogue.find(e => e.nom === nom)).filter((e): e is CatalogueEntry => !!e);
  }, [recentNoms, catalogue, query, category]);

  return (
    <div className="fixed inset-0 z-[60] bg-[var(--t-bg)] flex flex-col">
      <div className="shrink-0 border-b border-[var(--t-border-soft)]">
        <div className="flex items-center gap-2 px-4 pt-3.5 pb-2.5 max-w-lg mx-auto w-full">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un exercice…"
            className="flex-1 min-w-0 bg-[var(--t-surface-2)] border border-[var(--t-border)] rounded-xl text-base px-3.5 py-2.5 text-[var(--t-text)] placeholder-[var(--t-text-20)] focus:outline-none focus:border-[#c9a84c]/40 transition-colors"/>
          <button onClick={onClose} className="shrink-0 w-11 h-11 flex items-center justify-center text-[var(--t-text-30)] hover:text-[var(--t-text)] transition-colors -mr-2.5">
            <Icon icon={X} size={20} strokeWidth={2}/>
          </button>
        </div>
        {!detail && (
          <div ref={categoryScrollRef} className="flex gap-1.5 overflow-x-auto no-scrollbar h-scroll-snap px-4 pb-2.5 max-w-lg mx-auto w-full cursor-grab active:cursor-grabbing select-none">
            <Chip active={!category} onClick={() => setCategory(null)}>Tout</Chip>
            {categories.map(c => <Chip key={c} active={category === c} onClick={() => setCategory(p => (p === c ? null : c))}>{c}</Chip>)}
          </div>
        )}
      </div>

      {detail ? (
        <div className="flex-1 min-h-0 max-w-lg mx-auto w-full">
          <ExerciceDetailView entry={detail} onClose={() => setDetail(null)}
            footer={
              <button type="button" onClick={() => handlePick(detail)}
                className="w-full bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.7rem] font-bold tracking-[0.15em] uppercase py-3 rounded-2xl shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-[0.97] active:brightness-95 transition-all duration-200">
                Ajouter à ma séance
              </button>
            }/>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 max-w-lg mx-auto w-full flex flex-col gap-1">
          <button type="button" onClick={() => onPick(query.trim() || "Nouvel exercice")}
            className="flex items-center gap-3 px-3 py-3 mb-1.5 rounded-xl border border-dashed border-[#c9a84c]/40 text-[#c9a84c] hover:bg-[#c9a84c]/[0.06] transition-colors">
            <Icon icon={Plus} size={16} strokeWidth={2.5}/>
            <span className="text-sm font-bold">{query.trim() ? `Créer « ${query.trim()} »` : "Créer un exercice personnalisé"}</span>
          </button>

          {recentEntries.length > 0 && (
            <>
              <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[var(--t-text-25)] mt-1 px-2 mb-0.5">Récemment utilisés</p>
              {recentEntries.map(e => <Row key={e.id} entry={e} onAdd={() => handlePick(e)} onInfo={() => setDetail(e)}/>)}
              <div className="h-px bg-[var(--t-border-soft)] my-2"/>
            </>
          )}

          {results.length === 0 ? (
            <p className="text-xs text-[var(--t-text-25)] text-center py-12">Aucun exercice trouvé.</p>
          ) : (
            results.map(e => <Row key={e.id} entry={e} onAdd={() => handlePick(e)} onInfo={() => setDetail(e)}/>)
          )}
        </div>
      )}
    </div>
  );
}
