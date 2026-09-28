import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/apiAuth";
import { getEntitlement } from "@/lib/entitlements";

// Formule et niveau d'accès du compte connecté (page Abonnement, bandeaux d'essai).
// Premier appel d'un compte solo/coach sans formule = démarrage de son essai Premium.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY manquante côté serveur" }, { status: 500 });
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

    const entitlement = await getEntitlement(admin, user.id);

    let clientsCount: number | null = null;
    if (entitlement.kind === "coach" || entitlement.kind === "owner") {
      const { data: coach } = await admin.from("coaches").select("id").eq("profile_id", user.id).maybeSingle();
      if (coach) {
        const { count } = await admin.from("coach_clients").select("id", { count: "exact", head: true }).eq("coach_id", coach.id);
        clientsCount = count ?? 0;
      }
    }

    return NextResponse.json({ entitlement, clientsCount, paymentsEnabled: !!process.env.STRIPE_SECRET_KEY });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
