import { redirect } from "next/navigation";
// Vue kanban jamais construite — tous les liens internes pointent maintenant directement
// vers /crm/clients (filtrable par étape via ?stage=...). Cette route ne reste que pour un
// éventuel favori/lien externe déjà enregistré sur /crm/pipeline.
export default function PipelinePage() {
  redirect("/crm/clients");
}
