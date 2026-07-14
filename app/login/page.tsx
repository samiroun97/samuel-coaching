"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
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

    if (mode === "forgot") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Cette adresse email n'est pas valide (ex : ton@email.com)."); return; }
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: "https://samuel-coaching-five.vercel.app/reset-password",
      });
      if (error) setError(translateError(error.message));
      else setSuccess("Email envoyé ! Clique sur le lien reçu pour choisir un nouveau mot de passe.");
      setLoading(false);
      return;
    }

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
        {mode !== "forgot" && (
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
        )}

        <div className="bg-[#111111] border border-white/10 p-8">
          {mode === "forgot" && (
            <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }} className="text-white/30 hover:text-white/60 text-xs mb-4 transition-colors">
              ← Retour à la connexion
            </button>
          )}
          <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl uppercase tracking-wider text-white mb-2">
            {mode === "login" ? "Connexion" : mode === "register" ? "Créer un compte" : "Mot de passe oublié"}
          </h1>
          <p className="text-white/40 text-xs mb-8">
            {mode === "login" ? "Accède à ton espace client" : mode === "register" ? "Rejoins l'espace client Samuel Coaching" : "On t'envoie un lien par email pour en choisir un nouveau"}
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
                autoComplete="email"
                placeholder="ton@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 text-white placeholder-white/20 text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/50"
              />
            </div>
            {mode !== "forgot" && (
              <div>
                <label className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c] block mb-2">Mot de passe</label>
                <input
                  type="password"
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 text-white placeholder-white/20 text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/50"
                />
                {mode === "register" && <p className="text-white/25 text-[0.65rem] mt-1.5">Au moins 6 caractères, rien de plus compliqué.</p>}
                {mode === "login" && (
                  <button type="button" onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }}
                    className="text-white/30 hover:text-[#c9a84c] text-[0.65rem] mt-2 transition-colors">
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
            )}

            {error && <p className="text-red-400 text-xs">{error}</p>}
            {success && <p className="text-[#c9a84c] text-xs">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="bg-[#c9a84c] text-black text-xs font-bold tracking-[0.2em] uppercase py-4 hover:bg-[#e2c97e] transition-colors mt-2 disabled:opacity-50"
            >
              {loading ? "..." : mode === "login" ? "Se connecter" : mode === "register" ? "Créer mon compte" : "Envoyer le lien"}
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
