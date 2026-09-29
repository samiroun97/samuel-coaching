"use client";
import { useEffect, useRef, useState } from "react";
import lightData from "@/lib/lottie/loader-light.json";
import darkData from "@/lib/lottie/loader-dark.json";

// Indicateur de chargement de l'app : l'animation Lottie « bulle IA » fournie par Samuel
// (bulle de verre, arcs qui tournent, étoiles), recolorée dans la palette de l'app (or,
// bronze, champagne ; ombre portée violette d'origine passée en or).
// Deux versions selon le thème (attribut data-theme de <html>, cf. lib/theme.ts) : le verre
// de la bulle est semi-transparent — ivoire, il donne un verre clair sur fond blanc mais un
// disque GRIS sur fond noir ; en thème sombre il est donc teinté or (or chaud sur noir).
// `tone` force une version (ex. "dark" sur une vignette photo assombrie en thème clair).
// Lecteur lottie-web SVG (avec effets : halos flous) chargé à la demande — jamais plus d'un
// ou deux chargements à l'écran, contrairement aux icônes de liste (cf. AddExerciceIcon.tsx).
type Tone = "light" | "dark";

function currentTheme(): Tone {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

export function Loader({ size = 96, className = "", tone }: { size?: number; className?: string; tone?: Tone }) {
  const ref = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<Tone>(currentTheme);
  const effective = tone ?? theme;

  // Suit la bascule clair/sombre en direct (ThemeToggle modifie data-theme sur <html>).
  useEffect(() => {
    if (tone) return;
    const obs = new MutationObserver(() => setTheme(currentTheme()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, [tone]);

  useEffect(() => {
    let cancelled = false;
    let anim: { destroy: () => void } | null = null;
    import("lottie-web/build/player/lottie_svg").then(({ default: lottie }) => {
      if (cancelled || !ref.current) return;
      anim = lottie.loadAnimation({
        container: ref.current, renderer: "svg", loop: true, autoplay: true,
        // Copie par instance : lottie-web annote l'objet qu'on lui passe.
        animationData: JSON.parse(JSON.stringify(effective === "light" ? lightData : darkData)),
      });
    }).catch(() => { /* lecteur indisponible : zone vide plutôt qu'une erreur */ });
    return () => { cancelled = true; anim?.destroy(); };
  }, [effective]);

  return <div ref={ref} role="status" aria-label="Chargement" className={`shrink-0 ${className}`} style={{ width: size, height: size }}/>;
}
