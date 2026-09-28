import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Garde-fous des routes IA (clé Anthropic facturée à l'usage) :
//  • requireCoach — réservé aux comptes coach (ex. génération de programme, modèle le plus cher) ;
//  • checkAiQuota — plafond d'appels par utilisateur et par route sur 24 h glissantes, compté
//    dans la table ai_usage (voir supabase/ai_usage_migration.sql).
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

// Plafonds par route (appels / 24 h / utilisateur) — larges pour un usage réel, bloquants pour un script.
export const AI_LIMITS = {
  "programme/generate": 30,
  "programme/calories": 60,
  "coach": 80,
  "nutrition/analyze": 80,
  "nutrition/meal-idea": 40,
  "suivi/bodyfat": 15,
  "suivi/weekly-report": 20,
} as const;

export async function checkAiQuota(userId: string, route: keyof typeof AI_LIMITS): Promise<NextResponse | null> {
  const db = admin();
  if (!db) return null;
  const since = new Date(Date.now() - 86400000).toISOString();
  const { count, error } = await db.from("ai_usage").select("id", { count: "exact", head: true })
    .eq("user_id", userId).eq("route", route).gte("created_at", since);
  if (error) return null;
  if ((count ?? 0) >= AI_LIMITS[route]) {
    return NextResponse.json({ error: "Limite d'utilisation de l'IA atteinte pour aujourd'hui — réessaie demain." }, { status: 429 });
  }
  await db.from("ai_usage").insert({ user_id: userId, route });
  return null;
}
