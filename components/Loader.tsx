"use client";
import { useEffect, useRef } from "react";
import animationData from "@/lib/lottie/loader.json";

// Indicateur de chargement de l'app : l'animation Lottie fournie par Samuel (anneau doré et
// étoiles), fond noir et contour sombre retirés pour s'afficher proprement sur les thèmes
// clair comme sombre. Lecteur lottie-web SVG (avec effets : le halo flou du centre) chargé à la demande :
// jamais plus d'un ou deux chargements à l'écran, contrairement aux icônes de liste qui
// avaient dû repasser en SVG statique (cf. AddExerciceIcon.tsx).
export function Loader({ size = 64, className = "" }: { size?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let anim: { destroy: () => void } | null = null;
    import("lottie-web/build/player/lottie_svg").then(({ default: lottie }) => {
      if (cancelled || !ref.current) return;
      anim = lottie.loadAnimation({
        container: ref.current, renderer: "svg", loop: true, autoplay: true,
        // Copie par instance : lottie-web annote l'objet qu'on lui passe.
        animationData: JSON.parse(JSON.stringify(animationData)),
      });
    }).catch(() => { /* lecteur indisponible : zone vide plutôt qu'une erreur */ });
    return () => { cancelled = true; anim?.destroy(); };
  }, []);

  return <div ref={ref} role="status" aria-label="Chargement" className={`shrink-0 ${className}`} style={{ width: size, height: size }}/>;
}
