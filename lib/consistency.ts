import { supabase } from "@/lib/supabase";
import type { ObjectifType } from "@/lib/objectifTypes";

// Statut d'une journée pour le calendrier de régularité (coach ET client, même logique) :
// - empty     : rien loggé côté nutrition ce jour-là
// - off       : nutrition loggée mais objectif calorique/macros non respecté
// - ok        : nutrition loggée et objectif atteint
// - exemplary : objectif nutrition atteint + séance complétée le même jour
export type DayStatus = "empty" | "off" | "ok" | "exemplary";

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

// Jours (YYYY-MM-DD) où ce client a terminé au moins une séance sur les N derniers jours.
async function loadTrainedDays(clientId: string, since: Date): Promise<Set<string>> {
  const { data } = await supabase.from("programme_seances")
    .select("completed_at")
    .eq("client_id", clientId)
    .not("completed_at", "is", null)
    .gte("completed_at", since.toISOString());
  const days = new Set<string>();
  for (const r of data ?? []) if (r.completed_at) days.add(String(r.completed_at).slice(0, 10));
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
