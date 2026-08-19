import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/apiAuth";

// Rattache l'appelant (client) au coach propriétaire du code fourni, en
// remplaçant tout lien existant — "rejoindre" un coach via son code déplace
// toujours l'adhérent vers ce coach.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { code } = await req.json();
    const clean = (code ?? "").toString().trim().toUpperCase();
    if (!clean) return NextResponse.json({ error: "Code manquant" }, { status: 400 });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY manquante côté serveur" }, { status: 500 });
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

    const { data: caller } = await admin.from("profiles").select("is_coach").eq("id", user.id).single();
    if (caller?.is_coach) return NextResponse.json({ error: "Un coach ne peut pas rejoindre un autre coach" }, { status: 400 });

    const { data: coach } = await admin.from("coaches").select("id, business_name").eq("code", clean).maybeSingle();
    if (!coach) return NextResponse.json({ error: "Code invalide" }, { status: 404 });

    await admin.from("coach_clients").delete().eq("client_id", user.id);
    const { error } = await admin.from("coach_clients").insert({ coach_id: coach.id, client_id: user.id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, coachName: coach.business_name ?? null });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
