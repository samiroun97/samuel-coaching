import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireUser } from "@/lib/apiAuth";

const PROMPT = `Tu es un nutritionniste expert. Analyse ce repas et retourne UNIQUEMENT un objet JSON valide, sans markdown, sans texte avant ni après, sans balises code, au format exact {"name": string, "calories": integer, "proteines": integer, "glucides": integer, "lipides": integer}.
Toutes les valeurs sont des entiers. Estime des portions raisonnables si non précisées.

N'ancre jamais ton estimation sur une valeur "par défaut" ou "moyenne" (par exemple ~450-520 kcal) : le résultat doit refléter précisément l'aliment et la quantité décrits, avec une amplitude réaliste totalement différente selon les cas. Exemples d'ordres de grandeur très variés à titre indicatif (ne pas recopier ces chiffres, juste illustrer l'écart attendu) : un fruit seul ou un yaourt nature ≈ 60-150 kcal, une salade légère ≈ 150-300 kcal, un sandwich ou une portion de pâtes ≈ 400-650 kcal, un burger avec frites ou un plat en sauce copieux ≈ 700-1100 kcal, une pizza entière ou un repas de restauration rapide large ≈ 900-1500 kcal. Si la description est vague (ex : "un truc rapide", "un plat de pâtes"), choisis la valeur la plus plausible pour CE plat précis plutôt qu'un chiffre générique passe-partout.

Si la photo montre un tableau/étiquette de valeurs nutritionnelles (emballage produit), c'est ta source prioritaire et la plus fiable : lis les chiffres exacts imprimés dessus plutôt que d'estimer à partir de l'apparence du produit ou de son nom. Ces tableaux sont généralement donnés "pour 100g" — vérifie l'unité de référence indiquée, puis calcule pour la quantité réellement consommée (poids/portion précisé par l'utilisateur, ou la portion de référence de l'étiquette si rien n'est précisé). N'ignore jamais un tableau de valeurs nutritionnelles visible au profit d'une estimation générique.

Attention à l'ambiguïté du mot "tacos" en contexte francophone/suisse : il désigne presque toujours le tacos français de restauration rapide (galette garnie de viande, frites, fromage fondu et sauces, façon O'Tacos) et NON le petit taco mexicain. Ce plat est très calorique : compte environ 700-900 kcal en taille S/M, 1000-1400 kcal en taille L/XL selon les viandes, fromage et sauces visibles. Ne le confonds jamais avec un taco mexicain léger. Plus largement, pour tout plat de restauration rapide ou de restaurant (burger, kebab, pizza, tacos, sandwich…), ne sous-estime pas : l'huile de cuisson, le fromage fondu et les sauces ajoutent des calories significatives par rapport à une préparation maison — vise une estimation réaliste plutôt que prudente.`;

export async function POST(req: NextRequest) {
  try {
    if (!(await requireUser(req))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });
    const { type, image, text, portion } = await req.json();

    // Le réglage de portion (petite/grande) est appliqué mathématiquement après coup
    // (+/-15%), pas laissé à l'appréciation de l'IA : on lui demande donc toujours
    // une estimation pour une portion standard/typique.
    const portionMultiplier = portion === "grande" ? 1.15 : portion === "petite" ? 0.85 : 1;

    let content: Anthropic.Messages.MessageParam["content"];

    if (type === "photo" && image) {
      const comma = image.indexOf(",");
      const mediaType = (image.slice(0, comma).match(/:(.*?);/)?.[1] ?? "image/jpeg") as
        "image/jpeg" | "image/png" | "image/gif" | "image/webp";
      const precisions = text?.trim() ? `Précisions données par l'utilisateur : "${text.trim()}".` : "";
      content = [
        { type: "image", source: { type: "base64", media_type: mediaType, data: image.slice(comma + 1) } },
        { type: "text", text: [precisions, PROMPT].filter(Boolean).join("\n") },
      ];
    } else if (type === "text" && text) {
      content = [{ type: "text", text: [`Repas : "${text}"`, PROMPT].filter(Boolean).join("\n") }];
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
    if (portionMultiplier !== 1) {
      for (const key of ["calories", "proteines", "glucides", "lipides"] as const) {
        if (typeof parsed[key] === "number") parsed[key] = Math.round(parsed[key] * portionMultiplier);
      }
    }
    return NextResponse.json(parsed);

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
