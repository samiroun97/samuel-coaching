import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { requireUser } from "@/lib/apiAuth";

const BUCKET = "nutrition-temp";
const MAX_DIM = 900;

// Redimensionne côté serveur une photo de repas uploadée brute — sharp décode en flux
// (jamais la pleine résolution en mémoire), contrairement au pipeline client (canvas/
// createImageBitmap) qui pouvait faire planter l'onglet sur les photos très haute résolution
// des appareils Android récents (image brute décodée en RAM avant tout redimensionnement,
// suffisant pour épuiser la mémoire allouée à un onglet mobile). Le fichier brut est uploadé
// directement vers Supabase Storage par le client (hors limite de 4.5 Mo des routes Vercel),
// puis supprimé ici une fois le redimensionnement fait — il n'a aucune utilité au-delà.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { path }: { path?: string } = await req.json();
    if (!path || !path.startsWith(`${user.id}/`)) return NextResponse.json({ error: "path invalide" }, { status: 400 });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY manquante côté serveur" }, { status: 500 });
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

    const { data: file, error: dlError } = await admin.storage.from(BUCKET).download(path);
    if (dlError || !file) return NextResponse.json({ error: "Téléchargement impossible." }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const resized = await sharp(buffer, { limitInputPixels: 268402689 }) // ~16384x16384, écarte les fichiers aberrants avant décodage complet
      .rotate() // applique l'orientation EXIF puis la retire — sans ça une photo prise en portrait ressort parfois pivotée
      .resize({ width: MAX_DIM, height: MAX_DIM, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 68 })
      .toBuffer();

    // Best-effort : le fichier temporaire n'est utile qu'à cette requête, mais un échec de
    // suppression ne doit jamais faire échouer la réponse (la photo réduite est déjà prête).
    admin.storage.from(BUCKET).remove([path]).catch(() => {});

    return NextResponse.json({ image: `data:image/jpeg;base64,${resized.toString("base64")}` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
