export const EXERCICE_TYPES = ["Composé", "Isolation", "Poids du corps", "Cardio", "Gainage", "Étirement / Mobilité"] as const;

export type SetDetail = { reps: string; poids: string; repos: string; rpe: string; tempo: string };

export const emptySet = (): SetDetail => ({ reps: "", poids: "", repos: "", rpe: "", tempo: "" });

export type ExerciceMode = "simple" | "avance" | "libre";

// Champs du mode "simple" qu'on peut retirer individuellement par exercice
// (ex: "Poids" n'a pas de sens pour de la corde à sauter dans une séance de boxe).
export type SimpleField = "series" | "repetitions" | "poids" | "repos";

export type ExerciceItem = {
  nom: string; type: string; note: string;
  mode: ExerciceMode;
  // mode "simple"
  series: string; repetitions: string; poids: string; repos: string;
  hiddenFields: SimpleField[];
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
  series: "", repetitions: "", poids: "", repos: "", hiddenFields: [],
  sets: [], texteLibre: "", videoUrl: "", groupId: null, groupLabel: "",
});

// Comble les champs manquants d'un exercice partiel (ancien format JSON, réponse IA, modèle importé…).
export function normalizeExercice(p: Partial<ExerciceItem>): ExerciceItem {
  return {
    nom: p.nom ?? "", type: p.type ?? "", note: p.note ?? "",
    mode: p.mode ?? "simple",
    series: p.series ?? "", repetitions: p.repetitions ?? "", poids: p.poids ?? "", repos: p.repos ?? "",
    hiddenFields: Array.isArray(p.hiddenFields) ? p.hiddenFields : [],
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

// Regroupe les exercices consécutifs partageant un groupId (supersets) en
// "runs" ; un run seul (groupId: null) correspond à un exercice isolé.
// Logique partagée entre l'éditeur CRM et l'affichage côté client, pour que
// les deux vues d'un même programme restent identiques.
export type ExerciceRun = { groupId: string | null; groupLabel: string; indices: number[] };

export function groupExerciceRuns(items: ExerciceItem[]): ExerciceRun[] {
  const runs: ExerciceRun[] = [];
  let i = 0;
  while (i < items.length) {
    const cur = items[i];
    const isGrouped = !!cur.groupId && ((i > 0 && items[i - 1].groupId === cur.groupId) || (i < items.length - 1 && items[i + 1].groupId === cur.groupId));
    if (isGrouped && cur.groupId) {
      const gid = cur.groupId;
      let j = i;
      while (j < items.length && items[j].groupId === gid) j++;
      const indices: number[] = [];
      for (let k = i; k < j; k++) indices.push(k);
      runs.push({ groupId: gid, groupLabel: cur.groupLabel, indices });
      i = j;
    } else {
      runs.push({ groupId: null, groupLabel: "", indices: [i] });
      i += 1;
    }
  }
  return runs;
}

export function serializeExercices(items: ExerciceItem[]): string | null {
  const valid = items.filter(i => i.nom.trim());
  if (!valid.length) return null;
  return JSON.stringify(valid.map(i => ({
    nom: i.nom.trim(), type: i.type.trim(), note: i.note.trim(),
    mode: i.mode,
    series: i.series.trim(), repetitions: i.repetitions.trim(), poids: i.poids.trim(), repos: i.repos.trim(),
    hiddenFields: i.hiddenFields,
    sets: i.sets.map(s => ({ reps: s.reps.trim(), poids: s.poids.trim(), repos: s.repos.trim(), rpe: s.rpe.trim(), tempo: s.tempo.trim() })),
    texteLibre: i.texteLibre.trim(),
    videoUrl: i.videoUrl.trim(),
    groupId: i.groupId,
    groupLabel: i.groupLabel.trim(),
  })));
}
