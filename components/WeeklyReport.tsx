import { goalAwareStatus, OBJECTIF_TYPE_LABEL, type ObjectifType } from "@/lib/objectifTypes";

export type ReportSection = { point_fort: string; point_faible: string; conseil: string };

export type DailyBreakdownEntry = { date: string; calories: number; tdee: number; balance: number };

export type WeeklyReportData = {
  clientName?: string;
  weekStart: string;
  weekEnd: string;
  daysLogged: number;
  avgCalories: number;
  goalCalories: number;
  avgTdee: number;
  balanceStatus: "deficit" | "surplus" | "maintenance";
  balancePerDay: number;
  avgProteines: number;
  goalProteines: number;
  avgGlucides: number;
  goalGlucides: number;
  avgLipides: number;
  goalLipides: number;
  sessionsCount: number;
  targetSessions: number | null;
  totalTrainingMinutes: number;
  restDays: number;
  daysElapsed: number;
  avgSteps: number;
  stepsGoal: number;
  weightStart: number | null;
  weightEnd: number | null;
  objectifs?: string | null;
  objectifType?: string | null;
  dailyBreakdown?: DailyBreakdownEntry[];
  synthese?: string;
  nutrition: ReportSection;
  neat: ReportSection;
  eat: ReportSection;
};

const fmtInt = (n: number) => Math.round(n).toLocaleString("fr-FR");
const bebas = { fontFamily: "var(--font-bebas)" } as const;

// Beaucoup de navigateurs/imprimantes désactivent les couleurs d'arrière-plan par défaut à
// l'impression : sans ça, les liserés dorés et les puces de statut disparaissent du PDF.
function ForcePrintColors() {
  return (
    <style>{`
      @media print {
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      }
    `}</style>
  );
}

function GoldDivider() {
  return (
    <div className="flex items-center gap-3 justify-center">
      <div className="h-px w-10 bg-gradient-to-r from-transparent to-[#c9a84c]" />
      <div className="w-1 h-1 rotate-45 bg-[#c9a84c]" />
      <div className="h-px w-10 bg-gradient-to-l from-transparent to-[#c9a84c]" />
    </div>
  );
}

function StatCard({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className={`relative border p-4 print:p-3 break-inside-avoid ${gold ? "border-[#c9a84c]/30 bg-[#c9a84c]/[0.05]" : "border-black/10 bg-[#f7f5f0]"}`}>
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${gold ? "bg-[#c9a84c]" : "bg-black/10"}`} />
      <p className="text-[0.62rem] tracking-[0.2em] uppercase text-black/35 mb-1.5">{label}</p>
      <p style={bebas} className={`text-2xl tracking-wide ${gold ? "text-[#b8933f]" : "text-black"}`}>{value}</p>
    </div>
  );
}

function MacroBar({ label, avg, goal, color }: { label: string; avg: number; goal: number; color: string }) {
  const pct = goal > 0 ? Math.min((avg / goal) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-[0.65rem] tracking-wider mb-1.5">
        <span className="uppercase text-black/45">{label}</span>
        <span style={{ color }}>{Math.round(avg)}g <span className="text-black/30">/ {goal}g objectif</span></span>
      </div>
      <div className="h-1.5 bg-black/5">
        <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function DayMini({ entry, objectifType }: { entry: DailyBreakdownEntry; objectifType?: string | null }) {
  const d = new Date(entry.date + "T12:00:00");
  const label = d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "");
  const dayNum = d.getDate();
  const status = Math.abs(entry.balance) <= 100 ? "maintenance" : entry.balance > 0 ? "surplus" : "deficit";
  const { color } = goalAwareStatus(status, objectifType);
  return (
    <div className="flex-1 min-w-[4.2rem] border border-black/10 bg-[#f7f5f0] p-2.5 text-center break-inside-avoid">
      <p className="text-[0.6rem] tracking-wider uppercase text-black/35 capitalize">{label} {dayNum}</p>
      <p className="text-[0.65rem] text-black/45 mt-1.5">{fmtInt(entry.tdee)} kcal</p>
      <p className="text-[0.62rem] text-black/25 -mt-0.5">TDEE</p>
      <p style={{ ...bebas, color }} className="text-base tracking-wide mt-1">
        {entry.balance > 0 ? "+" : ""}{fmtInt(entry.balance)}
      </p>
    </div>
  );
}

function FeedbackBlock({ title, section }: { title: string; section: ReportSection }) {
  const rows = [
    { label: "Point fort", text: section.point_fort, color: "#5a9c81" },
    { label: "À améliorer", text: section.point_faible, color: "#c9564f" },
    { label: "Conseil", text: section.conseil, color: "#b8933f" },
  ];
  return (
    // Le padding-top (sur cette enveloppe transparente) sert d'espace de tête : contrairement
    // à une margin-top, il n'est jamais absorbé si ce bloc atterrit en haut d'une nouvelle page
    // après une coupure — donc l'air reste garanti même quand "print:mb-*" seul ne suffit pas.
    <div className="mb-3 print:mb-0 print:pt-6 break-inside-avoid">
      <div className="relative border border-black/10 bg-[#f7f5f0]">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#c9a84c]/60" />
        <div className="px-5 py-2.5 border-b border-black/5">
          <p style={bebas} className="text-sm tracking-[0.15em] text-[#b8933f] uppercase">{title}</p>
        </div>
        <div className="divide-y divide-black/5">
          {rows.map(r => (
            <div key={r.label} className="flex gap-3 px-5 py-2.5">
              <span className="text-[0.6rem] tracking-[0.12em] uppercase shrink-0 w-[5.2rem] pt-0.5" style={{ color: r.color }}>{r.label}</span>
              <p className="text-[0.72rem] text-black/70 leading-snug">{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WeeklyReport({ data }: { data: WeeklyReportData }) {
  const fmtDate = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  const { color: statusColor, label: statusLabel, note: statusNote } = goalAwareStatus(data.balanceStatus, data.objectifType);
  const objectifTypeLabel = data.objectifType ? OBJECTIF_TYPE_LABEL[data.objectifType as ObjectifType] : null;
  // On ne compte que les jours écoulés (daysElapsed) : pour une semaine en cours non
  // terminée, les jours à venir n'ont pas encore de dépense/consommation réelle et ne
  // doivent pas être extrapolés dans le total (sinon leur BMR apparaît comme déjà "brûlé").
  const weekConsumed = data.avgCalories * data.daysElapsed;
  const weekBurned = data.avgTdee * data.daysElapsed;
  const weekBalance = weekConsumed - weekBurned;

  return (
    <div className="max-w-2xl mx-auto p-6 sm:p-10 print:px-6 print:pt-0 print:pb-2 print:max-w-none bg-white">
      <ForcePrintColors/>
      {/* Header */}
      <div className="mb-10 print:mb-10 break-inside-avoid text-center">
        <p style={{ ...bebas, letterSpacing: "0.18em" }} className="text-lg text-black mb-5 print:mb-3">
          SAMUEL<span className="text-[#c9a84c]">.</span><span className="text-[#c9a84c]">COACHING</span>
        </p>
        <h1 style={bebas} className="text-4xl sm:text-5xl print:text-4xl text-[#b8933f] tracking-wide mb-4 print:mb-2">BILAN HEBDOMADAIRE</h1>
        <div className="mb-4 print:mb-2"><GoldDivider /></div>
        <p className="text-black/45 text-sm">
          {data.clientName ? `Préparé pour ${data.clientName}` : "Bilan personnalisé"} · {fmtDate(data.weekStart)} — {fmtDate(data.weekEnd)}
        </p>
        {objectifTypeLabel && (
          <p className="text-[0.62rem] tracking-[0.2em] uppercase text-[#b8933f] mt-2">Objectif · {objectifTypeLabel}</p>
        )}
      </div>

      {/* Synthèse du coach */}
      {data.synthese && (
        <div className="relative border border-[#c9a84c]/30 bg-[#c9a84c]/[0.05] p-5 print:p-4 mb-6 print:mb-3 break-inside-avoid">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#c9a84c]" />
          <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#b8933f] mb-2">Le mot de Samuel</p>
          <p className="text-[0.8rem] text-black/75 leading-relaxed">{data.synthese}</p>
        </div>
      )}

      {/* Résultat de la semaine */}
      <div className="relative border p-6 print:p-4 mb-6 print:mb-3 break-inside-avoid" style={{ borderColor: `${statusColor}50`, backgroundColor: "#f7f5f0" }}>
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: statusColor }} />
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4 print:mb-2">
          <div>
            <p className="text-[0.65rem] tracking-[0.2em] uppercase text-black/35 mb-1">Résultat de la semaine</p>
            <p style={{ ...bebas, color: statusColor }} className="text-3xl tracking-wide">{statusLabel}</p>
            {statusNote && <p className="text-[0.62rem] tracking-[0.1em] uppercase mt-1" style={{ color: statusColor }}>{statusNote}</p>}
          </div>
          <p className="text-sm text-black/55">{data.balancePerDay > 0 ? "+" : ""}{fmtInt(data.balancePerDay)} kcal / jour</p>
        </div>
        <div className="grid grid-cols-3 gap-4 border-t border-black/10 pt-4 print:pt-2">
          <div>
            <p className="text-[0.6rem] tracking-[0.15em] uppercase text-black/30 mb-1">Brûlées ({data.daysElapsed}/7 j.)</p>
            <p className="text-lg text-black/80">{fmtInt(weekBurned)} kcal</p>
          </div>
          <div>
            <p className="text-[0.6rem] tracking-[0.15em] uppercase text-black/30 mb-1">Consommées ({data.daysElapsed}/7 j.)</p>
            <p className="text-lg text-black/80">{fmtInt(weekConsumed)} kcal</p>
          </div>
          <div>
            <p className="text-[0.6rem] tracking-[0.15em] uppercase text-black/30 mb-1">Bilan total</p>
            <p className="text-lg font-bold" style={{ color: statusColor }}>{weekBalance > 0 ? "+" : ""}{fmtInt(weekBalance)} kcal</p>
          </div>
        </div>
      </div>

      {/* Détail jour par jour */}
      {data.dailyBreakdown && data.dailyBreakdown.length > 0 && (
        <div className="mb-6 print:mb-3 break-inside-avoid">
          <p className="text-[0.65rem] tracking-[0.2em] uppercase text-black/35 mb-2">Jour par jour</p>
          <div className="flex gap-2 print:gap-1.5">
            {data.dailyBreakdown.map(entry => <DayMini key={entry.date} entry={entry} objectifType={data.objectifType} />)}
          </div>
        </div>
      )}

      {/* Stats grid — calories/TDEE déjà couverts par "Résultat de la semaine" ci-dessus */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:gap-2 mb-6 print:mb-3 print:grid-cols-4">
        <StatCard label="Séances" value={data.targetSessions ? `${data.sessionsCount} / ${data.targetSessions}` : `${data.sessionsCount}`} gold />
        <StatCard label="Jours de repos" value={`${data.restDays} / ${data.daysElapsed}`} />
        <StatCard label="Pas / jour" value={fmtInt(data.avgSteps)} gold />
        <StatCard label="Poids" value={data.weightStart !== null && data.weightEnd !== null ? `${data.weightStart} → ${data.weightEnd} kg` : "—"} />
      </div>

      {/* Macros moyennes */}
      <div className="relative border border-black/10 bg-[#f7f5f0] p-5 print:p-4 mb-6 print:mb-3 flex flex-col gap-3 print:gap-2 break-inside-avoid">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-black/10" />
        <p className="text-[0.65rem] tracking-[0.2em] uppercase text-black/35">Macros moyennes / jour</p>
        <MacroBar label="Protéines" avg={data.avgProteines} goal={data.goalProteines} color="#c9564f" />
        <MacroBar label="Glucides" avg={data.avgGlucides} goal={data.goalGlucides} color="#c47a2e" />
        <MacroBar label="Lipides" avg={data.avgLipides} goal={data.goalLipides} color="#b8933f" />
      </div>

      {/* Feedback */}
      <FeedbackBlock title="Nutrition" section={data.nutrition} />
      <FeedbackBlock title="Activité quotidienne" section={data.neat} />
      <FeedbackBlock title="Entraînement" section={data.eat} />

      <div className="mt-10 print:mt-12 break-inside-avoid text-center">
        <div className="mb-3"><GoldDivider /></div>
        <p style={{ ...bebas, letterSpacing: "0.18em" }} className="text-xs text-black/55 mb-1">
          SAMUEL<span className="text-[#c9a84c]">.</span><span className="text-[#c9a84c]">COACHING</span>
        </p>
        <p className="text-[0.6rem] tracking-[0.2em] uppercase text-black/25">
          Généré le {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>
    </div>
  );
}
