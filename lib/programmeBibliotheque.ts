import { supabase } from "@/lib/supabase";

// Programmes multi-semaines réutilisables (table programme_bibliotheque) : gabarit de N
// semaines de séances positionnées par (semaine, jour), enregistré depuis le calendrier d'un
// client puis assigné à un ou plusieurs clients à partir d'une date de départ (un lundi).

export type ProgrammeSeance = {
  semaine: number;  // 0 = première semaine du programme
  jour: number;     // 0 = lundi … 6 = dimanche
  titre: string;
  type_seance: string | null;
  description: string | null;
  exercices: string | null;     // même format sérialisé que programme_seances.exercices
  notes_libres: string | null;
};

export type ProgrammeBiblio = {
  id: string;
  nom: string;
  objectif: string | null;
  nb_semaines: number;
  seances: ProgrammeSeance[];
  created_at: string;
};

const toISO = (d: Date) => d.toLocaleDateString("sv-SE");
const dayNoon = (iso: string) => new Date(iso + "T12:00:00");

export const mondayISO = (iso: string) => {
  const d = dayNoon(iso);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return toISO(d);
};

export async function listProgrammes(): Promise<ProgrammeBiblio[]> {
  const { data, error } = await supabase.from("programme_bibliotheque").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProgrammeBiblio[];
}

export async function deleteProgramme(id: string) {
  const { error } = await supabase.from("programme_bibliotheque").delete().eq("id", id);
  if (error) throw error;
}

// Convertit les séances datées d'un client (entre startMonday et startMonday + nbSemaines)
// en gabarit (semaine, jour). Les séances libres créées par le client sont ignorées.
export function seancesToProgramme(
  seances: { titre: string; type_seance: string | null; description: string | null; exercices: string | null; notes_libres: string | null; date_prevue: string | null; created_by_client?: boolean }[],
  startMonday: string, nbSemaines: number,
): ProgrammeSeance[] {
  const start = dayNoon(startMonday).getTime();
  const out: ProgrammeSeance[] = [];
  for (const s of seances) {
    if (s.created_by_client || !s.date_prevue) continue;
    const diff = Math.round((dayNoon(s.date_prevue).getTime() - start) / 86400000);
    if (diff < 0 || diff >= nbSemaines * 7) continue;
    out.push({
      semaine: Math.floor(diff / 7), jour: diff % 7,
      titre: s.titre, type_seance: s.type_seance, description: s.description,
      exercices: s.exercices, notes_libres: s.notes_libres,
    });
  }
  return out.sort((a, b) => a.semaine - b.semaine || a.jour - b.jour);
}

export async function saveProgramme(p: { nom: string; objectif: string; nb_semaines: number; seances: ProgrammeSeance[] }, coachId: string): Promise<ProgrammeBiblio> {
  const { data, error } = await supabase.from("programme_bibliotheque").insert({
    coach_id: coachId, nom: p.nom.trim(), objectif: p.objectif.trim() || null,
    nb_semaines: p.nb_semaines, seances: p.seances,
  }).select().single();
  if (error) throw error;
  return data as ProgrammeBiblio;
}

// Date réelle d'une séance du programme pour un départ donné (lundi).
export function dateFor(startMonday: string, s: Pick<ProgrammeSeance, "semaine" | "jour">): string {
  const d = dayNoon(startMonday);
  d.setDate(d.getDate() + s.semaine * 7 + s.jour);
  return toISO(d);
}
