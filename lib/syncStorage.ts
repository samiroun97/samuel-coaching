import { supabase } from "@/lib/supabase";

// Synchronisation multi-appareils : les données applicatives stockées en
// localStorage (repas, pas, poids, hydratation…) sont répliquées dans la
// table Supabase user_state, liée au compte. Au chargement, le serveur
// fait foi ; ensuite chaque écriture locale est poussée (debounce 1,5 s).

const SYNC_PREFIXES = [
  "nutrition_",        // repas par jour, objectifs, repas sauvegardés, préférence objectif/TDEE
  "hydration_",        // eau par jour
  "steps_",            // pas par jour + steps_goal
  "programme_logs",    // entraînements loggés
  "perf_history",      // historique de perfs par activité
  "weight_history_",   // historique de poids
  "bodyfat_history",   // historique body fat (avec et sans suffixe uid)
  "msg_seen_",         // dernier message lu
  "crm_treated_convs", // conversations traitées (CRM)
];

let userId: string | null = null;
let patched = false;
let muted = false;
const pending = new Map<string, string | null>();
let timer: ReturnType<typeof setTimeout> | undefined;
let consecutiveFailures = 0;

const shouldSync = (key: string) => SYNC_PREFIXES.some(p => key.startsWith(p));

// Notifie l'UI (voir dashboard/layout.tsx et crm/layout.tsx) au-delà d'un
// certain nombre d'échecs, pour ne pas alarmer sur un simple aller-retour
// réseau ponctuel.
export const SYNC_STATUS_EVENT = "samuel:sync-status";
const FAILURE_THRESHOLD = 3;

function notifySyncStatus(ok: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SYNC_STATUS_EVENT, { detail: { ok } }));
}

function queue(key: string, value: string | null) {
  if (!userId || muted || !shouldSync(key)) return;
  pending.set(key, value);
  clearTimeout(timer);
  timer = setTimeout(() => { void flush(); }, 1500);
}

async function flush() {
  if (!userId || pending.size === 0) return;
  const entries = [...pending.entries()];
  pending.clear();
  const upserts = entries.filter(([, v]) => v !== null)
    .map(([key, value]) => ({ user_id: userId, key, value: value as string, updated_at: new Date().toISOString() }));
  const deletions = entries.filter(([, v]) => v === null).map(([k]) => k);
  try {
    if (upserts.length) {
      const { error } = await supabase.from("user_state").upsert(upserts, { onConflict: "user_id,key" });
      if (error) throw error;
    }
    if (deletions.length) {
      const { error } = await supabase.from("user_state").delete().eq("user_id", userId).in("key", deletions);
      if (error) throw error;
    }
    if (consecutiveFailures >= FAILURE_THRESHOLD) notifySyncStatus(true);
    consecutiveFailures = 0;
  } catch {
    // Hors-ligne ou erreur transitoire : on remet les entrées en file (sans
    // écraser une valeur plus récente déjà en attente pour la même clé) et on
    // reprogramme un flush, sinon ces données ne seraient jamais retentées
    // tant que l'utilisateur ne retouche pas exactement les mêmes clés.
    for (const [key, value] of entries) {
      if (!pending.has(key)) pending.set(key, value);
    }
    clearTimeout(timer);
    timer = setTimeout(() => { void flush(); }, 1500);
    consecutiveFailures++;
    if (consecutiveFailures === FAILURE_THRESHOLD) notifySyncStatus(false);
  }
}

export async function startStateSync(uid: string) {
  if (typeof window === "undefined") return;
  userId = uid;

  if (!patched) {
    patched = true;
    const origSet = Storage.prototype.setItem;
    const origRemove = Storage.prototype.removeItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      origSet.call(this, key, value);
      if (this === window.localStorage) queue(key, value);
    };
    Storage.prototype.removeItem = function (key: string) {
      origRemove.call(this, key);
      if (this === window.localStorage) queue(key, null);
    };
    // Pousser ce qui reste quand on quitte la page
    window.addEventListener("pagehide", () => { void flush(); });
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") void flush(); });
  }

  // Hydratation : rapatrier l'état du compte sur cet appareil
  try {
    const { data } = await supabase.from("user_state").select("key,value").eq("user_id", uid);
    if (data) {
      muted = true;
      for (const row of data) {
        try { window.localStorage.setItem(row.key, row.value); } catch { /* stockage plein */ }
      }
      muted = false;
    }
  } catch { /* table absente ou hors-ligne : l'app fonctionne en local */ }
}
