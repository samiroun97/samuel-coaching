import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/apiAuth";
import { deleteUserData } from "@/lib/deleteUserData";

// Supprime un client entièrement : son compte de connexion (auth.users) et
// toutes ses données de coaching. Nécessite la clé service_role — c'est la
// seule façon de supprimer un compte auth (l'API publique/anon ne le permet
// jamais, RLS ou pas), donc ce nettoyage doit se faire côté serveur.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    // L'e-mail éventuellement envoyé est ignoré : deleteUserData le relit en base (un e-mail
    // arbitraire permettait d'effacer les messages et séances d'un autre utilisateur).
    const { id }: { id?: string } = await req.json();
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

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

    const { error } = await deleteUserData(admin, id);
    if (error) return NextResponse.json({ error }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
