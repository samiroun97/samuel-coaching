import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const SEANCE_TYPES = ["Haut du corps", "Bas du corps", "Full body", "Cardio", "Boxe", "Natation", "CrossFit", "Yoga", "Autre"];

export async function POST(req: NextRequest) {
  try {
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
- Adapte les exercices au lieu (maison = poids du corps/haltères, salle = machines/barres).
- type_seance doit être l'une de ces valeurs : ${SEANCE_TYPES.join(", ")}.
- exercices : un exercice par ligne, format "Nom de l'exercice séries×répétitions (conseil court optionnel)". 5 à 8 exercices par séance (3 à 5 pour cardio).
- description : 1 phrase — objectif de la séance et intensité.

Retourne UNIQUEMENT ce JSON valide, sans texte autour :
{"seances":[{"titre":"Séance 1 — Haut du corps","type_seance":"Haut du corps","description":"...","exercices":"Développé couché 4×8\\nTirage poulie 3×12"}]}`;

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: "Réponse IA non parseable" }, { status: 500 });

    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed.seances) || parsed.seances.length === 0) {
      return NextResponse.json({ error: "Programme vide" }, { status: 500 });
    }
    return NextResponse.json(parsed);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
