export const numOr = (s: string): number | null => {
  const n = parseFloat(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

// Stepper numérique tactile (Liftoff/Hevy-style) : +/- pour ajuster vite sans ouvrir le
// clavier tactile, tap sur le nombre pour saisir une valeur précise. Boutons 44px (repère
// Apple/Material pour une cible tactile confortable) — un <input type="number"> nu est trop
// petit à viser du pouce et le clavier numérique masque le reste du formulaire à chaque tap.
// Partagé entre la séance live (SeanceLive) et la préparation d'une séance (ExerciceEditor),
// pour la même ergonomie qu'on soit en train de planifier ou de s'entraîner.
export function NumberStepper({ value, placeholder, step, onChange, accent, label }: {
  value: string; placeholder: string; step: number; onChange: (v: string) => void; accent?: boolean; label?: string;
}) {
  const bump = (dir: 1 | -1) => {
    const n = numOr(value) ?? numOr(placeholder) ?? 0;
    const next = Math.max(0, Math.round((n + dir * step) * 100) / 100);
    onChange(String(next));
  };
  return (
    <div className={`flex flex-col rounded-xl border overflow-hidden ${accent && value ? "border-[#c9a84c]/40 bg-[#c9a84c]/[0.06]" : "border-[var(--t-border)] bg-[var(--t-bg)]"}`}>
      {label && <span className="text-[0.52rem] tracking-[0.12em] uppercase text-[var(--t-text-25)] text-center pt-1.5">{label}</span>}
      <div className="flex items-center">
        <button type="button" onClick={() => bump(-1)} tabIndex={-1}
          className="w-10 h-11 shrink-0 flex items-center justify-center text-[var(--t-text-30)] hover:text-[var(--t-text-60)] active:bg-[var(--t-track)] transition-colors text-lg leading-none">−</button>
        <input type="number" inputMode="decimal" placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full min-w-0 bg-transparent text-center text-base font-semibold py-2 text-[var(--t-text)] placeholder-[var(--t-text-20)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
        <button type="button" onClick={() => bump(1)} tabIndex={-1}
          className="w-10 h-11 shrink-0 flex items-center justify-center text-[var(--t-text-30)] hover:text-[var(--t-text-60)] active:bg-[var(--t-track)] transition-colors text-lg leading-none">+</button>
      </div>
    </div>
  );
}
