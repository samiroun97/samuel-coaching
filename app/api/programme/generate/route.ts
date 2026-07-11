import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireUser } from "@/lib/apiAuth";
import { EXERCICE_TYPES } from "@/lib/exercices";

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
          exercices: {
            type: "array",
            items: {
              type: "object",
              properties: {
                nom:         { type: "string" },
                type:        { type: "string", enum: EXERCICE_TYPES },
                series:      { type: "string", description: "Nombre de séries, ex: 4" },
                repetitions: { type: "string", description: "Répétitions par série, ex: 12, ou durée pour un exercice au temps, ex: 40 sec" },
                poids:       { type: "string", description: "Charge suggérée, ex: '20 kg', 'poids du corps', 'léger à modéré' — cohérente avec le niveau du client" },
                repos:       { type: "string", description: "Temps de repos entre les séries, ex: 90 sec" },
                note:        { type: "string", description: "Conseil technique court, chaîne vide si rien à ajouter" },
              },
              required: ["nom", "type", "series", "repetitions", "poids", "repos", "note"],
              additionalProperties: false,
            },
          },
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
- exercices : 5 à 8 exercices par séance (3 à 5 pour cardio), chacun avec son propre type, ses séries, répétitions (ou durée pour un exercice au temps), charge/poids et temps de repos entre séries — adapte ces valeurs par exercice selon son rôle (ex. plus de séries/repos et charge plus lourde sur les mouvements composés, moins sur l'isolation ou le gainage).
- poids : cohérent avec le niveau et le poids de corps du client ; "poids du corps" si l'exercice ne nécessite pas de charge externe.
- note : conseil technique court par exercice si pertinent (posture, tempo, sécurité), sinon chaîne vide.
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
