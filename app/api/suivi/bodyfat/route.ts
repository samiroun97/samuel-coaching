import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/apiAuth";

export async function POST(req: NextRequest) {
  try {
    const caller = await requireUser(req);
    if (!caller) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });

    const { photos, profile } = await req.json();
    const { sexe, poids, taille, age, objectifs, experience, niveau_activite, seances_par_semaine } = profile ?? {};

    const profileStr = profile
      ? `Profil : ${sexe ?? "?"}, ${age ?? "?"}ans, ${poids ?? "?"}kg, ${taille ?? "?"}cm, niveau ${niveau_activite ?? "?"}/${experience ?? "?"}, ${seances_par_semaine ?? "?"} séances/semaine.
Objectif déclaré par le client : ${objectifs || "non renseigné"}`
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

    // Corrections apportées par le coach sur d'anciennes estimations jugées fausses —
    // réinjectées comme contexte pour calibrer les prochaines estimations. Table interne
    // (RLS coach-only), donc lue ici via la clé service_role qui contourne RLS : ce n'est
    // pas un vrai réentraînement du modèle, mais un ajustement du prompt par l'usage réel.
    let correctionsBlock = "";
    try {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceKey) {
        const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
        const { data: link } = await admin.from("coach_clients").select("coach_id").eq("client_id", caller.id).limit(1).maybeSingle();
        const { data: corrections } = link ? await admin
          .from("bodyfat_ai_corrections")
          .select("original_estimate,corrected_estimate,coach_comment")
          .eq("coach_id", link.coach_id)
          .order("created_at", { ascending: false })
          .limit(20) : { data: null };
        if (corrections?.length) {
          correctionsBlock = `\n\nRetours d'ajustement d'un coach humain expert sur des estimations précédentes de CE MÊME système — prends-les en compte pour calibrer ton estimation actuelle si les cas se ressemblent :\n${
            corrections.map((c, i) =>
              `${i + 1}. Estimation IA initiale : ${c.original_estimate ?? "?"}%${c.corrected_estimate !== null && c.corrected_estimate !== undefined ? `, valeur corrigée par le coach : ${c.corrected_estimate}%` : ""}. Retour du coach : ${c.coach_comment}`
            ).join("\n")
          }`;
        }
      }
    } catch { /* best-effort : l'estimation continue sans le contexte de calibration */ }

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1300,
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

Avant de conclure, raisonne brièvement à partir de marqueurs visuels concrets ET SPÉCIFIQUES à CES photos précises (visibilité/nombre de stries abdominales, vascularité bras/abdos, séparation des muscles, graisse au niveau des hanches/bas du dos/taille, rondeur du visage) — n'utilise jamais une valeur "ronde" ou "typique" par défaut si les photos montrent un niveau de détail différent. Ce raisonnement reste interne : ne l'inclus pas dans le JSON final.

Chaque check-in est indépendant : si des corrections précédentes du coach (ci-dessous) concernent CE client, elles doivent primer sur tes repères visuels génériques — mais elles ne justifient jamais de recopier mécaniquement le même chiffre qu'un check-in antérieur. Donne le pourcentage qui correspond à ce que tu vois MAINTENANT sur ces photos, avec une décimale précise (pas seulement des multiples de 0.5).

Retourne UNIQUEMENT ce JSON valide, sans texte avant ni après :
{
  "body_fat_percentage": 18.5,
  "note": "Estimation basée sur la répartition adipeuse visible (max 80 car.)",
  "points_forts": "3-4 phrases détaillées sur les points forts visibles (muscles, proportions, symétrie, posture, etc.), avec des exemples concrets observés sur les photos",
  "points_faibles": "3-4 phrases détaillées sur les zones à améliorer (stockage graisseux, déséquilibres, zones à travailler en priorité, etc.), avec des exemples concrets observés sur les photos",
  "conseils": "5-6 phrases de conseils pratiques et personnalisés, construits explicitement à partir de l'objectif déclaré par le client ci-dessus (rappelle en une phrase le lien avec cet objectif, puis détaille : priorités d'entraînement, ajustements nutrition, et éventuellement récupération/habitudes). Si aucun objectif n'est renseigné, dis-le et donne des conseils génériques mais toujours détaillés."
}

Sois direct, bienveillant et concret — développe chaque point plutôt que de rester en surface, surtout les conseils qui doivent être construits sur mesure pour cet objectif précis, pas des généralités interchangeables d'un client à l'autre. Chaque champ texte max 700 caractères (jusqu'à 900 pour "conseils").${correctionsBlock}`,
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
