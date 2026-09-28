// Formules d'abonnement (partagé navigateur + serveur). Deux usages × deux niveaux :
//  • Solo  — l'app pour soi, sans coach ;
//  • Coach — la plateforme pour gérer ses clients (ses clients ne paient rien).
// Base = toute l'app avec une IA plafonnée ; Premium = IA "illimitée" (usage raisonnable,
// plafonds anti-abus dans lib/aiQuota.ts). Prix en CHF, TTC.

export type Plan = "solo_base" | "solo_premium" | "coach_base" | "coach_premium";
export type Tier = "premium" | "base" | "none";

export type PlanConfig = {
  label: string;
  audience: "solo" | "coach";
  tier: Exclude<Tier, "none">;
  monthlyChf: number;
  yearlyChf: number;
  maxClients?: number;
  features: string[];
};

export const PLANS: Record<Plan, PlanConfig> = {
  solo_base: {
    label: "Solo Base", audience: "solo", tier: "base", monthlyChf: 12, yearlyChf: 99,
    features: [
      "Toute l'app : programmes, séance live, nutrition, suivi",
      "3 analyses de repas par photo / jour",
      "1 idée de repas IA / jour",
      "1 estimation de masse grasse IA / mois",
    ],
  },
  solo_premium: {
    label: "Solo Premium", audience: "solo", tier: "premium", monthlyChf: 19, yearlyChf: 159,
    features: [
      "Tout Solo Base",
      "IA illimitée : analyses photo, idées de repas, coach IA",
      "Estimation de masse grasse IA illimitée",
      "Bilan hebdomadaire IA",
    ],
  },
  coach_base: {
    label: "Coach Base", audience: "coach", tier: "base", monthlyChf: 25, yearlyChf: 249, maxClients: 10,
    features: [
      "Jusqu'à 10 clients (gratuit pour eux)",
      "CRM complet, programmes, mésocycles, messagerie",
      "IA plafonnée pour toi et tes clients",
    ],
  },
  coach_premium: {
    label: "Coach Premium", audience: "coach", tier: "premium", monthlyChf: 49, yearlyChf: 490, maxClients: 30,
    features: [
      "Jusqu'à 30 clients (gratuit pour eux)",
      "IA illimitée pour toi et tous tes clients",
      "Génération de programmes par IA",
    ],
  },
};

export const TRIAL_DAYS = { solo: 7, coach: 14 } as const;
// Délai de grâce après une échéance impayée ou dépassée avant de couper l'accès.
export const GRACE_DAYS = 3;

// Ce que voit l'app d'un compte : d'où vient son accès et à quel niveau.
export type Entitlement = {
  kind: "owner" | "coach" | "coach_client" | "solo";
  plan: Plan | null;
  status: "trialing" | "active" | "past_due" | "canceled" | null;
  tier: Tier;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  maxClients: number | null; // null = illimité
};
