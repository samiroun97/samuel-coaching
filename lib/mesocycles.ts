import { supabase } from "@/lib/supabase";

export type Mesocycle = {
  id: string;
  coach_id: string;
  client_id: string;
  nom: string;
  objectif: string | null;
  date_debut: string;
  date_fin: string;
  created_at: string;
};

const todayStr = () => new Date().toISOString().slice(0, 10);

// Le mésocycle "actif" est celui dont la plage de dates couvre aujourd'hui — un client n'en a
// jamais qu'un seul à la fois en pratique (le coach clôt/décale l'ancien avant d'en ouvrir un
// nouveau), donc le plus récent qui matche suffit plutôt que d'imposer une contrainte DB dessus.
export async function loadActiveMesocycle(clientId: string): Promise<Mesocycle | null> {
  const today = todayStr();
  const { data } = await supabase.from("mesocycles").select("*")
    .eq("client_id", clientId).lte("date_debut", today).gte("date_fin", today)
    .order("date_debut", { ascending: false }).limit(1);
  return (data?.[0] as Mesocycle) ?? null;
}

export async function listMesocycles(clientId: string): Promise<Mesocycle[]> {
  const { data } = await supabase.from("mesocycles").select("*")
    .eq("client_id", clientId).order("date_debut", { ascending: false });
  return (data ?? []) as Mesocycle[];
}

export async function createMesocycle(params: {
  coachId: string; clientId: string; nom: string; objectif: string; dateDebut: string; dateFin: string;
}): Promise<Mesocycle | null> {
  const { data, error } = await supabase.from("mesocycles").insert({
    coach_id: params.coachId, client_id: params.clientId, nom: params.nom,
    objectif: params.objectif || null, date_debut: params.dateDebut, date_fin: params.dateFin,
  }).select("*").single();
  if (error) return null;
  return data as Mesocycle;
}

export async function deleteMesocycle(id: string): Promise<boolean> {
  const { error } = await supabase.from("mesocycles").delete().eq("id", id);
  return !error;
}

// Progression temporelle du mésocycle (0-100), pour une barre "semaine X/Y" — jamais négative
// ni > 100 même si la date système dérive légèrement des bornes stockées.
export function mesocycleProgress(m: Mesocycle): { weekNum: number; totalWeeks: number; pct: number; daysLeft: number } {
  const start = new Date(m.date_debut + "T00:00:00").getTime();
  const end = new Date(m.date_fin + "T00:00:00").getTime();
  const now = Date.now();
  const totalWeeks = Math.max(1, Math.round((end - start) / (7 * 86400000)));
  const weekNum = Math.min(totalWeeks, Math.max(1, Math.ceil((now - start) / (7 * 86400000)) + 1));
  const pct = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
  const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000));
  return { weekNum, totalWeeks, pct, daysLeft };
}
