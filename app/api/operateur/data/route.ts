import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/apiAuth";

// Vue transverse sur tous les coachs inscrits — nécessite la clé service_role pour
// contourner RLS (chaque coach est normalement scopé à ses propres clients via
// is_coach_of()). Réservé à profiles.is_platform_admin, vérifié ici côté serveur.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY manquante côté serveur" }, { status: 500 });
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

    const { data: caller } = await admin.from("profiles").select("is_platform_admin").eq("id", user.id).single();
    if (!caller?.is_platform_admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const [{ data: coaches }, { data: links }, { count: seancesCount }, { count: messagesCount }] = await Promise.all([
      admin.from("coaches").select("id,profile_id,business_name,code,created_at,is_active"),
      admin.from("coach_clients").select("coach_id"),
      admin.from("programme_seances").select("id", { count: "exact", head: true }),
      admin.from("messages").select("id", { count: "exact", head: true }),
    ]);

    const profileIds = (coaches ?? []).map(c => c.profile_id);
    const { data: profiles } = profileIds.length
      ? await admin.from("profiles").select("id,email,prenom,nom").in("id", profileIds)
      : { data: [] };
    const profileById = new Map((profiles ?? []).map(p => [p.id, p]));

    const clientCountByCoach = new Map<string, number>();
    for (const l of links ?? []) clientCountByCoach.set(l.coach_id, (clientCountByCoach.get(l.coach_id) ?? 0) + 1);

    const coachRows = (coaches ?? []).map(c => {
      const p = profileById.get(c.profile_id);
      return {
        id: c.id,
        businessName: c.business_name,
        email: p?.email ?? "",
        prenom: p?.prenom ?? "",
        nom: p?.nom ?? "",
        code: c.code,
        createdAt: c.created_at,
        isActive: c.is_active,
        clientCount: clientCountByCoach.get(c.id) ?? 0,
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      coaches: coachRows,
      totalCoaches: coachRows.length,
      totalClients: (links ?? []).length,
      totalSeances: seancesCount ?? 0,
      totalMessages: messagesCount ?? 0,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
