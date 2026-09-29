"use client";
export const dynamic = "force-dynamic";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "@/components/Loader";

// L'ancienne section admin est remplacée par le CRM (/crm/clients).
// On redirige pour que les vieux liens/bookmarks ne rouvrent pas
// une interface coach à l'intérieur de l'espace client.
export default function AdminRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/crm/clients"); }, [router]);
  return (
    <div className="min-h-screen bg-[var(--t-bg)] flex items-center justify-center">
      <Loader size={96}/>
    </div>
  );
}
