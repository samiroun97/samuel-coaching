import { type Mesocycle, mesocycleProgress } from "@/lib/mesocycles";

// Carte d'info du mésocycle actif — même rendu côté coach (CRM) et côté client (Activité),
// pour qu'ils voient toujours la même chose : nom, objectif, et où on en est dans le bloc.
export function MesocycleCard({ meso, onDelete }: { meso: Mesocycle; onDelete?: () => void }) {
  const { weekNum, totalWeeks, pct, daysLeft } = mesocycleProgress(meso);
  return (
    <div className="border border-[#a08ec9]/25 bg-[#a08ec9]/5 rounded-xl px-4 py-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#a08ec9]">Mésocycle en cours</p>
          <p className="text-sm text-[var(--t-text-70)] font-medium mt-0.5 truncate">{meso.nom}</p>
          {meso.objectif && <p className="text-[0.65rem] text-[var(--t-text-35)] mt-0.5 leading-relaxed">{meso.objectif}</p>}
        </div>
        {onDelete && (
          <button onClick={onDelete} title="Supprimer ce mésocycle"
            className="shrink-0 text-[var(--t-text-15)] hover:text-[#e07070] transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
            </svg>
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 mt-2.5">
        <div className="h-1.5 flex-1 bg-[var(--t-track)] rounded-full overflow-hidden">
          <div className="h-full bg-[#a08ec9] rounded-full transition-all duration-300" style={{ width: `${pct}%` }}/>
        </div>
        <span className="text-[0.6rem] tracking-wider shrink-0 text-[var(--t-text-30)] font-medium">Sem. {weekNum}/{totalWeeks}</span>
      </div>
      <p className="text-[0.58rem] text-[var(--t-text-20)] mt-1.5">
        {new Date(meso.date_debut + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
        {" → "}
        {new Date(meso.date_fin + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
        {" · "}{daysLeft > 0 ? `${daysLeft}j restants` : "termine aujourd'hui"}
      </p>
    </div>
  );
}
