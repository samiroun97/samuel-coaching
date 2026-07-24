import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/apiAuth";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { endpoint } = await req.json();
    if (!endpoint) return NextResponse.json({ error: "endpoint manquant" }, { status: 400 });

    const token = req.headers.get("authorization")?.replace(/^Bearer /i, "");
    const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    await supa.from("push_subscriptions").delete().eq("endpoint", endpoint).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
