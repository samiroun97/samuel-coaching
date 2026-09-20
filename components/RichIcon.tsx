// Icônes illustrées (dégradé or/anthracite, style "Charcoal Gold") réservées aux emplacements
// déjà accentués en doré et de taille généreuse — contrairement aux icônes Solar, leurs couleurs
// sont fixes (pas de currentColor), donc inadaptées aux endroits avec état actif/thème dynamique.
// Servies en WebP 200x200 (converties depuis les PNG/SVG sources d'origine, jamais affichées
// au-delà de 84px à l'écran) plutôt que les fichiers bruts — jusqu'à 500 Ko pièce pour un
// rendu final de quelques dizaines de pixels, désormais quelques Ko chacune.
const RICH_ICON_SRC = {
  scale: "/icons-rich/scale.webp",
  clipboardCheck: "/icons-rich/clipboard-check.webp",
  library: "/icons-rich/library.webp",
  lightbulb: "/icons-rich/lightbulb.webp",
  mealPetitDejeuner: "/icons-rich/petit-dejeuner.webp",
  mealDejeuner: "/icons-rich/dejeuner.webp",
  mealDiner: "/icons-rich/diner.webp",
  mealCollation: "/icons-rich/collation.webp",
  burn: "/icons-rich/burn.webp",
  targetGoal: "/icons-rich/target-goal.webp",
  waterBottle: "/icons-rich/water-bottle.webp",
  droplet: "/icons-rich/droplet.webp",
  step: "/icons-rich/step.webp",
  notebookPen: "/icons-rich/notebook.webp",
  chrono: "/icons-rich/chrono.webp",
  // Monogramme de marque — badge autonome (fond sombre déjà intégré au fichier, pas un
  // simple trait transparent), à réserver aux moments hero (voir public/icons/logo-source.svg
  // pour l'original, jamais utilisé nulle part avant cette passe).
  monogram: "/icons-rich/monogram.webp",
  // Badge autonome (même principe que monogram) — icône de téléchargement fournie par le
  // client pour tous les boutons de téléchargement de l'app (ex. export PDF programme).
  download: "/icons-rich/download.webp",
} as const;

export type RichIconName = keyof typeof RICH_ICON_SRC;

export function RichIcon({ name, size = 24, className }: { name: RichIconName; size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={RICH_ICON_SRC[name]} alt="" width={size} height={size} className={`shrink-0 object-contain ${className ?? ""}`} style={{ width: size, height: size }}/>
  );
}
