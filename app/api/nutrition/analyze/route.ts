import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireUser } from "@/lib/apiAuth";

const PROMPT = `Tu es un nutritionniste expert. Analyse ce repas.

Procède ingrédient par ingrédient, en écrivant ton raisonnement avant de conclure : identifie chaque composant du plat, estime son poids/sa quantité, puis calcule ses calories à partir des valeurs nutritionnelles usuelles que tu connais pour cet aliment précis (ex : 1 oeuf ≈ 70 kcal, 100g de riz cuit ≈ 130 kcal, 100g de thon au naturel égoutté ≈ 110 kcal, 100g de pâtes cuites ≈ 160 kcal, 1 galette de blé/tortilla ≈ 90-150 kcal selon taille). Additionne ensuite ces valeurs — le total doit être la somme visible de tes lignes de calcul, jamais un chiffre choisi a priori ou par habitude. Deux plats de composition différente doivent presque toujours donner des totaux différents — si tu remarques que tu t'apprêtes à répondre une valeur que tu as déjà donnée pour un plat précédent sans que la composition soit vraiment identique, recalcule depuis les ingrédients.

Garde ce raisonnement bref et strictement textuel : une ligne par ingrédient au format "ingrédient — poids estimé — calcul kcal/P/G/L", sans titres, sans tableau, sans markdown, sans mise en gras, sans phrase de conclusion.

Une fois ce calcul écrit, termine ta réponse — et seulement à la toute fin — par l'objet JSON final sur sa propre ligne, sans markdown ni balises code, au format exact {"name": string, "calories": integer, "proteines": integer, "glucides": integer, "lipides": integer}, où calories est bien la somme que tu viens de calculer. Toutes les valeurs sont des entiers. Estime des portions raisonnables si non précisées.

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
      max_tokens: 1000,
      messages: [{ role: "user", content }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "";

    // Le modèle écrit maintenant son calcul ingrédient par ingrédient avant de conclure
    // (nécessaire pour qu'il fasse vraiment l'addition au lieu de deviner un chiffre rond) ;
    // on ne garde que le dernier objet JSON de la réponse, qui contient le résultat final.
    const objectMatches = raw.match(/\{[^{}]*\}/g);
    const lastObject = objectMatches?.[objectMatches.length - 1];
    if (!lastObject) {
      return NextResponse.json({ error: "Réponse IA non parseable", raw }, { status: 500 });
    }

    const parsed = JSON.parse(lastObject);
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
