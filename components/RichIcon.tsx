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
  // Bulles de discussion fournies par le client — carte "Messages en attente" du dashboard coach.
  messages: "/icons-rich/message.webp",
  // Calendrier coché fourni par le client — carte "Derniers check-ins" du dashboard coach.
  checkin: "/icons-rich/checkin.webp",
  // Équipe médaillée sous 3 étoiles, fournie par le client — en-tête de la page Clients du CRM.
  clients: "/icons-rich/clients.webp",
  // Fournies par le client — cartes de résumé de CRM > Programmes.
  bloc: "/icons-rich/bloc.webp",               // "Bloc en cours" (montre, haltères, gourde, pommes)
  nextSession: "/icons-rich/prochaine-seance.webp", // "Prochaine séance" (medecine balls 5/10 kg)
  // Monogramme de marque — badge autonome (fond sombre déjà intégré au fichier, pas un
  // simple trait transparent), à réserver aux moments hero (voir public/icons/logo-source.svg
  // pour l'original, jamais utilisé nulle part avant cette passe).
  monogram: "/icons-rich/monogram.webp",
  // Badge autonome (même principe que monogram) — icône de téléchargement fournie par le
  // client pour tous les boutons de téléchargement de l'app (ex. export PDF programme).
  download: "/icons-rich/download.webp",
  // Icônes d'interface 3D (packs IconScout « Dark Gold Basic UI » — Hariz Design — et voisins
  // du même auteur), recolorées aux couleurs de l'app : tuile or, symbole blanc (même langage
  // que les boutons dorés à texte blanc et la bulle de chargement). Réservées aux boutons-icônes
  // et champs (loupe, calendrier…) ; les petites flèches/croix restent des icônes fines.
  uiAdd: "/icons-rich/ui/add.webp",
  uiCheck: "/icons-rich/ui/check.webp",
  uiBell: "/icons-rich/ui/bell.webp",
  uiDownload: "/icons-rich/ui/download.webp",
  uiGraph: "/icons-rich/ui/graph.webp",
  uiCalendar: "/icons-rich/ui/calendar.webp",
  uiSearch: "/icons-rich/ui/search.webp",
  uiShare: "/icons-rich/ui/share.webp",
  uiMail: "/icons-rich/ui/mail.webp",
  uiDocument: "/icons-rich/ui/document.webp",
  // Créées sur le même modèle (pas d'équivalent téléchargé) : vraie tuile IconScout
  // reconstituée et recolorée or, symbole Lucide épais en blanc avec reflet et ombre portée.
  uiTrash: "/icons-rich/ui/trash.webp",
  uiEdit: "/icons-rich/ui/edit.webp",
  uiSettings: "/icons-rich/ui/settings.webp",
  uiUser: "/icons-rich/ui/user.webp",
  uiCamera: "/icons-rich/ui/camera.webp",
  uiLock: "/icons-rich/ui/lock.webp",
  uiMic: "/icons-rich/ui/mic.webp",
  uiImage: "/icons-rich/ui/image.webp",
  uiCopy: "/icons-rich/ui/copy.webp",
  uiStar: "/icons-rich/ui/star.webp",
  // Navigation (menus espace client et CRM), même fabrication : actif en couleur, sinon
  // estompé (grayscale + opacité, cf. app/dashboard/layout.tsx et app/crm/layout.tsx).
  navHome: "/icons-rich/ui/nav-home.webp",
  navNutrition: "/icons-rich/ui/nav-nutrition.webp",
  navActivity: "/icons-rich/ui/nav-activity.webp",
  navProgress: "/icons-rich/ui/nav-progress.webp",
  navAccount: "/icons-rich/ui/nav-account.webp",
  navDashboard: "/icons-rich/ui/nav-dashboard.webp",
  navClients: "/icons-rich/ui/nav-clients.webp",
  navPipeline: "/icons-rich/ui/nav-pipeline.webp",
  navProgrammes: "/icons-rich/ui/nav-programmes.webp",
  navInbox: "/icons-rich/ui/nav-inbox.webp",
  navBusiness: "/icons-rich/ui/nav-business.webp",
  navPlatform: "/icons-rich/ui/nav-platform.webp",
  navPreview: "/icons-rich/ui/nav-preview.webp",
} as const;

export type RichIconName = keyof typeof RICH_ICON_SRC;

export function RichIcon({ name, size = 24, className }: { name: RichIconName; size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={RICH_ICON_SRC[name]} alt="" width={size} height={size} className={`shrink-0 object-contain ${className ?? ""}`} style={{ width: size, height: size }}/>
  );
}
