import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/apiAuth";

// Enregistre une correction (liée à un signalement) ou une note générale (message_id absent)
// pour calibrer l'IA — même table ai_corrections que /crm/ia, mais accessible ici quel que
// soit le coach concerné par le signalement d'origine. Réservé à profiles.is_platform_admin.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body: {
      category?: string; messageId?: string | null;
      originalData?: Record<string, unknown> | null; correctedData?: Record<string, unknown> | null;
      clientComment?: string | null; coachComment?: string;
    } = await req.json();
    if (!body.category || !body.coachComment?.trim()) return NextResponse.json({ error: "category et coachComment requis" }, { status: 400 });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY manquante côté serveur" }, { status: 500 });
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

    const { data: caller } = await admin.from("profiles").select("is_platform_admin").eq("id", user.id).single();
    if (!caller?.is_platform_admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { data: coach } = await admin.from("coaches").select("id").eq("profile_id", user.id).maybeSingle();

    const { data, error } = await admin.from("ai_corrections").insert({
      category: body.category, message_id: body.messageId ?? null,
      original_data: body.originalData ?? null, corrected_data: body.correctedData ?? null,
      client_comment: body.clientComment ?? null, coach_comment: body.coachComment.trim(),
      coach_id: coach?.id ?? null,
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
