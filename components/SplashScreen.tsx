"use client";
import { useState, useEffect } from "react";

export default function SplashScreen() {
  const [progress, setProgress] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Ne bloquer la page qu'à la première visite de la session :
    // un visiteur qui navigue ou revient ne doit pas revoir le splash.
    if (sessionStorage.getItem("splash_seen")) { setHidden(true); return; }
    sessionStorage.setItem("splash_seen", "1");
    const interval = setInterval(() => {
      setProgress((p) => (p >= 100 ? 100 : p + 1.5));
    }, 24);
    return () => clearInterval(interval);
  }, []);

  // Petit temps de pause une fois la barre pleine avant de lancer le fondu,
  // pour laisser le tracé cardio "respirer" au lieu de disparaître d'un coup.
  useEffect(() => {
    if (progress < 100) return;
    const t = setTimeout(() => setFading(true), 400);
    return () => clearTimeout(t);
  }, [progress]);

  useEffect(() => {
    if (!fading) return;
    const t = setTimeout(() => setHidden(true), 700);
    return () => clearTimeout(t);
  }, [fading]);

  if (hidden) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col items-center justify-center"
      style={{ opacity: fading ? 0 : 1, transition: "opacity 0.7s ease" }}
    >
      <div className="text-center px-6">

        <p className="text-[#c9a84c] text-[0.65rem] tracking-[0.4em] uppercase mb-8"
          style={{ opacity: progress > 15 ? 1 : 0, transition: "opacity 0.6s ease" }}>
          FITNESS · TRANSFORMATION · EXCELLENCE
        </p>

        <div style={{ opacity: progress > 5 ? 1 : 0, transform: progress > 5 ? "translateY(0)" : "translateY(30px)", transition: "opacity 0.8s ease, transform 0.8s ease" }}>
          <div style={{ lineHeight: 1 }}>
            <span style={{ fontFamily: "var(--font-bebas)", fontSize: "clamp(3rem, 12vw, 8rem)", color: "white", letterSpacing: "0.1em" }}>
              SAMUEL
            </span>
            <span className="animate-heartbeat-pulse inline-block"
              style={{ fontFamily: "var(--font-bebas)", fontSize: "clamp(3rem, 12vw, 8rem)", color: "#c9a84c" }}>.</span>
            <div style={{ fontSize: "clamp(0.6rem, 2vw, 1rem)", letterSpacing: "0.5em", color: "#c9a84c", fontWeight: 200, marginTop: "0.5rem" }}>
              COACHING
            </div>
          </div>
        </div>

        {/* Tracé cardio : ligne de base fixe + segment lumineux qui balaye en boucle,
            comme un moniteur de fréquence cardiaque — clin d'œil sportif/dynamique. */}
        <div className="mt-8 w-full max-w-[260px] mx-auto"
          style={{ opacity: progress > 30 ? 1 : 0, transition: "opacity 0.6s ease" }}>
          <svg viewBox="0 0 260 40" className="w-full h-auto" fill="none">
            <path
              d="M0,20 H60 L68,20 L74,4 L82,36 L90,10 L96,20 H130 L138,20 L144,4 L152,36 L160,10 L166,20 H260"
              stroke="#c9a84c" strokeOpacity="0.18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            />
            <path
              d="M0,20 H60 L68,20 L74,4 L82,36 L90,10 L96,20 H130 L138,20 L144,4 L152,36 L160,10 L166,20 H260"
              stroke="#e2c97e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              pathLength={300} strokeDasharray="60 300" className="animate-heartbeat-sweep"
            />
          </svg>
        </div>

        <div className="mt-6 w-56 mx-auto">
          <div className="h-px bg-white/10 relative overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-[#c9a84c]"
              style={{ width: `${progress}%`, transition: "width 0.05s linear" }}
            />
          </div>
          <p className="text-white/30 text-[0.55rem] tracking-[0.35em] uppercase mt-3 text-center"
            style={{ opacity: progress > 20 ? 1 : 0, transition: "opacity 0.4s ease" }}>
            Chargement
          </p>
        </div>

      </div>
    </div>
  );
}
