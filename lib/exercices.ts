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
  // Photo perso pour un exercice sans équivalent illustré dans le catalogue (exercice
  // libre, ou nom qui ne matche rien) — uploadée par le client, cf. lib/customExerciceImage.ts.
  imageUrl: string;
  groupId: string | null;
  groupLabel: string;
};

export const emptyExercice = (): ExerciceItem => ({
  nom: "", type: "", note: "", mode: "simple",
  series: "", repetitions: "", poids: "", repos: "", hiddenFields: [],
  sets: [], texteLibre: "", videoUrl: "", imageUrl: "", groupId: null, groupLabel: "",
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
    imageUrl: p.imageUrl ?? "",
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

// Une séance ne peut être "démarrée" en mode live (logging série par série) que si au moins
// un exercice a des séries structurées à cocher — un mode "libre" pur (texte seul) n'a rien à logger.
// Nombre de séries cible en mode "simple" : le champ "séries" est explicite quand rempli,
// mais un exercice où seuls reps/poids/repos ont été saisis (le coach a oublié "séries", ou
// le "4" affiché en placeholder dans l'éditeur a été pris pour une vraie valeur) ne doit
// jamais tomber à 0 série et disparaître silencieusement de la séance loggable — on retombe
// alors sur 4, le même défaut implicite déjà suggéré partout ailleurs dans l'éditeur.
function simpleSetCount(ex: ExerciceItem): number {
  const n = parseInt(ex.series) || 0;
  if (n > 0) return n;
  return ex.repetitions || ex.poids || ex.repos ? 4 : 0;
}

export function hasLoggableSets(items: ExerciceItem[]): boolean {
  return items.some(ex =>
    (ex.mode === "avance" && ex.sets.length > 0) ||
    (ex.mode === "simple" && simpleSetCount(ex) > 0)
  );
}

// Le mode "simple" ne décrit qu'une seule cible pour toutes les séries (series × repetitions
// à tel poids) : on la déplie en N séries identiques pour la logguer/l'afficher une par une
// comme en mode "avance". Le mode "libre" (texte seul) n'a rien de structuré à déplier.
// Partagée entre la séance live (client) et son récapitulatif (coach) pour ne jamais diverger.
export function targetSetsFor(ex: ExerciceItem): SetDetail[] {
  if (ex.mode === "avance") return ex.sets;
  if (ex.mode === "simple") {
    const n = simpleSetCount(ex);
    return Array.from({ length: n }, () => ({ reps: ex.repetitions, poids: ex.poids, repos: ex.repos, rpe: "", tempo: "" }));
  }
  return [];
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
    imageUrl: i.imageUrl.trim(),
    groupId: i.groupId,
    groupLabel: i.groupLabel.trim(),
  })));
}
