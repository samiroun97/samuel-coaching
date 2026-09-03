import { type Mesocycle, mesocycleProgress } from "@/lib/mesocycles";
import { Icon } from "@/components/Icon";
import { Trash2 } from "@/lib/solarIcons";

// Carte d'info du mésocycle actif — même rendu côté coach (CRM) et côté client (Activité),
// pour qu'ils voient toujours la même chose : nom, objectif, et où on en est dans le bloc.
export function MesocycleCard({ meso, onDelete }: { meso: Mesocycle; onDelete?: () => void }) {
  const { weekNum, totalWeeks, pct, daysLeft } = mesocycleProgress(meso);
  return (
    <div className="border border-[#c9a84c]/25 bg-[#c9a84c]/5 rounded-xl px-4 py-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c]">Mésocycle en cours</p>
          <p className="text-sm text-[var(--t-text-70)] font-medium mt-0.5 truncate">{meso.nom}</p>
          {meso.objectif && <p className="text-[0.65rem] text-[var(--t-text-35)] mt-0.5 leading-relaxed">{meso.objectif}</p>}
        </div>
        {onDelete && (
          <button onClick={onDelete} title="Supprimer ce mésocycle"
            className="shrink-0 text-[var(--t-text-15)] hover:text-[#e07070] transition-colors">
            <Icon icon={Trash2} size={13} strokeWidth={1.8}/>
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 mt-2.5">
        <div className="h-1.5 flex-1 bg-[var(--t-track)] rounded-full overflow-hidden">
          <div className="h-full bg-[#c9a84c] rounded-full transition-all duration-300" style={{ width: `${pct}%` }}/>
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
