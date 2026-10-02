"use client";
import { PlansPage } from "@/components/PlansPage";
import { RichIcon } from "@/components/RichIcon";

export default function AbonnementPage() {
  return (
    <div className="px-4 md:px-8 py-6 md:py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative w-[84px] h-[84px] md:w-[100px] md:h-[100px] flex items-center justify-center shrink-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl pointer-events-none icon-halo"
            style={{ width: 122, height: 122 }}/>
          <div className="relative animate-levitate-soft">
            <RichIcon name="abonnement" size={100} className="w-[84px]! h-[84px]! md:w-[100px]! md:h-[100px]! drop-shadow-[0_10px_14px_rgba(0,0,0,0.14)]"/>
          </div>
        </div>
        <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-5xl text-[var(--t-text)] tracking-wide leading-none">ABONNEMENT</h1>
      </div>
      <PlansPage/>
    </div>
  );
}
