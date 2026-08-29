// Graphique d'évolution (utilisé pour le body fat) : ligne lissée, thème adaptatif
// (les couleurs de grille/texte suivent les tokens --t-* au lieu d'un blanc figé qui
// devenait illisible en thème clair), tendance chiffrée au-dessus, point le plus récent
// mis en avant avec sa valeur, et espacement des dates qui s'adapte au nombre de points
// pour ne pas se chevaucher quand l'historique s'allonge.
export function LineChart({ data, unit, color, glow, lowerIsBetter = true }: {
  data: { id: string; date: string; val: number }[];
  unit: string;
  color: string;
  glow?: boolean;
  lowerIsBetter?: boolean;
}) {
  const W = 400, H = 172;
  const PAD = { top: 22, right: 14, bottom: 28, left: 32 };
  const vals = data.map(d => d.val);
  const pad = unit === "%" ? 2 : 1;
  const minV = Math.max(0, Math.min(...vals) - pad);
  const maxV = Math.max(...vals) + pad;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const toX = (i: number) => PAD.left + (data.length > 1 ? (i / (data.length - 1)) * innerW : innerW / 2);
  const toY = (v: number) => PAD.top + (1 - (v - minV) / (maxV - minV)) * innerH;
  const points = data.map((d, i) => ({ x: toX(i), y: toY(d.val) }));
  const filterId = `glow-${color.replace("#", "")}`;

  // Courbe lissée (Catmull-Rom -> Bézier cubique) plutôt qu'une ligne brisée, pour un rendu
  // moins "brut" — chaque segment passe exactement par les points mesurés.
  const smoothPath = points.length < 2 ? "" : points.reduce((path, p1, i) => {
    if (i === 0) return `M ${p1.x},${p1.y}`;
    const p0 = points[i - 2] ?? points[i - 1];
    const p2 = points[i];
    const p3 = points[i + 1] ?? p2;
    const prev = points[i - 1];
    const cp1x = prev.x + (p2.x - p0.x) / 6, cp1y = prev.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - prev.x) / 6, cp2y = p2.y - (p3.y - prev.y) / 6;
    return `${path} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }, "");
  const areaPath = points.length < 2 ? "" : `${smoothPath} L ${points[points.length - 1].x},${H - PAD.bottom} L ${points[0].x},${H - PAD.bottom} Z`;

  const first = data[0];
  const last = data[data.length - 1];
  const trend = data.length > 1 ? +(last.val - first.val).toFixed(1) : 0;
  const improving = lowerIsBetter ? trend < 0 : trend > 0;
  const trendColor = trend === 0 ? "var(--t-text-40)" : improving ? "#7eb8a0" : "#d98c6b";
  const gradientId = `grad-${color.replace("#", "")}`;
  // Au-delà de 7 points, une date sur N pour éviter que les libellés se chevauchent.
  const labelEvery = data.length > 7 ? Math.ceil(data.length / 6) : 1;
  const fmtDate = (date: string) => new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

  return (
    <div>
      {/* aspectRatio plutôt qu'une hauteur fixe : la carte peut maintenant être plus large sur
          desktop (voir suivi/page.tsx), et une hauteur figée aurait aplati le tracé au lieu de
          l'agrandir proportionnellement. */}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ aspectRatio: `${W} / ${H}` }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
          {glow && (
            <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="4" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          )}
        </defs>
        {[0, 0.5, 1].map(t => {
          const y = PAD.top + t * innerH;
          const v = maxV - t * (maxV - minV);
          return (
            <g key={t}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="var(--t-border-soft)" strokeWidth="1" strokeDasharray="3 3"/>
              <text x={PAD.left - 4} y={y + 3} textAnchor="end" fill="var(--t-text-25)" fontSize="7">{v.toFixed(unit === "%" ? 1 : 0)}</text>
            </g>
          );
        })}
        {areaPath && <path d={areaPath} fill={`url(#${gradientId})`}/>}
        {glow && <path d={smoothPath} fill="none" stroke={color} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" opacity="0.25"/>}
        <path d={smoothPath} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" filter={glow ? `url(#${filterId})` : undefined}/>
        {data.map((d, i) => {
          const isLast = i === data.length - 1;
          const showLabel = i % labelEvery === 0 || isLast;
          return (
            <g key={d.id}>
              {isLast && <circle cx={points[i].x} cy={points[i].y} r="9" fill={color} opacity="0.18"/>}
              <circle cx={points[i].x} cy={points[i].y} r={isLast ? 4 : 3} fill={color} filter={glow ? `url(#${filterId})` : undefined}>
                <title>{`${fmtDate(d.date)} · ${d.val}${unit}`}</title>
              </circle>
              {isLast && (
                <text x={points[i].x} y={points[i].y - 12} textAnchor="middle" fill="var(--t-text)" fontSize="9" fontWeight="700">
                  {d.val}{unit}
                </text>
              )}
              {showLabel && (
                <text x={points[i].x} y={H - PAD.bottom + 11} textAnchor="middle" fill="var(--t-text-25)" fontSize="6">
                  {fmtDate(d.date)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {data.length > 1 && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--t-border-soft)]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={trendColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            {trend >= 0
              ? <path d="M3 17 L10 10 L14 14 L21 6 M15 6 h6 v6"/>
              : <path d="M3 7 L10 14 L14 10 L21 18 M15 18 h6 v-6"/>}
          </svg>
          <div className="leading-tight">
            <p className="text-[0.72rem] font-semibold" style={{ color: trendColor }}>
              {trend > 0 ? "+" : ""}{trend}{unit} sur la période
            </p>
            <p className="text-[0.6rem] text-[var(--t-text-30)] tracking-wide">depuis le {fmtDate(first.date)} · {data.length} mesures</p>
          </div>
        </div>
      )}
    </div>
  );
}
