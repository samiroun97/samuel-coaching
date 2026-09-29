import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/apiAuth";
import { PLANS, type Plan } from "@/lib/plans";
import { isSubActive } from "@/lib/entitlements";

// Vue transverse de la plateforme (CRM opérateur) : tous les coachs ET tous les utilisateurs,
// y compris les inscrits sans coach (invisibles dans le CRM d'un coach, scopé à ses clients).
// Nécessite la clé service_role pour contourner RLS. Réservé à profiles.is_platform_admin.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY manquante côté serveur" }, { status: 500 });
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

    const { data: caller } = await admin.from("profiles").select("is_platform_admin").eq("id", user.id).single();
    if (!caller?.is_platform_admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const [{ data: coaches }, { data: links }, { data: profiles }, { count: seancesCount }, { count: messagesCount }, subsRes] = await Promise.all([
      admin.from("coaches").select("id,profile_id,business_name,code,created_at,is_active"),
      admin.from("coach_clients").select("coach_id,client_id,created_at"),
      admin.from("profiles").select("id,email,prenom,nom,created_at,last_seen_at,is_coach,is_platform_admin,objectifs"),
      admin.from("programme_seances").select("id", { count: "exact", head: true }),
      admin.from("messages").select("id", { count: "exact", head: true }),
      // Table absente tant que billing_security_migration.sql n'est pas appliquée : on ignore l'erreur.
      admin.from("subscriptions").select("user_id,plan,status,trial_ends_at,current_period_end"),
    ]);
    const subs = subsRes.error ? [] : (subsRes.data ?? []);
    const subByUser = new Map(subs.map(s => [s.user_id, s]));

    const profileById = new Map((profiles ?? []).map(p => [p.id, p]));
    const coachById = new Map((coaches ?? []).map(c => [c.id, c]));
    const linkByClient = new Map((links ?? []).map(l => [l.client_id, l]));
    const clientCountByCoach = new Map<string, number>();
    for (const l of links ?? []) clientCountByCoach.set(l.coach_id, (clientCountByCoach.get(l.coach_id) ?? 0) + 1);

    const subInfo = (userId: string) => {
      const s = subByUser.get(userId);
      if (!s) return { plan: null, planLabel: null, subStatus: null, trialEndsAt: null, active: null };
      return {
        plan: s.plan as Plan, planLabel: PLANS[s.plan as Plan]?.label ?? s.plan, subStatus: s.status,
        trialEndsAt: s.trial_ends_at, active: isSubActive(s),
      };
    };

    const coachRows = (coaches ?? []).map(c => {
      const p = profileById.get(c.profile_id);
      const si = subInfo(c.profile_id);
      return {
        id: c.id, profileId: c.profile_id, businessName: c.business_name,
        email: p?.email ?? "", prenom: p?.prenom ?? "", nom: p?.nom ?? "",
        code: c.code, createdAt: c.created_at, isActive: c.is_active,
        isOperator: !!p?.is_platform_admin,
        clientCount: clientCountByCoach.get(c.id) ?? 0,
        maxClients: p?.is_platform_admin ? null : (si.plan ? PLANS[si.plan].maxClients ?? null : null),
        ...si,
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const userRows = (profiles ?? []).map(p => {
      const link = linkByClient.get(p.id);
      const coach = link ? coachById.get(link.coach_id) : undefined;
      const kind = p.is_platform_admin ? "operateur" : p.is_coach ? "coach" : link ? "client" : "solo";
      return {
        id: p.id, email: p.email ?? "", prenom: p.prenom ?? "", nom: p.nom ?? "",
        objectifs: p.objectifs ?? "",
        createdAt: p.created_at, lastSeenAt: p.last_seen_at,
        kind, coachId: coach?.id ?? null, coachName: coach?.business_name ?? null,
        onboarded: !!p.prenom,
        ...subInfo(p.id),
      };
    }).sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());

    // Revenu mensuel récurrent estimé : formules actives payantes (hors essai), annuel ramené au mois.
    const mrr = subs.filter(s => s.status !== "trialing" && isSubActive(s))
      .reduce((sum, s) => sum + (PLANS[s.plan as Plan]?.monthlyChf ?? 0), 0);
    const weekAgo = Date.now() - 7 * 86400000;

    // Répartition par formule : en essai / payants / inactifs (essai fini, résilié, impayé).
    const planBreakdown = (Object.keys(PLANS) as Plan[]).map(plan => {
      const rows = subs.filter(s => s.plan === plan);
      const trialing = rows.filter(s => s.status === "trialing" && isSubActive(s)).length;
      const paying = rows.filter(s => s.status !== "trialing" && isSubActive(s)).length;
      return { plan, trialing, paying, inactive: rows.length - trialing - paying, mrr: paying * PLANS[plan].monthlyChf };
    });

    return NextResponse.json({
      coaches: coachRows,
      users: userRows,
      billingReady: !subsRes.error,
      planBreakdown,
      totals: {
        users: userRows.length,
        newThisWeek: userRows.filter(u => u.createdAt && new Date(u.createdAt).getTime() > weekAgo).length,
        unlinked: userRows.filter(u => u.kind === "solo").length,
        coaches: coachRows.length,
        clients: (links ?? []).length,
        trialing: subs.filter(s => s.status === "trialing" && isSubActive(s)).length,
        paying: subs.filter(s => s.status !== "trialing" && isSubActive(s)).length,
        mrr,
        seances: seancesCount ?? 0,
        messages: messagesCount ?? 0,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
