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
  // Sablier fourni par le client — en-tête "clients qui attendent une action" du dashboard coach.
  hourglass: "/icons-rich/sablier.webp",
  // Bulles de discussion fournies par le client, recolorées avec l'or et le noir relevés sur l'icône Clients — Inbox et « Messages en attente ».
  messages: "/icons-rich/message-v2.webp",
  // Calendrier coché fourni par le client — carte "Derniers check-ins" du dashboard coach.
  checkin: "/icons-rich/checkin.webp",
  // Équipe médaillée sous 3 étoiles, fournie par le client — en-tête de la page Clients du CRM.
  clients: "/icons-rich/clients.webp",
  // Tableau de présentation 3D (graphiques or) fourni par le client — en-tête Business.
  business: "/icons-rich/business-v4.webp",
  // Étoile dorée entre deux lauriers, fournie par le client — en-tête Abonnement (CRM et espace client).
  abonnement: "/icons-rich/abonnement.webp",
  // Fournies par le client — cartes de résumé de CRM > Programmes.
  bloc: "/icons-rich/bloc.webp",               // "Bloc en cours" (montre, haltères, gourde, pommes)
  nextSession: "/icons-rich/prochaine-seance.webp", // "Prochaine séance" (medecine balls 5/10 kg)
  // Badge de marque BURN-B (kettlebell flamme or dans un rond noir, ex-monogramme « S ») — badge autonome (fond sombre intégré, pas un
  // simple trait transparent), à réserver aux moments hero (voir public/icons/logo-source.svg
  // pour l'original, jamais utilisé nulle part avant cette passe).
  monogram: "/icons-rich/monogram.webp",
  // Badge autonome (même principe que monogram) — icône de téléchargement fournie par le
  // client pour tous les boutons de téléchargement de l'app (ex. export PDF programme).
  download: "/icons-rich/download.webp",
  // Menu de l'espace client uniquement (le reste de l'interface garde des icônes fines) :
  // boutons ronds dorés en relief, symbole blanc — actif en couleur, sinon estompé.
  navHome: "/icons-rich/nav/home.webp",
  navNutrition: "/icons-rich/nav/nutrition.webp",
  navActivity: "/icons-rich/nav/activity.webp",
  navProgress: "/icons-rich/nav/progress.webp",
  navAccount: "/icons-rich/nav/account.webp",
} as const;

export type RichIconName = keyof typeof RICH_ICON_SRC;

export function RichIcon({ name, size = 24, className }: { name: RichIconName; size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={RICH_ICON_SRC[name]} alt="" width={size} height={size} className={`shrink-0 object-contain ${className ?? ""}`} style={{ width: size, height: size }}/>
  );
}
