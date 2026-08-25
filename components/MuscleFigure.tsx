"use client";

// Silhouette cliquable pour choisir un groupe musculaire, en alternative à la
// rangée de puces de catégories — mêmes valeurs de partie_corps que le catalogue
// (voir lib/exercicesCatalogue.ts), juste une autre façon d'y accéder.
// Régions construites en formes simples (rects/ellipses arrondis) plutôt qu'en
// tracés anatomiques détaillés : plus propre à obtenir juste, et cohérent avec
// le style épuré du reste de l'app.

type Props = {
  view: "face" | "dos";
  onViewChange: (v: "face" | "dos") => void;
  active: string | null;
  onSelect: (muscle: string) => void;
  available: Set<string>;
};

const REGION_CLASS = "fill-[var(--t-glass-bg)] stroke-[var(--t-border-15)] transition-[fill,stroke,filter] duration-200";
const REGION_UNAVAILABLE = "opacity-30 pointer-events-none";

function Region({ muscle, active, disabled, children, onSelect }: {
  muscle: string; active: boolean; disabled: boolean; children: React.ReactNode; onSelect: (m: string) => void;
}) {
  return (
    <g
      className={`cursor-pointer ${disabled ? REGION_UNAVAILABLE : "hover:[&>*]:fill-[#c9a84c]/25 hover:[&>*]:stroke-[#c9a84c]/70"}`}
      onClick={() => !disabled && onSelect(muscle)}
    >
      <g className={active ? "" : REGION_CLASS} style={active ? { fill: "#c9a84c", stroke: "#e2c97e", filter: "drop-shadow(0 0 6px rgba(201,168,76,0.55))" } : undefined}>
        {children}
      </g>
    </g>
  );
}

export function MuscleFigure({ view, onViewChange, active, onSelect, available }: Props) {
  const dis = (m: string) => !available.has(m);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex border border-[var(--t-border)] rounded-full p-0.5">
        {(["face", "dos"] as const).map(v => (
          <button key={v} type="button" onClick={() => onViewChange(v)}
            className={`text-[0.55rem] tracking-[0.15em] uppercase px-4 py-1.5 rounded-full transition-colors ${view === v ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black" : "text-[var(--t-text-40)]"}`}>
            {v}
          </button>
        ))}
      </div>

      <svg viewBox="0 0 260 470" className="w-full max-w-[200px] h-auto" strokeWidth={1.4}>
        {/* tête / cou — décoratifs, non cliquables */}
        <ellipse cx="130" cy="32" rx="19" ry="23" className="fill-[var(--t-glass-bg)] stroke-[var(--t-border-15)] opacity-60"/>
        <rect x="118" y="52" width="24" height="12" rx="4" className="fill-[var(--t-glass-bg)] stroke-[var(--t-border-15)] opacity-60"/>

        <Region muscle="épaules" active={active === "épaules"} disabled={dis("épaules")} onSelect={onSelect}>
          <ellipse cx="88" cy="84" rx="19" ry="15"/>
          <ellipse cx="172" cy="84" rx="19" ry="15"/>
        </Region>

        <Region muscle="bras" active={active === "bras"} disabled={dis("bras")} onSelect={onSelect}>
          <rect x="53" y="90" width="25" height="84" rx="12.5"/>
          <rect x="182" y="90" width="25" height="84" rx="12.5"/>
        </Region>

        <Region muscle="avant-bras" active={active === "avant-bras"} disabled={dis("avant-bras")} onSelect={onSelect}>
          <rect x="49" y="178" width="23" height="68" rx="11.5"/>
          <rect x="188" y="178" width="23" height="68" rx="11.5"/>
        </Region>

        <ellipse cx="59" cy="252" rx="10" ry="12" className="fill-[var(--t-glass-bg)] stroke-[var(--t-border-15)] opacity-60"/>
        <ellipse cx="201" cy="252" rx="10" ry="12" className="fill-[var(--t-glass-bg)] stroke-[var(--t-border-15)] opacity-60"/>

        {view === "face" ? (
          <>
            <Region muscle="pectoraux" active={active === "pectoraux"} disabled={dis("pectoraux")} onSelect={onSelect}>
              <rect x="97" y="68" width="66" height="54" rx="17"/>
            </Region>
            <Region muscle="abdominaux" active={active === "abdominaux"} disabled={dis("abdominaux")} onSelect={onSelect}>
              <rect x="101" y="126" width="58" height="76" rx="15"/>
            </Region>
          </>
        ) : (
          <Region muscle="dos" active={active === "dos"} disabled={dis("dos")} onSelect={onSelect}>
            <rect x="95" y="68" width="70" height="140" rx="20"/>
          </Region>
        )}

        <rect x="99" y="202" width="62" height="24" rx="11" className="fill-[var(--t-glass-bg)] stroke-[var(--t-border-15)] opacity-60"/>

        <Region muscle="cuisses" active={active === "cuisses"} disabled={dis("cuisses")} onSelect={onSelect}>
          <rect x="99" y="226" width="29" height="108" rx="14.5"/>
          <rect x="132" y="226" width="29" height="108" rx="14.5"/>
        </Region>

        <Region muscle="bas des jambes" active={active === "bas des jambes"} disabled={dis("bas des jambes")} onSelect={onSelect}>
          <rect x="100" y="336" width="27" height="94" rx="13.5"/>
          <rect x="133" y="336" width="27" height="94" rx="13.5"/>
        </Region>

        <ellipse cx="113" cy="440" rx="16" ry="7" className="fill-[var(--t-glass-bg)] stroke-[var(--t-border-15)] opacity-60"/>
        <ellipse cx="147" cy="440" rx="16" ry="7" className="fill-[var(--t-glass-bg)] stroke-[var(--t-border-15)] opacity-60"/>
      </svg>
    </div>
  );
}
