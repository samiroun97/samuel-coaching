// Icônes illustrées (dégradé or/anthracite, style "Charcoal Gold") réservées aux emplacements
// déjà accentués en doré et de taille généreuse — contrairement aux icônes Solar, leurs couleurs
// sont fixes (pas de currentColor), donc inadaptées aux endroits avec état actif/thème dynamique.
const RICH_ICON_SRC = {
  scale: "/icons-rich/scale.png",
  clipboardCheck: "/icons-rich/clipboard-check.png",
  footprints: "/icons-rich/footprints.svg",
  library: "/icons-rich/library.png",
  lightbulb: "/icons-rich/lightbulb.png",
  mealPetitDejeuner: "/icons-rich/petit-dejeuner.png",
  mealDejeuner: "/icons-rich/dejeuner.png",
  mealDiner: "/icons-rich/diner.png",
  mealCollation: "/icons-rich/collation.png",
  burn: "/icons-rich/burn.png",
  targetGoal: "/icons-rich/target-goal.png",
  waterBottle: "/icons-rich/water-bottle.png",
  droplet: "/icons-rich/droplet.png",
  step: "/icons-rich/step.png",
} as const;

export type RichIconName = keyof typeof RICH_ICON_SRC;

export function RichIcon({ name, size = 24, className }: { name: RichIconName; size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={RICH_ICON_SRC[name]} alt="" width={size} height={size} className={`shrink-0 object-contain ${className ?? ""}`} style={{ width: size, height: size }}/>
  );
}
