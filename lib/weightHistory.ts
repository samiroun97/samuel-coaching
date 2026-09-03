import { supabase } from "@/lib/supabase";

export type WeightEntry = { id: string; date: string; weight: number };

// Poids stocké côté serveur (table weight_entries) plutôt qu'en localStorage uniquement :
// survit à un changement d'appareil et devient visible du coach (RLS is_coach_of), au même
// titre que le body fat.
export async function loadWeightHistory(clientId: string): Promise<WeightEntry[]> {
  const { data } = await supabase.from("weight_entries")
    .select("id,date,poids").eq("client_id", clientId).order("date", { ascending: false });
  return (data ?? []).map(r => ({ id: r.id as string, date: r.date as string, weight: Number(r.poids) }));
}

// onConflict cible la contrainte unique (client_id, date) — une pesée par jour, la plus
// récente écrite pour cette date remplace la précédente, comme en local avant cette migration.
export async function upsertWeightEntry(clientId: string, entry: WeightEntry): Promise<boolean> {
  const { error } = await supabase.from("weight_entries").upsert(
    { id: entry.id, client_id: clientId, date: entry.date, poids: entry.weight },
    { onConflict: "client_id,date" }
  );
  return !error;
}

export async function deleteWeightEntry(clientId: string, id: string): Promise<boolean> {
  const { error } = await supabase.from("weight_entries").delete().eq("id", id).eq("client_id", clientId);
  return !error;
}
