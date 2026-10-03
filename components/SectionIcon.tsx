import { LINE_GLYPHS, LineBadge } from "@/components/LineBadge";

// Icône d’en-tête de rubrique : pictogramme épuré propre à chaque rubrique, sur un halo doré
// qui respire (même famille que Clients, Business, Inbox, Abonnement).
export function SectionIcon({ name, size = 68 }: { name: keyof typeof LINE_GLYPHS; size?: number }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl pointer-events-none icon-halo"
        style={{ width: size * 1.3, height: size * 1.3 }}/>
      <div className="relative"><LineBadge glyph={LINE_GLYPHS[name]} size={size}/></div>
    </div>
  );
}
