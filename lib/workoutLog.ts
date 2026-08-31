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

// Au-delà de ~12 reps, l'estimation de 1RM (formule de Berger) devient peu fiable : la série
// sollicite surtout l'endurance musculaire, plus la force pure sur laquelle la formule se base.
const REP_CAP = 12;

// Formule de Berger (1961) : 1RM = poids / (1.0261 × e^(−0.0262 × reps)). Retenue plutôt
// qu'Epley pour sa meilleure corrélation (R² ≈ 0.93) sur la plage de reps modérée qu'on
// loggue le plus souvent (5-10) — cf. l'étude de validation de 2001.
export function estimate1RM(poids: number | null, reps: number | null): number | null {
  if (!poids || !reps || reps < 1 || reps > REP_CAP) return null;
  return poids / (1.0261 * Math.exp(-0.0262 * reps));
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

export type LastPerformance = Record<number, { poids: number | null; reps: number | null }>;
export type ExerciceHistory = { best1RM: number | null; lastPerformance: LastPerformance };

// Historique d'un exercice pour ce client, hors séance en cours : le 1RM de référence pour
// détecter un record, et le détail série par série de la dernière fois — alimente la colonne
// "précédent" façon Hevy pendant le live, en une seule requête par exercice.
export async function loadExerciceHistory(clientId: string, exerciceNom: string, excludeSeanceId: string): Promise<ExerciceHistory> {
  const { data } = await supabase.from("seance_logs")
    .select("seance_id,set_index,poids_reel,reps_reel,logged_at")
    .eq("client_id", clientId).eq("exercice_nom", exerciceNom).neq("seance_id", excludeSeanceId)
    .order("logged_at", { ascending: false });
  const rows = (data ?? []) as (Pick<SeanceLogRow, "seance_id" | "set_index" | "poids_reel" | "reps_reel"> & { logged_at: string })[];
  const lastPerformance: LastPerformance = {};
  if (rows.length) {
    const lastSeanceId = rows[0].seance_id;
    for (const r of rows) {
      if (r.seance_id === lastSeanceId) lastPerformance[r.set_index] = { poids: r.poids_reel, reps: r.reps_reel };
    }
  }
  return { best1RM: best1RM(rows), lastPerformance };
}

export type SetOutcome = "hit" | "under" | "unlogged";

function parseTargetReps(text: string): number | null {
  const m = (text || "").match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  return parseFloat(m[1].replace(",", "."));
}

// "hit" = série cochée et (aucune cible de reps chiffrée à comparer, ou reps réelles ≥ cible).
// "under" = cochée mais en dessous de la cible — un échec de série ne doit jamais se lire comme
// une réussite, sans quoi une future suggestion de progression se baserait sur du faux positif.
export function evaluateSet(targetReps: string, log: Pick<SeanceLogRow, "reps_reel"> | undefined): SetOutcome {
  if (!log) return "unlogged";
  const target = parseTargetReps(targetReps);
  if (target == null || log.reps_reel == null) return "hit";
  return log.reps_reel >= target ? "hit" : "under";
}

// Pour chaque exercice loggué dans une séance : son meilleur 1RM estimé *de cette séance*, et si
// ce chiffre dépasse le record historique du client sur cet exercice (hors séance en cours).
export async function computeExercicePRs(
  clientId: string, seanceId: string, logs: SeanceLogRow[]
): Promise<Record<string, { sessionBest1RM: number | null; isPR: boolean }>> {
  const byNom = new Map<string, SeanceLogRow[]>();
  for (const l of logs) {
    if (!byNom.has(l.exercice_nom)) byNom.set(l.exercice_nom, []);
    byNom.get(l.exercice_nom)!.push(l);
  }
  const noms = [...byNom.keys()];
  const historicalBests = await Promise.all(noms.map(nom => loadBest1RM(clientId, nom, seanceId)));
  const result: Record<string, { sessionBest1RM: number | null; isPR: boolean }> = {};
  noms.forEach((nom, i) => {
    const sessionBest = best1RM(byNom.get(nom)!);
    result[nom] = { sessionBest1RM: sessionBest, isPR: isNewRecord(sessionBest, historicalBests[i]) };
  });
  return result;
}
