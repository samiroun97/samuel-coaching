"use client";

const words = ["FORCE", "EXCELLENCE", "DISCIPLINE", "PROGRESSION", "FORCE", "EXCELLENCE", "DISCIPLINE", "PROGRESSION"];

export default function GallerySection() {
  return (
    <div className="overflow-hidden py-4 bg-[#0a0a0a] border-y border-[#c9a84c]/10">
      <div
        className="flex whitespace-nowrap"
        style={{ animation: "marquee 20s linear infinite" }}
      >
        {[...words, ...words].map((word, i) => (
          <span
            key={i}
            style={{
              fontFamily: "var(--font-bebas)",
              color: "rgba(255,255,255,0.3)",
              fontSize: "clamp(0.9rem, 2vw, 1.2rem)",
              letterSpacing: "0.25em",
            }}
            className="mx-16 flex-shrink-0"
          >
            {word}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
