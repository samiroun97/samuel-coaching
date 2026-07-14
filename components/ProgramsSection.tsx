const programs = [
  {
    label: "45 MINUTES",
    name: "BILAN GRATUIT",
    price: "Gratuit",
    sub: "Sans engagement",
    features: [
      "Évaluation métabolique",
      "Bilan général",
      "Analyse des objectifs",
    ],
    cta: "RÉSERVER MON BILAN",
    highlight: false,
  },
  {
    label: "1 MOIS",
    name: "SUIVI",
    price: "390 CHF",
    sub: "1 mois de suivi",
    features: [
      "Bilan physique complet",
      "Programme d'entraînement sur mesure avec suivi",
      "1 entraînement en présentiel / semaine",
      "Accès à l'app",
    ],
    cta: "COMMENCER",
    highlight: true,
    badge: "POPULAIRE",
  },
  {
    label: "À LA SÉANCE",
    name: "PRÉSENTIEL",
    price: "80 CHF",
    sub: "par séance",
    features: [
      "Entraînement en présentiel",
      "Objectif précis défini ensemble",
      "Programme d'entraînement sur mesure",
      "Accès à l'app",
    ],
    cta: "RÉSERVER UNE SÉANCE",
    highlight: false,
  },
];

export default function ProgramsSection() {
  return (
    <section id="programmes" className="py-28 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="section-label mb-4">Programmes</p>
          <h2 style={{ fontFamily: "var(--font-bebas)", background: "linear-gradient(120deg,#f5f5f0 30%,#c9a84c 65%,#e8c76a 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }} className="text-[clamp(2.5rem,6vw,5rem)] uppercase leading-none">
            CHOISIS TON NIVEAU
          </h2>
          <p className="text-white/40 text-sm mt-4">
            Chaque formule est personnalisée. Ces offres sont des points de départ, pas des cases.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {programs.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col border p-8 transition-colors duration-300 ${
                p.highlight
                  ? "border-[#c9a84c] bg-[#0f0d07]"
                  : "border-white/10 bg-[#111111] hover:border-white/20"
              }`}
            >
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#c9a84c] text-black text-[0.65rem] font-bold tracking-[0.2em] uppercase px-4 py-1">
                  {p.badge}
                </div>
              )}

              <p className="section-label text-[0.65rem] mb-2">{p.label}</p>
              <h3 style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl uppercase tracking-wider text-white mb-6">
                {p.name}
              </h3>

              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-white/60">
                    <span className="text-[#c9a84c] flex-shrink-0 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="border-t border-white/10 pt-6 mb-6">
                <p style={{ fontFamily: "var(--font-bebas)" }} className={`text-4xl ${p.highlight ? "text-[#c9a84c]" : "text-white"}`}>
                  {p.price}
                </p>
                <p className="text-white/40 text-xs mt-1">{p.sub}</p>
              </div>

              <a
                href="#contact"
                className={`text-center text-xs font-bold tracking-[0.15em] uppercase py-4 transition-colors duration-300 ${
                  p.highlight
                    ? "bg-[#c9a84c] text-black hover:bg-[#e2c97e]"
                    : "border border-white/20 text-white hover:border-[#c9a84c] hover:text-[#c9a84c]"
                }`}
              >
                {p.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-white/30 text-xs tracking-wide mt-10">
          Toutes les formules incluent l&apos;accès direct à l&apos;app de suivi.
        </p>
      </div>
    </section>
  );
}
