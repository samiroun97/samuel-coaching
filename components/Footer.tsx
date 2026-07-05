import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/5 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <p className="font-[family-name:var(--font-bebas)] font-black text-2xl tracking-[0.2em] text-white mb-3">SAMUEL</p>
            <p className="section-label text-[0.6rem] mb-6">Fitness · Transformation · Excellence</p>
            <div className="flex gap-5">
              <a href="https://www.instagram.com/samw.coaching/" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-[#c9a84c] transition-colors duration-200">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="https://www.tiktok.com/@samwcoaching" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-[#c9a84c] transition-colors duration-200">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
                </svg>
              </a>
              <a href="https://www.youtube.com/@pushpunch.science" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-[#c9a84c] transition-colors duration-200">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
                </svg>
              </a>
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
              href="mailto:sam97waelti@gmail.com"
              className="text-white/40 text-xs hover:text-white transition-colors duration-200 block mb-2"
            >
              sam97waelti@gmail.com
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

