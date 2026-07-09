"use client";
export const dynamic = "force-dynamic";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// L'ancienne section admin est remplacée par le CRM (/crm/clients).
// On redirige pour que les vieux liens/bookmarks ne rouvrent pas
// une interface coach à l'intérieur de l'espace client.
export default function AdminRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/crm/clients"); }, [router]);
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
