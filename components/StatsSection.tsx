"use client";
import { useEffect, useRef, useState } from "react";

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let start = 0;
          const step = Math.ceil(target / 60);
          const timer = setInterval(() => {
            start += step;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(start);
          }, 30);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="font-[family-name:var(--font-barlow)] font-black text-[clamp(2.5rem,6vw,4rem)] text-[#c9a84c] leading-none">
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
    <section className="bg-[#0f0d07] border-y border-[#c9a84c]/15">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-[#c9a84c]/15">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
            <Counter target={s.value} suffix={s.suffix} />
            <p className="section-label text-[0.65rem]">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
