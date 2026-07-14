"use client";
import { useEffect, useRef } from "react";
import Title from "./Title";

export default function HeroSection() {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (bgRef.current) {
        bgRef.current.style.transform = `translateY(${window.scrollY * 0.4}px)`;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div ref={bgRef} className="absolute inset-0 scale-110">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src="/videos/hero.mp4"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/70 via-[#0a0a0a]/50 to-[#0a0a0a]" />
      </div>

      <div className="relative z-10 text-center max-w-5xl mx-auto px-6 pt-24 -mt-24">
        <div style={{ opacity: 1, transform: "translateY(0)", animation: "fadeInUp 1s ease 0.2s both" }}>
          <p className="section-label mb-8">Coach Sportif à Lausanne · Fitness & Transformation</p>
        </div>

        <div style={{ animation: "fadeInUp 1s ease 0.4s both" }}>
          <Title as="h1" className="text-[clamp(5rem,15vw,11rem)] mb-0">
            TRANSFORME
          </Title>
        </div>

        <div className="flex items-center gap-4 justify-center my-4" style={{ animation: "fadeInUp 1s ease 0.5s both" }}>
          <div className="h-px flex-1 max-w-[120px] bg-gradient-to-r from-transparent to-[#c9a84c]" />
          <span className="section-label text-[0.6rem]">EST. 2025</span>
          <div className="h-px flex-1 max-w-[120px] bg-gradient-to-l from-transparent to-[#c9a84c]" />
        </div>

        <div style={{ animation: "fadeInUp 1s ease 0.6s both" }}>
          <Title as="h2" className="text-[clamp(1.5rem,5vw,3.5rem)] mb-8">
            Ton Corps. Ton Mental. Ta Vie.
          </Title>
        </div>

        <p className="text-white/50 text-sm tracking-wide max-w-md mx-auto mb-12 leading-relaxed"
          style={{ animation: "fadeInUp 1s ease 0.7s both" }}>
          Coaching sur mesure à Lausanne et en ligne. Un accompagnement d&apos;élite pour
          des résultats réels. Pas de raccourcis. Pas de compromis. Juste la transformation
          que tu mérites.
        </p>

        <div className="flex justify-center" style={{ animation: "fadeInUp 1s ease 0.8s both" }}>
          <a href="#contact"
            className="group relative bg-[#c9a84c] text-black text-xs font-bold tracking-[0.25em] uppercase px-10 py-4 overflow-hidden hover:scale-105 transition-transform duration-300">
            <span className="relative z-10">Je commence maintenant</span>
            <div className="absolute inset-0 bg-[#e8c76a] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          </a>
        </div>
      </div>
    </section>
  );
}
