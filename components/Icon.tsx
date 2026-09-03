import type { LucideIcon } from "@/lib/solarIcons";
import type { SVGProps } from "react";

// Wrapper unique autour des icônes Solar (Bold Duotone) : impose une taille par défaut cohérente
// partout dans l'app, plutôt que de laisser chaque écran choisir la sienne au hasard.
// `size`/`className` restent overridables au cas par cas (badges, boutons XL...).
// `strokeWidth` est conservé dans la signature pour ne pas casser les appelants existants
// (ancien héritage Lucide) mais n'a plus d'effet — les icônes Solar sont des formes pleines.
export function Icon({
  icon: IconComponent,
  size = 16,
  strokeWidth = 1.75,
  className,
  ...rest
}: {
  icon: LucideIcon;
  size?: number;
  strokeWidth?: number;
  className?: string;
} & Omit<SVGProps<SVGSVGElement>, "ref">) {
  return <IconComponent size={size} strokeWidth={strokeWidth} className={className} {...rest}/>;
}
