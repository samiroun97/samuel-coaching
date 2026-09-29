// Dépense énergétique quotidienne — UNE seule implémentation pour l'accueil, la page Nutrition
// et le bilan hebdo (auparavant copiée à trois endroits).
//
// TDEE = BMR + NEAT (pas) + EAT (entraînements) + TEF (digestion). Le TEF (effet thermique
// des aliments, ~10 % de la dépense totale) manquait : la dépense était sous-estimée de
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

export const TEF_RATIO = 0.1;

// Dépense totale et part du TEF (TEF = 10 % du total ⇒ total = (BMR+NEAT+EAT) / 0,9).
export function expenditure(bmrVal: number, neat: number, eat: number) {
  const base = bmrVal + neat + eat;
  if (base <= 0) return { tdee: 0, tef: 0 };
  const tdee = Math.round(base / (1 - TEF_RATIO));
  return { tdee, tef: tdee - base };
}
