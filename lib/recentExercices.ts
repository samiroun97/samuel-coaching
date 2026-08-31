// Derniers exercices choisis dans la bibliothèque, pour un accès rapide en tête de liste —
// stocké en local (par appareil), comme le reste des préférences légères de l'app
// (steps_goal, programme_logs…). Pas besoin de sync serveur pour ce raccourci de confort.
const KEY = "recent_exercices_catalogue";
const MAX = 12;

export function getRecentExerciceNoms(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function pushRecentExerciceNom(nom: string): void {
  try {
    const next = [nom, ...getRecentExerciceNoms().filter(n => n !== nom)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // localStorage indisponible (navigation privée...) — le raccourci "récents" est un
    // confort, pas une fonctionnalité critique, on l'ignore silencieusement.
  }
}
