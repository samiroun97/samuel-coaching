import { searchNaehrwertdaten, type NaehrwertdatenProduct } from "./naehrwertdaten";

async function searchOpenFoodFacts(query: string, limit: number): Promise<NaehrwertdatenProduct[]> {
  const res = await fetch(
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=${limit}&fields=product_name,brands,nutriments&search_simple=1&action=process&lc=fr`
  );
  const data = await res.json();
  type Raw = { product_name?: string; brands?: string; nutriments?: NaehrwertdatenProduct["nutriments"] };
  return ((data.products as Raw[]) ?? [])
    .filter((p): p is Required<Pick<Raw, "product_name" | "nutriments">> & Raw => !!(p.product_name && p.nutriments?.["energy-kcal_100g"]))
    .slice(0, limit)
    .map(p => ({ product_name: p.product_name, brands: p.brands, nutriments: p.nutriments }));
}

function renderEntry(source: string, p: NaehrwertdatenProduct): string {
  const n = p.nutriments;
  const label = source === "Open Food Facts" && p.brands ? `${source} (${p.brands})` : source;
  return `${label}: "${p.product_name}" — ${Math.round(n["energy-kcal_100g"] ?? 0)} kcal, P${n.proteins_100g ?? "?"} G${n.carbohydrates_100g ?? "?"} L${n.fat_100g ?? "?"} (pour 100g)`;
}

// Pour chaque ingrédient identifié par l'IA, cherche des valeurs réelles dans les deux
// bases (suisse pour les aliments génériques, Open Food Facts pour les produits de
// marque) et construit un bloc texte de référence à injecter dans le prompt final.
// Best-effort : un ingrédient sans correspondance dans aucune base est simplement omis,
// l'IA garde alors sa propre estimation pour celui-là.
export async function buildIngredientReferences(ingredients: { ingredient: string; grams: number }[]): Promise<string> {
  const capped = ingredients.filter(i => i.ingredient && typeof i.grams === "number").slice(0, 6);
  if (!capped.length) return "";

  const lines = await Promise.all(
    capped.map(async ({ ingredient, grams }) => {
      const [chRes, offRes] = await Promise.allSettled([
        searchNaehrwertdaten(ingredient, 2),
        searchOpenFoodFacts(ingredient, 2),
      ]);
      const entries = [
        ...(chRes.status === "fulfilled" ? chRes.value.map(p => renderEntry("Base suisse", p)) : []),
        ...(offRes.status === "fulfilled" ? offRes.value.map(p => renderEntry("Open Food Facts", p)) : []),
      ];
      if (!entries.length) return null;
      return `- ${ingredient} (≈${Math.round(grams)}g estimés) :\n  · ${entries.join("\n  · ")}`;
    })
  );

  const found = lines.filter((l): l is string => l !== null);
  if (!found.length) return "";

  return `\n\nValeurs nutritionnelles réelles trouvées dans des bases de données officielles pour certains des ingrédients identifiés (pour 100g de l'aliment tel que nommé, à ajuster au poids réellement présent) — utilise-les comme référence prioritaire UNIQUEMENT si l'entrée correspond vraiment à ce que tu vois/lis (même état : cru vs cuit, avec ou sans peau/os/panure, nature vs sauce...) ; sinon ignore-la et garde ton estimation habituelle :\n${found.join("\n")}`;
}
