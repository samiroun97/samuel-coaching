import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireUser } from "@/lib/apiAuth";

const SEANCE_TYPES = ["Haut du corps", "Bas du corps", "Full body", "Cardio", "Boxe", "Natation", "CrossFit", "Yoga", "Autre"];

const SCHEMA = {
  type: "object",
  properties: {
    seances: {
      type: "array",
      items: {
        type: "object",
        properties: {
          titre:       { type: "string" },
          type_seance: { type: "string", enum: SEANCE_TYPES },
          description: { type: "string" },
          exercices:   { type: "string", description: "Un exercice par ligne, séparés par \\n" },
        },
        required: ["titre", "type_seance", "description", "exercices"],
        additionalProperties: false,
      },
    },
  },
  required: ["seances"],
  additionalProperties: false,
} as const;

export async function POST(req: NextRequest) {
  try {
    if (!(await requireUser(req))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });

    const { profile } = await req.json();
    const { prenom, age, sexe, poids, taille, objectifs, experience, niveau_activite, seances_par_semaine, duree_seance, lieu_entrainement, blessures } = profile ?? {};
    if (!objectifs && !experience) return NextResponse.json({ error: "Profil client incomplet" }, { status: 400 });

    const nb = Math.min(Math.max(parseInt(seances_par_semaine) || 3, 2), 6);

    const prompt = `Tu es un coach sportif expert. Crée un programme d'entraînement hebdomadaire ciblé pour ce client.

Client : ${prenom ?? "?"}, ${sexe ?? "?"}, ${age ?? "?"} ans, ${poids ?? "?"} kg, ${taille ?? "?"} cm.
Objectif : ${objectifs || "remise en forme générale"}
Expérience : ${experience || "non renseignée"}
Niveau d'activité : ${niveau_activite || "non renseigné"}
Séances par semaine : ${nb}
Durée par séance : ${duree_seance || "1h"}
Lieu d'entraînement : ${lieu_entrainement || "salle de sport"}
Blessures / limitations : ${blessures || "aucune"}

Règles :
- Exactement ${nb} séances, adaptées à l'objectif et au niveau du client.
- Respecte impérativement les blessures/limitations.
- Adapte les exercices au lieu (maison = poids du corps/haltères, salle = machines/barres, mixte = varie).
- exercices : un exercice par ligne, format "Nom de l'exercice séries×répétitions (conseil court optionnel)". 5 à 8 exercices par séance (3 à 5 pour cardio).
- description : 1 phrase — objectif de la séance et intensité.
- Tout en français.`;

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 8000,
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find(b => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "Réponse IA vide" }, { status: 500 });
    }

    const parsed = JSON.parse(textBlock.text);
    if (!Array.isArray(parsed.seances) || parsed.seances.length === 0) {
      return NextResponse.json({ error: "Programme vide" }, { status: 500 });
    }
    return NextResponse.json(parsed);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
