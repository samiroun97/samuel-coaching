import ScrollReveal from "./ScrollReveal";

const pillars = [
  {
    num: "01",
    tag: "Performance",
    title: "CORPS",
    text: "Des programmes d'entraînement 100% sur mesure, conçus pour maximiser tes résultats en fonction de ton niveau, tes objectifs et ton mode de vie. Chaque séance a un but précis.",
  },
  {
    num: "02",
    tag: "Mindset",
    title: "MENTAL",
    text: "Le corps suit toujours le mental. Ensemble, on reprogramme tes croyances limitantes et on construit la discipline d'acier qui fait la différence entre ceux qui abandonnent et ceux qui transforment.",
  },
  {
    num: "03",
    tag: "Habitudes",
    title: "LIFESTYLE",
    text: "Nutrition adaptée, récupération optimisée, habitudes de vie repensées. Un mode de vie premium qui te propulse vers ta meilleure version — durablement, sans frustration.",
  },
];

export default function MethodSection() {
  return (
    <section id="methode" className="py-32 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-[2fr_3fr] gap-16 items-start">

        {/* Left */}
        <ScrollReveal className="sticky top-32">
          <p className="section-label mb-4">Ma Méthode</p>
          <h2
            style={{ fontFamily: "var(--font-bebas)" }}
            className="text-[clamp(2rem,4.5vw,3.8rem)] leading-none uppercase mb-6"
          >
            <span className="text-white">UNE APPROCHE<br /></span>
            <span style={{ color: "#c9a84c" }}>HOLISTIQUE</span>
          </h2>
          <p className="text-white/40 text-sm leading-relaxed mb-10 max-w-xs">
            Trois piliers indissociables pour une transformation durable. Corps, mental et style de vie — tout est connecté.
          </p>

          <div className="relative overflow-hidden rounded-sm">
            <div
              className="h-96 bg-cover bg-top"
              style={{ backgroundImage: "url('/photos/methode.png')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/80 to-transparent" />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <p className="text-[0.55rem] tracking-[0.25em] text-[#c9a84c] uppercase border border-[#c9a84c] px-4 py-1.5 bg-[#0a0a0a]/60">
                La performance, c&apos;est maintenant
              </p>
            </div>
          </div>
          <div className="h-px w-full" style={{ background: "linear-gradient(to right, transparent, #c9a84c 30%, #e8c76a 50%, #c9a84c 70%, transparent)", boxShadow: "0 0 8px rgba(201,168,76,0.4)" }} />
        </ScrollReveal>

        {/* Right — stacked cards */}
        <div className="flex flex-col gap-4">
          {pillars.map((p, i) => (
            <ScrollReveal key={p.num} delay={i * 0.15}>
              <div className="group border border-white/8 bg-[#0d0d0d] hover:bg-[#111] hover:border-[#c9a84c]/20 transition-all duration-500 p-8">
                <div className="flex items-start gap-6">
                  <span
                    style={{ fontFamily: "var(--font-bebas)", color: "#c9a84c", opacity: 0.4, fontSize: "clamp(2.5rem,5vw,3.5rem)", lineHeight: 1 }}
                    className="flex-shrink-0 group-hover:opacity-70 transition-opacity duration-500"
                  >
                    {p.num}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[0.55rem] tracking-[0.2em] uppercase border border-[#c9a84c]/40 text-[#c9a84c]/70 px-2.5 py-1">
                        {p.tag}
                      </span>
                    </div>
                    <h3
                      style={{ fontFamily: "var(--font-bebas)" }}
                      className="text-3xl text-white tracking-wider mb-4"
                    >
                      {p.title}
                    </h3>
                    <p className="text-white/45 text-sm leading-relaxed">{p.text}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  );
}
