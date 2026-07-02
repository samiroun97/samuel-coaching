"use client";
import { useState } from "react";

export default function ContactSection() {
  const [form, setForm] = useState({ prenom: "", objectif: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <section id="contact" className="py-28 bg-[#0f0d07]">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <div>
          <p className="section-label mb-4">Prêt ?</p>
          <h2 className="font-[family-name:var(--font-barlow)] font-black text-[clamp(2.5rem,5vw,4.5rem)] uppercase leading-none text-white mb-6">
            TON MEILLEUR<br />
            <span className="text-[#c9a84c]">SELF T&apos;ATTEND</span>
          </h2>
          <p className="text-white/50 text-sm leading-relaxed mb-10 max-w-sm">
            La seule question qui compte : est-ce que tu es prêt(e) à faire ce que la plupart ne feront jamais ?
          </p>

          {sent ? (
            <div className="bg-[#c9a84c]/10 border border-[#c9a84c]/30 p-6 text-center">
              <p className="text-[#c9a84c] font-semibold mb-2">Message envoyé !</p>
              <p className="text-white/60 text-sm">Je te réponds sous 24h. Prépare-toi.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="section-label text-[0.6rem] block mb-2">Prénom</label>
                <input
                  type="text"
                  required
                  placeholder="Ton prénom"
                  value={form.prenom}
                  onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                  className="w-full bg-[#111111] border border-white/10 text-white placeholder-white/30 text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                />
              </div>
              <div>
                <label className="section-label text-[0.6rem] block mb-2">Objectif</label>
                <select
                  required
                  value={form.objectif}
                  onChange={(e) => setForm({ ...form, objectif: e.target.value })}
                  className="w-full bg-[#111111] border border-white/10 text-white text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/50 transition-colors appearance-none"
                >
                  <option value="">Choisir...</option>
                  <option>Perte de poids</option>
                  <option>Prise de masse</option>
                  <option>Performance sportive</option>
                  <option>Transformation complète</option>
                </select>
              </div>
              <div>
                <label className="section-label text-[0.6rem] block mb-2">Dis-moi où tu en es</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Niveau actuel, objectifs, blocages..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full bg-[#111111] border border-white/10 text-white placeholder-white/30 text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/50 transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                className="bg-[#c9a84c] text-black text-xs font-bold tracking-[0.2em] uppercase py-4 hover:bg-[#e2c97e] transition-colors duration-300"
              >
                Envoyer ma demande →
              </button>
            </form>
          )}

          <div className="flex gap-6 mt-8">
            {["Sans engagement", "Réponse en 24h", "100% personnalisé"].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-[#c9a84c]" />
                <span className="text-white/40 text-xs">{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Samuel image */}
        <div className="relative hidden md:block">
          <div
            className="aspect-[3/4] bg-cover bg-center"
            style={{ backgroundImage: "url('/photos/samuel-contact.jpg')" }}
          >
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#0f0d07]/60" />
          </div>
          <div className="absolute bottom-6 left-6">
            <p className="text-white/40 text-[0.6rem] tracking-widest uppercase mb-1">Coach certifié</p>
            <p className="font-[family-name:var(--font-barlow)] font-black text-4xl uppercase text-white tracking-wider">SAMUEL</p>
          </div>
        </div>
      </div>
    </section>
  );
}
