import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

// Déclenché par Vercel Cron (voir vercel.json) deux fois par jour, une fois par repas.
// Heures UTC choisies pour tomber vers 12h/18-19h heure de Zurich été comme hiver (CEST/CET).
const MEAL_LABELS: Record<string, string> = { dejeuner: "Déjeuner", diner: "Dîner" };
const MEAL_MESSAGES: Record<string, string> = {
  dejeuner: "C'est l'heure du déjeuner — pense à scanner ou logguer ton repas 🍽️",
  diner: "C'est l'heure du dîner — pense à scanner ou logguer ton repas 🍽️",
};

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const meal = req.nextUrl.searchParams.get("meal") ?? "";
  const mealLabel = MEAL_LABELS[meal];
  if (!mealLabel) return NextResponse.json({ error: "Paramètre meal invalide" }, { status: 400 });

  const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vapidPublic  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!serviceKey || !vapidPublic || !vapidPrivate) {
    return NextResponse.json({ error: "Configuration push manquante côté serveur" }, { status: 500 });
  }

  webpush.setVapidDetails("mailto:sam97waelti@gmail.com", vapidPublic, vapidPrivate);
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

  const today = new Date().toISOString().split("T")[0];
  const [{ data: subs }, { data: todaySummaries }] = await Promise.all([
    admin.from("push_subscriptions").select("id,user_id,endpoint,p256dh,auth"),
    admin.from("daily_summaries").select("user_id,foods").eq("date", today),
  ]);

  const alreadyLogged = new Set(
    (todaySummaries ?? [])
      .filter((row) => Array.isArray(row.foods) && row.foods.some((f: { repas?: string }) => f.repas === mealLabel))
      .map((row) => row.user_id)
  );

  let sent = 0, removed = 0;
  await Promise.all((subs ?? []).map(async (s) => {
    if (alreadyLogged.has(s.user_id)) return;
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ title: "Samuel Coaching", body: MEAL_MESSAGES[meal], url: "/dashboard/nutrition" })
      );
      sent++;
    } catch (err: unknown) {
      // Abonnement expiré/révoqué côté navigateur : on le retire.
      const statusCode = (err as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await admin.from("push_subscriptions").delete().eq("id", s.id);
        removed++;
      }
    }
  }));

  return NextResponse.json({ ok: true, meal, sent, removed, candidates: (subs ?? []).length });
}
