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
          content: `Tu es un coach sportif expert. Voici le bilan chiffré de la semaine d'un client, avec ses objectifs personnels :
${JSON.stringify(stats, null, 2)}

Génère un retour structuré en 3 domaines distincts, calibré sur les objectifs réels du client ("objectifs", "experience", "niveauActivite" fournis ci-dessus) — pas un discours générique. Sois direct, factuel et bienveillant, comme un vrai coach.

Retourne UNIQUEMENT ce JSON valide, sans texte avant ni après, chaque champ = 1 phrase courte et concrète (max 110 caractères) :
{
  "nutrition": {
    "point_fort": "ce qui est bien équilibré dans l'apport macro (glucides/protéines/lipides) vs les objectifs macro fournis",
    "point_faible": "le déséquilibre macro principal constaté (ex: trop de glucides, protéines insuffisantes) — jamais une liste d'aliments, juste un constat chiffré",
    "conseil": "ajustement macro concret et actionnable pour la semaine prochaine"
  },
  "neat": {
    "point_fort": "ce qui est positif dans l'activité quotidienne (pas) de la semaine vs l'objectif de pas",
    "point_faible": "le principal manque sur les pas de la semaine, ou absence de point faible si l'objectif est atteint",
    "conseil": "conseil concret pour ajuster l'activité quotidienne"
  },
  "eat": {
    "point_fort": "ce qui est positif dans l'entraînement de la semaine (régularité, volume, séances vs objectif de fréquence)",
    "point_faible": "dis explicitement si le client est en sous-entraînement, en sur-entraînement, ou si le rythme est adapté par rapport à sa fréquence visée (targetSessions) — base-toi sur sessionsCount vs targetSessions et totalTrainingMinutes",
    "conseil": "conseil concret pour la suite ; si restDays vaut 0 cette semaine, rappelle explicitement l'importance d'un jour de repos pour la récupération"
  }
}

Base-toi uniquement sur les chiffres fournis, ne les invente pas. Si une donnée est manquante ou à 0 (ex: pas d'objectif de séances défini), adapte le propos sans inventer de chiffre.`,
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
