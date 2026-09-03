export type Theme = "dark" | "light";
const KEY = "theme";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem(KEY) === "light" ? "light" : "dark";
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try { localStorage.setItem(KEY, theme); } catch { /* ignore */ }
}

// Script inline injecté dans <head> pour poser data-theme avant le premier paint — sans ça,
// la page flashe en sombre avant de basculer en clair. Pose toujours une valeur explicite
// ("dark" y compris) : le variant dark: de Tailwind (voir app/globals.css) cible
// [data-theme="dark"], donc un <html> sans attribut du tout ne matcherait ni l'un ni l'autre.
export const THEME_INIT_SCRIPT = `
try {
  var t = localStorage.getItem('${KEY}') === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
} catch (e) {}
`;
