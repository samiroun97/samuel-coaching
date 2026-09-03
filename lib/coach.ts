import { supabase } from "./supabase";

// Est-ce que cet utilisateur est un coach (plutôt qu'un simple adhérent) ?
export async function isCoachUser(userId: string): Promise<boolean> {
  const { data } = await supabase.from("profiles").select("is_coach").eq("id", userId).single();
  return data?.is_coach ?? false;
}

// Opérateur de la plateforme (toi) : accès à /operateur, vue transverse sur tous les coachs
// inscrits — distinct d'un coach normal qui ne voit que ses propres clients via /crm.
export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase.from("profiles").select("is_platform_admin").eq("id", userId).single();
  return data?.is_platform_admin ?? false;
}

// Un coach suspendu par l'opérateur (coaches.is_active = false) garde son compte
// mais perd l'accès au CRM — vérifié à l'entrée de app/crm/layout.tsx.
export async function isCoachActive(coachProfileId: string): Promise<boolean> {
  const { data } = await supabase.from("coaches").select("is_active").eq("profile_id", coachProfileId).single();
  return data?.is_active ?? true;
}

// id (table coaches, différent de profiles.id) du coach connecté — nécessaire pour
// renseigner coach_id sur les tables comme ai_corrections/bodyfat_ai_corrections.
export async function getMyCoachId(coachProfileId: string): Promise<string | null> {
  const { data } = await supabase.from("coaches").select("id").eq("profile_id", coachProfileId).single();
  return data?.id ?? null;
}

// Email du coach rattaché à ce client (le premier trouvé), ou null si aucun coach assigné.
// Remplace l'ancien SAMUEL_EMAIL codé en dur : chaque client peut désormais avoir un coach différent.
export async function getMyCoachEmail(clientId: string): Promise<string | null> {
  const { data: link } = await supabase
    .from("coach_clients").select("coach_id").eq("client_id", clientId).limit(1).maybeSingle();
  if (!link) return null;
  const { data: coach } = await supabase.from("coaches").select("profile_id").eq("id", link.coach_id).single();
  if (!coach) return null;
  const { data: profile } = await supabase.from("profiles").select("email").eq("id", coach.profile_id).single();
  return profile?.email ?? null;
}

// Nom d'activité du coach lui-même (vue CRM) — pour que le sidebar affiche la marque de CE
// coach plutôt qu'un nom codé en dur : la plateforme est multi-coachs, chacun garde son identité.
export async function getMyOwnBusinessName(coachProfileId: string): Promise<string | null> {
  const { data } = await supabase.from("coaches").select("business_name").eq("profile_id", coachProfileId).single();
  return data?.business_name ?? null;
}

// Nom d'activité du coach rattaché à ce client, ou null si aucun coach assigné —
// pour afficher le bon nom (au lieu d'un texte en dur) dans les écrans que le
// client voit : intro IA, notifications, PDF... business_name vit directement
// sur coaches, pas besoin de passer par profiles comme pour l'email.
export async function getMyCoachBusinessName(clientId: string): Promise<string | null> {
  const { data: link } = await supabase
    .from("coach_clients").select("coach_id").eq("client_id", clientId).limit(1).maybeSingle();
  if (!link) return null;
  const { data: coach } = await supabase.from("coaches").select("business_name").eq("id", link.coach_id).single();
  return coach?.business_name ?? null;
}
