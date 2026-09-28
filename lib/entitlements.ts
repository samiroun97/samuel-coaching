import type { SupabaseClient } from "@supabase/supabase-js";
import { PLANS, TRIAL_DAYS, GRACE_DAYS, type Entitlement, type Plan } from "@/lib/plans";

// Calcul côté serveur (client service_role) du niveau d'accès d'un compte :
//  • opérateur de la plateforme (Samuel) et ses propres clients → Premium, sans formule ;
//  • coach → sa propre formule ; ses clients héritent du niveau de leur coach ;
//  • solo → sa formule ; au premier passage, un essai Premium démarre automatiquement.
// Si la table subscriptions est absente ou illisible, on laisse l'accès Premium (même
// principe que les quotas IA : une panne de facturation ne doit jamais casser l'app).

type Sub = { plan: Plan; status: Entitlement["status"]; trial_ends_at: string | null; current_period_end: string | null };

const DAY = 86400000;
const OPEN: Omit<Entitlement, "kind"> = { plan: null, status: null, tier: "premium", trialEndsAt: null, currentPeriodEnd: null, maxClients: null };

export function isSubActive(sub: Sub, now = Date.now()): boolean {
  const end = sub.current_period_end ? new Date(sub.current_period_end).getTime() : null;
  switch (sub.status) {
    case "trialing": return !!sub.trial_ends_at && new Date(sub.trial_ends_at).getTime() > now;
    case "active":   return end === null || end + GRACE_DAYS * DAY > now;
    case "past_due": return end !== null && end + GRACE_DAYS * DAY > now;
    case "canceled": return end !== null && end > now;
    default:         return false;
  }
}

function fromSub(kind: Entitlement["kind"], sub: Sub): Entitlement {
  const cfg = PLANS[sub.plan];
  return {
    kind, plan: sub.plan, status: sub.status,
    tier: isSubActive(sub) ? cfg.tier : "none",
    trialEndsAt: sub.trial_ends_at, currentPeriodEnd: sub.current_period_end,
    maxClients: cfg.maxClients ?? null,
  };
}

async function readOrStartTrial(db: SupabaseClient, userId: string, audience: "solo" | "coach"): Promise<Sub | null> {
  const { data, error } = await db.from("subscriptions")
    .select("plan,status,trial_ends_at,current_period_end").eq("user_id", userId).maybeSingle();
  if (error) return null;
  if (data) return data as Sub;
  const trial: Sub = {
    plan: audience === "solo" ? "solo_premium" : "coach_premium",
    status: "trialing",
    trial_ends_at: new Date(Date.now() + TRIAL_DAYS[audience] * DAY).toISOString(),
    current_period_end: null,
  };
  // ignoreDuplicates : deux requêtes simultanées au premier passage ne créent qu'un essai.
  const { error: insErr } = await db.from("subscriptions").upsert({ user_id: userId, ...trial }, { onConflict: "user_id", ignoreDuplicates: true });
  if (insErr) return null;
  const { data: again } = await db.from("subscriptions")
    .select("plan,status,trial_ends_at,current_period_end").eq("user_id", userId).maybeSingle();
  return (again as Sub | null) ?? trial;
}

export async function getEntitlement(db: SupabaseClient, userId: string): Promise<Entitlement> {
  const { data: profile } = await db.from("profiles").select("is_coach,is_platform_admin").eq("id", userId).maybeSingle();
  if (profile?.is_platform_admin) return { kind: "owner", ...OPEN };

  if (profile?.is_coach) {
    const sub = await readOrStartTrial(db, userId, "coach");
    return sub ? fromSub("coach", sub) : { kind: "coach", ...OPEN };
  }

  const { data: link } = await db.from("coach_clients").select("coach_id").eq("client_id", userId).limit(1).maybeSingle();
  if (link) {
    const { data: coach } = await db.from("coaches").select("profile_id").eq("id", link.coach_id).maybeSingle();
    if (!coach) return { kind: "coach_client", ...OPEN };
    const coachEnt = await getEntitlement(db, coach.profile_id);
    // Le client hérite du niveau de son coach, sans limite de clients à son échelle.
    return { ...coachEnt, kind: "coach_client", maxClients: null };
  }

  const sub = await readOrStartTrial(db, userId, "solo");
  return sub ? fromSub("solo", sub) : { kind: "solo", ...OPEN };
}
