"use client";
export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/photos/hero.jpg')" }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a]/82 via-[#0a0a0a]/40 to-[#0a0a0a]/72" />
      <div className="absolute inset-0 bg-[#0a0a0a]/30" />

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        <p className="section-label mb-6">Coach Fitness & Transformation Personnelle</p>

        <h1
          className="font-[family-name:var(--font-barlow)] font-black text-[clamp(4rem,12vw,9rem)] leading-none tracking-[0.05em] uppercase text-white mb-2"
        >
          TRANSFORME
        </h1>

        <div className="divider mb-6" />

        <h2
          className="font-[family-name:var(--font-barlow)] font-bold text-[clamp(1.2rem,4vw,2.5rem)] text-[#c9a84c] tracking-[0.08em] uppercase mb-8"
        >
          Ton Corps. Ton Mental. Ta Vie.
        </h2>

        <p className="text-white/60 text-sm tracking-wide max-w-lg mx-auto mb-12 leading-relaxed">
          Un accompagnement d&apos;élite pour des résultats réels. Pas de raccourcis. Pas de compromis.
          Juste la transformation que tu mérites.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#contact"
            className="bg-[#c9a84c] text-black text-xs font-bold tracking-[0.2em] uppercase px-8 py-4 hover:bg-[#e2c97e] transition-colors duration-300"
          >
            Je commence maintenant
          </a>
          <a
            href="#resultats"
            className="border border-white/30 text-white text-xs font-semibold tracking-[0.2em] uppercase px-8 py-4 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors duration-300"
          >
            Voir les résultats
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-scroll">
        <span className="section-label text-[0.6rem]">Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-[#c9a84c] to-transparent" />
      </div>
    </section>
  );
}
