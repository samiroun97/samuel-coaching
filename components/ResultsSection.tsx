const results = [
  {
    before: "/avant-apres/homme.jpg",
    after: "/avant-apres/homme.jpg",
    badge: "−18kg",
    name: "THOMAS M.",
    detail: "−18 kg de graisse · +6 kg de muscle",
    program: "Programme TRANSFORM · 12 semaines",
  },
  {
    before: "/avant-apres/femme.jpg",
    after: "/avant-apres/femme.jpg",
    badge: "+12kg",
    name: "LÉA P.",
    detail: "+12 kg de masse musculaire sèche",
    program: "Programme ELITE · 6 mois",
  },
  {
    before: "/avant-apres/alexis.jpg",
    after: "/avant-apres/alexis.jpg",
    badge: "−24kg",
    name: "ALEXIS B.",
    detail: "−24 kg · objectif marathon atteint",
    program: "Programme TRANSFORM · 6 mois",
  },
];

export default function ResultsSection() {
  return (
    <section
      id="resultats"
      className="relative py-28 overflow-hidden"
      style={{ backgroundImage: "url('/photos/results-bg.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute inset-0 bg-[#0a0a0a]/88" />
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="section-label mb-4">Résultats</p>
          <h2 className="font-[family-name:var(--font-barlow)] font-black text-[clamp(2.5rem,6vw,5rem)] uppercase leading-none text-white">
            LA PREUVE <span className="text-[#c9a84c]">PAR L&apos;ACTION</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {results.map((r) => (
            <div key={r.name} className="group">
              <div className="relative grid grid-cols-2 gap-1 mb-4">
                <div className="relative aspect-square overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url('${r.before}')` }}
                  />
                  <div className="absolute bottom-2 left-2 bg-[#0a0a0a]/80 text-[0.6rem] tracking-widest uppercase px-2 py-1 text-white/70">
                    Avant
                  </div>
                </div>
                <div className="relative aspect-square overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url('${r.after}')` }}
                  />
                  <div className="absolute bottom-2 left-2 bg-[#c9a84c]/90 text-[0.6rem] tracking-widest uppercase px-2 py-1 text-black font-semibold">
                    Après
                  </div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#c9a84c] text-black font-[family-name:var(--font-barlow)] font-black text-xl px-3 py-1 z-10">
                  {r.badge}
                </div>
              </div>
              <h3 className="font-[family-name:var(--font-barlow)] font-black text-2xl uppercase tracking-wider text-white mb-1">
                {r.name}
              </h3>
              <p className="text-white/60 text-xs mb-1">{r.detail}</p>
              <p className="section-label text-[0.6rem]">{r.program}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
