"use client";
import { useEffect, useRef, useState } from "react";
import ScrollReveal from "./ScrollReveal";

const gradientStyle = {
  fontFamily: "var(--font-bebas)",
  color: "#c9a84c",
};

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const run = () => {
      if (started.current) return;
      started.current = true;
      if (target === 0) return;
      const duration = 1800;
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const el = ref.current;
    // Si l'élément est déjà visible au chargement, on lance tout de suite.
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) run();
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) run();
    }, { threshold: 0.3 });
    if (el) observer.observe(el);

    // Filet de sécurité : si rien ne s'est déclenché (observer bloqué,
    // navigateur capricieux), on affiche la valeur finale au bout de 2,5 s.
    const fallback = setTimeout(() => {
      if (!started.current) { started.current = true; setCount(target); }
    }, 2500);

    return () => { observer.disconnect(); clearTimeout(fallback); };
  }, [target]);

  return (
    <div ref={ref} style={{ ...gradientStyle, fontSize: "clamp(2rem,4vw,3rem)", lineHeight: 1 }}>
      {count}{suffix}
    </div>
  );
}

const stats = [
  { value: 15, suffix: " ANS", label: "De Pratique" },
  { value: 3, suffix: "", label: "Disciplines Maîtrisées" },
  { value: 100, suffix: "%", label: "Sur-Mesure" },
  { value: 0, suffix: "", label: "Méthode Miracle" },
];

export default function StatsSection() {
  return (
    <section className="bg-[#0f0d07] border-y border-[#c9a84c]/10 py-12 sm:py-14">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-4">
        {stats.map((s, i) => (
          <ScrollReveal key={s.label} delay={i * 0.1}
            className={`flex flex-col items-center gap-2 text-center ${i < stats.length - 1 ? "md:border-r border-[#c9a84c]/20" : ""}`}>
            <Counter target={s.value} suffix={s.suffix} />
            <p className="text-[0.62rem] tracking-[0.2em] text-white/40 uppercase text-center px-2">{s.label}</p>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
