import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/apiAuth";

// Signalements IA (nutrition/programme/activité) et corrections, tous coachs confondus —
// contourne RLS (clé service_role) car /crm/ia (par coach) ne montre que les clients du
// coach connecté ; ici l'opérateur doit voir les signalements de toute la plateforme pour
// calibrer les prompts IA globalement. Réservé à profiles.is_platform_admin.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY manquante côté serveur" }, { status: 500 });
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

    const { data: caller } = await admin.from("profiles").select("is_platform_admin").eq("id", user.id).single();
    if (!caller?.is_platform_admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const [{ data: profiles }, { data: msgs }, { data: corrections }] = await Promise.all([
      admin.from("profiles").select("id,email,prenom,nom"),
      admin.from("messages").select("id,from_email,to_email,content,created_at").order("created_at", { ascending: false }),
      admin.from("ai_corrections").select("*").order("created_at", { ascending: false }),
    ]);

    return NextResponse.json({ profiles: profiles ?? [], msgs: msgs ?? [], corrections: corrections ?? [] });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
