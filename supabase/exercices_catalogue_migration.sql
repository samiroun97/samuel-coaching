-- ══════════════════════════════════════════════════════════════
-- Migration : catalogue d'exercices (recherche/autocomplete côté coach et client)
-- Métadonnées (nom, groupe musculaire, équipement) reprises de la base
-- ExerciseDB v1, distribuée en licence MIT par hasaneyldrm/exercises-dataset
-- (https://github.com/hasaneyldrm/exercises-dataset) — texte uniquement,
-- aucune image/vidéo importée (leur licence média est non résolue, voir
-- leur NOTICE.md ; on ne redistribue donc pas ce qu'ils ne peuvent
-- eux-mêmes pas garantir).
-- Noms et métadonnées traduits en français à l'import (le dataset source est
-- en anglais) — traduction originale, pas reprise d'un tiers.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.exercices_catalogue (
  id                    text PRIMARY KEY,  -- id source ExerciseDB, ex. "0001"
  nom                   text NOT NULL,     -- en français
  partie_corps          text,              -- en français : "pectoraux", "dos", "cuisses"...
  equipement            text,              -- en français : "barre", "poids du corps"...
  muscle_cible          text,
  muscles_secondaires   text[]
);

ALTER TABLE public.exercices_catalogue ENABLE ROW LEVEL SECURITY;

-- Catalogue de référence statique : lecture ouverte à tout utilisateur connecté,
-- aucune policy d'écriture (seul un import via la clé de service peut le modifier).
DROP POLICY IF EXISTS "authenticated_read_catalogue" ON public.exercices_catalogue;
CREATE POLICY "authenticated_read_catalogue" ON public.exercices_catalogue
  FOR SELECT
  USING (auth.role() = 'authenticated');
