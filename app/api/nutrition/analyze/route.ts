import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const PROMPT = `Tu es un nutritionniste expert. Analyse ce repas et retourne UNIQUEMENT un objet JSON valide, sans markdown, sans texte avant ni après :
{
  "name": "Nom court du plat",
  "calories": 450,
  "proteines": 35,
  "glucides": 40,
  "lipides": 15
}
Toutes les valeurs sont des entiers arrondis. Estime des portions raisonnables si non précisées.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY non configurée" }, { status: 500 });
  }

  const client = new Anthropic({ apiKey });
  const { type, image, text } = await req.json();

  let content: Anthropic.Messages.MessageParam["content"];

  if (type === "photo" && image) {
    const comma = image.indexOf(",");
    const meta = image.slice(0, comma);
    const data = image.slice(comma + 1);
    const mediaType = (meta.match(/:(.*?);/)?.[1] ?? "image/jpeg") as
      | "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    content = [
      { type: "image", source: { type: "base64", media_type: mediaType, data } },
      { type: "text", text: PROMPT },
    ];
  } else if (type === "text" && text) {
    content = [{ type: "text", text: `Description du repas : "${text}"\n\n${PROMPT}` }];
  } else {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [{ role: "user", content }],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "";
  const match = raw.match(/\{[\s\S]*?\}/);
  if (!match) return NextResponse.json({ error: "Réponse IA non parseable" }, { status: 500 });

  return NextResponse.json(JSON.parse(match[0]));
}
