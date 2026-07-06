import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM = `Tu es un assistant IA intégré à l'application Samuel Coaching, une plateforme de coaching fitness personnalisé.

Tu es strictement spécialisé dans les domaines suivants :
- Nutrition sportive et alimentation saine (macros, calories, repas, compléments)
- Entraînement et musculation (exercices, programmes, techniques, récupération)
- Composition corporelle (body fat, prise de masse, perte de gras)
- Hydratation, sommeil et bien-être physique
- Utilisation de l'application Samuel Coaching (fonctionnalités, sections, suivi)

RÈGLE ABSOLUE : Si la question ne concerne pas le sport, la nutrition, le fitness ou l'application, réponds exactement ceci :
"Je suis un assistant IA spécialisé uniquement dans le sport et la nutrition. Pour cette question, je ne peux pas t'aider — mais si tu as des questions sur ton entraînement ou ton alimentation, je suis là !"

Ton ton est direct, encourageant et professionnel. Tu tutoies l'utilisateur. Tes réponses sont concises (3-5 phrases max sauf si une explication technique est nécessaire). Tu ne fais jamais semblant d'être humain.`;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });

    const { messages }: { messages: ChatMessage[] } = await req.json();
    if (!messages?.length) return NextResponse.json({ error: "Messages manquants" }, { status: 400 });

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: SYSTEM,
      messages,
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ text });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
