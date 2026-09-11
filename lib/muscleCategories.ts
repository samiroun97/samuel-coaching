import { type Muscle } from "react-body-highlighter";

// On filtre par muscle_cible (plus précis que partie_corps, ~19 valeurs) plutôt que par
// partie_corps (~10, trop large pour une silhouette détaillée) — voir supabase/exercices_catalogue_migration.sql.
// Correspondance avec les clés de react-body-highlighter (licence MIT, github.com/giavinh79/react-body-highlighter) :
// certains muscle_cible n'ont pas d'équivalent sur la silhouette (colonne vertébrale, élévateur de
// la scapula, grand dentelé, système cardiovasculaire) — ils restent accessibles via les chips/la recherche.
// Partagé entre ExerciceLibraryBrowser (CRM coach) et ExercicePicker/ExerciceDetailView
// (client) pour que les deux écrans classent les muscles de façon identique.
export const CIBLE_TO_LIB: Record<string, Muscle[]> = {
  "pectoraux": ["chest"],
  "grand dorsal": ["upper-back"],
  "lombaires": ["lower-back"],
  "trapèzes": ["trapezius"],
  "deltoïdes": ["front-deltoids", "back-deltoids"],
  "biceps": ["biceps"],
  "triceps": ["triceps"],
  "avant-bras": ["forearm"],
  "abdominaux": ["abs", "obliques"],
  "quadriceps": ["quadriceps"],
  "ischio-jambiers": ["hamstring"],
  "adducteurs": ["adductor"],
  "abducteurs": ["abductors"],
  "fessiers": ["gluteal"],
  "mollets": ["calves", "left-soleus", "right-soleus"],
};
export const LIB_TO_CIBLE: Record<string, string> = Object.fromEntries(
  Object.entries(CIBLE_TO_LIB).flatMap(([cible, libs]) => libs.map(l => [l, cible]))
);
// Vue (face/dos) à afficher pour la mini-silhouette de la fiche exercice — certains muscles
// existent dans les deux vues de la librairie, on choisit celle où ils sont le plus lisibles.
export const CIBLE_VIEW: Record<string, "anterior" | "posterior"> = {
  "pectoraux": "anterior", "grand dorsal": "posterior", "lombaires": "posterior",
  "trapèzes": "posterior", "deltoïdes": "anterior", "biceps": "anterior", "triceps": "posterior",
  "avant-bras": "anterior", "abdominaux": "anterior", "quadriceps": "anterior",
  "ischio-jambiers": "posterior", "adducteurs": "posterior", "abducteurs": "anterior",
  "fessiers": "posterior", "mollets": "posterior",
};
// Ordre d'affichage des chips — du plus gros groupe musculaire au plus spécifique.
export const CATEGORY_ORDER = [
  "pectoraux", "grand dorsal", "trapèzes", "lombaires", "deltoïdes", "biceps", "triceps", "avant-bras",
  "abdominaux", "quadriceps", "ischio-jambiers", "adducteurs", "abducteurs", "fessiers", "mollets",
];
// Catégories volontairement masquées de la liste de chips (trop marginales comme filtre) — les
// exercices concernés restent trouvables via la recherche, juste sans chip dédiée.
export const HIDDEN_CHIPS = new Set(["cou", "tibial antérieur"]);
