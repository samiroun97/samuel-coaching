import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });

    const { photos, profile } = await req.json();
    const { sexe, poids, taille, age } = profile ?? {};

    const profileStr = profile
      ? `Profil : ${sexe ?? "?"}, ${age ?? "?"}ans, ${poids ?? "?"}kg, ${taille ?? "?"}cm`
      : "Profil non renseigné.";

    type ValidMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    const VALID_TYPES: ValidMediaType[] = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    const imageContent: Anthropic.ImageBlockParam[] = (photos as string[])
      .filter(Boolean)
      .flatMap((dataUri: string): Anthropic.ImageBlockParam[] => {
        const match = dataUri.match(/^data:(image\/\w+);base64,(.+)$/);
        if (!match) return [];
        const mt = match[1] as string;
        if (!VALID_TYPES.includes(mt as ValidMediaType)) return [];
        return [{
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: mt as ValidMediaType,
            data: match[2],
          },
        }];
      });

    if (imageContent.length === 0) {
      return NextResponse.json({ error: "Aucune image valide" }, { status: 400 });
    }

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: [
            ...imageContent,
            {
              type: "text",
              text: `Tu es un expert en composition corporelle et coaching fitness. Analyse ces photos corporelles.
${profileStr}
Nombre de photos fournies : ${imageContent.length}/5 (face, dos, profil, jambe avant, jambe arrière).

Retourne UNIQUEMENT ce JSON valide, sans texte avant ni après :
{
  "body_fat_percentage": 18.5,
  "note": "Estimation basée sur la répartition adipeuse visible (max 80 car.)",
  "points_forts": "1-2 phrases courtes sur les points forts visibles (muscles, proportions, etc.)",
  "points_faibles": "1-2 phrases courtes sur les zones à améliorer (stockage graisseux, etc.)",
  "conseils": "1-2 phrases courtes de conseil pratique personnalisé"
}

Sois direct, bienveillant et concret. Chaque champ texte max 120 caractères.`,
            },
          ],
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
