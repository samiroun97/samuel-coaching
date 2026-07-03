import Title from "./Title";

const certs = [
  "Diplômé Coach Sportif certifié STAPS",
  "Certification Nutrition du Sport (INSEP)",
  "Praticien en Psychologie de la Performance",
  "Expert en Body Recomposition & Force Athlétique",
];

export default function AboutSection() {
  return (
    <section className="py-28 bg-[#0f0d07]">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        <div className="relative">
          <div className="absolute -left-3 -top-3 w-24 h-24 border-l-2 border-t-2 border-[#c9a84c]/40" />
          <div className="relative aspect-[3/4] bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/photos/samuel.jpg')" }}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0f0d07]/50" />
          </div>
          <div className="absolute -right-3 -bottom-3 w-24 h-24 border-r-2 border-b-2 border-[#c9a84c]/40" />
          <div className="absolute bottom-8 -right-6 bg-[#c9a84c] px-4 py-3">
            <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-black">8</p>
            <p className="text-[0.6rem] text-black/70 tracking-widest uppercase">Années<br />d&apos;expertise</p>
          </div>
        </div>

        <div>
          <p className="section-label mb-6">À Propos</p>
          <Title className="text-[clamp(2.5rem,5vw,4.5rem)] mb-8">
            JE SUIS SAMUEL
          </Title>
          <p className="text-white/60 text-sm leading-relaxed mb-6">
            Ancien athlète de compétition, j&apos;ai vécu la transformation de l&apos;intérieur. Pas seulement physique — mentale, émotionnelle, totale. J&apos;ai compris que le corps et le mental sont indissociables, et que la vraie performance naît de cette synergie.
          </p>
          <p className="text-white/60 text-sm leading-relaxed mb-10">
            Mon approche ? Pas de méthodes miracles. De la rigueur, de la personnalisation, et un accompagnement qui te traite comme l&apos;athlète que tu es — ou que tu vas devenir.
          </p>
          <ul className="flex flex-col gap-3">
            {certs.map((c) => (
              <li key={c} className="flex items-start gap-3 text-sm text-white/70">
                <span className="text-[#c9a84c] mt-0.5 flex-shrink-0">◆</span>
                {c}
              </li>
            ))}
          </ul>
          <p style={{ fontFamily: "var(--font-bebas)" }} className="mt-10 text-2xl tracking-[0.2em] text-white/10 uppercase select-none">
            Samuel Coaching
          </p>
        </div>
      </div>
    </section>
  );
}
