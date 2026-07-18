import { supabase } from "@/lib/supabase";

export type LibraryEntry = {
  id: string;
  nom: string;
  type: string;
  note_default: string;
  video_url: string;
  created_at: string;
};

export async function listLibrary(): Promise<LibraryEntry[]> {
  const { data, error } = await supabase.from("exercice_bibliotheque").select("*").order("nom", { ascending: true });
  if (error) throw error;
  return (data ?? []) as LibraryEntry[];
}

export async function addLibraryEntry(entry: { nom: string; type: string; note_default: string; video_url: string }) {
  const { data, error } = await supabase.from("exercice_bibliotheque").insert({
    nom: entry.nom.trim(), type: entry.type || null, note_default: entry.note_default.trim() || null, video_url: entry.video_url.trim() || null,
  }).select().single();
  if (error) throw error;
  return data as LibraryEntry;
}

export async function deleteLibraryEntry(id: string) {
  const { error } = await supabase.from("exercice_bibliotheque").delete().eq("id", id);
  if (error) throw error;
}
