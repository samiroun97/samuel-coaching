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
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setFading(true);
          setTimeout(() => setHidden(true), 500);
          return 100;
        }
        return p + 4;
      });
    }, 20);
    return () => clearInterval(interval);
  }, []);

  if (hidden) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col items-center justify-center"
      style={{ opacity: fading ? 0 : 1, transition: "opacity 0.7s ease" }}
    >
      <div className="text-center px-6">

        <p className="text-[#c9a84c] text-[0.65rem] tracking-[0.4em] uppercase mb-10"
          style={{ opacity: progress > 15 ? 1 : 0, transition: "opacity 0.6s ease" }}>
          FITNESS · TRANSFORMATION · EXCELLENCE
        </p>

        <div style={{ opacity: progress > 5 ? 1 : 0, transform: progress > 5 ? "translateY(0)" : "translateY(30px)", transition: "opacity 0.8s ease, transform 0.8s ease" }}>
          <div style={{ lineHeight: 1 }}>
            <span style={{ fontFamily: "var(--font-bebas)", fontSize: "clamp(3rem, 12vw, 8rem)", color: "white", letterSpacing: "0.1em" }}>
              SAMUEL
            </span>
            <span style={{ fontFamily: "var(--font-bebas)", fontSize: "clamp(3rem, 12vw, 8rem)", color: "#c9a84c" }}>.</span>
            <div style={{ fontSize: "clamp(0.6rem, 2vw, 1rem)", letterSpacing: "0.5em", color: "#c9a84c", fontWeight: 200, marginTop: "0.5rem" }}>
              COACHING
            </div>
          </div>
        </div>

        <div className="mt-14 w-56 mx-auto">
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
