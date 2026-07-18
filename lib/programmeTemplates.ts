import { supabase } from "@/lib/supabase";
import { type ExerciceItem, parseExercices, serializeExercices } from "@/lib/exercices";

export type ProgrammeTemplate = {
  id: string;
  nom: string;
  objectif: string | null;
  type_seance: string | null;
  description: string | null;
  exercices: string | null;
  created_at: string;
};

export async function listTemplates(): Promise<ProgrammeTemplate[]> {
  const { data, error } = await supabase.from("programme_templates").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProgrammeTemplate[];
}

export async function saveTemplate(entry: { nom: string; objectif: string; type_seance: string; description: string; exercices: ExerciceItem[] }) {
  const { data, error } = await supabase.from("programme_templates").insert({
    nom: entry.nom.trim(),
    objectif: entry.objectif.trim() || null,
    type_seance: entry.type_seance || null,
    description: entry.description.trim() || null,
    exercices: serializeExercices(entry.exercices),
  }).select().single();
  if (error) throw error;
  return data as ProgrammeTemplate;
}

export async function deleteTemplate(id: string) {
  const { error } = await supabase.from("programme_templates").delete().eq("id", id);
  if (error) throw error;
}

export function templateToExercices(t: ProgrammeTemplate): ExerciceItem[] {
  return parseExercices(t.exercices);
}
