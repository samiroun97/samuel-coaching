import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

type Remaining = { calories: number; proteines: number; glucides: number; lipides: number };

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });

    const { remaining }: { remaining: Remaining } = await req.json();

    if (remaining.calories <= 0) {
      return NextResponse.json({ ideas: [] });
    }

    const client = new Anthropic({ apiKey });

    const prompt = `Tu es un expert en nutrition sportive. Je cherche des idées de repas pour compléter ma journée alimentaire.

Budget restant :
- Calories : ${remaining.calories} kcal
- Protéines : ${remaining.proteines}g
- Glucides : ${remaining.glucides}g
- Lipides : ${remaining.lipides}g

Propose 3 idées de repas simples, réalistes et savoureux qui s'inscrivent chacun dans ce budget.
Adapte chaque repas au budget (si le budget est faible, propose quelque chose de léger ; si le budget est élevé, propose quelque chose de plus complet).

Réponds UNIQUEMENT avec un JSON valide, sans texte avant ni après, dans ce format exact :
{
  "ideas": [
    { "name": "Nom du repas", "description": "Description courte et appétissante", "calories": 400, "proteines": 30, "glucides": 35, "lipides": 12 },
    { "name": "...", "description": "...", "calories": 0, "proteines": 0, "glucides": 0, "lipides": 0 },
    { "name": "...", "description": "...", "calories": 0, "proteines": 0, "glucides": 0, "lipides": 0 }
  ]
}`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 700,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Format de réponse invalide");

    const parsed = JSON.parse(match[0]);
    return NextResponse.json(parsed);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
