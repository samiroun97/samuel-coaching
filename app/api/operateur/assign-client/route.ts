import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/apiAuth";

// CRM opérateur : rattache un utilisateur à un coach (ou le détache avec coachId = null).
// Sert surtout à récupérer les inscrits arrivés sans code d'invitation, invisibles dans le
// CRM d'un coach tant qu'ils ne lui sont pas rattachés. Réservé à profiles.is_platform_admin.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY manquante côté serveur" }, { status: 500 });
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

    const { data: caller } = await admin.from("profiles").select("is_platform_admin").eq("id", user.id).single();
    if (!caller?.is_platform_admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { clientId, coachId } = await req.json() as { clientId?: string; coachId?: string | null };
    if (!clientId) return NextResponse.json({ error: "clientId manquant" }, { status: 400 });

    const { data: target } = await admin.from("profiles").select("is_coach").eq("id", clientId).maybeSingle();
    if (!target) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    if (target.is_coach) return NextResponse.json({ error: "Un coach ne peut pas être rattaché à un autre coach" }, { status: 400 });

    if (coachId) {
      const { data: coach } = await admin.from("coaches").select("id").eq("id", coachId).maybeSingle();
      if (!coach) return NextResponse.json({ error: "Coach introuvable" }, { status: 404 });
    }

    // Même règle que /api/coach/join : un client n'a qu'un coach, le nouveau lien remplace l'ancien.
    const { error: delErr } = await admin.from("coach_clients").delete().eq("client_id", clientId);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
    if (coachId) {
      const { error } = await admin.from("coach_clients").insert({ coach_id: coachId, client_id: clientId });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
