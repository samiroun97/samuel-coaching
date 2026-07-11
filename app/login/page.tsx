"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const translateError = (message: string) => {
    const m = message.toLowerCase();
    if (m.includes("already registered") || m.includes("already exists")) return "Un compte existe déjà avec cet email. Essaie de te connecter.";
    if (m.includes("invalid login credentials")) return "Email ou mot de passe incorrect.";
    if (m.includes("password") && (m.includes("short") || m.includes("at least"))) return "Le mot de passe doit contenir au moins 6 caractères.";
    if (m.includes("email") && (m.includes("invalid") || m.includes("valid"))) return "Cette adresse email n'est pas valide.";
    if (m.includes("rate limit")) return "Trop de tentatives, réessaie dans quelques minutes.";
    return message;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (mode === "register" && !nom.trim()) { setError("Merci d'indiquer ton prénom."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Cette adresse email n'est pas valide (ex : ton@email.com)."); return; }
    if (password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères."); return; }

    setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setError(translateError(error.message));
        setLoading(false);
      } else {
        router.push("/dashboard");
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: nom.trim() },
          emailRedirectTo: "https://samuel-coaching-five.vercel.app/dashboard",
        },
      });
      if (error) {
        setError(translateError(error.message));
        setLoading(false);
      } else {
        setSuccess("Compte créé ! Vérifie ton email pour confirmer ton inscription.");
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" style={{ fontFamily: "var(--font-bebas)" }} className="block text-2xl tracking-[0.2em] text-white text-center mb-12">
          SAMUEL<span style={{ color: "#c9a84c" }}>.</span><span style={{ color: "#c9a84c" }}>COACHING</span>
        </Link>

        {/* Toggle */}
        <div className="flex mb-6 border border-white/10">
          <button
            onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
            className={`flex-1 py-3 text-xs tracking-[0.15em] uppercase font-bold transition-colors duration-200 ${mode === "login" ? "bg-[#c9a84c] text-black" : "text-white/40 hover:text-white"}`}
          >
            Connexion
          </button>
          <button
            onClick={() => { setMode("register"); setError(""); setSuccess(""); }}
            className={`flex-1 py-3 text-xs tracking-[0.15em] uppercase font-bold transition-colors duration-200 ${mode === "register" ? "bg-[#c9a84c] text-black" : "text-white/40 hover:text-white"}`}
          >
            Créer un compte
          </button>
        </div>

        <div className="bg-[#111111] border border-white/10 p-8">
          <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl uppercase tracking-wider text-white mb-2">
            {mode === "login" ? "Connexion" : "Créer un compte"}
          </h1>
          <p className="text-white/40 text-xs mb-8">
            {mode === "login" ? "Accède à ton espace client" : "Rejoins l'espace client Samuel Coaching"}
          </p>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {mode === "register" && (
              <div>
                <label className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c] block mb-2">Prénom</label>
                <input
                  type="text"
                  placeholder="Ton prénom"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 text-white placeholder-white/20 text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/50"
                />
              </div>
            )}
            <div>
              <label className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c] block mb-2">Email</label>
              <input
                type="email"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="ton@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 text-white placeholder-white/20 text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/50"
              />
            </div>
            <div>
              <label className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c] block mb-2">Mot de passe</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 text-white placeholder-white/20 text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/50"
              />
              {mode === "register" && <p className="text-white/25 text-[0.65rem] mt-1.5">Au moins 6 caractères, rien de plus compliqué.</p>}
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}
            {success && <p className="text-[#c9a84c] text-xs">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="bg-[#c9a84c] text-black text-xs font-bold tracking-[0.2em] uppercase py-4 hover:bg-[#e2c97e] transition-colors mt-2 disabled:opacity-50"
            >
              {loading ? "..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          Pas encore client ?{" "}
          <Link href="/#contact" className="text-[#c9a84c] hover:underline">
            Séance gratuite →
          </Link>
        </p>
      </div>
    </div>
  );
}
