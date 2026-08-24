import { supabase } from "@/lib/supabase";
import { parseExercices, targetSetsFor } from "@/lib/exercices";
import { evaluateSet } from "@/lib/workoutLog";

const DEFAULT_INCREMENT_KG = 2.5;
// Après combien de séances d'affilée sans tenir la cible on suggère un deload plutôt que
// de continuer à suggérer "refais le même poids" indéfiniment.
const DELOAD_AFTER = 3;
const DELOAD_FACTOR = 0.9;

export type SessionOutcome = {
  seanceId: string;
  date: string | null;
  allHit: boolean;   // toutes les séries loggées de cet exercice ont atteint leur cible de reps
  topWeight: number | null;
};

// Historique (le plus récent en premier) des séances où ce client a loggué cet exercice, avec
// pour chacune : le poids max soulevé et si la cible de reps a été tenue sur toutes les séries.
// La cible vient de programme_seances.exercices à l'index loggué — si la séance a depuis été
// réécrite par le coach et que le nom ne correspond plus, cette séance est ignorée (donnée
// devenue incomparable, mieux vaut l'exclure que fausser la suggestion).
export async function loadExerciceSessionOutcomes(
  clientId: string, exerciceNom: string, limitSessions = 5
): Promise<SessionOutcome[]> {
  const { data: logRows } = await supabase.from("seance_logs")
    .select("seance_id,set_index,exercice_index,poids_reel,reps_reel,logged_at")
    .eq("client_id", clientId).eq("exercice_nom", exerciceNom)
    .order("logged_at", { ascending: false });
  if (!logRows?.length) return [];

  const orderedSeanceIds: string[] = [];
  for (const r of logRows) if (!orderedSeanceIds.includes(r.seance_id)) orderedSeanceIds.push(r.seance_id);
  const seanceIds = orderedSeanceIds.slice(0, limitSessions);

  const { data: seances } = await supabase.from("programme_seances")
    .select("id,exercices,date_prevue").in("id", seanceIds);
  const seanceById = new Map((seances ?? []).map(s => [s.id, s]));

  return seanceIds.map(sid => {
    const rows = logRows.filter(r => r.seance_id === sid);
    const topWeight = rows.reduce<number | null>((max, r) => r.poids_reel != null && (max == null || r.poids_reel > max) ? r.poids_reel : max, null);
    const seance = seanceById.get(sid);
    const exercice = seance ? parseExercices(seance.exercices).find(e => e.nom === exerciceNom) : undefined;

    let allHit = true;
    if (exercice) {
      const targets = targetSetsFor(exercice);
      allHit = rows.every(r => evaluateSet(targets[r.set_index]?.reps ?? "", { reps_reel: r.reps_reel }) === "hit");
    }

    return { seanceId: sid, date: seance?.date_prevue ?? null, allHit, topWeight };
  });
}

export type ProgressionSuggestion = {
  action: "increase" | "repeat" | "deload" | "none";
  suggestedWeight: number | null;
  lastWeight: number | null;
  basis: string;
};

// Ne décide jamais rien seul : produit une suggestion que le coach lit et applique — ou pas —
// en rédigeant la prochaine séance. Une série ratée ne compte jamais comme une réussite
// (cohérent avec evaluateSet) ; le deload se déclenche après plusieurs séances d'affilée sans
// tenir la cible, pas après un seul raté isolé.
export function suggestProgression(
  history: SessionOutcome[], incrementKg = DEFAULT_INCREMENT_KG, deloadAfter = DELOAD_AFTER, deloadFactor = DELOAD_FACTOR
): ProgressionSuggestion {
  const last = history[0];
  if (!last || last.topWeight == null) {
    return { action: "none", suggestedWeight: null, lastWeight: last?.topWeight ?? null, basis: "Pas encore assez de données loggées." };
  }

  if (last.allHit) {
    return {
      action: "increase", lastWeight: last.topWeight, suggestedWeight: +(last.topWeight + incrementKg).toFixed(1),
      basis: `Toutes les reps faites la dernière séance${last.date ? ` (${last.date})` : ""}.`,
    };
  }

  let stall = 0;
  for (const h of history) { if (h.allHit) break; stall++; }

  if (stall >= deloadAfter) {
    return {
      action: "deload", lastWeight: last.topWeight, suggestedWeight: +(last.topWeight * deloadFactor).toFixed(1),
      basis: `${stall} séances d'affilée sans tenir la cible — deload conseillé.`,
    };
  }

  return {
    action: "repeat", lastWeight: last.topWeight, suggestedWeight: last.topWeight,
    basis: `Cible non tenue la dernière fois (${stall} séance${stall > 1 ? "s" : ""} d'affilée) — reproposer le même poids.`,
  };
}

// Noms d'exercices récemment loggués par ce client, du plus récent au plus ancien — sert de
// point de départ pour savoir sur quels exercices calculer une suggestion (voir ProgressionSuggestions.tsx).
export async function loadRecentExerciceNoms(clientId: string, limit = 8): Promise<string[]> {
  const { data } = await supabase.from("seance_logs")
    .select("exercice_nom,logged_at")
    .eq("client_id", clientId)
    .order("logged_at", { ascending: false })
    .limit(200);
  const seen = new Set<string>();
  const noms: string[] = [];
  for (const r of data ?? []) {
    if (!seen.has(r.exercice_nom)) { seen.add(r.exercice_nom); noms.push(r.exercice_nom); }
    if (noms.length >= limit) break;
  }
  return noms;
}
