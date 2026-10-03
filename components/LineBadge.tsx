import { useId, type ReactNode } from "react";

// Icônes « épurées » de l'app : pictogramme au trait doré dans un cercle légèrement teinté
// d'or (même dessin que l'icône Bilan). Remplacent les illustrations 3D, jugées trop cartoon.
// Vectoriel, net à toutes les tailles, lisible en clair comme en sombre. En dessous de 30 px,
// le cercle disparaît et le pictogramme est agrandi / épaissi pour rester lisible.
// Dégradés en userSpaceOnUse : un dégradé « objectBoundingBox » ne s'affiche pas sur une
// ligne parfaitement horizontale ou verticale (boîte de hauteur/largeur nulle).

const dot = (f: string, cx: number, cy: number, r = 1.4) => <circle cx={cx} cy={cy} r={r} fill={f} stroke="none"/>;

// Chaque pictogramme reçoit f = le dégradé or, pour les éléments pleins.
export const LINE_GLYPHS: Record<string, (f: string) => ReactNode> = {
  clipboardCheck: f => <>
    <rect x="20.5" y="17" width="23" height="31" rx="4.5"/>
    <rect x="26" y="13.5" width="12" height="6.5" rx="2.5" fill={f} stroke="none"/>
    <path d="M26.5 32.5 L30.5 36.5 L38 28.5" strokeWidth="2.6"/>
    <path d="M27 42h10" opacity="0.6"/>
  </>,
  scale: () => <>
    <rect x="19" y="19" width="26" height="26" rx="6"/>
    <path d="M25 30a7 7 0 0 1 14 0"/>
    <path d="M32 30l3.2-4.2"/>
    <path d="M27 40h10" opacity="0.6"/>
  </>,
  library: () => <>
    <rect x="18.5" y="19" width="6.5" height="26" rx="1.6"/>
    <rect x="27" y="19" width="6.5" height="26" rx="1.6"/>
    <path d="M36.4 21.6l6-1.6 6.3 23.4-6 1.6z"/>
    <path d="M21.7 24v3M30.2 24v3" opacity="0.6"/>
  </>,
  lightbulb: () => <>
    <path d="M32 17a10 10 0 0 0-6 18c1.4 1.1 2 2.4 2 4v1h8v-1c0-1.6.6-2.9 2-4a10 10 0 0 0-6-18z"/>
    <path d="M28.5 44h7M29.5 47.5h5"/>
  </>,
  mealPetitDejeuner: () => <>
    <path d="M21 28h18v8a8 8 0 0 1-8 8h-2a8 8 0 0 1-8-8z"/>
    <path d="M39 30.5h2.2a3.3 3.3 0 0 1 0 6.6H39"/>
    <path d="M26 19c-1 2 1 3 0 5M31 19c-1 2 1 3 0 5M36 19c-1 2 1 3 0 5" opacity="0.6"/>
  </>,
  mealDejeuner: () => <>
    <circle cx="33" cy="33" r="9"/>
    <circle cx="33" cy="33" r="5" opacity="0.5"/>
    <path d="M18 20v7a2.5 2.5 0 0 0 5 0v-7M20.5 20v26"/>
    <path d="M47 20c-2 2.5-3 6-3 10h3v16"/>
  </>,
  mealDiner: () => <>
    <path d="M18 42h28"/>
    <path d="M21 42a11 11 0 0 1 22 0"/>
    <path d="M32 31v-3M29.5 28h5"/>
    <path d="M26 37a7 7 0 0 1 4-3" opacity="0.5"/>
  </>,
  mealCollation: f => <>
    <path d="M32 27c-3-2-11-2-11 7 0 6 4 12 7 12 1.5 0 2.5-1 4-1s2.5 1 4 1c3 0 7-6 7-12 0-9-8-9-11-7z"/>
    <path d="M32 27c0-3 1-6 4-8"/>
    <path d="M33 22c2-2 5-2 6-1-1 2-4 3-6 1z" fill={f} stroke="none"/>
  </>,
  burn: () => <>
    <path d="M32 47c-6 0-10-4-10-9.5 0-6.5 5.5-8.5 6.5-15 3 2.2 5 5.2 5 8.5 1.2-1 2-3 2-5 4.5 3.2 6.5 7.2 6.5 11.5C42 43 38 47 32 47z"/>
    <path d="M32 47c-2.5 0-4-1.8-4-4 0-2.8 2.5-4 3.2-6.5 2.3 1.5 4.8 3.7 4.8 6.5 0 2.2-1.5 4-4 4z" opacity="0.6"/>
  </>,
  targetGoal: f => <>
    <circle cx="31" cy="34" r="12"/>
    <circle cx="31" cy="34" r="6.5"/>
    <circle cx="31" cy="34" r="1.8" fill={f} stroke="none"/>
    <path d="M32 33l11-11M39.5 21.5h4v4"/>
  </>,
  waterBottle: () => <>
    <path d="M28 17h8"/>
    <path d="M29 17v4c-3 1-5 3-5 6v16a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V27c0-3-2-5-5-6v-4"/>
    <path d="M24 33h16" opacity="0.6"/>
  </>,
  droplet: () => <>
    <path d="M32 17c5 7 10 12 10 18.5a10 10 0 0 1-20 0C22 29 27 24 32 17z"/>
    <path d="M27.5 37a4.5 4.5 0 0 0 4 4" opacity="0.6"/>
  </>,
  step: () => <>
    <ellipse cx="26" cy="25" rx="4.2" ry="6.8"/>
    <circle cx="26" cy="37" r="3"/>
    <ellipse cx="38" cy="30" rx="4.2" ry="6.8"/>
    <circle cx="38" cy="42" r="3"/>
  </>,
  notebookPen: () => <>
    <rect x="19" y="18" width="21" height="28" rx="3"/>
    <path d="M24 25h11M24 31h11M24 37h7" opacity="0.6"/>
    <path d="M45 22l3 3-9 9-4 1 1-4z"/>
  </>,
  chrono: () => <>
    <circle cx="32" cy="35" r="11.5"/>
    <path d="M32 35v-6.5M28.5 18.5h7M32 18.5v5M41.5 25.5l2.2-2.2"/>
  </>,
  hourglass: f => <>
    <path d="M22.5 18h19M22.5 46h19"/>
    <path d="M25 18c0 7 7 10 7 14s-7 7-7 14M39 18c0 7-7 10-7 14s7 7 7 14"/>
    <path d="M28.5 43c1-2 2.2-3 3.5-3s2.5 1 3.5 3z" fill={f} stroke="none" opacity="0.7"/>
  </>,
  messages: f => <>
    <path d="M20 21h16a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9l-5 4v-4h-2a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3z"/>
    <path d="M42 28h2a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-1v4l-5-4h-7a3 3 0 0 1-3-3v-1" opacity="0.6"/>
    {dot(f, 23.5, 28.5)}{dot(f, 28, 28.5)}{dot(f, 32.5, 28.5)}
  </>,
  checkin: () => <>
    <rect x="19" y="21" width="26" height="24" rx="4"/>
    <path d="M19 28h26M25 18v6M39 18v6"/>
    <path d="M26.5 36.5l3.5 3.5 7-7" strokeWidth="2.5"/>
  </>,
  clients: () => <>
    <circle cx="32" cy="26.5" r="5"/>
    <path d="M23 45c0-6 4-10 9-10s9 4 9 10"/>
    <circle cx="20.5" cy="30" r="3.5" opacity="0.6"/>
    <path d="M14.5 43c0-4 2.5-7 6-7" opacity="0.6"/>
    <circle cx="43.5" cy="30" r="3.5" opacity="0.6"/>
    <path d="M49.5 43c0-4-2.5-7-6-7" opacity="0.6"/>
  </>,
  bloc: () => <>
    <path d="M24 32h16"/>
    <rect x="19" y="24.5" width="5" height="15" rx="1.6"/>
    <rect x="40" y="24.5" width="5" height="15" rx="1.6"/>
    <path d="M16 28.5v7M48 28.5v7"/>
  </>,
  nextSession: () => <>
    <rect x="19" y="21" width="26" height="24" rx="4"/>
    <path d="M19 28h26M25 18v6M39 18v6"/>
    <path d="M26 37h11M33.5 33.5L37 37l-3.5 3.5"/>
  </>,
  download: () => <>
    <path d="M32 18v17M25 29l7 7 7-7"/>
    <path d="M20 38v5a3 3 0 0 0 3 3h18a3 3 0 0 0 3-3v-5"/>
  </>,
  business: () => <>
    <path d="M17 19h30M17 41h30"/>
    <path d="M19.5 19v22M44.5 19v22" opacity="0.6"/>
    <path d="M25 36v-4.5M29.5 36v-8.5M34 36v-6"/>
    <circle cx="39.5" cy="27" r="3"/>
    <path d="M32 41v6"/>
  </>,
  abonnement: () => <>
    <path d="M32 21l3.2 6.6 7.3 1-5.3 5.1 1.3 7.2L32 37.5l-6.5 3.4 1.3-7.2-5.3-5.1 7.3-1z"/>
    <path d="M19.5 25c-3 6-2 13 4.5 18.5M44.5 25c3 6 2 13-4.5 18.5" opacity="0.6"/>
  </>,
  home: () => <>
    <path d="M18.5 31.5L32 20l13.5 11.5"/>
    <path d="M23 28v17h18V28"/>
    <path d="M29 45v-8h6v8" opacity="0.6"/>
  </>,
  nutrition: () => <>
    <path d="M18 33h28c0 7.7-6.3 13-14 13s-14-5.3-14-13z"/>
    <path d="M33 30c0-6 4-10.5 10-11.5 0 6-4 10.5-10 11.5z"/>
    <path d="M33 30c-1-4-4-6.5-8.5-7.5" opacity="0.6"/>
  </>,
  progress: () => <>
    <path d="M19 19v26h26" opacity="0.6"/>
    <path d="M24 38l6-7 5 4 9-11"/>
    <path d="M39 24h5v5"/>
  </>,
  account: () => <>
    <circle cx="32" cy="26" r="6.5"/>
    <path d="M20.5 45c0-6.5 5-11 11.5-11s11.5 4.5 11.5 11"/>
  </>,
  dashboard: () => <>
    <rect x="19" y="19" width="11" height="13" rx="2.5"/>
    <rect x="34" y="19" width="11" height="8" rx="2.5"/>
    <rect x="19" y="36" width="11" height="9" rx="2.5"/>
    <rect x="34" y="31" width="11" height="14" rx="2.5"/>
  </>,
  pipeline: () => <>
    <path d="M18 20h28L36 32v10l-8 4V32z"/>
    <path d="M23 25h18" opacity="0.6"/>
  </>,
  programme: f => <>
    <rect x="20" y="17" width="24" height="30" rx="4"/>
    <rect x="26.5" y="13.5" width="11" height="6" rx="2.5" fill={f} stroke="none"/>
    <path d="M27.5 30h9M25.5 27v6M38.5 27v6"/>
    <path d="M26 40h12" opacity="0.6"/>
  </>,
  plateforme: () => <>
    <circle cx="32" cy="21" r="4"/>
    <circle cx="21" cy="41" r="4"/>
    <circle cx="43" cy="41" r="4"/>
    <path d="M30 24.5l-7 13M34 24.5l7 13M25 41h14" opacity="0.6"/>
  </>,
  factures: () => <>
    <path d="M22 17h20v29l-3.3-2-3.4 2-3.3-2-3.3 2-3.4-2-3.3 2z"/>
    <path d="M27 25h10M27 31h10M27 37h6" opacity="0.6"/>
  </>,
};

export function LineBadge({ glyph, size = 52, className = "" }: { glyph: (f: string) => ReactNode; size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  const small = size < 30;
  const stroke = `url(#g${id})`;
  return (
    <svg viewBox={small ? "12 12 40 40" : "0 0 64 64"} width={size} height={size} className={`shrink-0 ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id={`g${id}`} gradientUnits="userSpaceOnUse" x1="14" y1="12" x2="50" y2="52">
          <stop offset="0" stopColor="#ecd590"/><stop offset="0.5" stopColor="#c9a84c"/><stop offset="1" stopColor="#9c7a2e"/>
        </linearGradient>
        <radialGradient id={`f${id}`} cx="0.5" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#c9a84c" stopOpacity="0.2"/><stop offset="1" stopColor="#c9a84c" stopOpacity="0.05"/>
        </radialGradient>
      </defs>
      {!small && <>
        <circle cx="32" cy="32" r="30" fill={`url(#f${id})`}/>
        <circle cx="32" cy="32" r="30" fill="none" stroke={stroke} strokeOpacity="0.55" strokeWidth="1"/>
      </>}
      <g fill="none" stroke={stroke} strokeWidth={small ? 2.6 : 2.1} strokeLinecap="round" strokeLinejoin="round">
        {glyph(stroke)}
      </g>
    </svg>
  );
}
