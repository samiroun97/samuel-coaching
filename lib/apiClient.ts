import { supabase } from "@/lib/supabase";

const DEFAULT_TIMEOUT_MS = 45_000;

// Sans timeout, une requête qui reste en suspens (réseau mobile instable, typiquement
// Android en zone de faible couverture) laisse l'UI bloquée en "chargement" indéfiniment —
// et comme les boutons d'action restent désactivés tant que la requête est en cours, le
// symptôme perçu est que la fonctionnalité entière (caméra, scan) ne répond plus.
export async function withTimeout<T>(promise: Promise<T>, ms = DEFAULT_TIMEOUT_MS, message = "La requête a pris trop de temps — vérifie ta connexion et réessaie."): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

// POST vers nos routes /api/* avec le jeton de session Supabase.
export async function apiPost(url: string, body: unknown, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const { data: { session } } = await supabase.auth.getSession();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("La requête a pris trop de temps — vérifie ta connexion et réessaie.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
