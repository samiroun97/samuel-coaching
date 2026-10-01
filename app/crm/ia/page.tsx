"use client";
export const dynamic = "force-dynamic";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SplashScreen } from "@/components/Loader";

// Les corrections IA sont désormais transverses à toute la plateforme (tous coachs
// confondus), donc rattachées au CRM (/operateur) plutôt qu'à un coach en particulier.
// On redirige pour que les vieux liens/bookmarks ne rouvrent pas cette page.
export default function CrmIaRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/crm/plateforme"); }, [router]);
  return (
    <div className="min-h-screen bg-[var(--t-bg)] flex items-center justify-center">
      <SplashScreen/>
    </div>
  );
}
