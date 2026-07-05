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
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
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
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
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
    <section className="bg-[#0f0d07] border-y border-[#c9a84c]/10 py-14">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-center gap-0">
        {stats.map((s, i) => (
          <ScrollReveal key={s.label} delay={i * 0.1} className="flex items-center gap-0">
            <div className="flex flex-col items-center gap-2 px-10">
              <Counter target={s.value} suffix={s.suffix} />
              <p className="text-[0.6rem] tracking-[0.2em] text-white/40 uppercase text-center">{s.label}</p>
            </div>
            {i < stats.length - 1 && (
              <div className="w-px h-14 bg-[#c9a84c]/20 flex-shrink-0" />
            )}
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
