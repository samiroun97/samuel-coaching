import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { requireUser } from "@/lib/apiAuth";

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

const genToken = () => crypto.randomBytes(24).toString("hex");

// Récupère le jeton webhook du client (le crée s'il n'existe pas encore), ou en génère
// un nouveau si { regenerate: true } — utilisé par la page Préférences pour afficher/
// régénérer le lien à coller dans le Raccourci iPhone.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { regenerate } = await req.json().catch(() => ({ regenerate: false }));
    const supa = adminClient();

    if (!regenerate) {
      const { data } = await supa.from("profiles").select("steps_webhook_token").eq("id", user.id).single();
      if (data?.steps_webhook_token) return NextResponse.json({ token: data.steps_webhook_token });
    }

    const token = genToken();
    const { error } = await supa.from("profiles").update({ steps_webhook_token: token }).eq("id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ token });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
