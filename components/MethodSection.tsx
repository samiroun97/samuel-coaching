import ScrollReveal from "./ScrollReveal";
import Title from "./Title";

const pillars = [
  {
    num: "01",
    tag: "Performance",
    title: "CORPS",
    text: "Des programmes d'entraînement 100% sur mesure, conçus pour maximiser tes résultats en fonction de ton niveau, tes objectifs et ton mode de vie. Chaque séance a un but précis.",
    detail: ["Analyse morphologique complète", "Programme progressif sur mesure", "Techniques d'intensité avancées", "Suivi hebdomadaire des charges"],
  },
  {
    num: "02",
    tag: "Mindset",
    title: "MENTAL",
    text: "Le corps suit toujours le mental. Ensemble, on reprogramme tes croyances limitantes et on construit la discipline d'acier qui fait la différence entre ceux qui abandonnent et ceux qui transforment.",
    detail: ["Psychologie de la performance", "Gestion du stress et de la pression", "Construction de rituels gagnants", "Mindset d'athlète d'élite"],
  },
  {
    num: "03",
    tag: "Habitudes",
    title: "LIFESTYLE",
    text: "Nutrition adaptée, récupération optimisée, habitudes de vie repensées. Un mode de vie premium qui te permet de performer au quotidien, durablement.",
    detail: ["Plan nutritionnel personnalisé", "Protocoles de récupération", "Optimisation du sommeil", "Habitudes de vie hautes performances"],
  },
];

export default function MethodSection() {
  return (
    <section id="methode" className="py-32 bg-[#0a0a0a] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <ScrollReveal className="text-center mb-20">
          <p className="section-label mb-4">Ma Méthode</p>
          <Title className="text-[clamp(3rem,8vw,6rem)]">UNE APPROCHE HOLISTIQUE</Title>
          <p className="text-white/40 text-sm mt-6 max-w-lg mx-auto leading-relaxed">
            Trois piliers indissociables pour une transformation durable. Corps, mental et style de vie — tout est connecté.
          </p>
        </ScrollReveal>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-0 border border-white/5">
          {pillars.map((p, i) => (
            <ScrollReveal key={p.num} delay={i * 0.15} className="group relative border-r border-white/5 last:border-r-0 p-10 overflow-hidden hover:bg-white/[0.02] transition-colors duration-500">

              {/* Big background number */}
              <span
                style={{ fontFamily: "var(--font-bebas)" }}
                className="absolute -top-4 -right-2 text-[8rem] leading-none text-white/[0.03] select-none pointer-events-none group-hover:text-white/[0.05] transition-colors duration-500"
              >
                {p.num}
              </span>

              {/* Gold top border reveal */}
              <div className="absolute top-0 left-0 w-0 h-px bg-gradient-to-r from-[#c9a84c] to-[#e8c76a] group-hover:w-full transition-all duration-700" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <span style={{ fontFamily: "var(--font-bebas)" }} className="text-5xl text-[#c9a84c]/20 leading-none group-hover:text-[#c9a84c]/40 transition-colors duration-500">
                    {p.num}
                  </span>
                  <span className="text-[0.6rem] tracking-[0.25em] uppercase border border-[#c9a84c]/30 text-[#c9a84c]/60 px-3 py-1">
                    {p.tag}
                  </span>
                </div>

                <h3
                  style={{
                    fontFamily: "var(--font-bebas)",
                    background: "linear-gradient(120deg, #f5f5f0 30%, #c9a84c 65%, #e8c76a 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                  className="text-5xl mb-4 tracking-wider"
                >
                  {p.title}
                </h3>

                <p className="text-white/50 text-sm leading-relaxed mb-8">{p.text}</p>

                <ul className="flex flex-col gap-2.5">
                  {p.detail.map((d) => (
                    <li key={d} className="flex items-start gap-3 text-xs text-white/35 group-hover:text-white/50 transition-colors duration-300">
                      <span className="text-[#c9a84c] mt-0.5 flex-shrink-0 text-[0.5rem]">◆</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Bottom image band */}
        <ScrollReveal delay={0.3} className="mt-1 relative h-64 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/photos/samuel-coaching.jpg')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/60 to-[#0a0a0a]" />
          <div className="relative z-10 h-full flex items-center justify-center">
            <p
              style={{ fontFamily: "var(--font-bebas)", fontSize: "clamp(1.5rem, 4vw, 2.5rem)" }}
              className="tracking-[0.3em] text-white/20 uppercase"
            >
              LA PERFORMANCE, C&apos;EST MAINTENANT
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
