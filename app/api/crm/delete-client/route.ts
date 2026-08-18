import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/apiAuth";

// Supprime un client entièrement : son compte de connexion (auth.users) et
// toutes ses données de coaching. Nécessite la clé service_role — c'est la
// seule façon de supprimer un compte auth (l'API publique/anon ne le permet
// jamais, RLS ou pas), donc ce nettoyage doit se faire côté serveur.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { id, email }: { id?: string; email?: string } = await req.json();
    if (!id || !email) return NextResponse.json({ error: "id et email requis" }, { status: 400 });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY manquante côté serveur" }, { status: 500 });

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

    // Ce endpoint contourne RLS (clé service_role) : on doit donc vérifier nous-mêmes
    // que l'appelant est bien un coach ET que ce client précis lui est rattaché,
    // sinon n'importe quel coach pourrait supprimer les clients d'un autre coach.
    const { data: caller } = await admin.from("profiles").select("is_coach").eq("id", user.id).single();
    if (!caller?.is_coach) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const { data: link } = await admin
      .from("coach_clients").select("coach_id, coaches!inner(profile_id)")
      .eq("client_id", id).eq("coaches.profile_id", user.id).maybeSingle();
    if (!link) return NextResponse.json({ error: "Ce client ne t'est pas rattaché" }, { status: 403 });

    await Promise.all([
      admin.from("coach_notes").delete().eq("client_id", id),
      admin.from("weekly_checkins").delete().eq("client_id", id),
      admin.from("programme_seances").delete().eq("assigned_to_email", email),
      admin.from("meal_plans").delete().eq("client_id", id),
      admin.from("daily_summaries").delete().eq("user_id", id),
      admin.from("body_fat_entries").delete().eq("user_id", id),
      admin.from("body_photos").delete().eq("user_id", id),
      admin.from("user_state").delete().eq("user_id", id),
      admin.from("messages").delete().or(`from_email.eq.${email},to_email.eq.${email}`),
    ]);
    await admin.from("profiles").delete().eq("id", id);

    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
