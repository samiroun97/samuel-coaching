import { supabase } from "@/lib/supabase";
import { loadCatalogue, findCatalogueEntry } from "@/lib/exercicesCatalogue";

const mondayOf = (d: Date) => { const n = new Date(d); const day = (n.getDay() + 6) % 7; n.setDate(n.getDate() - day); n.setHours(0, 0, 0, 0); return n; };

// Volume (poids × reps, additionné) loggué par ce client sur les `weeks` dernières semaines,
// regroupé par muscle cible — déduit du nom d'exercice loggué via le catalogue de référence
// (exercices_catalogue), jamais saisi à la main. Les exercices sans correspondance dans le
// catalogue (nom libre, faute de frappe…) n'ont pas de muscle connu et sont ignorés plutôt que
// de fausser un total "Autre" qui ne dirait rien d'exploitable.
export async function loadMuscleVolume(clientId: string, weeks = 6): Promise<Record<string, number[]>> {
  const since = mondayOf(new Date());
  since.setDate(since.getDate() - (weeks - 1) * 7);

  const [{ data: logs }, catalogue] = await Promise.all([
    supabase.from("seance_logs")
      .select("exercice_nom,poids_reel,reps_reel,logged_at")
      .eq("client_id", clientId).gte("logged_at", since.toISOString()),
    loadCatalogue(),
  ]);

  const byMuscle: Record<string, number[]> = {};
  for (const row of logs ?? []) {
    if (!row.poids_reel || !row.reps_reel) continue;
    const muscle = findCatalogueEntry(catalogue, row.exercice_nom)?.muscle_cible;
    if (!muscle) continue;
    const dayDiff = Math.floor((new Date(String(row.logged_at).slice(0, 10)).getTime() - since.getTime()) / 86400000);
    const weekIdx = Math.floor(dayDiff / 7);
    if (weekIdx < 0 || weekIdx >= weeks) continue;
    if (!byMuscle[muscle]) byMuscle[muscle] = Array(weeks).fill(0);
    byMuscle[muscle][weekIdx] += row.poids_reel * row.reps_reel;
  }
  return byMuscle;
}
