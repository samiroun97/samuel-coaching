import { supabase } from "@/lib/supabase";

// Photo perso pour un exercice "libre" sans équivalent illustré dans le catalogue — bucket
// public (comme exercise-media, le catalogue officiel) : ce sont des photos d'exercices de
// sport, pas des données sensibles. Voir supabase/custom_exercice_photos_migration.sql.
const BUCKET = "custom-exercise-photos";
export const MAX_CUSTOM_IMAGE_BYTES = 3 * 1024 * 1024;

export async function uploadCustomExerciceImage(file: File): Promise<{ url: string } | { error: string }> {
  if (!file.type.startsWith("image/")) return { error: "Format non supporté." };
  if (file.size > MAX_CUSTOM_IMAGE_BYTES) return { error: "Image trop lourde (max 3 Mo)." };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Connexion requise." };

  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (error) return { error: "Échec de l'envoi." };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}
