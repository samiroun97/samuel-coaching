import { LINE_GLYPHS, LineBadge } from "@/components/LineBadge";

// Icône « Bilan » : presse-papier au trait doré (même famille que toutes les icônes épurées).
export function BilanIcon({ size = 52, className = "" }: { size?: number; className?: string }) {
  return <LineBadge glyph={LINE_GLYPHS.clipboardCheck} size={size} className={className}/>;
}
