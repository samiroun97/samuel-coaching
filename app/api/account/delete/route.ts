import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/apiAuth";

// Suppression de compte self-service : contrairement à app/api/crm/delete-client (un coach
// supprime un client, autorisation par lien coach↔client), ici l'appelant ne peut agir que
// sur lui-même — pas de vérification is_coach/coach_clients, requireUser suffit à identifier
// qui supprimer. Même cascade de tables que delete-client (client_id/user_id/email), plus le
// nettoyage des buckets Storage — les FK ON DELETE CASCADE vers auth.users couvrent déjà les
// lignes de seance_logs/weight_entries/push_subscriptions/steps_log/body_fat_entries/
// body_photos/coach_clients à la suppression du compte auth plus bas, mais jamais les
// fichiers Storage (aucune cascade possible côté objets), d'où le nettoyage explicite ici.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const id = user.id;
    const email = user.email;
    if (!email) return NextResponse.json({ error: "Email introuvable sur le compte" }, { status: 400 });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY manquante côté serveur" }, { status: 500 });

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

    // Un coach ne peut pas s'auto-supprimer par ce flux self-service : cette cascade ne
    // nettoie que des données côté client (coach_notes, meal_plans assignés, etc.), jamais
    // la ligne `coaches` ni les liens coach_clients qui rattachent SES clients à lui — les
    // laisser orphelins casserait leur accès. Un coach qui a activé l'aperçu client (bouton
    // "Espace coach") peut donc atteindre cette route ; on la bloque explicitement ici,
    // pas seulement côté UI (l'UI cache aussi l'option, mais la route reste appelable).
    const { data: caller } = await admin.from("profiles").select("is_coach").eq("id", id).single();
    if (caller?.is_coach) {
      return NextResponse.json({ error: "Un compte coach ne peut pas être supprimé depuis cet écran — contacte le support." }, { status: 403 });
    }

    // Les chemins exacts des photos corporelles sont capturés avant suppression des lignes
    // (photo_path est nested {user_id}/{session_id}/{angle}.jpg — pas listable à plat comme
    // les deux buckets ci-dessous, donc on lit la table plutôt que de lister le dossier).
    const { data: bodyPhotoRows } = await admin.from("body_photos").select("photo_path").eq("user_id", id);
    const bodyPhotoPaths = (bodyPhotoRows ?? []).map(r => r.photo_path).filter(Boolean);

    await Promise.all([
      admin.from("coach_notes").delete().eq("client_id", id),
      admin.from("weekly_checkins").delete().eq("client_id", id),
      admin.from("programme_seances").delete().eq("assigned_to_email", email),
      admin.from("meal_plans").delete().eq("client_id", id),
      admin.from("daily_summaries").delete().eq("user_id", id),
      admin.from("body_fat_entries").delete().eq("user_id", id),
      admin.from("body_photos").delete().eq("user_id", id),
      admin.from("user_state").delete().eq("user_id", id),
      admin.from("seance_logs").delete().eq("client_id", id),
      admin.from("messages").delete().or(`from_email.eq.${email},to_email.eq.${email}`),
    ]);

    // Nettoyage Storage — best-effort : un échec ici ne doit pas bloquer la suppression du
    // compte lui-même (des fichiers orphelins dans un bucket privé/limité en visibilité sont
    // un moindre mal comparé à un compte "zombie" qui ne peut plus être supprimé du tout).
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
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
