"use client";
export const dynamic = "force-dynamic";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Les corrections IA sont désormais transverses à toute la plateforme (tous coachs
// confondus), donc rattachées au CRM (/operateur) plutôt qu'à un coach en particulier.
// On redirige pour que les vieux liens/bookmarks ne rouvrent pas cette page.
export default function CrmIaRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/operateur"); }, [router]);
  return (
    <div className="min-h-screen bg-[var(--t-bg)] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
