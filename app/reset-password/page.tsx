"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") { setValid(true); setReady(true); }
    });
    // Si la session de récupération est déjà établie au montage (lien déjà consommé une fois)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setValid(true);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères."); return; }
    if (password !== confirm) { setError("Les deux mots de passe ne correspondent pas."); return; }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSuccess(true);
    setTimeout(() => router.push("/dashboard"), 1500);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" style={{ fontFamily: "var(--font-bebas)" }} className="block text-2xl tracking-[0.2em] text-white text-center mb-12">
          SAMUEL<span style={{ color: "#c9a84c" }}>.</span><span style={{ color: "#c9a84c" }}>COACHING</span>
        </Link>

        <div className="bg-[#111111] border border-white/10 p-8">
          <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl uppercase tracking-wider text-white mb-2">
            Nouveau mot de passe
          </h1>

          {!ready ? (
            <p className="text-white/40 text-xs">Vérification du lien…</p>
          ) : !valid ? (
            <>
              <p className="text-white/40 text-xs mb-4">
                Ce lien n&apos;est plus valide ou a déjà été utilisé. Redemande un lien depuis la page de connexion.
              </p>
              <Link href="/login" className="text-[#c9a84c] text-xs hover:underline">← Retour à la connexion</Link>
            </>
          ) : success ? (
            <p className="text-[#c9a84c] text-xs">Mot de passe mis à jour ✓ Redirection…</p>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <div>
                <label className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c] block mb-2">Nouveau mot de passe</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 text-white placeholder-white/20 text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/50"
                />
              </div>
              <div>
                <label className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c] block mb-2">Confirme le mot de passe</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 text-white placeholder-white/20 text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/50"
                />
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="bg-[#c9a84c] text-black text-xs font-bold tracking-[0.2em] uppercase py-4 hover:bg-[#e2c97e] transition-colors mt-2 disabled:opacity-50"
              >
                {loading ? "..." : "Valider le nouveau mot de passe"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
