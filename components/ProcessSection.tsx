"use client";
import ScrollReveal from "./ScrollReveal";

const steps = [
  {
    num: "01",
    title: "CONSULTATION GRATUITE",
    text: "On se parle 30 minutes pour comprendre qui tu es, où tu en es, et où tu veux aller. Pas de vente, juste une vraie conversation pour évaluer si on est fait pour travailler ensemble.",
  },
  {
    num: "02",
    title: "BILAN PERSONNALISÉ",
    text: "Analyse complète de ton profil — physique, nutritionnel, mental, environnemental. Je construis une carte précise de ta situation pour définir ta feuille de route.",
  },
  {
    num: "03",
    title: "PROGRAMME SUR MESURE",
    text: "Ton programme est créé de A à Z pour toi. Entraînements, nutrition, mental, habitudes — tout est calibré pour tes objectifs, ton emploi du temps et ta vie réelle.",
  },
  {
    num: "04",
    title: "TRANSFORMATION & SUIVI",
    text: "Le vrai travail commence. Je suis là à chaque étape — pour célébrer les victoires, ajuster le tir, et te pousser quand tu voudras lâcher. C'est là que se joue tout.",
  },
];

export default function ProcessSection() {
  return (
    <section className="py-28 bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto px-6">

        <div className="text-center mb-16">
          <p className="section-label mb-4">Le Processus</p>
          <h2 style={{ fontFamily: "var(--font-bebas)" }} className="text-[clamp(2.5rem,6vw,5rem)] uppercase leading-none">
            <span className="text-white">COMMENT ÇA<br /></span>
            <span style={{ color: "#c9a84c" }}>MARCHE</span>
          </h2>
        </div>

        <div className="flex flex-col">
          {steps.map((s, i) => (
            <ScrollReveal key={s.num} delay={i * 0.1} className="flex gap-8 group">
              {/* Timeline */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-14 h-14 rounded-full border-2 border-[#c9a84c] flex items-center justify-center bg-[#0a0a0a] z-10 group-hover:bg-[#c9a84c] transition-colors duration-300">
                  <span style={{ fontFamily: "var(--font-bebas)" }} className="text-lg text-[#c9a84c] group-hover:text-black transition-colors duration-300">{s.num}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className="w-px bg-[#c9a84c]/25 flex-1" />
                )}
              </div>

              {/* Content */}
              <div className="pb-12 mt-3">
                <h3
                  style={{ fontFamily: "var(--font-bebas)" }}
                  className="text-2xl tracking-wider text-white group-hover:text-[#c9a84c] transition-colors duration-300 mb-3"
                >
                  {s.title}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed group-hover:text-[#c9a84c]/70 transition-colors duration-300">{s.text}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  );
}
