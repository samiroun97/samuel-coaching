import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireUser } from "@/lib/apiAuth";

export async function POST(req: NextRequest) {
  try {
    if (!(await requireUser(req))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });

    const { stats } = await req.json();
    if (!stats) return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 900,
      messages: [
        {
          role: "user",
          content: `Tu es Samuel, coach sportif expert. Voici le bilan chiffré de la semaine de ton client :
${JSON.stringify(stats, null, 2)}

Génère un retour en 3 domaines. CHAQUE conseil doit être directement lié à l'objectif déclaré ("objectifs") et au profil du client ("experience", "niveauActivite"). Sois direct, concret, sans généralités.

Retourne UNIQUEMENT ce JSON valide, sans texte avant ni après. Chaque champ = 1 phrase courte et percutante (max 120 caractères) :
{
"nutrition": {
"point_fort": "ce qui fonctionne dans les apports caloriques cette semaine par rapport à l'objectif du client",
"point_faible": "le principal écart constaté (surplus, déficit trop fort, irrégularité) — constat chiffré, pas de liste d'aliments",
"conseil": "ajustement calorique prioritaire pour la semaine prochaine, directement lié à l'objectif du client"
},
"neat": {
"point_fort": "ce qui est positif dans l'activité quotidienne (pas) vs l'objectif et le niveau d'activité habituel",
"point_faible": "le principal manque sur les pas ; si l'objectif est atteint, signale que c'est en bonne voie",
"conseil": "action concrète et réaliste pour améliorer ou maintenir l'activité quotidienne, adaptée au profil"
},
"eat": {
"point_fort": "ce qui est positif dans l'entraînement (régularité, fréquence vs objectif, progression)",
"point_faible": "sous-entraînement ou sur-entraînement — compare sessionsCount vs targetSessions ; sois explicite",
"conseil": "conseil prioritaire pour la semaine prochaine ; si restDays = 0, insiste sur la récupération obligatoire"
}
}

Base-toi uniquement sur les données fournies. Si une donnée est à 0 ou absente, adapte sans inventer de chiffre.`,
        },
      ],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Réponse IA non parseable", raw }, { status: 500 });

    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
