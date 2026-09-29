"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Ancienne adresse de la Vue plateforme, désormais intégrée au CRM (/crm/plateforme).
export default function OperateurRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/crm/plateforme"); }, [router]);
  return null;
}
