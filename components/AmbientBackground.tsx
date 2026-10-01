// Fond animé de l'app (espace client et CRM), dans l'esprit du splash mais bien plus discret :
// deux halos dorés qui dérivent lentement, quelques braises qui montent et deux traits de
// vitesse très pâles. Uniquement du CSS (transform/opacity), aucun JS ni écouteur. Posé en
// `fixed -z-10` dans un layout `isolate` : derrière tout le contenu, sans créer de contexte
// d'empilement qui ferait passer les modales sous la barre latérale.
const EMBERS = Array.from({ length: 12 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
  return { left: 4 + r(1) * 92, size: 2 + r(2) * 3, dur: 14 + r(3) * 12, delay: -r(4) * 26, dx: (r(5) - 0.5) * 140, o: 0.25 + r(6) * 0.35 };
});

export function AmbientBackground() {
  return (
    <div aria-hidden="true" className="ambient fixed inset-0 -z-10 overflow-hidden pointer-events-none print:hidden">
      <div className="ambient-blob ambient-blob-a"/>
      <div className="ambient-blob ambient-blob-b"/>
      <div className="ambient-heat"/>
      {EMBERS.map((e, i) => (
        <span key={i} className="ambient-ember"
          style={{ left: `${e.left}%`, width: e.size, height: e.size, animationDuration: `${e.dur}s`, animationDelay: `${e.delay}s`,
            ["--dx" as string]: `${e.dx}px`, ["--o" as string]: e.o } as React.CSSProperties}/>
      ))}
      <div className="absolute inset-[-20%] -rotate-12">
        <span className="ambient-streak" style={{ top: "30%", animationDelay: "-3s" }}/>
        <span className="ambient-streak" style={{ top: "68%", animationDelay: "-11s", animationDuration: "17s" }}/>
      </div>
    </div>
  );
}
