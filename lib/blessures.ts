// Le champ blessures est du texte libre saisi par le client à l'inscription : "Aucune",
// "rien", "non", "RAS"… veulent dire "pas de blessure" et ne doivent pas déclencher
// d'alerte (orange) dans le CRM.
export const hasBlessure = (b: string | null | undefined): boolean =>
  !!b && !/^\s*(aucune?s?|rien|non|nope|ras|r\.a\.s\.?|-+|—|n\/a|pas de blessures?)\s*\.?\s*$/i.test(b);
