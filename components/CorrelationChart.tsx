// Superpose deux courbes d'échelles différentes (poids en kg, body fat en %) sur un même
// graphique — chaque série est normalisée sur sa propre plage (min/max) plutôt que sur une
// échelle commune, pour comparer la forme des tendances (montent/descendent ensemble ou pas)
// sans qu'une échelle n'écrase l'autre. Axe X basé sur les dates réelles (pas juste l'index),
// les deux séries n'étant pas forcément loguées aux mêmes jours.
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

export function CorrelationChart({ weightData, bfData }: { weightData: Point[]; bfData: Point[] }) {
  const W = 400, H = 180;
  const PAD = { top: 22, right: 10, bottom: 28, left: 10 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const allMs = [...weightData, ...bfData].map(d => new Date(d.date).getTime());
  const minMs = Math.min(...allMs), maxMs = Math.max(...allMs);
  const spanMs = Math.max(maxMs - minMs, 1);
  const toX = (date: string) => PAD.left + ((new Date(date).getTime() - minMs) / spanMs) * innerW;

  const project = (data: Point[]) => {
    const vals = data.map(d => d.val);
    const pad = (Math.max(...vals) - Math.min(...vals)) * 0.15 || 1;
    const minV = Math.min(...vals) - pad, maxV = Math.max(...vals) + pad;
    const toY = (v: number) => PAD.top + (1 - (v - minV) / (maxV - minV)) * innerH;
    return data.map(d => ({ x: toX(d.date), y: toY(d.val), raw: d }));
  };

  const weightPts = project(weightData);
  const bfPts = project(bfData);
  const fmtDate = (date: string) => new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ aspectRatio: `${W} / ${H}` }}>
        {[0, 0.5, 1].map(t => {
          const y = PAD.top + t * innerH;
          return <line key={t} x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="var(--t-border-soft)" strokeWidth="1" strokeDasharray="3 3"/>;
        })}

        <path d={smoothPath(weightPts)} fill="none" stroke="#7eb8a0" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
        {weightPts.map((p, i) => (
          <circle key={`w-${i}`} cx={p.x} cy={p.y} r={i === weightPts.length - 1 ? 4 : 2.5} fill="#7eb8a0">
            <title>{`${fmtDate(p.raw.date)} · ${p.raw.val} kg`}</title>
          </circle>
        ))}

        <path d={smoothPath(bfPts)} fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
        {bfPts.map((p, i) => (
          <circle key={`bf-${i}`} cx={p.x} cy={p.y} r={i === bfPts.length - 1 ? 4 : 2.5} fill="#c9a84c">
            <title>{`${fmtDate(p.raw.date)} · ${p.raw.val}%`}</title>
          </circle>
        ))}

        <text x={PAD.left} y={H - PAD.bottom + 12} textAnchor="start" fill="var(--t-text-25)" fontSize="6">
          {fmtDate([...weightData, ...bfData].sort((a, b) => a.date.localeCompare(b.date))[0].date)}
        </text>
        <text x={W - PAD.right} y={H - PAD.bottom + 12} textAnchor="end" fill="var(--t-text-25)" fontSize="6">
          {fmtDate([...weightData, ...bfData].sort((a, b) => b.date.localeCompare(a.date))[0].date)}
        </text>
      </svg>

      <div className="flex items-center justify-center gap-4 mt-2 pt-3 border-t border-[var(--t-border-soft)]">
        <span className="flex items-center gap-1.5 text-[0.65rem] text-[var(--t-text-40)]">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#7eb8a0" }}/>
          Poids · {weightPts[weightPts.length - 1]?.raw.val} kg
        </span>
        <span className="flex items-center gap-1.5 text-[0.65rem] text-[var(--t-text-40)]">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#c9a84c" }}/>
          Body fat · {bfPts[bfPts.length - 1]?.raw.val}%
        </span>
      </div>
    </div>
  );
}
