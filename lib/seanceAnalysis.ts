import { type ExerciceItem, type RepKind, effectiveLoad, targetSetsFor, estimateSetKcal } from "@/lib/exercices";
import { type SeanceLogRow } from "@/lib/workoutLog";

export type SeanceAnalysis = {
  volume: number;
  calories: number;
  totalPlanned: number;
  totalLogged: number;
  avgRir: number | null;
  durationMin: number | null;
  perExercice: {
    exIdx: number; nom: string; repKind: RepKind; isPR: boolean;
    sets: { setIdx: number; poids: number | null; reps: number | null; rir: number | null }[];
  }[];
  points: { forts: string[]; aAmeliorer: string[] };
};

// Analyse pure d'une séance déjà loguée — pas de récupération de données ici (le composant
// appelant charge seance_logs + computeExercicePRs), juste des calculs et des constats
// simples à partir de ce qui a réellement été fait. Même esprit que suggestProgression
// (lib/progression.ts) : des règles à seuils transparentes, pas un texte généré par IA —
// gratuit, instantané, et prévisible d'une séance à l'autre.
export function analyzeSeance(
  exercices: ExerciceItem[], logs: SeanceLogRow[], clientBodyweight: number | null, prCountByNom: Record<string, boolean>
): SeanceAnalysis {
  // Le volume live (SeanceLive) additionne aussi les paliers dégressifs, mais ceux-ci sont
  // volontairement éphémères (jamais persistés dans seance_logs) — le volume rétroactif ici
  // est donc une légère sous-estimation pour une séance avec dégressifs, limite déjà connue
  // et acceptée ailleurs dans l'app plutôt qu'un vrai manque introduit ici.
  const volume = logs.reduce((s, l) => {
    const ex = exercices[l.exercice_index];
    if (!ex || ex.repKind !== "reps") return s;
    const load = effectiveLoad(ex, l.poids_reel, clientBodyweight);
    return s + (load ?? 0) * (l.reps_reel ?? 0);
  }, 0);

  // Un exercice ajouté en direct (Bibliothèque/Nom libre) reste en mode "simple" avec
  // series:"1" quel que soit le nombre réel de séries ajoutées pendant la séance (suivi à
  // part dans extraSets, jamais recopié dans exercices) — totalPlanned peut donc sous-compter
  // pour ces exercices-là. On ne laisse jamais ça produire un taux de complétion > 100%.
  const totalPlanned = exercices.reduce((s, ex) => s + targetSetsFor(ex).length, 0);
  const totalLogged = logs.length;

  const rirValues = logs.map(l => l.rir_reel).filter((r): r is number => r != null);
  const avgRir = rirValues.length ? rirValues.reduce((a, b) => a + b, 0) / rirValues.length : null;

  const timestamps = logs.map(l => new Date(l.logged_at).getTime()).filter(t => !Number.isNaN(t));
  const durationMin = timestamps.length >= 2
    ? Math.round((Math.max(...timestamps) - Math.min(...timestamps)) / 60000)
    : null;

  // Même méthode que l'estimation live (SeanceLive) : sur la vraie durée de la séance
  // (durationMin, du premier au dernier set loggé), PLAFONNÉE — sans plafond, un gros écart
  // entre deux séries (interruption, séance reprise plus tard via "Modifier") gonflait
  // démesurément le chiffre, aussi grave que l'ancienne sous-estimation par répétition.
  // Plafond à ~4 min par série loguée (rythme généreux mais borné), même valeur que le live.
  // Charge moyenne et RIR moyen pilotent l'intensité de cette durée. Repli sur l'ancienne
  // approximation par répétition si durationMin est indisponible (un seul set loggué, ou
  // logged_at identique sur toutes les lignes après une suppression d'exercice — cf.
  // removeExercice dans SeanceLive) plutôt que 0 kcal.
  const bodyweightForCalc = clientBodyweight ?? 75;
  const loadsForCal = logs.map(l => { const ex = exercices[l.exercice_index]; return ex ? effectiveLoad(ex, l.poids_reel, clientBodyweight) ?? 0 : null; }).filter((v): v is number => v != null);
  const avgLoadForCal = loadsForCal.length ? loadsForCal.reduce((a, b) => a + b, 0) / loadsForCal.length : 0;
  const avgRirForCal = avgRir ?? 2.5;
  const MAX_MIN_PER_SET = 4;
  const cappedDurationMin = durationMin != null ? Math.min(durationMin, totalLogged * MAX_MIN_PER_SET) : null;
  const calories = cappedDurationMin != null
    ? estimateSetKcal(avgLoadForCal, cappedDurationMin * 60, avgRirForCal, bodyweightForCalc)
    : logs.reduce((sum, l) => {
        const ex = exercices[l.exercice_index];
        if (!ex) return sum;
        const load = effectiveLoad(ex, l.poids_reel, clientBodyweight) ?? 0;
        const rir = l.rir_reel ?? 2.5;
        const qty = l.reps_reel ?? 0;
        const durationSeconds = ex.repKind === "temps" ? qty : qty * 3;
        return sum + estimateSetKcal(load, durationSeconds, rir, bodyweightForCalc);
      }, 0);

  const byExercice = new Map<number, SeanceLogRow[]>();
  for (const l of logs) {
    if (!exercices[l.exercice_index]) continue; // ligne orpheline (exercice depuis supprimé) — ignorée plutôt que de planter
    if (!byExercice.has(l.exercice_index)) byExercice.set(l.exercice_index, []);
    byExercice.get(l.exercice_index)!.push(l);
  }
  const perExercice = [...byExercice.entries()]
    .sort(([a], [b]) => a - b)
    .map(([exIdx, rows]) => {
      const ex = exercices[exIdx];
      return {
        exIdx, nom: ex.nom, repKind: ex.repKind, isPR: !!prCountByNom[ex.nom],
        sets: rows.slice().sort((a, b) => a.set_index - b.set_index)
          .map(r => ({ setIdx: r.set_index, poids: r.poids_reel, reps: r.reps_reel, rir: r.rir_reel })),
      };
    });

  const prCount = Object.values(prCountByNom).filter(Boolean).length;
  const completionRate = totalPlanned > 0 ? Math.min(1, totalLogged / totalPlanned) : null;
  const unloggedPlanned = exercices.filter((ex, i) => targetSetsFor(ex).length > 0 && !byExercice.has(i)).map(ex => ex.nom);

  const forts: string[] = [];
  const aAmeliorer: string[] = [];

  if (completionRate != null && completionRate >= 0.9) {
    forts.push(completionRate >= 0.999 ? "Toutes les séries prévues ont été faites." : `${totalLogged}/${totalPlanned} séries faites.`);
  }
  if (prCount > 0) forts.push(`${prCount} nouveau${prCount > 1 ? "x" : ""} record${prCount > 1 ? "s" : ""} personnel${prCount > 1 ? "s" : ""} !`);
  if (avgRir != null && avgRir <= 1.5) forts.push("Intensité soutenue (RIR moyen bas).");

  if (completionRate != null && completionRate < 0.7) aAmeliorer.push("Une partie des séries prévues n'a pas été loguée.");
  if (avgRir != null && avgRir >= 4) aAmeliorer.push("RIR moyen élevé — marge pour pousser un peu plus la prochaine fois.");
  if (unloggedPlanned.length > 0) {
    const shown = unloggedPlanned.slice(0, 2).join(", ");
    aAmeliorer.push(`Pas loggué : ${shown}${unloggedPlanned.length > 2 ? "…" : ""}`);
  }

  if (forts.length === 0 && aAmeliorer.length === 0) forts.push("Séance loguée.");

  return {
    volume, calories, totalPlanned, totalLogged, avgRir, durationMin, perExercice,
    points: { forts: forts.slice(0, 2), aAmeliorer: aAmeliorer.slice(0, 2) },
  };
}
