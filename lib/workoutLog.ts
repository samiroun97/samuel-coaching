import { supabase } from "@/lib/supabase";

export type SeanceLogRow = {
  id: string;
  seance_id: string;
  client_id: string;
  exercice_index: number;
  exercice_nom: string;
  set_index: number;
  poids_reel: number | null;
  reps_reel: number | null;
  rir_reel: number | null;
  logged_at: string;
};

// Au-delà de ~12 reps, l'estimation de 1RM (formule d'Epley) devient peu fiable : la série
// sollicite surtout l'endurance musculaire, plus la force pure sur laquelle la formule se base.
const REP_CAP = 12;

export function estimate1RM(poids: number | null, reps: number | null): number | null {
  if (!poids || !reps || reps < 1 || reps > REP_CAP) return null;
  return poids * (1 + reps / 30);
}

export function best1RM(logs: Pick<SeanceLogRow, "poids_reel" | "reps_reel">[]): number | null {
  let best: number | null = null;
  for (const l of logs) {
    const est = estimate1RM(l.poids_reel, l.reps_reel);
    if (est != null && (best == null || est > best)) best = est;
  }
  return best;
}

// Marge pour ignorer les micro-écarts d'arrondi flottant plutôt qu'un vrai nouveau record.
export function isNewRecord(candidate: number | null, previousBest: number | null): boolean {
  return candidate != null && (previousBest == null || candidate > previousBest + 0.01);
}

// Un coach écrit rarement une valeur de repos sans unité au-delà de la dizaine ("90", "120") ;
// en dessous ("2", "3"), c'est presque toujours des minutes. "1:30" et "2 min" restent explicites.
export function parseRestSeconds(text: string | null | undefined, fallback = 90): number {
  if (!text) return fallback;
  const t = text.trim().toLowerCase();
  const mmss = t.match(/^(\d+)\s*:\s*(\d+)$/);
  if (mmss) return parseInt(mmss[1], 10) * 60 + parseInt(mmss[2], 10);
  const m = t.match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return fallback;
  const n = parseFloat(m[1].replace(",", "."));
  if (/min/.test(t)) return Math.round(n * 60);
  if (/s(ec)?\b/.test(t)) return Math.round(n);
  return n <= 10 ? Math.round(n * 60) : Math.round(n);
}

export async function loadSeanceLogs(seanceId: string): Promise<SeanceLogRow[]> {
  const { data } = await supabase.from("seance_logs").select("*").eq("seance_id", seanceId);
  return (data ?? []) as SeanceLogRow[];
}

export async function saveSetLog(params: {
  seanceId: string; clientId: string; exerciceIndex: number; exerciceNom: string;
  setIndex: number; poids: number | null; reps: number | null; rir: number | null;
}): Promise<void> {
  await supabase.from("seance_logs").upsert(
    {
      seance_id: params.seanceId, client_id: params.clientId,
      exercice_index: params.exerciceIndex, exercice_nom: params.exerciceNom,
      set_index: params.setIndex,
      poids_reel: params.poids, reps_reel: params.reps, rir_reel: params.rir,
      logged_at: new Date().toISOString(),
    },
    { onConflict: "seance_id,exercice_index,set_index" }
  );
}

export async function deleteSetLog(seanceId: string, exerciceIndex: number, setIndex: number): Promise<void> {
  await supabase.from("seance_logs").delete()
    .eq("seance_id", seanceId).eq("exercice_index", exerciceIndex).eq("set_index", setIndex);
}

// Meilleur 1RM estimé de ce client pour un exercice donné, tous programmes confondus — sert
// de référence pour détecter un record pendant la séance en cours (exclue du calcul : un
// re-log de la même série pendant la séance ne doit pas se comparer à lui-même).
export async function loadBest1RM(clientId: string, exerciceNom: string, excludeSeanceId: string): Promise<number | null> {
  const { data } = await supabase.from("seance_logs")
    .select("poids_reel,reps_reel")
    .eq("client_id", clientId).eq("exercice_nom", exerciceNom).neq("seance_id", excludeSeanceId);
  return best1RM((data ?? []) as SeanceLogRow[]);
}
