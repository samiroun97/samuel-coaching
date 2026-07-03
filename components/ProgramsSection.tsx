const programs = [
  {
    name: "STARTER",
    duration: "⏱ 4 SEMAINES",
    features: [
      "Bilan physique complet",
      "Programme entraînement sur mesure",
      "Plan nutritionnel de base",
      "2 appels de suivi / mois",
      "Accès à l'app de suivi",
    ],
    price: "297€",
    sub: "paiement unique",
    cta: "Commencer ici",
    highlight: false,
  },
  {
    name: "TRANSFORM",
    duration: "⏱ 12 SEMAINES",
    features: [
      "Tout le programme Starter",
      "Coaching mental hebdomadaire",
      "Plan nutrition avancé + recettes",
      "Appels illimités en semaine",
      "Suivi quotidien sur WhatsApp",
      "Accès communauté privée",
    ],
    price: "697€",
    sub: "ou 3 × 240€",
    cta: "Je veux transformer ma vie",
    highlight: true,
    badge: "⚡ Populaire",
  },
  {
    name: "ELITE",
    duration: "⏱ 6 MOIS",
    features: [
      "Tout le programme Transform",
      "Accès VIP 24/7 direct à Samuel",
      "Séances en présentiel (Paris)",
      "Analyse sanguine & morphologique",
      "Programme voyage inclus",
      "Suivi post-programme à vie",
    ],
    price: "1 997€",
    sub: "ou 6 × 360€",
    cta: "Accès Elite",
    highlight: false,
  },
];

export default function ProgramsSection() {
  return (
    <section id="programmes" className="py-28 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="section-label mb-4">Programmes</p>
          <h2 style={{background:'linear-gradient(120deg,#f5f5f0 30%,#c9a84c 65%,#e8c76a 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',fontFamily:'var(--font-bebas)'}} className="text-[clamp(2.5rem,6vw,5rem)] uppercase leading-none">
            CHOISIS TON <span className="text-[#c9a84c]">NIVEAU</span>
          </h2>
          <p className="text-white/40 text-sm mt-4">
            Chaque programme est personnalisé. Ces formules sont des points de départ, pas des cases.
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

              <p className="section-label text-[0.65rem] mb-2">{p.duration}</p>
              <h3 className="font-[family-name:var(--font-bebas)] font-black text-4xl uppercase tracking-wider text-white mb-6">
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
                <p className={`font-[family-name:var(--font-bebas)] font-black text-4xl ${p.highlight ? "text-[#c9a84c]" : "text-white"}`}>
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
      </div>
    </section>
  );
}


