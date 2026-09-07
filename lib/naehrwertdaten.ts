// Base suisse de composition des aliments (BLV/OSAV, naehrwertdaten.ch) — API publique,
// sans clé, gratuite pour usage commercial avec attribution. Complète Open Food Facts
// (surtout produits emballés/marques) avec des aliments génériques bien couverts pour
// la Suisse (viandes, légumes, plats faits maison...) que OFF n'a souvent pas.
const BLV_BASE = "https://api.webapp.prod.blv.foodcase-services.com/BLV_WebApp_WS/webresources/BLV-api";

type BlvSearchHit = { id: number; foodName: string };
type BlvValue = { value: number; component: { code: string } };
type BlvFood = { values: BlvValue[] };

export type NaehrwertdatenProduct = {
  product_name: string;
  brands?: string;
  nutriments: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
    fiber_100g?: number;
  };
};

function valueByCode(values: BlvValue[], code: string): number | undefined {
  return values.find(v => v.component.code === code)?.value;
}

// Toutes les valeurs de cette base sont exprimées pour 100g — pas de conversion nécessaire.
export async function searchNaehrwertdaten(query: string, limit = 6): Promise<NaehrwertdatenProduct[]> {
  const hitsRes = await fetch(`${BLV_BASE}/foods?search=${encodeURIComponent(query)}&lang=fr`);
  const hits = (await hitsRes.json()) as BlvSearchHit[];
  const top = hits.slice(0, limit);

  const foods = await Promise.all(
    top.map(async h => {
      try {
        const res = await fetch(`${BLV_BASE}/food/${h.id}?lang=fr`);
        return { hit: h, food: (await res.json()) as BlvFood };
      } catch {
        return null;
      }
    })
  );

  return foods
    .filter((f): f is { hit: BlvSearchHit; food: BlvFood } => f !== null)
    .map(({ hit, food }) => ({
      product_name: hit.foodName,
      brands: "Base suisse (BLV)",
      nutriments: {
        "energy-kcal_100g": valueByCode(food.values, "ENERCC"),
        proteins_100g: valueByCode(food.values, "PROT625") ?? valueByCode(food.values, "PROT"),
        carbohydrates_100g: valueByCode(food.values, "CHO"),
        fat_100g: valueByCode(food.values, "FAT"),
        fiber_100g: valueByCode(food.values, "FIBT"),
      },
    }))
    .filter(p => typeof p.nutriments["energy-kcal_100g"] === "number");
}
