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

// Script inline injecté dans <head> pour poser data-theme avant le premier
// paint — sans ça, la page flashe en sombre avant de basculer en clair.
export const THEME_INIT_SCRIPT = `
try {
  if (localStorage.getItem('${KEY}') === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  }
} catch (e) {}
`;
