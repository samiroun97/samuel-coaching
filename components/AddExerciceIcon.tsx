"use client";
import { Lottie } from "lottie-react";

// Icône "ajouter" fournie par Samuel (animation Lottie : rond doré + croix blanche qui se
// dessine). Dans une liste de dizaines d'exercices, la jouer en boucle serait bruyant
// visuellement et coûteux sur mobile — on la fige donc sur sa frame la plus "posée" (le
// pop d'entrée est terminé, le pop de sortie n'a pas commencé) pour qu'elle serve
// d'icône statique plutôt que d'animation. Frame choisie à partir des keyframes du
// fichier (public/lottie/bouton-ajouter.json) : croix et fond doré tiennent tous les deux
// à l'échelle 100% entre ~frame 20 et ~frame 27 — segment de chargement plutôt qu'un
// lottieRef.seek() après coup, pour ne dépendre d'aucun timing de callback (un seek
// imperatif qui arrive avant/après le montage réel laisse l'icône bloquée sur sa toute
// première frame, où la croix et le rond blanc sont encore invisibles — c'est ce qui
// rendait le bouton "pas visible").
const REST_FRAME: [number, number] = [22, 25];

export function AddExerciceIcon({ size = 44 }: { size?: number }) {
  return (
    <Lottie
      src="/lottie/bouton-ajouter.json"
      autoplay
      loop={false}
      segment={REST_FRAME}
      style={{ width: size, height: size, pointerEvents: "none" }}
    />
  );
}
