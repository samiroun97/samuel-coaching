import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });

    const { activity, duration_minutes, description, profile } = await req.json();
    const { sexe, poids, taille, age } = profile ?? {};

    const profileStr = profile
      ? `Profil : ${sexe ?? "non renseigné"}, ${poids ?? "?"}kg, ${taille ?? "?"}cm, ${age ?? "?"}ans.`
      : "Profil non disponible, estime pour un adulte moyen.";

    const prompt = `Tu es un expert en physiologie sportive. Estime les calories brûlées.

${profileStr}
Activité : ${activity}
Durée : ${duration_minutes} minutes
${description ? `Détails : ${description}` : ""}

Retourne UNIQUEMENT ce JSON valide, sans texte autour :
{"calories_brulees":350,"note":"Estimation basée sur votre profil"}

calories_brulees doit être un entier réaliste. note = explication courte (max 60 caractères).`;

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
