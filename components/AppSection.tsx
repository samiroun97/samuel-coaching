import Link from "next/link";
import ScrollReveal from "./ScrollReveal";
import { Icon } from "@/components/Icon";
import { Apple, Zap, BarChart3, MessageCircle } from "@/lib/solarIcons";

const FEATURE_ICON: Record<string, typeof Apple> = { nutrition: Apple, programme: Zap, suivi: BarChart3, messages: MessageCircle };
function FeatureIcon({ name }: { name: string }) {
  const icon = FEATURE_ICON[name];
  return icon ? <Icon icon={icon} size={18} strokeWidth={1.5} className="text-[#c9a84c]"/> : null;
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
          <p className="text-white/50 text-sm leading-relaxed mb-10">
            Ton suivi nutrition, ton programme d&apos;entraînement, tes stats et tes échanges avec moi — tout accessible en un tap, où que tu sois.
          </p>

          <div className="flex flex-wrap gap-5 mb-10">
            {features.map((f) => (
              <div key={f.title} className="flex flex-col items-center text-center gap-2">
                <div className="w-11 h-11 shrink-0 rounded-full border border-[#c9a84c]/25 bg-[#c9a84c]/5 flex items-center justify-center">
                  <FeatureIcon name={f.icon} />
                </div>
                <span className="text-[0.6rem] tracking-wide text-white/50 uppercase">{f.title}</span>
              </div>
            ))}
          </div>

          <p className="text-white/40 text-xs leading-relaxed mb-6">
            L&apos;app est <span className="text-[#c9a84c]">100% gratuite</span>. Pour y accéder, crée ton compte dans l&apos;espace membre — c&apos;est immédiat.
          </p>

          <Link
            href="/login?invite=E14D03&mode=register"
            className="group relative inline-flex items-center gap-4 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-xs font-bold tracking-[0.25em] uppercase px-10 py-4 overflow-hidden rounded-xl shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
          >
            CRÉER MON COMPTE
            <span className="text-base">→</span>
          </Link>
        </ScrollReveal>

        {/* Right — phone mockup */}
        <ScrollReveal direction="right" className="flex items-center justify-center">
          <div className="relative">
            {/* Decorative gold wave */}
            <svg className="absolute -inset-24 -z-10 opacity-10 blur-2xl" viewBox="0 0 400 700" preserveAspectRatio="none">
              <defs>
                <linearGradient id="appWaveGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#c9a84c" />
                  <stop offset="100%" stopColor="#e8c76a" />
                </linearGradient>
              </defs>
              <path d="M0,420 C90,320 140,520 230,400 C320,280 360,560 400,460 L400,700 L0,700 Z" fill="url(#appWaveGrad)" />
            </svg>

            {/* Soft white halo — separates the phone from the black background */}
            <div className="absolute -inset-6 blur-3xl rounded-full" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.05), transparent 65%)" }} />
            <div className="absolute inset-0 blur-3xl rounded-full" style={{ background: "radial-gradient(circle, rgba(201,168,76,0.15), transparent 70%)" }} />

            {/* Metallic bezel */}
            <div className="relative w-[264px] h-[544px] rounded-[2.9rem] p-[3px] shadow-2xl" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.45), rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.3))" }}>
              <div className="relative w-full h-full rounded-[2.75rem] bg-[#050505] p-1.5">
                <div className="relative w-full h-full rounded-[2.4rem] overflow-hidden flex flex-col items-center justify-center" style={{ background: "linear-gradient(160deg,#111 0%,#0f0d07 100%)" }}>
                  {/* Screen sheen */}
                  <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06), transparent 40%)" }} />

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

                  <img src="/icons/icon-512.png" alt="Samuel Coaching" className="w-24 h-24 rounded-[1.5rem] mt-8 shadow-lg" />

                  <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-8 opacity-40">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
