import { type Mesocycle } from "@/lib/mesocycles";

// Outils de dates du planning coach (CRM > Programmes) : semaines lundi → dimanche, dates
// ISO locales (pas UTC, pour ne jamais décaler un jour autour de minuit), numéro de semaine
// dans le mésocycle.

export const toISO = (d: Date) => d.toLocaleDateString("sv-SE");
export const todayISO = () => toISO(new Date());
export const mondayOf = (d: Date) => { const n = new Date(d); n.setHours(12, 0, 0, 0); n.setDate(n.getDate() - ((n.getDay() + 6) % 7)); return n; };
export const mondayISOOf = (iso: string) => toISO(mondayOf(new Date(iso + "T12:00:00")));
export const addDays = (iso: string, n: number) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return toISO(d); };

export const DAY_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export const TYPE_COLOR: Record<string, string> = {
  "Haut du corps": "#c9a84c", "Bas du corps": "#7eb8a0", "Full body": "#e0834a", "Cardio": "#6fa8d8",
  "Boxe": "#e07070", "Natation": "#4fb8c4", "CrossFit": "#c97ea0", "Yoga": "#8fb87e",
};
export const DEFAULT_TYPE_COLOR = "#9a9a9a";
export const typeColor = (t: string | null | undefined) => TYPE_COLOR[t ?? ""] ?? DEFAULT_TYPE_COLOR;

// Numéro de semaine dans le mésocycle (S1 = semaine qui contient date_debut), null hors mésocycle.
export function mesoWeekNum(meso: Mesocycle | null, iso: string): number | null {
  if (!meso || iso < meso.date_debut || iso > meso.date_fin) return null;
  const start = mondayOf(new Date(meso.date_debut + "T12:00:00")).getTime();
  return Math.floor((mondayOf(new Date(iso + "T12:00:00")).getTime() - start) / (7 * 86400000)) + 1;
}

export const fmtShort = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
export const fmtDay = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
