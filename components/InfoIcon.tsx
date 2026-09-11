// Icône "information" fournie par Samuel — même traitement que AddExerciceIcon : un SVG
// statique généré une fois hors ligne à partir de l'animation d'origine
// (public/lottie/bouton-information.json), figée sur sa frame la plus "posée" (tout est
// dessiné, aucune animation de sortie), plutôt qu'un lecteur Lottie en direct par ligne
// de liste — voir components/AddExerciceIcon.tsx pour le détail du pourquoi.
export function InfoIcon({ size = 44 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/icons-rich/info-exercice.svg" alt="" width={size} height={size} style={{ width: size, height: size }}/>
  );
}
