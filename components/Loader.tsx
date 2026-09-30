"use client";
import { useEffect, useId, useRef } from "react";
import animationData from "@/lib/lottie/loader.json";

// Indicateurs de chargement de l'app.
// - Par défaut (« sport ») : médaillon doré avec un haltère blanc qui enchaîne les répétitions
//   et un arc blanc qui tourne autour — SVG + CSS pur, léger, lisible sur fond clair et sombre.
// - variant="ai" : l'animation Lottie « bulle IA » fournie par Samuel (bulle dorée, arcs et
//   étoiles blancs), réservée à la rubrique Alimentation (estimation de repas, photo, idées).
export function Loader({ size = 96, className = "", variant = "sport" }: { size?: number; className?: string; variant?: "sport" | "ai" }) {
  return variant === "ai" ? <AiLoader size={size} className={className}/> : <SportLoader size={size} className={className}/>;
}

function SportLoader({ size, className }: { size: number; className: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <div role="status" aria-label="Chargement" className={`shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        <defs>
          <radialGradient id={`g${id}`} cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#f0d98f"/>
            <stop offset="55%" stopColor="#d4b35a"/>
            <stop offset="100%" stopColor="#b08a36"/>
          </radialGradient>
        </defs>
        {/* halo qui respire au rythme des répétitions */}
        <circle cx="50" cy="50" r="44" fill="#c9a84c" className="loader-sport-halo"/>
        <circle cx="50" cy="50" r="36" fill={`url(#g${id})`}/>
        <circle cx="50" cy="50" r="36" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="1"/>
        {/* arc blanc qui tourne dans le médaillon */}
        <circle cx="50" cy="50" r="29" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"
          strokeDasharray="46 136" className="loader-sport-arc"/>
        {/* haltère : monte et redescend comme une répétition */}
        <g className="loader-sport-lift" fill="#fff">
          <rect x="35" y="48.4" width="30" height="3.2" rx="1.6"/>
          <rect x="30.5" y="41" width="6" height="18" rx="2"/>
          <rect x="26" y="44.5" width="5" height="11" rx="1.8"/>
          <rect x="63.5" y="41" width="6" height="18" rx="2"/>
          <rect x="69" y="44.5" width="5" height="11" rx="1.8"/>
        </g>
      </svg>
    </div>
  );
}

function AiLoader({ size, className }: { size: number; className: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let anim: { destroy: () => void } | null = null;
    // Lecteur lottie-web SVG (avec effets : halos flous) chargé à la demande.
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
