import Link from "next/link";
import ScrollReveal from "./ScrollReveal";

function FeatureIcon({ name }: { name: string }) {
  const p = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "#c9a84c", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "nutrition": return <svg {...p}><path d="M5 21c8 0 14-6 14-14V3h-4C7 3 3 9 3 17v4z" /></svg>;
    case "programme": return <svg {...p}><rect x="2" y="9" width="3" height="6" rx="1" /><rect x="19" y="9" width="3" height="6" rx="1" /><rect x="6" y="7" width="3" height="10" rx="1" /><rect x="15" y="7" width="3" height="10" rx="1" /><line x1="9" y1="12" x2="15" y2="12" /></svg>;
    case "suivi": return <svg {...p}><polyline points="3 17 9 11 13 15 21 7" /><polyline points="15 7 21 7 21 13" /></svg>;
    case "messages": return <svg {...p}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>;
    default: return null;
  }
}

const features = [
  { icon: "nutrition", title: "Nutrition" },
  { icon: "programme", title: "Programme" },
  { icon: "suivi", title: "Suivi & stats" },
  { icon: "messages", title: "Messages" },
];

export default function AppSection() {
  return (
    <section id="app" className="py-28 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">

        {/* Left — text */}
        <ScrollReveal direction="left">
          <p className="section-label mb-4">Application</p>
          <h2 style={{ fontFamily: "var(--font-bebas)" }} className="text-[clamp(2.5rem,5vw,4rem)] uppercase leading-none mb-6">
            <span className="text-white">TON COACHING<br /></span>
            <span style={{ color: "#c9a84c" }}>DANS TA POCHE</span>
          </h2>
          <p className="text-white/50 text-sm leading-relaxed mb-10 max-w-sm">
            Ton suivi nutrition, ton programme d&apos;entraînement, tes stats et tes échanges avec moi — tout accessible en un tap, où que tu sois.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-10">
            {features.map((f) => (
              <div key={f.title} className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 rounded-full border border-[#c9a84c]/25 bg-[#c9a84c]/5 flex items-center justify-center">
                  <FeatureIcon name={f.icon} />
                </div>
                <span className="text-[0.65rem] tracking-wide text-white/50 uppercase">{f.title}</span>
              </div>
            ))}
          </div>

          <p className="text-white/40 text-xs leading-relaxed mb-6 max-w-sm">
            L&apos;app est <span className="text-[#c9a84c]">100% gratuite</span>. Pour y accéder, crée ton compte dans l&apos;espace membre — c&apos;est immédiat.
          </p>

          <Link
            href="/login"
            className="group relative inline-flex items-center gap-4 bg-[#c9a84c] text-black text-xs font-bold tracking-[0.25em] uppercase px-10 py-4 overflow-hidden hover:bg-[#e2c97e] transition-colors duration-300"
          >
            CRÉER MON COMPTE
            <span className="text-base">→</span>
          </Link>
        </ScrollReveal>

        {/* Right — phone mockup */}
        <ScrollReveal direction="right" className="flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 blur-3xl rounded-full" style={{ background: "radial-gradient(circle, rgba(201,168,76,0.25), transparent 70%)" }} />

            <div className="relative w-[260px] h-[540px] rounded-[2.8rem] border-[3px] border-white/15 bg-[#050505] p-2.5 shadow-2xl">
              <div className="relative w-full h-full rounded-[2.2rem] overflow-hidden flex flex-col items-center justify-center" style={{ background: "linear-gradient(160deg,#0a0a0a 0%,#0f0d07 100%)" }}>
                {/* Notch */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-5 rounded-full bg-black/60" />

                {/* Wordmark */}
                <div className="text-center">
                  <div style={{ lineHeight: 1 }}>
                    <span style={{ fontFamily: "var(--font-bebas)", fontSize: "2.4rem", color: "white" }}>SAMUEL</span>
                    <span style={{ fontFamily: "var(--font-bebas)", fontSize: "2.4rem", color: "#c9a84c" }}>.</span>
                  </div>
                  <div style={{ fontSize: "0.7rem", letterSpacing: "0.45em", color: "#c9a84c", marginTop: "0.3rem" }}>
                    COACHING
                  </div>
                </div>

                {/* Decorative ring, echoes the app's calorie ring */}
                <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90 mt-10">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#c9a84c" strokeWidth="6" strokeLinecap="round" strokeDasharray="230 314" />
                </svg>

                <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-8 opacity-30">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
