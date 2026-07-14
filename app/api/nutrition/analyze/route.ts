import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireUser } from "@/lib/apiAuth";

const PROMPT = `Tu es un nutritionniste expert. Analyse ce repas et retourne UNIQUEMENT un objet JSON valide, sans markdown, sans texte avant ni après, sans balises code :
{"name":"Nom court du plat","calories":450,"proteines":35,"glucides":40,"lipides":15}
Toutes les valeurs sont des entiers. Estime des portions raisonnables si non précisées.`;

export async function POST(req: NextRequest) {
  try {
    if (!(await requireUser(req))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });
    const { type, image, text, portion } = await req.json();

    const portionNote = portion === "petite" || portion === "moyenne" || portion === "grande"
      ? `Portion indiquée par l'utilisateur : ${portion}.`
      : "";

    let content: Anthropic.Messages.MessageParam["content"];

    if (type === "photo" && image) {
      const comma = image.indexOf(",");
      const mediaType = (image.slice(0, comma).match(/:(.*?);/)?.[1] ?? "image/jpeg") as
        "image/jpeg" | "image/png" | "image/gif" | "image/webp";
      const precisions = text?.trim() ? `Précisions données par l'utilisateur : "${text.trim()}".` : "";
      content = [
        { type: "image", source: { type: "base64", media_type: mediaType, data: image.slice(comma + 1) } },
        { type: "text", text: [precisions, portionNote, PROMPT].filter(Boolean).join("\n") },
      ];
    } else if (type === "text" && text) {
      content = [{ type: "text", text: [`Repas : "${text}"`, portionNote, PROMPT].filter(Boolean).join("\n") }];
    } else {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [{ role: "user", content }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "";

    // greedy match to capture full JSON object
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json({ error: "Réponse IA non parseable", raw }, { status: 500 });
    }

    const parsed = JSON.parse(match[0]);
    return NextResponse.json(parsed);

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
