export default function NutritionPage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-10">
        <p className="text-[0.55rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-2">Rubrique</p>
        <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-5xl text-white tracking-wide">
          NUTRITION
        </h1>
      </div>

      <div className="border border-white/10 bg-[#111] p-12 flex flex-col items-center text-center">
        <div className="w-14 h-14 border border-white/10 flex items-center justify-center mb-6">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a4 4 0 010 8h-1"/>
            <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/>
            <line x1="6" y1="1" x2="6" y2="4"/>
            <line x1="10" y1="1" x2="10" y2="4"/>
            <line x1="14" y1="1" x2="14" y2="4"/>
          </svg>
        </div>
        <p className="text-[0.55rem] tracking-[0.25em] text-[#c9a84c] uppercase mb-3">Bientôt disponible</p>
        <p className="text-white/40 text-sm max-w-xs leading-relaxed">
          Ton plan nutritionnel personnalisé sera disponible ici une fois établi avec Samuel.
        </p>
        <div className="mt-8 flex flex-col gap-2 text-left w-full max-w-xs">
          {["Macros journaliers", "Plan de repas", "Recettes adaptées", "Suivi calorique"].map(item => (
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
          <p className="text-white/30 text-xs">Contacte Samuel pour établir ton plan</p>
        </div>
        <a href="https://wa.me/41798617518" target="_blank" rel="noopener noreferrer"
          className="bg-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.15em] uppercase px-5 py-3 hover:bg-[#e2c97e] transition-colors">
          WhatsApp →
        </a>
      </div>
    </div>
  );
}
