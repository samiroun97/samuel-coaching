// Badge rond de la marque BURN-B (kettlebell flamme or) dans les en-têtes de l'app :
// rond noir en thème sombre, rond blanc en thème clair. Les deux images sont rendues et le
// thème (data-theme sur <html>) choisit laquelle s'affiche — pas de saut au changement de thème.
export function BrandBadge({ size = 68, className = "" }: { size?: number; className?: string }) {
  const img = "shrink-0 rounded-full object-contain";
  const style = { width: size, height: size };
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons-rich/monogram.webp" alt="BURN-B" width={size} height={size} style={style} className={`brand-badge-dark ${img} ${className}`}/>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons-rich/monogram-light.webp" alt="BURN-B" width={size} height={size} style={style} className={`brand-badge-light ${img} ${className}`}/>
    </>
  );
}
