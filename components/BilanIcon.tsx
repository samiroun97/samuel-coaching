"use client";
import { LINE_GLYPHS, LineBadge } from "@/components/LineBadge";
import { RichIcon } from "@/components/RichIcon";
import { useIconStyle } from "@/components/IconStyle";

// Icône « Bilan » : presse-papier 3D d’origine dans l’espace client, pictogramme épuré au CRM.
export function BilanIcon({ size = 52, className = "" }: { size?: number; className?: string }) {
  const style = useIconStyle();
  if (style === "3d") return <RichIcon name="clipboardCheck" size={size} className={`drop-shadow-[0_4px_10px_rgba(201,168,76,0.3)] ${className}`}/>;
  return <LineBadge glyph={LINE_GLYPHS.clipboardCheck} size={size} className={className}/>;
}
