import { supabase } from "@/lib/supabase";

// Catalogue de référence (1324 exercices) : nom, groupe musculaire cible, équipement,
// partie du corps. Métadonnées reprises d'ExerciseDB v1 en licence MIT (voir NOTICE dans
// supabase/exercices_catalogue_migration.sql) — pas d'image/vidéo, juste du texte.
export type CatalogueEntry = {
  id: string;
  nom: string;
  partie_corps: string | null;
  equipement: string | null;
  muscle_cible: string | null;
  muscles_secondaires: string[] | null;
  // Photo pour un sous-ensemble curé d'exercices (voir supabase/exercices_catalogue_images_migration.sql) —
  // hébergée et servie directement par wger.de (jamais copiée ici), licence CC-BY-SA par image,
  // attribution obligatoire : image_license_author + image_license doivent rester affichés avec la photo.
  image_url: string | null;
  image_license: string | null;
  image_license_author: string | null;
};

let cache: CatalogueEntry[] | null = null;

// Chargé une seule fois par session coach (≈130 Ko) puis filtré côté client — plus simple
// et plus réactif qu'une requête réseau à chaque frappe pour une liste de cette taille.
export async function loadCatalogue(): Promise<CatalogueEntry[]> {
  if (cache) return cache;
  const { data } = await supabase.from("exercices_catalogue")
    .select("id,nom,partie_corps,equipement,muscle_cible,muscles_secondaires,image_url,image_license,image_license_author")
    .order("nom", { ascending: true });
  cache = (data ?? []) as CatalogueEntry[];
  return cache;
}

export function findCatalogueEntry(catalogue: CatalogueEntry[], nom: string): CatalogueEntry | undefined {
  const needle = nom.trim().toLowerCase();
  return catalogue.find(e => e.nom.toLowerCase() === needle);
}
