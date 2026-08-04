// Notes libres d'une séance : des points en texte libre qui ne sont pas des exercices
// (ex: "bien s'hydrater avant", "focus respiration", "arriver 10 min en avance"…).
// Stockées comme les anciennes listes d'exercices : une note par ligne dans une colonne texte.

export function parseNotesLibres(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw.split("\n").map(l => l.trim()).filter(Boolean);
}

export function serializeNotesLibres(notes: string[]): string | null {
  const valid = notes.map(n => n.trim()).filter(Boolean);
  return valid.length ? valid.join("\n") : null;
}
