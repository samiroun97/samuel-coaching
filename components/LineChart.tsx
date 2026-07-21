export function LineChart({ data, unit, color, glow }: { data: { id: string; date: string; val: number }[]; unit: string; color: string; glow?: boolean }) {
  const W = 400, H = 120;
  const PAD = { top: 14, right: 14, bottom: 28, left: 32 };
  const vals = data.map(d => d.val);
  const minV = Math.max(0, Math.min(...vals) - (unit === "%" ? 2 : 1));
  const maxV = Math.max(...vals) + (unit === "%" ? 2 : 1);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const toX = (i: number) => PAD.left + (data.length > 1 ? (i / (data.length - 1)) * innerW : innerW / 2);
  const toY = (v: number) => PAD.top + (1 - (v - minV) / (maxV - minV)) * innerH;
  const pts = data.map((d, i) => `${toX(i)},${toY(d.val)}`).join(" ");
  const filterId = `glow-${color.replace("#", "")}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }}>
      {glow && (
        <defs>
          <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
      )}
      {[0, 0.5, 1].map(t => {
        const y = PAD.top + t * innerH;
        const v = maxV - t * (maxV - minV);
        return (
          <g key={t}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            <text x={PAD.left - 4} y={y + 3} textAnchor="end" fill="rgba(255,255,255,0.18)" fontSize="7">{v.toFixed(unit === "%" ? 1 : 0)}</text>
          </g>
        );
      })}
      <polygon points={`${toX(0)},${H - PAD.bottom} ${pts} ${toX(data.length - 1)},${H - PAD.bottom}`} fill={`${color}18`}/>
      {glow && <polyline points={pts} fill="none" stroke={color} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" opacity="0.25"/>}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" filter={glow ? `url(#${filterId})` : undefined}/>
      {data.map((d, i) => (
        <g key={d.id}>
          {glow && <circle cx={toX(i)} cy={toY(d.val)} r="7" fill={color} opacity="0.15"/>}
          <circle cx={toX(i)} cy={toY(d.val)} r="3" fill={color} filter={glow ? `url(#${filterId})` : undefined}/>
          <text x={toX(i)} y={H - PAD.bottom + 11} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="6">
            {new Date(d.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
          </text>
        </g>
      ))}
    </svg>
  );
}
