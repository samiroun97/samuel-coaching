// Mini-courbe inline sans axes ni légende, pour les cartes de record compactes
// (façon Wingfit) — LineChart reste pour les graphiques détaillés.
export function Sparkline({ points, color }: { points: number[]; color: string }) {
  if (points.length < 2) {
    return <div className="h-8 flex items-center"><div className="w-full h-px" style={{ backgroundColor: `${color}40` }}/></div>;
  }
  const W = 100, H = 32, PAD = 3;
  const min = Math.min(...points), max = Math.max(...points);
  const span = max - min || 1;
  const toX = (i: number) => PAD + (i / (points.length - 1)) * (W - PAD * 2);
  const toY = (v: number) => PAD + (1 - (v - min) / span) * (H - PAD * 2);
  const d = points.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)},${toY(v)}`).join(" ");
  const lastX = toX(points.length - 1), lastY = toY(points[points.length - 1]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-8" preserveAspectRatio="none">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
      <circle cx={lastX} cy={lastY} r="2.5" fill={color}/>
    </svg>
  );
}
