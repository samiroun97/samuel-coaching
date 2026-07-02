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
    text: "Le corps suit toujours le mental. Ensemble, on reprogramme tes croyances limitantes et on construit la discipline d'acier qui fait la différence entre ceux qui échouent et ceux qui transforment.",
  },
  {
    num: "03",
    tag: "Habitudes",
    title: "LIFESTYLE",
    text: "Nutrition adaptée, récupération optimisée, habitudes de vie repensées. Un mode de vie premium qui te permet de performer au quotidien, durablement.",
  },
];

export default function MethodSection() {
  return (
    <section id="methode" className="py-28 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-start">
        {/* Left */}
        <div className="md:sticky md:top-32">
          <p className="section-label mb-6">Ma Méthode</p>
          <h2 className="font-[family-name:var(--font-barlow)] font-black text-[clamp(3rem,6vw,5rem)] uppercase leading-none text-white mb-4">
            UNE APPROCHE
            <br />
            <span className="text-[#c9a84c]">HOLISTIQUE</span>
          </h2>
          <p className="text-white/50 text-sm leading-relaxed mb-10 max-w-sm">
            Trois piliers indissociables pour une transformation durable. Corps, mental et style de vie — tout est connecté.
          </p>

          <div
            className="relative h-80 rounded-sm overflow-hidden"
            style={{ backgroundImage: "url('/photos/samuel-coaching.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4">
              <p className="section-label text-[0.6rem]">La performance, c&apos;est maintenant</p>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-col gap-4">
          {pillars.map((p) => (
            <div key={p.num} className="bg-[#111111] border border-white/5 p-8 hover:border-[#c9a84c]/30 transition-colors duration-300">
              <div className="flex items-start gap-6">
                <span className="font-[family-name:var(--font-barlow)] font-black text-5xl text-[#c9a84c]/30 leading-none select-none">
                  {p.num}
                </span>
                <div>
                  <span className="inline-block text-[0.65rem] tracking-[0.2em] uppercase border border-white/20 text-white/50 px-3 py-1 mb-4">
                    {p.tag}
                  </span>
                  <h3 className="font-[family-name:var(--font-barlow)] font-black text-3xl uppercase tracking-wider text-white mb-3">
                    {p.title}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed">{p.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
