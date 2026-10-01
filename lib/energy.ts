// Dépense énergétique quotidienne — UNE seule implémentation pour l'accueil, la page Nutrition
// et le bilan hebdo (auparavant copiée à trois endroits).
//
// TDEE = BMR + NEAT (pas) + EAT (entraînements) + TEF (digestion). Le TEF (effet thermique
// des aliments, calculé selon les macros mangées) manquait : la dépense était sous-estimée de
// ~150-250 kcal/jour par rapport aux méthodes de référence (MacroFactor, calculateurs
// Mifflin/Katch usuels), ce qui faussait le bilan déficit/surplus.

export type EnergyProfile = { poids: number; taille: number; age: number; sexe: string };

// Katch-McArdle si la masse grasse est connue (basé sur la masse maigre), sinon Mifflin-St Jeor.
export function bmr(p: EnergyProfile, bodyFatPct: number | null): number {
  if (bodyFatPct != null) {
    const lbm = p.poids * (1 - bodyFatPct / 100);
    return Math.round(370 + 21.6 * lbm);
  }
  const base = 10 * p.poids + 6.25 * p.taille - 5 * p.age;
  return Math.round(p.sexe === "Femme" ? base - 161 : base + 5);
}

// ~0,04 kcal par pas pour 70 kg, proportionnel au poids.
export const neatFromSteps = (steps: number, poids: number) => Math.round(steps * 0.04 * (poids / 70));

// TEF (effet thermique des aliments) : il dépend de ce qu’on mange, pas d’un % fixe.
// Coût de digestion par macro (valeurs médianes de la littérature) : protéines 20-30 %,
// glucides 5-10 %, lipides 0-3 % de leurs calories.
export const TEF_FACTORS = { proteines: 0.25, glucides: 0.075, lipides: 0.02 } as const;
// Repli quand rien n’est encore saisi ce jour-là (le matin, journée non loggée) : estimation
// d’un TEF « régime mixte » à 10 % de la dépense, pour ne pas sous-estimer la dépense du jour.
export const TEF_FALLBACK_RATIO = 0.1;

export type MacroIntake = { proteines: number; glucides: number; lipides: number };

export const tefFromMacros = (m: MacroIntake) =>
  Math.round(m.proteines * 4 * TEF_FACTORS.proteines + m.glucides * 4 * TEF_FACTORS.glucides + m.lipides * 9 * TEF_FACTORS.lipides);

// Dépense totale = BMR + NEAT + EAT + TEF. TEF calculé sur les macros réellement mangées ;
// sans repas saisi, estimation à 10 % (tefEstimated = true pour l’afficher comme tel).
export function expenditure(bmrVal: number, neat: number, eat: number, intake?: MacroIntake | null) {
  const base = bmrVal + neat + eat;
  if (base <= 0) return { tdee: 0, tef: 0, tefEstimated: true };
  const logged = !!intake && (intake.proteines + intake.glucides + intake.lipides) > 0;
  if (logged && intake) {
    const tef = tefFromMacros(intake);
    return { tdee: base + tef, tef, tefEstimated: false };
  }
  const tdee = Math.round(base / (1 - TEF_FALLBACK_RATIO));
  return { tdee, tef: tdee - base, tefEstimated: true };
}
