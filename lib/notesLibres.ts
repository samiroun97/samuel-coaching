// Notes libres d'une séance : des points en texte libre qui ne sont pas des exercices
// (ex: "bien s'hydrater avant", "focus respiration", "arriver 10 min en avance"…).
// Chaque note peut elle-même contenir plusieurs lignes (bullet points, retours à la
// ligne…), donc stockées en JSON dans la colonne texte plutôt qu'une note par ligne
// (sinon impossible de distinguer "nouvelle note" de "nouvelle ligne dans la note").

export function parseNotesLibres(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(n => String(n).trim()).filter(Boolean);
    } catch {
      // pas du JSON valide → on retombe sur le format historique ci-dessous
    }
  }
  // Format historique (avant support du multi-lignes) : une note par ligne.
  return raw.split("\n").map(l => l.trim()).filter(Boolean);
}

export function serializeNotesLibres(notes: string[]): string | null {
  const valid = notes.map(n => n.trim()).filter(Boolean);
  return valid.length ? JSON.stringify(valid) : null;
}
