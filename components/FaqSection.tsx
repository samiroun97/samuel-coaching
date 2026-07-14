"use client";
import { useState } from "react";
import ScrollReveal from "./ScrollReveal";
import Title from "./Title";

const FAQ = [
  {
    q: "Où se déroulent les séances en présentiel ?",
    a: "Les séances en présentiel ont lieu à Lausanne et ses environs. Le lieu exact (salle partenaire, extérieur ou à domicile) est défini ensemble lors du bilan, selon tes objectifs et ce qui t'arrange le plus.",
  },
  {
    q: "Est-ce que tu proposes du coaching à distance ?",
    a: "Oui. Que tu sois à Lausanne ou ailleurs, l'app de suivi te donne accès à ton programme, ton plan nutritionnel, ta messagerie directe avec moi et tout ton suivi. Le coaching à distance suit exactement la même exigence que le présentiel.",
  },
  {
    q: "Y a-t-il un engagement dans la durée ?",
    a: "Le bilan de 45 minutes est gratuit et sans aucun engagement. Ensuite, tu choisis : à la séance (80 CHF) sans engagement, ou un suivi mensuel (390 CHF/mois) que tu peux arrêter quand tu veux. Pas de contrat piège.",
  },
  {
    q: "Je débute totalement, est-ce pour moi ?",
    a: "Absolument. Chaque programme est construit à partir de ton niveau réel, débutant compris. On avance à ton rythme, avec une technique propre et une progression adaptée — l'objectif est que ça dure, pas que ça brûle une semaine.",
  },
  {
    q: "Comment se passe le paiement, et est-ce remboursable ?",
    a: "Le paiement se fait de manière simple après le bilan, une fois la formule choisie. Si tu commences un suivi mensuel et que ça ne te convient pas, on en parle : je ne cherche pas à retenir quelqu'un qui n'est pas au bon endroit. L'objectif reste ta réussite.",
  },
  {
    q: "Qu'est-ce qui est inclus dans l'app de suivi ?",
    a: "Ton programme d'entraînement, ton plan nutritionnel avec suivi des calories et macros, le suivi de ton poids et de ta composition corporelle, une messagerie directe avec moi, et ton check-in hebdomadaire. Tout est centralisé, sur ordinateur comme sur téléphone.",
  },
];

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group">
        <span className="text-white/85 text-sm sm:text-base font-medium group-hover:text-[#c9a84c] transition-colors">{q}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          className={`shrink-0 transition-transform duration-300 ${open ? "rotate-45" : ""}`}>
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
      <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: open ? "300px" : "0" }}>
        <p className="text-white/50 text-sm leading-relaxed pb-5 pr-8">{a}</p>
      </div>
    </div>
  );
}

export default function FaqSection() {
  return (
    <section id="faq" className="py-24 sm:py-32 bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto px-6">
        <ScrollReveal className="text-center mb-12">
          <p className="section-label mb-3">Questions fréquentes</p>
          <Title as="h2" className="text-[clamp(2.5rem,7vw,4.5rem)]">TOUT SAVOIR</Title>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          {FAQ.map(f => <Item key={f.q} {...f} />)}
        </ScrollReveal>
      </div>
    </section>
  );
}
