"use client";
import { useRouter } from "next/navigation";

// Interrupteur "Mode coach" pour un compte coach : allumé dans le CRM, éteint dans l'aperçu
// de son espace client. Remplace l'ancien bouton pastille "Espace coach".
export function ModeSwitch({ mode, className = "" }: { mode: "coach" | "client"; className?: string }) {
  const router = useRouter();
  const on = mode === "coach";
  const toggle = () => {
    if (on) { router.push("/dashboard?preview=1"); return; }
    try { sessionStorage.removeItem("client_preview"); } catch { /* ignore */ }
    router.push("/crm/clients");
  };
  return (
    <button type="button" role="switch" aria-checked={on} onClick={toggle}
      className={`group inline-flex items-center gap-2.5 rounded-full border border-[var(--t-border-soft)] bg-[var(--t-surface)] pl-3.5 pr-1.5 py-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-[#c9a84c]/40 transition-colors ${className}`}>
      <span className={`text-[0.62rem] font-bold tracking-[0.12em] uppercase transition-colors ${on ? "text-[#a8893a]" : "text-[var(--t-text-50)]"}`}>Mode coach</span>
      <span className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${on ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c]" : "bg-[var(--t-border)]"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.25)] transition-transform duration-200 ${on ? "translate-x-4" : ""}`}/>
      </span>
    </button>
  );
}
