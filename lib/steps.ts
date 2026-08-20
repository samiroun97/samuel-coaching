import { supabase } from "@/lib/supabase";

export const getLocalSteps = (date: string): number =>
  parseInt(localStorage.getItem(`steps_${date}`) ?? "0") || 0;

// Récupère les pas depuis Supabase pour un ou plusieurs jours et rafraîchit le cache
// localStorage au passage. Nécessaire car les pas reçus via le Raccourci iPhone sont
// écrits côté serveur et n'arrivent donc jamais directement dans le localStorage
// de l'appareil consultant l'app — sans cet appel, l'UI resterait bloquée sur l'ancienne
// valeur locale (ou 0) tant qu'aucune saisie manuelle n'a eu lieu sur cet appareil.
export async function syncSteps(userId: string, dates: string[]): Promise<void> {
  if (!userId || dates.length === 0) return;
  try {
    const { data } = await supabase.from("steps_log").select("date,steps").eq("user_id", userId).in("date", dates);
    if (!data) return;
    for (const row of data) localStorage.setItem(`steps_${row.date}`, String(row.steps));
  } catch { /* best-effort : l'UI reste sur le cache local existant */ }
}
