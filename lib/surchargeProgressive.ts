import { type ExerciceItem, parseExercices, serializeExercices, REP_KIND_SUFFIX } from "@/lib/exercices";

// Surcharge progressive semaine après semaine (CRM > Programmes) : appliquée au moment de
// dupliquer une semaine du calendrier, et résumée dans la vue "Progression" (un exercice
// par ligne, une semaine par colonne, façon Everfit).

export type ProgressionRule = { kg: number; pct: number; reps: number };
export const NO_PROGRESSION: ProgressionRule = { kg: 0, pct: 0, reps: 0 };

// Point décimal (pas de virgule) : lu tel quel par parseFloat partout (séance live, logs…).
const fmt = (n: number) => (Math.round(n * 100) / 100).toString();
const num = (s: string) => parseFloat(s.replace(",", "."));

// Incrémente une valeur saisie en texte libre : "60", "60 kg", "8", "8-10" (les deux bornes).
// Tout ce qui n'est pas reconnu ("max", "AMRAP", vide…) est laissé tel quel.
function bump(value: string, f: (n: number) => number): string {
  const v = value.trim();
  const range = v.match(/^(\d+(?:[.,]\d+)?)\s*[-–à]\s*(\d+(?:[.,]\d+)?)(.*)$/);
  if (range) return `${fmt(f(num(range[1])))}-${fmt(f(num(range[2])))}${range[3]}`;
  const single = v.match(/^(\d+(?:[.,]\d+)?)(\s*kg)?$/i);
  if (single) return `${fmt(f(num(single[1])))}${single[2] ?? ""}`;
  return value;
}

// Charge arrondie au 0,5 kg le plus proche en % (les disques vont rarement plus fin).
const bumpLoad = (value: string, r: ProgressionRule) =>
  r.kg || r.pct ? bump(value, n => r.pct ? Math.round(n * (1 + r.pct / 100) * 2) / 2 : n + r.kg) : value;
const bumpReps = (value: string, ex: ExerciceItem, r: ProgressionRule) =>
  r.reps && ex.repKind === "reps" ? bump(value, n => n + r.reps) : value;

export function applyProgression(raw: string | null, rule: ProgressionRule): string | null {
  if (!raw || (!rule.kg && !rule.pct && !rule.reps)) return raw;
  const items = parseExercices(raw).map(ex => {
    if (ex.bodyweight && !ex.poids && ex.sets.every(s => !s.poids)) return { ...ex, repetitions: bumpReps(ex.repetitions, ex, rule), sets: ex.sets.map(s => ({ ...s, reps: bumpReps(s.reps, ex, rule) })) };
    return {
      ...ex,
      poids: bumpLoad(ex.poids, rule),
      repetitions: bumpReps(ex.repetitions, ex, rule),
      sets: ex.sets.map(s => ({ ...s, poids: bumpLoad(s.poids, rule), reps: bumpReps(s.reps, ex, rule) })),
    };
  });
  return serializeExercices(items);
}

// Résumé compact de la prescription d'un exercice, ex : "4×8 · 60 kg", "3×10-12 · 20→25 kg", "3×45 sec".
export function summarizeExercice(ex: ExerciceItem): string {
  const suffix = ex.repKind === "reps" ? "" : ` ${REP_KIND_SUFFIX[ex.repKind]}`;
  const kg = (p: string) => (p && !/kg/i.test(p) ? `${p} kg` : p);
  if (ex.mode === "libre") return ex.texteLibre.slice(0, 40) || "—";
  if (ex.mode === "avance" && ex.sets.length) {
    const reps = [...new Set(ex.sets.map(s => s.reps).filter(Boolean))];
    const loads = ex.sets.map(s => s.poids).filter(Boolean);
    const load = loads.length ? (new Set(loads).size === 1 ? kg(loads[0]) : `${loads[0]}→${kg(loads[loads.length - 1])}`) : "";
    return `${ex.sets.length}×${reps.join("/") || "?"}${suffix}${load ? ` · ${load}` : ""}`;
  }
  const head = ex.series || ex.repetitions ? `${ex.series || "?"}×${ex.repetitions || "?"}${suffix}` : "";
  return [head, kg(ex.poids)].filter(Boolean).join(" · ") || "—";
}

export const exerciceKey = (nom: string) => nom.trim().toLowerCase();
