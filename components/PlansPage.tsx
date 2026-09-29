"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiPost } from "@/lib/apiClient";
import { PLANS, type Entitlement, type Plan } from "@/lib/plans";
import { Icon } from "@/components/Icon";
import { Check } from "@/lib/solarIcons";
import { Loader } from "@/components/Loader";

// Page Abonnement (espace client et CRM) : formule actuelle, essai en cours, et les deux
// niveaux Base/Premium de l'usage concerné (Solo ou Coach). Le paiement en ligne (Stripe)
// s'activera quand STRIPE_SECRET_KEY sera configurée — d'ici là, boutons désactivés.
type Me = { entitlement: Entitlement; clientsCount: number | null; paymentsEnabled: boolean };

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("fr-CH", { day: "numeric", month: "long", year: "numeric" });
const daysLeft = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));

export function PlansPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  const [yearly, setYearly] = useState(false);

  useEffect(() => {
    apiPost("/api/billing/me", {})
      .then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error ?? `Erreur ${r.status}`); setMe(j as Me); })
      .catch(e => setError(e instanceof Error ? e.message : "Erreur"));
  }, []);

  if (error) return <p className="text-sm text-[#e07070]">{error}</p>;
  if (!me) return <div className="flex justify-center py-16"><Loader size={64}/></div>;

  const ent = me.entitlement;
  const isOwner = ent.kind === "owner";
  const audience: "solo" | "coach" = ent.kind === "coach" || isOwner ? "coach" : "solo";
  // L'opérateur ne paie rien mais voit toutes les formules, en aperçu (boutons inactifs).
  const groups: ("solo" | "coach")[] = isOwner ? ["solo", "coach"] : [audience];
  const plansOf = (a: "solo" | "coach") => (Object.keys(PLANS) as Plan[]).filter(p => PLANS[p].audience === a);

  // ── Statut actuel ──
  let statusTitle = "";
  let statusText = "";
  if (ent.kind === "owner") {
    statusTitle = "Compte opérateur";
    statusText = "Accès complet à toute la plateforme, pour toi et tes clients.";
  } else if (ent.kind === "coach_client") {
    statusTitle = ent.tier === "none" ? "Accès suspendu" : "Accès inclus par ton coach";
    statusText = ent.tier === "none"
      ? "L'abonnement de ton coach est inactif. Contacte-le pour rétablir ton accès."
      : `Ton coach prend en charge ton accès (niveau ${ent.tier === "premium" ? "Premium" : "Base"}). Tu n'as rien à payer.`;
  } else if (ent.plan) {
    const label = PLANS[ent.plan].label;
    if (ent.tier === "none") {
      statusTitle = ent.status === "trialing" ? "Essai terminé" : "Abonnement inactif";
      statusText = "Choisis une formule pour continuer à utiliser l'IA et les fonctions avancées.";
    } else if (ent.status === "trialing" && ent.trialEndsAt) {
      const d = daysLeft(ent.trialEndsAt);
      statusTitle = `Essai ${label} — ${d} jour${d > 1 ? "s" : ""} restant${d > 1 ? "s" : ""}`;
      statusText = `Ton essai gratuit se termine le ${fmtDate(ent.trialEndsAt)}. Choisis ta formule pour continuer sans interruption.`;
    } else {
      statusTitle = label;
      statusText = ent.currentPeriodEnd ? `Prochaine échéance le ${fmtDate(ent.currentPeriodEnd)}.` : "Abonnement actif.";
    }
  } else {
    statusTitle = "Accès complet";
    statusText = "Les formules seront bientôt disponibles.";
  }

  const showPlans = ent.kind === "solo" || ent.kind === "coach" || isOwner;

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className={`rounded-2xl border px-5 py-4 bg-[var(--t-surface)] shadow-[0_2px_14px_-8px_rgba(0,0,0,0.15),0_0_22px_-6px_rgba(201,168,76,0.22)] ${ent.tier === "none" ? "border-[#e07070]/40" : "border-[var(--t-border-soft)]"}`}>
        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-[var(--t-text-50)]">Ta formule</p>
        <p className="text-[1.05rem] font-bold text-[var(--t-text)] mt-0.5">{statusTitle}</p>
        <p className="text-[0.8rem] text-[var(--t-text-50)] mt-1">{statusText}</p>
        {audience === "coach" && me.clientsCount !== null && (
          <p className="text-[0.8rem] text-[var(--t-text-70)] mt-2">
            Clients : <span className="font-semibold">{me.clientsCount}</span>{ent.maxClients !== null ? ` / ${ent.maxClients}` : ""}
          </p>
        )}
      </div>

      {showPlans && (
        <>
          <div className="self-start inline-flex rounded-full border border-[var(--t-border-soft)] bg-[var(--t-surface)] p-1 text-[0.72rem] font-semibold">
            {([false, true] as const).map(y => (
              <button key={String(y)} onClick={() => setYearly(y)}
                className={`px-4 py-1.5 rounded-full transition-colors ${yearly === y ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black" : "text-[var(--t-text-50)]"}`}>
                {y ? "Annuel · 2 mois offerts" : "Mensuel"}
              </button>
            ))}
          </div>

          {groups.map(g => (
          <div key={g} className="flex flex-col gap-3">
          {isOwner && (
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-[var(--t-text-50)]">
              {g === "solo" ? "Formules Solo · pour utiliser l'app sans coach" : "Formules Coach · pour gérer ses clients"}
            </p>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            {plansOf(g).map(p => {
              const cfg = PLANS[p];
              const current = ent.plan === p && ent.tier !== "none" && ent.status !== "trialing";
              const premium = cfg.tier === "premium";
              return (
                <div key={p} className={`relative rounded-2xl border bg-[var(--t-surface)] px-5 py-5 flex flex-col ${premium ? "border-[#c9a84c]/50 shadow-[0_0_26px_-8px_rgba(201,168,76,0.45)]" : "border-[var(--t-border-soft)] shadow-[0_2px_14px_-8px_rgba(0,0,0,0.15)]"}`}>
                  {premium && (
                    <span className="absolute -top-2.5 left-5 px-2.5 py-0.5 rounded-full bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.12em] uppercase">IA illimitée</span>
                  )}
                  <p className="text-[0.95rem] font-bold text-[var(--t-text)]">{cfg.label}</p>
                  <p className="mt-2">
                    <span style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl text-[var(--t-text)] tracking-wide">
                      {yearly ? cfg.yearlyChf : cfg.monthlyChf} CHF
                    </span>
                    <span className="text-[0.75rem] text-[var(--t-text-50)]"> / {yearly ? "an" : "mois"}</span>
                  </p>
                  <ul className="flex flex-col gap-2 mt-4 mb-5 flex-1">
                    {cfg.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-[0.8rem] text-[var(--t-text-70)]">
                        <Icon icon={Check} size={13} className="text-[#c9a84c] shrink-0 mt-0.5"/>{f}
                      </li>
                    ))}
                  </ul>
                  <button disabled={current || isOwner || !me.paymentsEnabled}
                    className={`py-2.5 rounded-xl text-[0.72rem] font-bold tracking-[0.1em] uppercase transition-all disabled:cursor-not-allowed ${premium ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black disabled:opacity-60" : "border border-[var(--t-border)] text-[var(--t-text-70)] disabled:opacity-60"}`}>
                    {isOwner ? "Aperçu" : current ? "Ta formule actuelle" : me.paymentsEnabled ? "Choisir" : "Paiement en ligne bientôt"}
                  </button>
                </div>
              );
            })}
          </div>
          </div>
          ))}

          <p className="text-[0.7rem] text-[var(--t-text-40)] leading-relaxed">
            Prix en CHF. Résiliable à tout moment, effet à la fin de la période payée. « IA illimitée » s&apos;entend
            pour un usage personnel raisonnable. Voir les <Link href="/cgv" className="underline hover:text-[#c9a84c]">conditions générales</Link>.
          </p>
        </>
      )}
    </div>
  );
}
