export const EXERCICE_TYPES = ["Composé", "Isolation", "Poids du corps", "Cardio", "Gainage", "Étirement / Mobilité"] as const;

export type SetDetail = { reps: string; poids: string; repos: string; rpe: string; tempo: string };

export const emptySet = (): SetDetail => ({ reps: "", poids: "", repos: "", rpe: "", tempo: "" });

export type ExerciceMode = "simple" | "avance" | "libre";

export type ExerciceItem = {
  nom: string; type: string; note: string;
  mode: ExerciceMode;
  // mode "simple"
  series: string; repetitions: string; poids: string; repos: string;
  // mode "avance"
  sets: SetDetail[];
  // mode "libre"
  texteLibre: string;
  // commun
  videoUrl: string;
  groupId: string | null;
  groupLabel: string;
};

export const emptyExercice = (): ExerciceItem => ({
  nom: "", type: "", note: "", mode: "simple",
  series: "", repetitions: "", poids: "", repos: "",
  sets: [], texteLibre: "", videoUrl: "", groupId: null, groupLabel: "",
});

// Comble les champs manquants d'un exercice partiel (ancien format JSON, réponse IA, modèle importé…).
export function normalizeExercice(p: Partial<ExerciceItem>): ExerciceItem {
  return {
    nom: p.nom ?? "", type: p.type ?? "", note: p.note ?? "",
    mode: p.mode ?? "simple",
    series: p.series ?? "", repetitions: p.repetitions ?? "", poids: p.poids ?? "", repos: p.repos ?? "",
    sets: Array.isArray(p.sets) ? p.sets : [],
    texteLibre: p.texteLibre ?? "",
    videoUrl: p.videoUrl ?? "",
    groupId: p.groupId ?? null,
    groupLabel: p.groupLabel ?? "",
  };
}

// Le programme est stocké en texte libre (colonne `exercices`). On y sérialise du JSON structuré ;
// les anciennes séances (texte brut, un exercice par ligne, ou JSON sans les champs v2) restent lisibles via fallback.
export function parseExercices(raw: string | null | undefined): ExerciceItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every(p => p && typeof p === "object" && "nom" in p)) {
      return parsed.map(normalizeExercice);
    }
  } catch {
    // pas du JSON -> ancien format texte
  }
  return raw.split("\n").filter(l => l.trim()).map(l => ({ ...emptyExercice(), nom: l.trim() }));
}

export function serializeExercices(items: ExerciceItem[]): string | null {
  const valid = items.filter(i => i.nom.trim());
  if (!valid.length) return null;
  return JSON.stringify(valid.map(i => ({
    nom: i.nom.trim(), type: i.type.trim(), note: i.note.trim(),
    mode: i.mode,
    series: i.series.trim(), repetitions: i.repetitions.trim(), poids: i.poids.trim(), repos: i.repos.trim(),
    sets: i.sets.map(s => ({ reps: s.reps.trim(), poids: s.poids.trim(), repos: s.repos.trim(), rpe: s.rpe.trim(), tempo: s.tempo.trim() })),
    texteLibre: i.texteLibre.trim(),
    videoUrl: i.videoUrl.trim(),
    groupId: i.groupId,
    groupLabel: i.groupLabel.trim(),
  })));
}
