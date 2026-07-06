import { NextRequest, NextResponse } from "next/server";

const PROMPT = `Tu es un nutritionniste expert. Analyse ce repas et retourne UNIQUEMENT un objet JSON valide, sans markdown, sans texte avant ni après :
{
  "name": "Nom court du plat",
  "calories": 450,
  "proteines": 35,
  "glucides": 40,
  "lipides": 15
}
Toutes les valeurs sont des entiers. Estime des portions raisonnables si non précisées.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_AI_API_KEY non configurée" }, { status: 500 });
  }

  const { type, image, text } = await req.json();

  let parts: unknown[];

  if (type === "photo" && image) {
    const comma = image.indexOf(",");
    const mimeType = image.slice(0, comma).match(/:(.*?);/)?.[1] ?? "image/jpeg";
    const data = image.slice(comma + 1);
    parts = [
      { inlineData: { mimeType, data } },
      { text: PROMPT },
    ];
  } else if (type === "text" && text) {
    parts = [{ text: `Description du repas : "${text}"\n\n${PROMPT}` }];
  } else {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts }] }),
    }
  );

  const data = await res.json();
  const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const match = raw.match(/\{[\s\S]*?\}/);
  if (!match) return NextResponse.json({ error: "Réponse IA non parseable" }, { status: 500 });

  return NextResponse.json(JSON.parse(match[0]));
}
