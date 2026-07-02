import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/5 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <p className="font-[family-name:var(--font-barlow)] font-black text-2xl tracking-[0.2em] text-white mb-3">SAMUEL</p>
            <p className="section-label text-[0.6rem] mb-6">Fitness · Transformation · Excellence</p>
            <div className="flex gap-4">
              {["Instagram", "TikTok", "YouTube"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="text-white/30 text-xs tracking-widest uppercase hover:text-[#c9a84c] transition-colors duration-200"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="section-label text-[0.6rem] mb-6">Navigation</p>
            <nav className="flex flex-col gap-3">
              {[
                { label: "Ma Méthode", href: "#methode" },
                { label: "À Propos", href: "#about" },
                { label: "Programmes", href: "#programmes" },
                { label: "Résultats", href: "#resultats" },
                { label: "Contact", href: "#contact" },
              ].map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="text-white/40 text-xs tracking-wide hover:text-white transition-colors duration-200"
                >
                  {l.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <p className="section-label text-[0.6rem] mb-6">Contact</p>
            <a
              href="mailto:contact@samuelcoaching.fr"
              className="text-white/40 text-xs hover:text-white transition-colors duration-200 block mb-2"
            >
              contact@samuelcoaching.fr
            </a>
            <p className="text-white/30 text-xs mb-6">Lausanne, Suisse</p>
            <a
              href="#contact"
              className="inline-block border border-[#c9a84c]/40 text-[#c9a84c] text-xs tracking-[0.15em] uppercase px-5 py-2.5 hover:bg-[#c9a84c] hover:text-black transition-colors duration-300"
            >
              Séance gratuite →
            </a>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/20 text-xs">© 2026 Samuel Coaching. Tous droits réservés.</p>
          <div className="flex gap-6">
            <Link href="/mentions-legales" className="text-white/20 text-xs hover:text-white/50 transition-colors">
              Mentions légales
            </Link>
            <Link href="/mentions-legales#donnees-personnelles" className="text-white/20 text-xs hover:text-white/50 transition-colors">
              Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
