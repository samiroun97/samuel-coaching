import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="block font-[family-name:var(--font-barlow)] font-black text-2xl tracking-[0.2em] text-white text-center mb-12">
          SAMUEL
        </Link>

        <div className="bg-[#111111] border border-white/10 p-8">
          <h1 className="font-[family-name:var(--font-barlow)] font-black text-2xl uppercase tracking-wider text-white mb-2">
            Connexion
          </h1>
          <p className="text-white/40 text-xs mb-8">Accède à ton espace client</p>

          <form className="flex flex-col gap-4">
            <div>
              <label className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c] block mb-2">Email</label>
              <input
                type="email"
                placeholder="ton@email.com"
                className="w-full bg-[#0a0a0a] border border-white/10 text-white placeholder-white/20 text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/50"
              />
            </div>
            <div>
              <label className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c] block mb-2">Mot de passe</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-[#0a0a0a] border border-white/10 text-white placeholder-white/20 text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/50"
              />
            </div>
            <button
              type="submit"
              className="bg-[#c9a84c] text-black text-xs font-bold tracking-[0.2em] uppercase py-4 hover:bg-[#e2c97e] transition-colors mt-2"
            >
              Se connecter
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          Pas encore client ?{" "}
          <Link href="#contact" className="text-[#c9a84c] hover:underline">
            Séance gratuite →
          </Link>
        </p>
      </div>
    </div>
  );
}
