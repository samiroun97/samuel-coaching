// Icône "ajouter" fournie par Samuel — un SVG statique plutôt qu'une animation Lottie
// jouée en direct (voir historique : instancier un lecteur Lottie par ligne dans une
// liste de plusieurs dizaines d'exercices était lent à charger et perceptible comme "pas
// visible" le temps du chargement). Le SVG a été généré une fois, hors ligne, à partir de
// l'animation d'origine (public/lottie/bouton-ajouter.json), figée sur sa frame la plus
// "posée" (croix, cercle blanc et fond doré tous à l'échelle 100% simultanément) puis
// exportée en un fichier statique — public/icons-rich/add-exercice.svg.
export function AddExerciceIcon({ size = 44 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/icons-rich/add-exercice.svg" alt="" width={size} height={size} style={{ width: size, height: size }}/>
  );
}
