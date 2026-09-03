import { type ClientStatus, STATUS_LEVEL_COLOR } from "@/lib/clientStatus";

function reasonText(s: ClientStatus): string {
  const parts: string[] = [];
  parts.push(s.daysSinceSeance === null ? "Aucune séance terminée" : `Dernière séance il y a ${s.daysSinceSeance}j`);
  if (s.pendingMessageDays !== null) parts.push(`message sans réponse depuis ${s.pendingMessageDays}j`);
  return parts.join(" · ");
}

// Pastille de statut d'activité (vert/orange/rouge) sur le roster — cf. lib/clientStatus.ts
// pour le calcul. Le titre HTML natif (tooltip au survol) explique le signal sans devoir
// cliquer sur le client, pour rester scannable sur une liste entière.
export function ClientStatusDot({ status }: { status: ClientStatus }) {
  return (
    <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_LEVEL_COLOR[status.level] }}
      title={reasonText(status)}/>
  );
}
