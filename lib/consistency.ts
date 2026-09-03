import { supabase } from "@/lib/supabase";
import type { ObjectifType } from "@/lib/objectifTypes";

// Statut d'une journée pour le calendrier de régularité (coach ET client, même logique) :
// - empty     : rien loggé côté nutrition ce jour-là
// - off       : nutrition loggée mais objectif calorique/macros non respecté
// - ok        : nutrition loggée et objectif atteint
// - exemplary : objectif nutrition atteint + séance complétée le même jour
export type DayStatus = "empty" | "off" | "ok" | "exemplary";

// Rendu partagé entre le calendrier de régularité du coach (ConsistencyHeatmap) et le
// calendrier de sélection de date côté client (CalendarPicker), pour une seule et même
// logique de couleurs/labels.
export const STATUS_COLOR: Record<DayStatus, string> = {
  empty:     "bg-[var(--t-track)]",
  off:       "bg-[#e07070]",
  ok:        "bg-[#7eb8a0]",
  exemplary: "bg-[#6ea8d9]",
};
export const STATUS_TEXT: Record<DayStatus, string> = {
  empty:     "text-[var(--t-text-50)]",
  off:       "text-white",
  ok:        "text-white",
  exemplary: "text-white",
};
export const STATUS_LABEL: Record<DayStatus, string> = {
  empty:     "Rien loggé",
  off:       "Objectif non respecté",
  ok:        "Objectif atteint",
  exemplary: "Séance + objectif atteints",
};
export const STATUS_LEGEND: { status: DayStatus; label: string }[] = [
  { status: "ok",        label: "Atteint" },
  { status: "off",       label: "Non respecté" },
  { status: "empty",     label: "Rien loggé" },
  { status: "exemplary", label: "Exemplaire" },
];

type DailySummaryRow = {
  date: string;
  calories: number; proteines: number; glucides: number; lipides: number;
  goal_calories: number | null; goal_proteines: number | null; goal_glucides: number | null; goal_lipides: number | null;
};

// Tolérance sur chaque macro (P/G/L) pour compter comme "respecté" — un écart de moins de 15%
// par rapport à la cible du jour reste dans les clous, pas besoin d'être pile dessus.
const MACRO_TOLERANCE = 0.15;
// Tolérance calorique pour "prise de muscle" (déficit toléré) et "maintien" (écart toléré
// dans les deux sens) — au-delà de 300 kcal, on considère que l'objectif n'est pas respecté.
const CALORIE_TOLERANCE = 300;

function caloriesOnTarget(actual: number, goal: number, objectifType?: string | null): boolean {
  if (!goal) return true; // pas de cible connue ce jour-là (donnée antérieure à la migration) : on ne pénalise pas
  const diff = actual - goal; // > 0 = surplus, < 0 = déficit
  switch (objectifType as ObjectifType) {
    case "prise_muscle": return diff >= -CALORIE_TOLERANCE;
    case "perte_gras":
    case "recomposition": return diff <= 0;
    case "maintien":
    default:
      // Type d'objectif pas encore renseigné par le client : on ne présume ni sèche ni prise,
      // on tolère un écart raisonnable dans les deux sens plutôt que de pénaliser à tort.
      return Math.abs(diff) <= CALORIE_TOLERANCE;
  }
}

function macroOnTarget(actual: number, goal: number): boolean {
  if (!goal) return true;
  return Math.abs(actual - goal) <= goal * MACRO_TOLERANCE;
}

// Jours (YYYY-MM-DD) où ce client a terminé au moins une séance sur les N derniers jours —
// croise les séances assignées par le coach (programme_seances.completed_at) ET les activités
// loggées à la main sur la page Activité (formulaire "musculation, boxe, natation…", stocké en
// localStorage sous programme_logs et répliqué dans user_state par lib/syncStorage.ts). Sans ce
// second croisement, un client qui logge une sortie course à pied n'a ni flamme au calendrier de
// régularité ni visibilité côté coach — les deux étaient auparavant complètement déconnectés.
async function loadTrainedDays(clientId: string, since: Date): Promise<Set<string>> {
  const [{ data: seances }, { data: state }] = await Promise.all([
    supabase.from("programme_seances")
      .select("completed_at")
      .eq("client_id", clientId)
      .not("completed_at", "is", null)
      .gte("completed_at", since.toISOString()),
    supabase.from("user_state")
      .select("value")
      .eq("user_id", clientId).eq("key", "programme_logs")
      .maybeSingle(),
  ]);
  const days = new Set<string>();
  for (const r of seances ?? []) if (r.completed_at) days.add(String(r.completed_at).slice(0, 10));
  if (state?.value) {
    try {
      const logs = JSON.parse(state.value) as { date?: string }[];
      for (const log of logs) if (log.date) {
        const d = new Date(log.date);
        if (d >= since) days.add(log.date.slice(0, 10));
      }
    } catch { /* valeur corrompue ou format inattendu : on ignore plutôt que de faire planter le calendrier */ }
  }
  return days;
}

// Alimente le calendrier de régularité : croise le journal nutrition (daily_summaries, avec le
// snapshot de l'objectif du jour) et les séances complétées, en tenant compte du type d'objectif
// du client pour juger si un surplus/déficit calorique va dans le bon sens.
// 370 jours (un peu plus d'un an) pour que le calendrier de régularité, navigable mois par
// mois, ait des données réelles même en remontant sur les mois précédents.
export async function loadDayStatuses(clientId: string, objectifType: string | null | undefined, days = 370): Promise<Record<string, DayStatus>> {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  const sinceISO = since.toISOString().split("T")[0];

  const [{ data: summaries }, trainedDays] = await Promise.all([
    supabase.from("daily_summaries")
      .select("date,calories,proteines,glucides,lipides,goal_calories,goal_proteines,goal_glucides,goal_lipides")
      .eq("user_id", clientId).gte("date", sinceISO),
    loadTrainedDays(clientId, since),
  ]);

  const statuses: Record<string, DayStatus> = {};
  for (const row of (summaries ?? []) as DailySummaryRow[]) {
    if (!row.calories || row.calories <= 0) { statuses[row.date] = "empty"; continue; }
    const objectifOk = caloriesOnTarget(row.calories, row.goal_calories ?? 0, objectifType)
      && macroOnTarget(row.proteines, row.goal_proteines ?? 0)
      && macroOnTarget(row.glucides, row.goal_glucides ?? 0)
      && macroOnTarget(row.lipides, row.goal_lipides ?? 0);
    if (!objectifOk) { statuses[row.date] = "off"; continue; }
    statuses[row.date] = trainedDays.has(row.date) ? "exemplary" : "ok";
  }
  return statuses;
}
