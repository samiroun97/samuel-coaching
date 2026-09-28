import { supabase } from "@/lib/supabase";

// File d'attente hors ligne des écritures de la séance live. En salle, le réseau coupe
// souvent : sans ça, chaque série validée pendant une coupure partait vers Supabase, échouait
// en silence (supabase-js renvoie { error }, ne lève pas) et était perdue au rechargement.
//
// Principe : on tente l'écriture ; si elle échoue pour une raison réseau, l'opération est
// gardée en localStorage (une entrée par série, la dernière action gagne) et rejouée dans
// l'ordre au retour du réseau (événement "online", ouverture d'une séance, prochaine écriture).
// Une erreur non réseau (RLS, contrainte) n'est pas mise en file : la rejouer ne la corrigerait pas.

export type LogRow = {
  seance_id: string; client_id: string; exercice_index: number; exercice_nom: string;
  set_index: number; poids_reel: number | null; reps_reel: number | null; rir_reel: number | null;
  logged_at: string; warmup: boolean; drops: unknown; warmup_steps: unknown;
};

export type QueuedOp =
  | { kind: "upsertLog"; row: LogRow }
  | { kind: "deleteLog"; seanceId: string; exerciceIndex: number; setIndex: number }
  | { kind: "complete"; seanceId: string; completedAt: string };

const KEY = "offline_seance_ops";
export const QUEUE_EVENT = "offline-queue-change";

const opKey = (op: QueuedOp) =>
  op.kind === "complete" ? `complete:${op.seanceId}`
  : op.kind === "upsertLog" ? `log:${op.row.seance_id}:${op.row.exercice_index}:${op.row.set_index}`
  : `log:${op.seanceId}:${op.exerciceIndex}:${op.setIndex}`;

type Stored = { key: string; op: QueuedOp }[];

function read(): Stored {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Stored; } catch { return []; }
}
function write(list: Stored) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* stockage plein/bloqué */ }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(QUEUE_EVENT));
}

export function pendingOps(): QueuedOp[] {
  return typeof window === "undefined" ? [] : read().map(e => e.op);
}

function enqueue(op: QueuedOp) {
  const key = opKey(op);
  // Même série : l'ancienne opération est remplacée et la nouvelle passe en fin de file.
  write([...read().filter(e => e.key !== key), { key, op }]);
}

function dequeue(key: string) {
  write(read().filter(e => e.key !== key));
}

const isNetworkError = (error: { message?: string } | null, status?: number) =>
  !!error && ((typeof navigator !== "undefined" && !navigator.onLine) || status === 0 || /fetch|network/i.test(error.message ?? ""));

async function run(op: QueuedOp): Promise<{ error: { message?: string } | null; status?: number }> {
  try {
    if (op.kind === "upsertLog") {
      return await supabase.from("seance_logs").upsert(op.row, { onConflict: "seance_id,exercice_index,set_index" });
    }
    if (op.kind === "deleteLog") {
      return await supabase.from("seance_logs").delete()
        .eq("seance_id", op.seanceId).eq("exercice_index", op.exerciceIndex).eq("set_index", op.setIndex);
    }
    return await supabase.from("programme_seances").update({ completed_at: op.completedAt }).eq("id", op.seanceId);
  } catch (e) {
    return { error: { message: e instanceof Error ? e.message : "network" }, status: 0 };
  }
}

let flushing: Promise<void> | null = null;

// Rejoue la file dans l'ordre ; s'arrête à la première erreur réseau (on réessaiera plus tard).
export function flushQueue(): Promise<void> {
  if (flushing) return flushing;
  flushing = (async () => {
    for (const { key, op } of read()) {
      const { error, status } = await run(op);
      if (error && isNetworkError(error, status)) break;
      dequeue(key); // succès, ou erreur définitive : inutile de la garder
    }
  })().finally(() => { flushing = null; });
  return flushing;
}

// Exécute tout de suite si possible, sinon met en file. Les opérations déjà en attente
// passent d'abord, pour garder l'ordre des actions de l'utilisateur.
export async function runOrQueue(op: QueuedOp): Promise<void> {
  if (read().length) {
    enqueue(op);
    await flushQueue();
    return;
  }
  const { error, status } = await run(op);
  if (error && isNetworkError(error, status)) enqueue(op);
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => { flushQueue(); });
}
