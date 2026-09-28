"use client";
import { PlansPage } from "@/components/PlansPage";

export default function AbonnementPage() {
  return (
    <div className="px-4 md:px-8 py-6 md:py-8">
      <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-5xl text-[var(--t-text)] tracking-wide leading-none mb-6">ABONNEMENT</h1>
      <PlansPage/>
    </div>
  );
}
