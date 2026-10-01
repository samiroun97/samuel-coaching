"use client";
import { useEffect, useId, useRef, useState } from "react";
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

// Écran de chargement plein écran (chargement d'une page, vérification de la session…).
// Volontairement « cinéma » et toujours sur fond noir, quel que soit le thème : nom en très
// grand qui monte lettre par lettre avec un reflet doré qui passe, ligne de battement de cœur
// tracée sur toute la largeur, traits de vitesse en fond et compteur en %.
// Plusieurs écrans s'enchaînent souvent (session puis page) : l'heure de départ est gardée au
// niveau du module pour que l'intro ne rejoue pas et que le compteur continue au lieu de
// repartir de 0.
const SPLASH_LINES = ["Échauffement", "Chargement des haltères", "Mise en place de la séance", "Dernière répétition"];
let splashStart = 0;
let splashLastSeen = 0;

export function SplashScreen() {
  const [intro, setIntro] = useState(true);
  const [pct, setPct] = useState(0);
  const [line, setLine] = useState(0);

  useEffect(() => {
    const now = Date.now();
    const continuing = now - splashLastSeen < 1500;
    if (!continuing) splashStart = now;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dépend d'un état module (enchaînement d'écrans)
    setIntro(!continuing);
    const tick = () => {
      splashLastSeen = Date.now();
      const t = (Date.now() - splashStart) / 1000;
      setPct(Math.min(99, Math.round(100 * (1 - Math.exp(-t / 1.4)))));
      setLine(Math.floor(t / 1.6) % SPLASH_LINES.length);
    };
    tick();
    const id = setInterval(tick, 60);
    return () => { clearInterval(id); splashLastSeen = Date.now(); };
  }, []);

  const word = (text: string, offset: number, gold: boolean) => (
    <span className="flex justify-center">
      {text.split("").map((ch, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.04em]">
          <span className={`inline-block ${intro ? "splash-rise" : ""} ${gold ? "splash-gold" : "text-white"}`}
            style={intro ? { animationDelay: `${(offset + i) * 55}ms` } : undefined}>{ch}</span>
        </span>
      ))}
    </span>
  );

  return (
    <div role="status" aria-label="Chargement" className="fixed inset-0 z-[100] bg-[#060606] overflow-hidden flex flex-col items-center justify-center select-none">
      {/* Lueur + vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(201,168,76,0.22), transparent 60%), radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.85))" }}/>
      {/* Traits de vitesse */}
      <div className="absolute inset-[-20%] -rotate-12 pointer-events-none">
        {[12, 24, 37, 51, 63, 76, 88].map((top, i) => (
          <span key={top} className="splash-streak absolute left-0 h-px"
            style={{ top: `${top}%`, width: `${28 + (i % 3) * 14}vw`, animationDelay: `${i * 0.37}s`, animationDuration: `${1.5 + (i % 4) * 0.35}s`, opacity: 0.18 + (i % 3) * 0.12 }}/>
        ))}
      </div>

      <div className={`relative w-full flex flex-col items-center ${intro ? "splash-zoom" : ""}`}>
        <h1 style={{ fontFamily: "var(--font-bebas)", fontSize: "clamp(3.6rem, min(17vw, 19vh), 12rem)" }}
          className="leading-[0.86] tracking-[0.06em] text-center">
          {word("SAMUEL", 0, false)}
          {word("COACHING", 6, true)}
        </h1>

        {/* Battement de cœur sur toute la largeur */}
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-[70px] md:h-[90px] mt-4 md:mt-6 overflow-visible" aria-hidden="true">
          <path d="M0 60 H430 L455 60 L470 38 L488 60 L510 60 L530 8 L555 112 L578 60 L610 60 L628 46 L646 60 H1200"
            fill="none" stroke="#c9a84c" strokeOpacity="0.15" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
          <path d="M0 60 H430 L455 60 L470 38 L488 60 L510 60 L530 8 L555 112 L578 60 L610 60 L628 46 L646 60 H1200"
            pathLength={100} fill="none" stroke="#f0d98f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            vectorEffect="non-scaling-stroke" className="splash-ecg"/>
        </svg>

        <div className="mt-6 md:mt-8 flex flex-col items-center gap-2">
          <span style={{ fontFamily: "var(--font-bebas)" }} className="text-[2.6rem] md:text-[3.2rem] leading-none tabular-nums text-white">
            {pct}<span className="text-[#c9a84c]">%</span>
          </span>
          <span className="text-[0.68rem] md:text-[0.72rem] tracking-[0.35em] uppercase text-white/55">{SPLASH_LINES[line]}</span>
        </div>
      </div>
    </div>
  );
}
