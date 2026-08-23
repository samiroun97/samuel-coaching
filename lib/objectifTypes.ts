export type ObjectifType = "perte_gras" | "prise_muscle" | "recomposition" | "maintien";

export const OBJECTIF_TYPES: { value: ObjectifType; label: string }[] = [
  { value: "perte_gras", label: "Perte de gras" },
  { value: "prise_muscle", label: "Prise de muscle" },
  { value: "recomposition", label: "Recomposition" },
  { value: "maintien", label: "Maintien" },
];

export const OBJECTIF_TYPE_LABEL: Record<ObjectifType, string> = {
  perte_gras: "Perte de gras",
  prise_muscle: "Prise de muscle",
  recomposition: "Recomposition",
  maintien: "Maintien",
};

export type BalanceStatus = "deficit" | "surplus" | "maintenance";

const GOOD = "#7eb8a0";
const BAD = "#e07070";
const NEUTRAL = "#c9a84c";

const BALANCE_LABEL: Record<BalanceStatus, string> = {
  deficit: "Déficit calorique",
  surplus: "Surplus calorique",
  maintenance: "Maintien calorique",
};

// Un déficit n'est "bon" que si l'objectif du client en fait un déficit ; pareil pour
// un surplus. Sans ça, le bilan affichait toujours le déficit en vert et le surplus en
// rouge, ce qui pénalisait visuellement les clients en prise de masse.
const GOAL_STATUS_TABLE: Partial<Record<ObjectifType, Partial<Record<BalanceStatus, { color: string; note: string }>>>> = {
  perte_gras: {
    deficit: { color: GOOD, note: "En ligne avec l'objectif" },
    maintenance: { color: NEUTRAL, note: "Pas de perte cette semaine" },
    surplus: { color: BAD, note: "À l'opposé de l'objectif" },
  },
  prise_muscle: {
    surplus: { color: GOOD, note: "En ligne avec l'objectif" },
    maintenance: { color: NEUTRAL, note: "Prise ralentie" },
    deficit: { color: BAD, note: "À l'opposé de l'objectif" },
  },
  recomposition: {
    deficit: { color: GOOD, note: "Cohérent avec la recomposition" },
    maintenance: { color: GOOD, note: "Cohérent avec la recomposition" },
    surplus: { color: BAD, note: "Trop haut pour recomposer" },
  },
  maintien: {
    maintenance: { color: GOOD, note: "Objectif tenu" },
    deficit: { color: NEUTRAL, note: "Léger déficit" },
    surplus: { color: NEUTRAL, note: "Léger surplus" },
  },
};

export function goalAwareStatus(balance: BalanceStatus, objectifType?: string | null) {
  const match = GOAL_STATUS_TABLE[objectifType as ObjectifType]?.[balance];
  return {
    color: match?.color ?? NEUTRAL,
    label: BALANCE_LABEL[balance],
    note: match?.note ?? null,
  };
}
