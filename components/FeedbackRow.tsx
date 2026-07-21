export function FeedbackRow({ color, label, text }: { color: string; label: string; text: string }) {
  return (
    <div className="flex gap-3 px-4 py-2.5">
      <span className="text-[0.62rem] tracking-[0.15em] uppercase shrink-0 w-20 pt-0.5" style={{ color }}>{label}</span>
      <p className="text-[0.65rem] text-white/45 leading-relaxed">{text}</p>
    </div>
  );
}
