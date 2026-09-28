import { supabase } from "@/lib/supabase";

export type ClientStatusLevel = "ok" | "attention" | "risque";
export type ClientStatus = { level: ClientStatusLevel; daysSinceSeance: number | null; pendingMessageDays: number | null };

const DEFAULT_STATUS: ClientStatus = { level: "risque", daysSinceSeance: null, pendingMessageDays: null };

export const STATUS_LEVEL_COLOR: Record<ClientStatusLevel, string> = { ok: "#7eb8a0", attention: "#e09070", risque: "#e07070" };

function computeLevel(daysSinceSeance: number | null, pendingMessageDays: number | null): ClientStatusLevel {
  if (pendingMessageDays !== null && pendingMessageDays >= 3) return "risque";
  if (daysSinceSeance === null || daysSinceSeance >= 14) return "risque";
  if (pendingMessageDays !== null && pendingMessageDays >= 1) return "attention";
  if (daysSinceSeance >= 7) return "attention";
  return "ok";
}

// Statut d'activité mesuré (vert/orange/rouge) par client, à partir de deux signaux agrégés en
// une passe sur toute la base du coach : la dernière séance terminée, et un message client resté
// sans réponse. Sert de repérage rapide sur le roster (/crm/clients) — complémentaire au
// pipeline_stage réglé à la main par le coach, qui reflète une décision plutôt qu'un signal mesuré.
// Un client absent des deux tables (jamais de séance, jamais de message) retombe sur "risque" par
// défaut : c'est justement le cas qui mérite d'être vu en premier sur le roster.
export async function loadClientStatuses(coachEmail: string): Promise<Map<string, ClientStatus>> {
  const [{ data: seances }, { data: msgs }] = await Promise.all([
    supabase.from("programme_seances").select("assigned_to_email,completed_at").not("completed_at", "is", null),
    supabase.from("messages").select("from_email,to_email,created_at").order("created_at", { ascending: true }),
  ]);

  const lastSeanceByEmail = new Map<string, string>();
  for (const s of seances ?? []) {
    const email = s.assigned_to_email as string | null;
    if (!email || !s.completed_at) continue;
    const prev = lastSeanceByEmail.get(email);
    if (!prev || s.completed_at > prev) lastSeanceByEmail.set(email, s.completed_at as string);
  }

  const lastMsgByClient = new Map<string, { from: string; at: string }>();
  for (const m of msgs ?? []) {
    const client = m.from_email === coachEmail ? m.to_email : m.from_email;
    if (client === coachEmail) continue;
    lastMsgByClient.set(client, { from: m.from_email, at: m.created_at });
  }
  // Conversations marquées "traitées" dans l'Inbox (synchronisées entre appareils via user_state,
  // voir lib/syncStorage) : même règle que le Dashboard et l'Inbox, pour qu'un client ne soit
  // jamais "Message en attente" ici et "Tout est répondu" là-bas.
  const treated = readTreatedConvs();
  for (const email of treated) {
    const last = lastMsgByClient.get(email);
    if (last && last.from !== coachEmail) lastMsgByClient.delete(email);
  }

  const now = Date.now();
  const emails = new Set([...lastSeanceByEmail.keys(), ...lastMsgByClient.keys()]);
  const result = new Map<string, ClientStatus>();
  for (const email of emails) {
    const lastSeance = lastSeanceByEmail.get(email) ?? null;
    const daysSinceSeance = lastSeance ? Math.floor((now - new Date(lastSeance).getTime()) / 86400000) : null;
    const lastMsg = lastMsgByClient.get(email);
    const pendingMessageDays = lastMsg && lastMsg.from !== coachEmail
      ? Math.floor((now - new Date(lastMsg.at).getTime()) / 86400000) : null;
    result.set(email, { level: computeLevel(daysSinceSeance, pendingMessageDays), daysSinceSeance, pendingMessageDays });
  }
  return result;
}

// Conversations que le coach a marquées "traitées" dans l'Inbox (clé localStorage synchronisée).
export function readTreatedConvs(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try { return new Set(JSON.parse(localStorage.getItem("crm_treated_convs") ?? "[]")); } catch { return new Set(); }
}

// "Vu il y a…" à partir de profiles.last_seen_at (mis à jour à l'ouverture de l'app client).
export function lastSeenLabel(iso: string | null | undefined, now = Date.now()): { label: string; days: number | null } {
  if (!iso) return { label: "Jamais connecté", days: null };
  const days = Math.floor((now - new Date(iso).getTime()) / 86400000);
  return { label: days <= 0 ? "Vu aujourd'hui" : days === 1 ? "Vu hier" : `Vu il y a ${days}j`, days };
}

export function statusFor(statuses: Map<string, ClientStatus>, email: string): ClientStatus {
  return statuses.get(email) ?? DEFAULT_STATUS;
}
