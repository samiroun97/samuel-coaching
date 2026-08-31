import { supabase } from "@/lib/supabase";
import { estimate1RM } from "@/lib/workoutLog";

export type PRCard = { nom: string; currentKg: number; date: string; points: number[] };

// Un "record" par exercice = le 1RM estimé le plus récent loggué par le client, avec son
// historique (un point par jour d'entraînement) pour la mini-courbe — façon Wingfit, mais
// dérivé de seance_logs plutôt que d'une liste de PR saisis à la main.
export async function loadPersonalRecords(clientId: string): Promise<PRCard[]> {
  const { data } = await supabase.from("seance_logs")
    .select("exercice_nom,poids_reel,reps_reel,logged_at")
    .eq("client_id", clientId).order("logged_at", { ascending: true });
  const rows = (data ?? []) as { exercice_nom: string; poids_reel: number | null; reps_reel: number | null; logged_at: string }[];

  const byNom = new Map<string, Map<string, number>>();
  for (const r of rows) {
    const est = estimate1RM(r.poids_reel, r.reps_reel);
    if (est == null) continue;
    const day = r.logged_at.slice(0, 10);
    const byDay = byNom.get(r.exercice_nom) ?? new Map<string, number>();
    byDay.set(day, Math.max(byDay.get(day) ?? 0, est));
    byNom.set(r.exercice_nom, byDay);
  }

  const cards: PRCard[] = [];
  for (const [nom, byDay] of byNom) {
    const days = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    const last = days[days.length - 1];
    cards.push({
      nom, currentKg: Math.round(last[1]), date: last[0],
      points: days.slice(-12).map(([, v]) => v),
    });
  }
  return cards.sort((a, b) => b.date.localeCompare(a.date));
}
