export default function ProgrammePage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-10">
        <p className="text-[0.55rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-2">Rubrique</p>
        <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-5xl text-white tracking-wide">
          PROGRAMME
        </h1>
      </div>

      <div className="border border-white/10 bg-[#111] p-12 flex flex-col items-center text-center">
        <div className="w-14 h-14 border border-white/10 flex items-center justify-center mb-6">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <line x1="10" y1="9" x2="8" y2="9"/>
          </svg>
        </div>
        <p className="text-[0.55rem] tracking-[0.25em] text-[#c9a84c] uppercase mb-3">Bientôt disponible</p>
        <p className="text-white/40 text-sm max-w-xs leading-relaxed">
          Ton programme d&apos;entraînement sur-mesure sera disponible ici une fois établi avec Samuel.
        </p>
        <div className="mt-8 flex flex-col gap-2 text-left w-full max-w-xs">
          {["Séances hebdomadaires", "Exercices détaillés", "Séries & répétitions", "Vidéos démo"].map(item => (
            <div key={item} className="flex items-center gap-3 text-white/20 text-xs">
              <div className="w-4 h-[1px] bg-white/10"/>
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 border border-[#c9a84c]/20 bg-[#0f0d07] p-6 flex items-center justify-between">
        <div>
          <p style={{ fontFamily: "var(--font-bebas)" }} className="text-lg tracking-wider text-white mb-0.5">Commencer maintenant</p>
          <p className="text-white/30 text-xs">Contacte Samuel pour établir ton programme</p>
        </div>
        <a href="https://wa.me/41798617518" target="_blank" rel="noopener noreferrer"
          className="bg-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.15em] uppercase px-5 py-3 hover:bg-[#e2c97e] transition-colors">
          WhatsApp →
        </a>
      </div>
    </div>
  );
}
