import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
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
    const caller = await requireUser(req);
    if (!caller) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });

    const { profile, description } = await req.json();
    const { prenom, age, sexe, poids, taille, objectifs, experience, niveau_activite, seances_par_semaine, duree_seance, lieu_entrainement, blessures } = profile ?? {};
    if (!objectifs && !experience && !description?.trim()) return NextResponse.json({ error: "Profil client incomplet" }, { status: 400 });

    const nb = Math.min(Math.max(parseInt(seances_par_semaine) || 3, 2), 6);

    // Corrections apportées par le coach sur d'anciens programmes jugés inadaptés (via la
    // rubrique IA du CRM) — réinjectées comme contexte pour calibrer la génération actuelle.
    // Table interne (RLS coach-only), donc lue ici via la clé service_role qui contourne RLS.
    let correctionsBlock = "";
    try {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceKey) {
        const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
        // Cette route est appelée depuis le CRM (le coach génère un programme pour un client) :
        // caller est donc le coach lui-même, pas un client.
        const { data: coachRow } = await admin.from("coaches").select("id").eq("profile_id", caller.id).maybeSingle();
        const { data: corrections } = coachRow ? await admin
          .from("ai_corrections")
          .select("coach_comment")
          .eq("category", "programme")
          .eq("coach_id", coachRow.id)
          .order("created_at", { ascending: false })
          .limit(20) : { data: null };
        if (corrections?.length) {
          correctionsBlock = `\n\nRetours d'ajustement d'un coach humain expert sur des programmes précédents générés par CE MÊME système — prends-les en compte si pertinent pour ce client :\n${
            corrections.map((c, i) => `${i + 1}. ${c.coach_comment}`).join("\n")
          }`;
        }
      }
    } catch { /* best-effort : la génération continue sans le contexte de calibration */ }

    const prompt = `Tu es un coach sportif expert. Crée un programme d'entraînement hebdomadaire ciblé pour ce client.

Client : ${prenom ?? "?"}, ${sexe ?? "?"}, ${age ?? "?"} ans, ${poids ?? "?"} kg, ${taille ?? "?"} cm.
Objectif enregistré dans le profil : ${objectifs || "remise en forme générale"}
Expérience : ${experience || "non renseignée"}
Niveau d'activité : ${niveau_activite || "non renseigné"}
Séances par semaine : ${nb}
Durée par séance : ${duree_seance || "1h"}
Lieu d'entraînement : ${lieu_entrainement || "salle de sport"}
Blessures / limitations : ${blessures || "aucune"}
${description?.trim() ? `\nPrécisions du coach pour ce programme précis (prioritaires sur l'objectif enregistré si elles le complètent ou le contredisent) : ${description.trim()}\n` : ""}
Règles :
- Exactement ${nb} séances, adaptées à l'objectif (précisions du coach en priorité, sinon objectif enregistré) et au niveau du client.
- Respecte impérativement les blessures/limitations.
- Adapte les exercices au lieu (maison = poids du corps/haltères, salle = machines/barres, mixte = varie).
- exercices : 5 à 8 exercices par séance (3 à 5 pour cardio), chacun avec son propre type, ses séries, répétitions (ou durée pour un exercice au temps), charge/poids et temps de repos entre séries — adapte ces valeurs par exercice selon son rôle (ex. plus de séries/repos et charge plus lourde sur les mouvements composés, moins sur l'isolation ou le gainage).
- poids : cohérent avec le niveau et le poids de corps du client ; "poids du corps" si l'exercice ne nécessite pas de charge externe.
- note : conseil technique court par exercice si pertinent (posture, tempo, sécurité), sinon chaîne vide.
- description : 1 phrase — objectif de la séance et intensité.
- Tout en français.${correctionsBlock}`;

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
