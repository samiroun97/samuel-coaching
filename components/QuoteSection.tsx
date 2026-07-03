import Title from "./Title";

export default function QuoteSection() {
  return (
    <section
      className="relative min-h-[60vh] flex items-center justify-center overflow-hidden"
      style={{ backgroundImage: "url('/photos/equipment.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute inset-0 bg-[#0a0a0a]/75" />
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <p className="section-label mb-8">La mentalité Samuel Coaching</p>
        <Title className="text-[clamp(3rem,10vw,7rem)] mb-2">LA DISCIPLINE</Title>
        <div className="flex items-center gap-4 justify-center mb-2">
          <div className="divider-left" />
          <div className="divider-left" />
        </div>
        <Title className="text-[clamp(3rem,10vw,7rem)]">CRÉE LA LIBERTÉ</Title>
        <p className="section-label mt-8">Chaque répétition compte</p>
      </div>
    </section>
  );
}
