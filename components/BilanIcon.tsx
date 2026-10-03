import { useId } from "react";

// Icône « Bilan » épurée (remplace le presse-papier 3D jugé trop cartoon) : presse-papier
// au trait doré avec une coche, dans un cercle légèrement teinté d'or. Vectoriel, net à
// toutes les tailles, lisible en thème clair comme en sombre.
export function BilanIcon({ size = 52, className = "" }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={`shrink-0 ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ecd590"/><stop offset="0.5" stopColor="#c9a84c"/><stop offset="1" stopColor="#9c7a2e"/>
        </linearGradient>
        <radialGradient id={`f${id}`} cx="0.5" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#c9a84c" stopOpacity="0.2"/><stop offset="1" stopColor="#c9a84c" stopOpacity="0.05"/>
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill={`url(#f${id})`}/>
      <circle cx="32" cy="32" r="30" fill="none" stroke={`url(#g${id})`} strokeOpacity="0.55" strokeWidth="1"/>
      {/* presse-papier */}
      <rect x="20.5" y="17" width="23" height="31" rx="4.5" fill="none" stroke={`url(#g${id})`} strokeWidth="2"/>
      <rect x="26" y="13.5" width="12" height="6.5" rx="2.5" fill={`url(#g${id})`}/>
      {/* coche + ligne */}
      <path d="M26.5 32.5 L30.5 36.5 L38 28.5" fill="none" stroke={`url(#g${id})`} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="27" y1="42" x2="37" y2="42" stroke="#c9a84c" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
