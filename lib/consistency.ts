import { supabase } from "@/lib/supabase";

// Jours (YYYY-MM-DD) où ce client a terminé au moins une séance sur les N derniers jours —
// alimente ConsistencyHeatmap. Basé sur completed_at plutôt que date_prevue : on veut ce qui
// a été réellement fait, pas ce qui était prévu.
export async function loadTrainedDates(clientId: string, days = 84): Promise<Set<string>> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data } = await supabase.from("programme_seances")
    .select("completed_at")
    .eq("client_id", clientId)
    .not("completed_at", "is", null)
    .gte("completed_at", since.toISOString());
  const dates = new Set<string>();
  for (const r of data ?? []) if (r.completed_at) dates.add(String(r.completed_at).slice(0, 10));
  return dates;
}
