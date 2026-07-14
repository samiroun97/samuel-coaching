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
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: `Tu es un coach sportif expert. Voici le bilan chiffré de la semaine d'un client :
${JSON.stringify(stats, null, 2)}

Retourne UNIQUEMENT ce JSON valide, sans texte avant ni après :
{
  "point_fort": "1 phrase courte et concrète sur ce que le client a bien fait cette semaine (max 110 car.)",
  "point_faible": "1 phrase courte et concrète sur le principal axe de progrès (max 110 car.)",
  "remarque": "1 phrase courte de conseil actionnable pour la semaine prochaine (max 110 car.)"
}

Sois direct, factuel et bienveillant, comme un vrai coach qui donne un feedback hebdomadaire. Base-toi uniquement sur les chiffres fournis, ne les invente pas.`,
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
