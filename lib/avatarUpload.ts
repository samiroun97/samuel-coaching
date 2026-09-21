import { supabase } from "@/lib/supabase";

const BUCKET = "avatars";
export const MAX_AVATAR_BYTES = 3 * 1024 * 1024;
const AVATAR_SIZE = 400;

// Une photo de profil s'affiche toujours dans un cercle, jamais dans son ratio d'origine —
// autant la recadrer en carré (centré) et la redimensionner dès l'upload plutôt que de
// recropper à chaque affichage. Pas de crop interactif (glisser/zoomer) : aucune lib de ce
// type dans le repo, un recadrage automatique centré suffit pour une photo de profil.
function cropToSquare(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      const canvas = document.createElement("canvas");
      canvas.width = AVATAR_SIZE; canvas.height = AVATAR_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas indisponible.")); return; }
      ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
      canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error("Échec du recadrage."))), "image/jpeg", 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image invalide.")); };
    img.src = url;
  });
}

export async function uploadAvatar(file: File): Promise<{ url: string } | { error: string }> {
  if (!file.type.startsWith("image/")) return { error: "Format non supporté." };
  if (file.size > MAX_AVATAR_BYTES) return { error: "Image trop lourde (max 3 Mo)." };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Connexion requise." };

  let blob: Blob;
  try {
    blob = await cropToSquare(file);
  } catch {
    return { error: "Échec du recadrage." };
  }

  const path = `${user.id}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg" });
  if (error) return { error: "Échec de l'envoi." };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}
