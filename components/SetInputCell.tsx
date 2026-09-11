// Case de saisie d'un nombre (kg ou reps) — le point central de la refonte de la saisie
// de séance. Contrairement à NumberStepper (deux boutons +/- qui, sur mobile, occupent
// à eux seuls plus de la moitié de la largeur d'une case), c'est une simple case pleine
// largeur : on tape, le clavier numérique natif du téléphone s'ouvre, le chiffre remplit
// toute la case. C'est le pattern de toutes les apps de tracking sérieuses (Hevy, Strong,
// TrainingPeaks) — aucune n'utilise de stepper pour la saisie de séries.
// Partagée entre SeanceBuilder (préparation) et SeanceLive (logging en direct) pour que
// la case de saisie soit visuellement et fonctionnellement identique partout dans l'app.
export function SetInputCell({ value, placeholder, onChange, kind, label, accent }: {
  value: string; placeholder: string; onChange: (v: string) => void;
  kind: "kg" | "reps"; label?: string; accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-[0.6rem] tracking-[0.12em] uppercase text-[var(--t-text-25)] text-center">{label}</span>}
      <input
        type="text" inputMode={kind === "kg" ? "decimal" : "numeric"} enterKeyHint="next"
        value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
        style={{ fontFamily: "var(--font-bebas)" }}
        className={`w-full h-12 rounded-xl border text-center text-xl tracking-wide text-[var(--t-text)] placeholder-[var(--t-text-15)] focus:outline-none focus:border-[#c9a84c]/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
          accent && value ? "border-[#c9a84c]/40 bg-[#c9a84c]/[0.06]" : "border-[var(--t-border)] bg-[var(--t-surface-2)]"}`}/>
    </div>
  );
}
