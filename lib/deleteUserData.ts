import type { SupabaseClient } from "@supabase/supabase-js";

// Suppression complète d'un utilisateur (client) — partagée par la suppression self-service
// (/api/account/delete) et la suppression par son coach (/api/crm/delete-client), qui
// divergeaient : la seconde oubliait les séries loggées et les fichiers Storage (photos
// corporelles, avatar…), laissés sur le serveur après suppression — contraire à la nLPD.
// L'e-mail est TOUJOURS relu en base (jamais fourni par l'appelant) : il sert à filtrer les
// messages et séances, et un e-mail arbitraire permettait d'effacer les données d'un tiers.
// Les factures et paiements ne sont pas effacés (conservation légale 10 ans) : leur lien
// client passe à NULL (ON DELETE SET NULL), les coordonnées restent figées dans la facture.
export async function deleteUserData(admin: SupabaseClient, id: string): Promise<{ error?: string }> {
  const [{ data: authUser }, { data: profile }] = await Promise.all([
    admin.auth.admin.getUserById(id),
    admin.from("profiles").select("email").eq("id", id).maybeSingle(),
  ]);
  const email = authUser?.user?.email ?? profile?.email ?? null;

  const { data: bodyPhotoRows } = await admin.from("body_photos").select("photo_path").eq("user_id", id);
  const bodyPhotoPaths = (bodyPhotoRows ?? []).map(r => r.photo_path).filter(Boolean);

  await Promise.all([
    admin.from("coach_notes").delete().eq("client_id", id),
    admin.from("weekly_checkins").delete().eq("client_id", id),
    admin.from("meal_plans").delete().eq("client_id", id),
    admin.from("daily_summaries").delete().eq("user_id", id),
    admin.from("body_fat_entries").delete().eq("user_id", id),
    admin.from("body_photos").delete().eq("user_id", id),
    admin.from("user_state").delete().eq("user_id", id),
    admin.from("seance_logs").delete().eq("client_id", id),
    admin.from("weight_entries").delete().eq("client_id", id),
    admin.from("steps_log").delete().eq("user_id", id),
    ...(email ? [
      admin.from("programme_seances").delete().eq("assigned_to_email", email),
      admin.from("messages").delete().eq("from_email", email),
      admin.from("messages").delete().eq("to_email", email),
    ] : []),
  ]);

  // Storage best-effort : des fichiers orphelins ne doivent pas bloquer la suppression du compte.
  await Promise.allSettled([
    (async () => {
      const { data: files } = await admin.storage.from("custom-exercise-photos").list(id);
      if (files?.length) await admin.storage.from("custom-exercise-photos").remove(files.map(f => `${id}/${f.name}`));
    })(),
    (async () => {
      const { data: files } = await admin.storage.from("avatars").list(id);
      if (files?.length) await admin.storage.from("avatars").remove(files.map(f => `${id}/${f.name}`));
    })(),
    (async () => {
      if (bodyPhotoPaths.length) await admin.storage.from("body-photos").remove(bodyPhotoPaths);
    })(),
  ]);

  await admin.from("profiles").delete().eq("id", id);
  const { error } = await admin.auth.admin.deleteUser(id);
  return error ? { error: error.message } : {};
}
