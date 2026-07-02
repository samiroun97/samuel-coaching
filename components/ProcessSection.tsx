const steps = [
  {
    num: "01",
    title: "CONSULTATION GRATUITE",
    text: "On se parle 30 minutes pour comprendre qui tu es, où tu en es, et où tu veux aller. Pas de vente, juste de la vérité.",
  },
  {
    num: "02",
    title: "BILAN PERSONNALISÉ",
    text: "Analyse complète de ton profil — physique, nutritionnel, mental, environnemental. Je construis une carte précise de ta situation.",
  },
  {
    num: "03",
    title: "PROGRAMME SUR MESURE",
    text: "Ton programme est créé de A à Z pour toi. Entraînements, nutrition, mental, habitudes — tout est calibré pour tes objectifs.",
  },
  {
    num: "04",
    title: "TRANSFORMATION & SUIVI",
    text: "Le vrai travail commence. Je suis là à chaque étape — pour célébrer les victoires, ajuster le tir, et te pousser quand tu en as besoin.",
  },
];

export default function ProcessSection() {
  return (
    <section className="py-28 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="section-label mb-4">Le Processus</p>
          <h2 className="font-[family-name:var(--font-barlow)] font-black text-[clamp(2.5rem,6vw,5rem)] uppercase leading-none text-white">
            COMMENT ÇA <span className="text-[#c9a84c]">MARCHE</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <div key={s.num} className="relative flex flex-col">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-[#c9a84c]/40 to-transparent z-0" />
              )}
              <div className="relative z-10 w-12 h-12 border border-[#c9a84c]/40 flex items-center justify-center mb-6">
                <span className="font-[family-name:var(--font-barlow)] font-black text-[#c9a84c] text-lg">{s.num}</span>
              </div>
              <h3 className="font-[family-name:var(--font-barlow)] font-black text-xl uppercase tracking-wider text-white mb-3">
                {s.title}
              </h3>
              <p className="text-white/50 text-sm leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
