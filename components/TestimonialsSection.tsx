"use client";
import { useState, useEffect, useCallback } from "react";

const testimonials = [
  {
    quote: "Samuel a changé ma vie. Pas juste mon corps — ma façon de penser, de travailler, de gérer le stress. Un vrai accompagnement 360°.",
    name: "Thomas M.",
    location: "Lyon · Programme Transform",
  },
  {
    quote: "J'avais essayé 5 coachs avant Samuel. Aucun n'avait son niveau de précision et de personnalisation. Les résultats parlent d'eux-mêmes.",
    name: "Léa P.",
    location: "Paris · Programme Elite",
  },
  {
    quote: "Le coaching mental de Samuel est ce qui m'a vraiment fait décoller. J'ai compris pourquoi j'échouais avant, et comment ne plus jamais échouer.",
    name: "Alexis B.",
    location: "Bordeaux · Programme Transform",
  },
  {
    quote: "Disponible, exigeant, bienveillant. Samuel sait exactement quand te pousser et quand t'encourager. Une méthode unique.",
    name: "Marie C.",
    location: "Marseille · Programme Starter",
  },
  {
    quote: "En tant que chef d'entreprise, j'avais besoin d'efficacité maximale. Samuel a optimisé chaque aspect de ma vie : corps, énergie, mental.",
    name: "Romain D.",
    location: "Nantes · Programme Elite",
  },
  {
    quote: "Ce n'est pas juste un coach fitness. Samuel est un architecte de vie. Il m'a aidé à construire des fondations solides pour tout le reste.",
    name: "Sofia K.",
    location: "Toulouse · Programme Transform",
  },
];

export default function TestimonialsSection() {
  const [active, setActive] = useState(0);

  const next = useCallback(() => setActive((a) => (a + 1) % testimonials.length), []);

  useEffect(() => {
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next]);

  return (
    <section className="py-28 bg-[#0f0d07] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="section-label mb-4">Témoignages</p>
          <h2 className="font-[family-name:var(--font-barlow)] font-black text-[clamp(2.5rem,6vw,5rem)] uppercase leading-none text-white">
            ILS L&apos;ONT <span className="text-[#c9a84c]">VÉCU</span>
          </h2>
        </div>

        <div className="relative">
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.slice(active, active + 3).concat(
              active + 3 > testimonials.length ? testimonials.slice(0, (active + 3) % testimonials.length) : []
            ).slice(0, 3).map((t, i) => (
              <div
                key={`${active}-${i}`}
                className="bg-[#111111] border border-white/5 p-8 flex flex-col gap-4"
              >
                <div className="text-[#c9a84c] text-sm tracking-widest">★★★★★</div>
                <p className="text-white/70 text-sm leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-auto border-t border-white/5 pt-4">
                  <p className="font-semibold text-white text-sm">{t.name}</p>
                  <p className="section-label text-[0.6rem] mt-1">{t.location}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-2 mt-10">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`transition-all duration-300 ${
                  i === active ? "w-8 h-1 bg-[#c9a84c]" : "w-2 h-1 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
