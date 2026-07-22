export type ReportSection = { point_fort: string; point_faible: string; conseil: string };

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
  avgSteps: number;
  stepsGoal: number;
  weightStart: number | null;
  weightEnd: number | null;
  objectifs?: string | null;
  nutrition: ReportSection;
  neat: ReportSection;
  eat: ReportSection;
};

const fmtInt = (n: number) => Math.round(n).toLocaleString("fr-FR");
const bebas = { fontFamily: "var(--font-bebas)" } as const;

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
    <div className={`relative border p-4 print:p-3 break-inside-avoid ${gold ? "border-[#c9a84c]/30 bg-[#c9a84c]/[0.04]" : "border-white/10 bg-[#111]"}`}>
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${gold ? "bg-[#c9a84c]" : "bg-white/10"}`} />
      <p className="text-[0.62rem] tracking-[0.2em] uppercase text-white/30 mb-1.5">{label}</p>
      <p style={bebas} className={`text-2xl tracking-wide ${gold ? "text-[#c9a84c]" : "text-white"}`}>{value}</p>
    </div>
  );
}

function MacroBar({ label, avg, goal, color }: { label: string; avg: number; goal: number; color: string }) {
  const pct = goal > 0 ? Math.min((avg / goal) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-[0.65rem] tracking-wider mb-1.5">
        <span className="uppercase text-white/40">{label}</span>
        <span style={{ color }}>{Math.round(avg)}g <span className="text-white/25">/ {goal}g objectif</span></span>
      </div>
      <div className="h-1.5 bg-white/5">
        <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function FeedbackBlock({ title, section }: { title: string; section: ReportSection }) {
  const rows = [
    { label: "Point fort", text: section.point_fort, color: "#7eb8a0" },
    { label: "À améliorer", text: section.point_faible, color: "#e07070" },
    { label: "Conseil", text: section.conseil, color: "#c9a84c" },
  ];
  return (
    // Le padding-top (sur cette enveloppe transparente) sert d'espace de tête : contrairement
    // à une margin-top, il n'est jamais absorbé si ce bloc atterrit en haut d'une nouvelle page
    // après une coupure — donc l'air reste garanti même quand "print:mb-*" seul ne suffit pas.
    <div className="mb-4 print:mb-0 print:pt-8 break-inside-avoid">
      <div className="relative border border-white/10 bg-[#111]">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#c9a84c]/40" />
        <div className="px-5 py-3 print:py-2 border-b border-white/5 flex items-center gap-2.5">
          <p style={bebas} className="text-sm tracking-[0.15em] text-[#c9a84c] uppercase">{title}</p>
        </div>
        <div className="divide-y divide-white/5">
          {rows.map(r => (
            <div key={r.label} className="flex gap-3 px-5 py-3 print:py-2">
              <span className="text-[0.62rem] tracking-[0.15em] uppercase shrink-0 w-24 pt-0.5" style={{ color: r.color }}>{r.label}</span>
              <p className="text-[0.75rem] text-white/70 leading-relaxed">{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WeeklyReport({ data }: { data: WeeklyReportData }) {
  const fmtDate = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  const statusColor = data.balanceStatus === "surplus" ? "#e07070" : data.balanceStatus === "deficit" ? "#7eb8a0" : "#c9a84c";
  const statusLabel = data.balanceStatus === "surplus" ? "Surplus calorique" : data.balanceStatus === "deficit" ? "Déficit calorique" : "Maintien calorique";
  const weekConsumed = data.avgCalories * 7;
  const weekBurned = data.avgTdee * 7;
  const weekBalance = weekConsumed - weekBurned;

  return (
    <div className="max-w-2xl mx-auto p-6 sm:p-10 print:px-6 print:pt-0 print:pb-2 print:max-w-none bg-[#0a0a0a]">
      {/* Header */}
      <div className="mb-10 print:mb-10 break-inside-avoid text-center">
        <p style={{ ...bebas, letterSpacing: "0.18em" }} className="text-lg text-white mb-5 print:mb-3">
          SAMUEL<span className="text-[#c9a84c]">.</span><span className="text-[#c9a84c]">COACHING</span>
        </p>
        <h1 style={bebas} className="text-4xl sm:text-5xl print:text-4xl text-[#c9a84c] tracking-wide mb-4 print:mb-2">BILAN HEBDOMADAIRE</h1>
        <div className="mb-4 print:mb-2"><GoldDivider /></div>
        <p className="text-white/40 text-sm">
          {data.clientName ? `Préparé pour ${data.clientName}` : "Bilan personnalisé"} · {fmtDate(data.weekStart)} — {fmtDate(data.weekEnd)}
        </p>
        {data.objectifs && <p className="text-[0.68rem] tracking-[0.15em] uppercase text-[#c9a84c]/70 mt-2">{data.objectifs}</p>}
      </div>

      {/* Résultat de la semaine */}
      <div className="relative border p-6 print:p-4 mb-6 print:mb-3 break-inside-avoid" style={{ borderColor: `${statusColor}40`, backgroundColor: "#111" }}>
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: statusColor }} />
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4 print:mb-2">
          <div>
            <p className="text-[0.65rem] tracking-[0.2em] uppercase text-white/30 mb-1">Résultat de la semaine</p>
            <p style={{ ...bebas, color: statusColor }} className="text-3xl tracking-wide">{statusLabel}</p>
          </div>
          <p className="text-sm text-white/60">{data.balancePerDay > 0 ? "+" : ""}{fmtInt(data.balancePerDay)} kcal / jour</p>
        </div>
        <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4 print:pt-2">
          <div>
            <p className="text-[0.6rem] tracking-[0.15em] uppercase text-white/25 mb-1">Brûlées / semaine</p>
            <p className="text-lg text-white/80">{fmtInt(weekBurned)} kcal</p>
          </div>
          <div>
            <p className="text-[0.6rem] tracking-[0.15em] uppercase text-white/25 mb-1">Consommées / semaine</p>
            <p className="text-lg text-white/80">{fmtInt(weekConsumed)} kcal</p>
          </div>
          <div>
            <p className="text-[0.6rem] tracking-[0.15em] uppercase text-white/25 mb-1">Bilan total</p>
            <p className="text-lg font-bold" style={{ color: statusColor }}>{weekBalance > 0 ? "+" : ""}{fmtInt(weekBalance)} kcal</p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 print:gap-2 mb-6 print:mb-3 print:grid-cols-3">
        <StatCard label="Calories / jour" value={`${fmtInt(data.avgCalories)} kcal`} gold />
        <StatCard label="Séances" value={data.targetSessions ? `${data.sessionsCount} / ${data.targetSessions}` : `${data.sessionsCount}`} gold />
        <StatCard label="Jours de repos" value={`${data.restDays} / 7`} />
        <StatCard label="TDEE moyen" value={`${fmtInt(data.avgTdee)} kcal`} />
        <StatCard label="Pas / jour" value={fmtInt(data.avgSteps)} gold />
        <StatCard label="Poids" value={data.weightStart !== null && data.weightEnd !== null ? `${data.weightStart} → ${data.weightEnd} kg` : "—"} />
      </div>

      {/* Macros moyennes */}
      <div className="relative border border-white/10 bg-[#111] p-5 print:p-4 mb-6 print:mb-3 flex flex-col gap-3 print:gap-2 break-inside-avoid">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10" />
        <p className="text-[0.65rem] tracking-[0.2em] uppercase text-white/30">Macros moyennes / jour</p>
        <MacroBar label="Protéines" avg={data.avgProteines} goal={data.goalProteines} color="#F3F4F6" />
        <MacroBar label="Glucides" avg={data.avgGlucides} goal={data.goalGlucides} color="#e0834a" />
        <MacroBar label="Lipides" avg={data.avgLipides} goal={data.goalLipides} color="#9c8563" />
      </div>

      {/* Feedback */}
      <FeedbackBlock title="Nutrition" section={data.nutrition} />
      <FeedbackBlock title="Activité quotidienne" section={data.neat} />
      <FeedbackBlock title="Entraînement" section={data.eat} />

      <div className="mt-10 print:mt-12 break-inside-avoid text-center">
        <div className="mb-3"><GoldDivider /></div>
        <p style={{ ...bebas, letterSpacing: "0.18em" }} className="text-xs text-white/50 mb-1">
          SAMUEL<span className="text-[#c9a84c]">.</span><span className="text-[#c9a84c]">COACHING</span>
        </p>
        <p className="text-[0.6rem] tracking-[0.2em] uppercase text-white/15">
          Généré le {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>
    </div>
  );
}
