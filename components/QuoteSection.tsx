export default function QuoteSection() {
  return (
    <section
      className="relative min-h-[60vh] flex items-center justify-center overflow-hidden"
      style={{ backgroundImage: "url('/photos/equipment.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute inset-0 bg-[#0a0a0a]/75" />
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <p className="section-label mb-8">La mentalité Samuel Coaching</p>
        <h2 className="font-[family-name:var(--font-barlow)] font-black text-[clamp(3rem,10vw,7rem)] uppercase leading-none text-white mb-2">
          LA DISCIPLINE
        </h2>
        <div className="flex items-center gap-4 justify-center mb-2">
          <div className="divider-left" />
          <div className="divider-left" />
        </div>
        <h2 className="font-[family-name:var(--font-barlow)] font-black text-[clamp(3rem,10vw,7rem)] uppercase leading-none text-[#c9a84c]">
          CRÉE LA LIBERTÉ
        </h2>
        <p className="section-label mt-8">Chaque répétition compte</p>
      </div>
    </section>
  );
}
