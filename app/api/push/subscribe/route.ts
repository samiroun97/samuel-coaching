import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/apiAuth";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { endpoint, p256dh, auth } = await req.json();
    if (!endpoint || !p256dh || !auth) return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });

    // Client scopé au token de l'utilisateur pour que RLS (user_id = auth.uid()) s'applique.
    const token = req.headers.get("authorization")?.replace(/^Bearer /i, "");
    const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { error } = await supa.from("push_subscriptions")
      .upsert({ user_id: user.id, endpoint, p256dh, auth }, { onConflict: "endpoint" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
