"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { WeeklyReport, type WeeklyReportData } from "@/components/WeeklyReport";

export default function BilanPage() {
  const [data, setData] = useState<WeeklyReportData | null | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("pending_weekly_report");
      setData(raw ? (JSON.parse(raw) as WeeklyReportData) : null);
    } catch {
      setData(null);
    }
  }, []);

  if (data === undefined) return null;

  if (data === null) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl">
        <p className="text-white/40 text-sm mb-4">
          Aucun bilan à afficher — génère-le depuis la page Suivi.
        </p>
        <Link href="/dashboard/suivi" className="text-[#c9a84c] text-[0.7rem] tracking-[0.15em] uppercase hover:text-[#e2c97e] transition-colors">
          ← Retour au suivi
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="print:hidden flex items-center justify-between gap-4 flex-wrap px-4 sm:px-8 pt-6">
        <Link href="/dashboard/suivi" className="text-white/40 hover:text-white/70 transition-colors text-[0.7rem] tracking-[0.15em] uppercase flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Retour
        </Link>
        <button onClick={() => window.print()}
          className="bg-[#c9a84c] text-black text-[0.7rem] font-bold tracking-[0.15em] uppercase px-5 py-2.5 hover:bg-[#e2c97e] transition-colors">
          Enregistrer en PDF →
        </button>
      </div>
      <WeeklyReport data={data} />
    </div>
  );
}
