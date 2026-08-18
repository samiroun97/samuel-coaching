import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/apiAuth";

export async function POST(req: NextRequest) {
  try {
    const caller = await requireUser(req);
    if (!caller) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });

    const { activity, duration_minutes, description, profile } = await req.json();
    const { sexe, poids, taille, age } = profile ?? {};

    const profileStr = profile
      ? `Profil : ${sexe ?? "non renseigné"}, ${poids ?? "?"}kg, ${taille ?? "?"}cm, ${age ?? "?"}ans.`
      : "Profil non disponible, estime pour un adulte moyen.";

    // Corrections apportées par le coach sur d'anciennes estimations jugées fausses (via la
    // rubrique IA du CRM) — réinjectées comme contexte pour calibrer l'estimation actuelle.
    // Table interne (RLS coach-only), donc lue ici via la clé service_role qui contourne RLS.
    let correctionsBlock = "";
    try {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceKey) {
        const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
        const { data: link } = await admin.from("coach_clients").select("coach_id").eq("client_id", caller.id).limit(1).maybeSingle();
        const { data: corrections } = link ? await admin
          .from("ai_corrections")
          .select("original_data,coach_comment")
          .eq("category", "activite")
          .eq("coach_id", link.coach_id)
          .order("created_at", { ascending: false })
          .limit(20) : { data: null };
        if (corrections?.length) {
          correctionsBlock = `\n\nRetours d'ajustement d'un coach humain expert sur des estimations précédentes de CE MÊME système — prends-les en compte pour calibrer ton estimation actuelle si les cas se ressemblent :\n${
            corrections.map((c, i) => `${i + 1}. ${c.original_data ? `Estimation IA initiale : ${JSON.stringify(c.original_data)}. ` : ""}Retour du coach : ${c.coach_comment}`).join("\n")
          }`;
        }
      }
    } catch { /* best-effort : l'estimation continue sans le contexte de calibration */ }

    const prompt = `Tu es un expert en physiologie sportive. Estime les calories brûlées.

${profileStr}
Activité : ${activity}
Durée : ${duration_minutes} minutes
${description ? `Détails : ${description}` : ""}

Retourne UNIQUEMENT ce JSON valide, sans texte autour :
{"calories_brulees":350,"note":"Estimation basée sur votre profil"}

calories_brulees doit être un entier réaliste. note = explication courte (max 60 caractères).${correctionsBlock}`;

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: "Réponse IA non parseable" }, { status: 500 });

    return NextResponse.json(JSON.parse(match[0]));
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
