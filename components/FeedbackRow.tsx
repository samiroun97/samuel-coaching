const FEEDBACK_TYPES = {
  fort: {
    color: "#7eb8a0",
    label: "Points forts",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.3 2.3L16 10"/>
      </svg>
    ),
  },
  faible: {
    color: "#d99a58",
    label: "À travailler",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/>
      </svg>
    ),
  },
  conseil: {
    color: "#c9a84c",
    label: "Conseils",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.9 1.1 1 1.6h5c.1-.5.5-1.2 1-1.6A6 6 0 0 0 12 3z"/>
      </svg>
    ),
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
