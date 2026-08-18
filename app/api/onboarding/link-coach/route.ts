import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/apiAuth";

// Rattache un nouvel adhérent à un coach dans coach_clients — sans ça, un
// nouveau compte n'apparaît dans le CRM d'aucun coach (RLS multi-coach oblige).
// Provisoire : tant qu'il n'existe qu'un seul coach sur la plateforme, on
// rattache automatiquement au plus ancien. À remplacer par un vrai système
// d'invitation/sélection de coach le jour où plusieurs coachs sont actifs.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY manquante côté serveur" }, { status: 500 });
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

    const { data: existing } = await admin
      .from("coach_clients").select("id").eq("client_id", user.id).limit(1).maybeSingle();
    if (existing) return NextResponse.json({ ok: true, alreadyLinked: true });

    const { data: caller } = await admin.from("profiles").select("is_coach").eq("id", user.id).single();
    if (caller?.is_coach) return NextResponse.json({ ok: true, isCoach: true });

    const { data: defaultCoach } = await admin
      .from("coaches").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
    if (!defaultCoach) return NextResponse.json({ error: "Aucun coach disponible" }, { status: 500 });

    const { error } = await admin.from("coach_clients").insert({ coach_id: defaultCoach.id, client_id: user.id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
