"use client";
import { PlansPage } from "@/components/PlansPage";

export default function CrmAbonnementPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 md:px-8 py-5 md:py-7">
        <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl md:text-5xl text-[var(--t-text)] tracking-wide leading-none mb-6">ABONNEMENT</h1>
        <PlansPage/>
      </div>
    </div>
  );
}
