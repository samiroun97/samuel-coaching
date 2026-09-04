// Superpose deux courbes d'échelles différentes (poids en kg, body fat en %) sur un même
// graphique — même logique que LineChart (repris volontairement) : chaque série est
// espacée par index plutôt que par date réelle (évite qu'une série moins fréquemment
// loguée que l'autre ne s'écrase sur un bord du graphique), et normalisée sur sa propre
// plage min/max pour comparer la forme des tendances, pas les valeurs absolues.
type Point = { date: string; val: number };

function smoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return "";
  return points.reduce((path, p1, i) => {
    if (i === 0) return `M ${p1.x},${p1.y}`;
    const p0 = points[i - 2] ?? points[i - 1];
    const p2 = points[i];
    const p3 = points[i + 1] ?? p2;
    const prev = points[i - 1];
    const cp1x = prev.x + (p2.x - p0.x) / 6, cp1y = prev.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - prev.x) / 6, cp2y = p2.y - (p3.y - prev.y) / 6;
    return `${path} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }, "");
}

function project(data: Point[], innerW: number, innerH: number, padX: number, padY: number) {
  const vals = data.map(d => d.val);
  const pad = (Math.max(...vals) - Math.min(...vals)) * 0.2 || 1;
  const minV = Math.min(...vals) - pad, maxV = Math.max(...vals) + pad;
  const toX = (i: number) => padX + (data.length > 1 ? (i / (data.length - 1)) * innerW : innerW / 2);
  const toY = (v: number) => padY + (1 - (v - minV) / (maxV - minV)) * innerH;
  return data.map((d, i) => ({ x: toX(i), y: toY(d.val), raw: d }));
}

function fmtDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function Series({ points, color, unit, glow }: { points: { x: number; y: number; raw: Point }[]; color: string; unit: string; glow: boolean }) {
  const filterId = `corr-glow-${color.replace("#", "")}`;
  return (
    <>
      {glow && <defs>
        <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>}
      <path d={smoothPath(points)} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
        filter={glow ? `url(#${filterId})` : undefined}/>
      {points.map((p, i) => {
        const isLast = i === points.length - 1;
        return (
          <g key={i}>
            {isLast && <circle cx={p.x} cy={p.y} r="8" fill={color} opacity="0.18"/>}
            <circle cx={p.x} cy={p.y} r={isLast ? 3.5 : 2.5} fill={color}>
              <title>{`${fmtDate(p.raw.date)} · ${p.raw.val}${unit}`}</title>
            </circle>
          </g>
        );
      })}
    </>
  );
}

export function CorrelationChart({ weightData, bfData }: { weightData: Point[]; bfData: Point[] }) {
  const W = 400, H = 180;
  const PAD = { top: 24, right: 10, bottom: 10, left: 10 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const weightPts = project(weightData, innerW, innerH, PAD.left, PAD.top);
  const bfPts = project(bfData, innerW, innerH, PAD.left, PAD.top);
  const lastWeight = weightData[weightData.length - 1];
  const lastBf = bfData[bfData.length - 1];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ aspectRatio: `${W} / ${H}` }}>
        {[0, 0.5, 1].map(t => {
          const y = PAD.top + t * innerH;
          return <line key={t} x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="var(--t-border-soft)" strokeWidth="1" strokeDasharray="3 3"/>;
        })}
        <Series points={weightPts} color="#7eb8a0" unit=" kg" glow={false}/>
        <Series points={bfPts} color="#c9a84c" unit="%" glow/>
      </svg>

      <div className="flex items-center justify-center gap-4 mt-1">
        <span className="flex items-center gap-1.5 text-[0.65rem] text-[var(--t-text-40)]">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#7eb8a0" }}/>
          Poids · {lastWeight.val} kg
        </span>
        <span className="flex items-center gap-1.5 text-[0.65rem] text-[var(--t-text-40)]">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#c9a84c" }}/>
          Body fat · {lastBf.val}%
        </span>
      </div>
      <p className="text-[0.58rem] text-[var(--t-text-20)] tracking-wide text-center mt-1.5">
        {weightData.length} pesées · {bfData.length} mesures body fat — chaque courbe sur sa propre échelle
      </p>
    </div>
  );
}
