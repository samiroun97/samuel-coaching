import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Appelée par le Raccourci iPhone du client (pas de session Supabase ici — juste le
// jeton personnel du client en Authorization: Bearer, généré depuis Préférences).
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace(/^Bearer /i, "");
    if (!token) return NextResponse.json({ error: "Jeton manquant" }, { status: 401 });

    const { date, steps } = await req.json();
    if (typeof steps !== "number" || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Paramètres invalides — attendu { date: 'AAAA-MM-JJ', steps: number }" }, { status: 400 });
    }

    const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: profile } = await supa.from("profiles").select("id").eq("steps_webhook_token", token).single();
    if (!profile) return NextResponse.json({ error: "Jeton invalide" }, { status: 401 });

    const { error } = await supa.from("steps_log").upsert({
      user_id: profile.id, date, steps: Math.max(0, Math.round(steps)),
      source: "shortcuts", updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,date" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
