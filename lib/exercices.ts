export const EXERCICE_TYPES = ["Composé", "Isolation", "Poids du corps", "Cardio", "Gainage", "Étirement / Mobilité"] as const;

export type ExerciceItem = { nom: string; type: string; series: string; repetitions: string; poids: string; repos: string; note: string };

export const emptyExercice = (): ExerciceItem => ({ nom: "", type: "", series: "", repetitions: "", poids: "", repos: "", note: "" });

// Le programme est stocké en texte libre (colonne `exercices`). On y sérialise du JSON structuré ;
// les anciennes séances (texte brut, un exercice par ligne) restent lisibles via ce fallback.
export function parseExercices(raw: string | null | undefined): ExerciceItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every(p => p && typeof p === "object" && "nom" in p)) {
      return parsed.map((p: Partial<ExerciceItem>) => ({
        nom: p.nom ?? "", type: p.type ?? "", series: p.series ?? "", repetitions: p.repetitions ?? "",
        poids: p.poids ?? "", repos: p.repos ?? "", note: p.note ?? "",
      }));
    }
  } catch {
    // pas du JSON -> ancien format texte
  }
  return raw.split("\n").filter(l => l.trim()).map(l => ({ nom: l.trim(), type: "", series: "", repetitions: "", poids: "", repos: "", note: "" }));
}

export function serializeExercices(items: ExerciceItem[]): string | null {
  const valid = items.filter(i => i.nom.trim());
  if (!valid.length) return null;
  return JSON.stringify(valid.map(i => ({
    nom: i.nom.trim(), type: i.type.trim(), series: i.series.trim(), repetitions: i.repetitions.trim(),
    poids: i.poids.trim(), repos: i.repos.trim(), note: i.note.trim(),
  })));
}
