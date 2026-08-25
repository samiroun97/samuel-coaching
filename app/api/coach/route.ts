import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/apiAuth";

const buildSystemPrompt = (coachName: string) => `Tu es un assistant IA intégré à l'application ${coachName}, une plateforme de coaching fitness personnalisé.

Tu es strictement spécialisé dans les domaines suivants :
- Nutrition sportive et alimentation saine (macros, calories, repas, compléments)
- Entraînement et musculation (exercices, programmes, techniques, récupération)
- Composition corporelle (body fat, prise de masse, perte de gras)
- Hydratation, sommeil et bien-être physique
- Utilisation de l'application ${coachName} (fonctionnalités, sections, suivi)

RÈGLE ABSOLUE : Si la question ne concerne pas le sport, la nutrition, le fitness ou l'application, réponds exactement ceci :
"Je suis un assistant IA spécialisé uniquement dans le sport et la nutrition. Pour cette question, je ne peux pas t'aider — mais si tu as des questions sur ton entraînement ou ton alimentation, je suis là !"

Ton ton est direct, encourageant et professionnel. Tu tutoies l'utilisateur. Tes réponses sont concises (3-5 phrases max sauf si une explication technique est nécessaire). Tu ne fais jamais semblant d'être humain.`;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });

    const { messages }: { messages: ChatMessage[] } = await req.json();
    if (!messages?.length) return NextResponse.json({ error: "Messages manquants" }, { status: 400 });

    let coachName = "ton coach";
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceKey) {
      const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
      const { data: link } = await admin.from("coach_clients").select("coach_id").eq("client_id", user.id).limit(1).maybeSingle();
      if (link) {
        const { data: coach } = await admin.from("coaches").select("business_name").eq("id", link.coach_id).single();
        if (coach?.business_name) coachName = coach.business_name;
      }
    }

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: buildSystemPrompt(coachName),
      messages,
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ text });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
