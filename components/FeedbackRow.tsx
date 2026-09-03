import { Icon } from "@/components/Icon";
import { CheckCircle2, Target, Lightbulb } from "@/lib/solarIcons";

const FEEDBACK_TYPES = {
  fort: {
    color: "#7eb8a0",
    label: "Points forts",
    icon: <Icon icon={CheckCircle2} size={13} strokeWidth={2}/>,
  },
  faible: {
    color: "#d99a58",
    label: "À travailler",
    icon: <Icon icon={Target} size={13} strokeWidth={2}/>,
  },
  conseil: {
    color: "#c9a84c",
    label: "Conseils",
    icon: <Icon icon={Lightbulb} size={13} strokeWidth={2}/>,
  },
} as const;

export function FeedbackRow({ type, text }: { type: keyof typeof FEEDBACK_TYPES; text: string }) {
  const { color, label, icon } = FEEDBACK_TYPES[type];
  return (
    <div className="flex gap-2.5 rounded-xl px-3 py-2.5" style={{ backgroundColor: `${color}14`, borderLeft: `2px solid ${color}` }}>
      <div className="shrink-0 mt-0.5" style={{ color }}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[0.6rem] font-semibold tracking-[0.14em] uppercase mb-0.5" style={{ color }}>{label}</p>
        <p className="text-[0.68rem] text-[var(--t-text-50)] leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
