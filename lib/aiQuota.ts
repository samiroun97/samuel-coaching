import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEntitlement } from "@/lib/entitlements";

// Garde-fous des routes IA (clé Anthropic facturée à l'usage) :
//  • requireCoach — réservé aux comptes coach (ex. génération de programme, modèle le plus cher) ;
//  • checkAiQuota — plafond d'appels par utilisateur et par route sur une fenêtre glissante,
//    selon le niveau de sa formule (Base/Premium, voir lib/entitlements.ts), compté dans la
//    table ai_usage (voir supabase/ai_usage_migration.sql).
// En cas d'erreur de la base (table absente, panne), on laisse passer : un quota ne doit
// jamais casser l'app pour un usage normal ; il est là contre l'abus, pas pour le coût au centime.

function admin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return key ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key) : null;
}

export async function requireCoach(userId: string): Promise<NextResponse | null> {
  const db = admin();
  if (!db) return null;
  const { data, error } = await db.from("profiles").select("is_coach").eq("id", userId).maybeSingle();
  if (error) return null;
  return data?.is_coach ? null : NextResponse.json({ error: "Réservé aux coachs" }, { status: 403 });
}

const H = 3600000;
type Limit = { max: number; windowMs: number };

// Plafonds par route selon le niveau de la formule (voir lib/plans.ts) :
//  • premium — "IA illimitée" : plafonds larges d'usage raisonnable, jamais atteints par un
//    humain, bloquants pour un script ;
//  • base — l'IA à petite dose, pour y goûter et donner envie de passer en Premium ;
//    la génération de programme (modèle le plus cher) est réservée au Premium.
export const AI_LIMITS = {
  premium: {
    "programme/generate":  { max: 30, windowMs: 24 * H },
    "programme/calories":  { max: 60, windowMs: 24 * H },
    "coach":               { max: 80, windowMs: 24 * H },
    "nutrition/analyze":   { max: 80, windowMs: 24 * H },
    "nutrition/meal-idea": { max: 40, windowMs: 24 * H },
    "suivi/bodyfat":       { max: 15, windowMs: 24 * H },
    "suivi/weekly-report": { max: 20, windowMs: 24 * H },
  },
  base: {
    "programme/generate":  { max: 0,  windowMs: 24 * H },
    "programme/calories":  { max: 10, windowMs: 24 * H },
    "coach":               { max: 10, windowMs: 24 * H },
    "nutrition/analyze":   { max: 3,  windowMs: 24 * H },
    "nutrition/meal-idea": { max: 1,  windowMs: 24 * H },
    "suivi/bodyfat":       { max: 1,  windowMs: 30 * 24 * H },
    "suivi/weekly-report": { max: 1,  windowMs: 7 * 24 * H },
  },
} satisfies Record<"premium" | "base", Record<string, Limit>>;

export type AiRoute = keyof typeof AI_LIMITS.premium;

export async function checkAiQuota(userId: string, route: AiRoute): Promise<NextResponse | null> {
  const db = admin();
  if (!db) return null;

  const ent = await getEntitlement(db, userId);
  if (ent.tier === "none") {
    return NextResponse.json({
      error: ent.kind === "coach_client"
        ? "L'abonnement de ton coach est inactif — l'IA est suspendue pour le moment."
        : "Ton essai ou ton abonnement est terminé — choisis une formule pour continuer à utiliser l'IA.",
      upgrade: ent.kind !== "coach_client",
    }, { status: 402 });
  }

  const limit = AI_LIMITS[ent.tier][route];
  if (limit.max === 0) {
    return NextResponse.json({ error: "Fonction réservée à la formule Premium.", upgrade: true }, { status: 402 });
  }
  const since = new Date(Date.now() - limit.windowMs).toISOString();
  const { count, error } = await db.from("ai_usage").select("id", { count: "exact", head: true })
    .eq("user_id", userId).eq("route", route).gte("created_at", since);
  if (error) return null;
  if ((count ?? 0) >= limit.max) {
    const period = limit.windowMs > 7 * 24 * H ? "ce mois-ci" : limit.windowMs > 24 * H ? "cette semaine" : "aujourd'hui";
    return NextResponse.json(ent.tier === "base"
      ? { error: `Limite de la formule Base atteinte ${period} — passe en Premium pour l'IA illimitée.`, upgrade: true }
      : { error: "Limite d'utilisation de l'IA atteinte pour aujourd'hui — réessaie demain." }, { status: 429 });
  }
  await db.from("ai_usage").insert({ user_id: userId, route });
  return null;
}
