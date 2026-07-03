"use client";
import { useEffect, useRef, useState } from "react";
import ScrollReveal from "./ScrollReveal";

const gradientStyle = {
  fontFamily: "var(--font-bebas)",
  background: "linear-gradient(120deg, #f5f5f0 30%, #c9a84c 65%, #e8c76a 100%)",
  WebkitBackgroundClip: "text" as const,
  WebkitTextFillColor: "transparent" as const,
  backgroundClip: "text" as const,
};

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
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
    <div ref={ref} style={{ ...gradientStyle, fontSize: "clamp(3rem,7vw,5rem)", lineHeight: 1 }}>
      {count}{suffix}
    </div>
  );
}

const stats = [
  { value: 200, suffix: "+", label: "Clients Transformés" },
  { value: 8, suffix: " ans", label: "D'Expérience" },
  { value: 94, suffix: "%", label: "Taux de Réussite" },
  { value: 3, suffix: "", label: "Disciplines Maîtrisées" },
];

export default function StatsSection() {
  return (
    <section className="bg-[#0f0d07] border-y border-[#c9a84c]/10">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-[#c9a84c]/10">
        {stats.map((s, i) => (
          <ScrollReveal key={s.label} delay={i * 0.1} className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
            <Counter target={s.value} suffix={s.suffix} />
            <p className="section-label text-[0.6rem]">{s.label}</p>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
