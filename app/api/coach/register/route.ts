import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/apiAuth";

// Transforme l'appelant en coach : profiles.is_coach = true + une ligne coaches.
// Consommé une fois au premier login après confirmation d'email (voir
// app/dashboard/layout.tsx, même schéma que le rattachement client par
// ?invite=CODE dans app/api/coach/join/route.ts). Le code d'invitation à
// partager avec ses futurs clients se génère tout seul (colonne coaches.code
// avec une valeur par défaut, voir supabase/coach_invite_code_migration.sql).
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { businessName } = await req.json();
    const clean = (businessName ?? "").toString().trim();
    if (!clean) return NextResponse.json({ error: "Nom d'activité manquant" }, { status: 400 });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY manquante côté serveur" }, { status: 500 });
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

    const { data: caller } = await admin.from("profiles").select("is_coach").eq("id", user.id).single();
    if (caller?.is_coach) return NextResponse.json({ ok: true, alreadyCoach: true });

    const { data: existingCoach } = await admin.from("coaches").select("id").eq("profile_id", user.id).maybeSingle();
    if (existingCoach) return NextResponse.json({ ok: true, alreadyCoach: true });

    const { error: updateErr } = await admin.from("profiles").update({ is_coach: true }).eq("id", user.id);
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    const { data: coach, error: insertErr } = await admin.from("coaches")
      .insert({ profile_id: user.id, business_name: clean }).select("code").single();
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, code: coach.code });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
