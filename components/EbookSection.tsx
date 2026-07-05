import Title from "./Title";
import ScrollReveal from "./ScrollReveal";

export default function EbookSection() {
  return (
    <section className="py-28 bg-[#0f0d07] border-y border-[#c9a84c]/10">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">

        {/* Left — cover */}
        <ScrollReveal direction="left">
          <div className="relative max-w-sm mx-auto">
            <div className="absolute -inset-3 border border-[#c9a84c]/20" />
            <img
              src="/photos/ebook-cover.jpg"
              alt="Du Chaos à la Méthode — Samuel Waelti"
              className="w-full object-cover shadow-2xl"
            />
          </div>
        </ScrollReveal>

        {/* Right — text */}
        <ScrollReveal direction="right">
          <p className="section-label mb-4">Ebook</p>
          <Title className="text-[clamp(2rem,5vw,3.5rem)] mb-6">
            MA MÉTHODE ENFIN DÉCORTIQUÉE
          </Title>
          <p className="text-white/50 text-sm leading-relaxed mb-4">
            Tout ce que j&apos;applique avec mes clients, mis à plat dans un guide clair et direct. Entraînement, nutrition, mental, habitudes — sans jargon, sans bullshit.
          </p>
          <p className="text-white/50 text-sm leading-relaxed mb-10">
            Un ebook pour ceux qui veulent comprendre comment fonctionne une vraie transformation — et commencer à la vivre.
          </p>

          <a
            href="https://waelti.gumroad.com/l/gxjhdj"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-4 bg-[#c9a84c] text-black text-xs font-bold tracking-[0.25em] uppercase px-10 py-4 overflow-hidden hover:bg-[#e2c97e] transition-colors duration-300"
          >
            OBTENIR L&apos;EBOOK
            <span className="text-base">→</span>
          </a>

          <p className="text-white/20 text-xs mt-4">Accès immédiat après paiement · Via Gumroad</p>
        </ScrollReveal>

      </div>
    </section>
  );
}
