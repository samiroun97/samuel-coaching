import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/apiAuth";

// No-op de sécurité, appelé en best-effort à la fin de l'onboarding client (voir
// app/dashboard/onboarding/page.tsx). Le vrai rattachement à un coach se fait via
// un lien d'invitation (?invite=CODE, voir app/api/coach/join/route.ts, consommé
// dans app/dashboard/layout.tsx) — cette route ne fait plus qu'un état des lieux,
// sans jamais rattacher automatiquement à un coach par défaut : un client arrivé
// sans lien ni code n'a simplement pas de coach, plutôt que d'être silencieusement
// détourné vers le premier coach inscrit sur la plateforme.
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

    return NextResponse.json({ ok: true, noCoach: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
