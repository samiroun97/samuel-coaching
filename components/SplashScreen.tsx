"use client";
import { useState, useEffect } from "react";

export default function SplashScreen() {
  const [progress, setProgress] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setFading(true);
          setTimeout(() => setHidden(true), 700);
          return 100;
        }
        return p + 1.8;
      });
    }, 35);
    return () => clearInterval(interval);
  }, []);

  if (hidden) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col items-center justify-center"
      style={{ opacity: fading ? 0 : 1, transition: "opacity 0.7s ease" }}
    >
      <div className="text-center px-6">
        <p
          className="section-label mb-10"
          style={{ opacity: progress > 20 ? 1 : 0, transition: "opacity 0.6s ease" }}
        >
          FITNESS · TRANSFORMATION · EXCELLENCE
        </p>

        <h1
          style={{
            fontFamily: "var(--font-bebas)",
            background: "linear-gradient(120deg, #f5f5f0 30%, #c9a84c 65%, #e8c76a 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontSize: "clamp(5rem, 18vw, 12rem)",
            lineHeight: 1,
            opacity: progress > 10 ? 1 : 0,
            transform: progress > 10 ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.8s ease, transform 0.8s ease",
          }}
        >
          SAMUEL.
        </h1>

        <div className="mt-14 w-56 mx-auto">
          <div className="h-px bg-white/10 relative overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#c9a84c] to-[#e8c76a]"
              style={{ width: `${progress}%`, transition: "width 0.05s linear" }}
            />
          </div>
          <p
            className="text-white/20 text-[0.6rem] tracking-[0.3em] uppercase mt-3 text-center"
            style={{ opacity: progress > 30 ? 1 : 0, transition: "opacity 0.4s ease" }}
          >
            Chargement
          </p>
        </div>
      </div>
    </div>
  );
}
