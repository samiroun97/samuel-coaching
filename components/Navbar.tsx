"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Méthode", href: "#methode" },
    { label: "Programmes", href: "#programmes" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#c9a84c]/10" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" style={{ fontFamily: "var(--font-bebas)", filter: "blur(0.3px)", letterSpacing: "0.18em" }} className="text-2xl text-white hover:opacity-70 transition-opacity duration-300">
          SAMUEL<span style={{ color: "#c9a84c" }}>.</span><span style={{ color: "#c9a84c" }}>COACHING</span>
        </Link>

        <ul className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className="text-xs tracking-[0.15em] uppercase text-white/70 hover:text-white transition-colors duration-200"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <Link
              href="/login"
              className="text-xs tracking-[0.15em] uppercase text-white/70 hover:text-white transition-colors duration-200"
            >
              Connexion
            </Link>
          </li>
          <li>
            <a
              href="#contact"
              className="text-xs tracking-[0.15em] uppercase bg-[#c9a84c] text-black px-5 py-2.5 font-semibold hover:bg-[#e2c97e] transition-colors duration-200"
            >
              Séance Gratuite
            </a>
          </li>
        </ul>

        <button
          className="md:hidden text-white p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Ouvrir le menu"
        >
          <div className="w-5 flex flex-col gap-1">
            <span className={`block h-px bg-white transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
            <span className={`block h-px bg-white transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-px bg-white transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
          </div>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-[#0a0a0a] border-t border-[#c9a84c]/10 px-6 py-6 flex flex-col gap-5">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="text-xs tracking-[0.2em] uppercase text-white/70"
            >
              {l.label}
            </a>
          ))}
          <Link href="/login" onClick={() => setMenuOpen(false)} className="text-xs tracking-[0.2em] uppercase text-white/70">
            Connexion
          </Link>
          <a
            href="#contact"
            onClick={() => setMenuOpen(false)}
            className="text-xs tracking-[0.2em] uppercase bg-[#c9a84c] text-black px-5 py-3 text-center font-semibold"
          >
            Séance Gratuite
          </a>
        </div>
      )}
    </nav>
  );
}

