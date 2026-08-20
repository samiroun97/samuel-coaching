"use client";

import { useState } from "react";

type Mode = "objectif" | "tdee";

const EXPLANATIONS: Record<Mode, { label: string; color: string; text: string }> = {
  tdee: {
    label: "TDEE",
    color: "#7eb8a0",
    text: "Ta dépense totale du jour, c'est ton métabolisme de base (BMR) + ton NEAT (les déplacements et l'activité hors sport) + ton EAT (ta séance de sport). Cette dépense varie d'un jour à l'autre selon ce que tu fais. En mode TDEE, ton apport cible se réadapte automatiquement à cette dépense réelle, jour après jour.",
  },
  objectif: {
    label: "Objectif",
    color: "#c9a84c",
    text: "Un apport calorique fixe, que tu définis une bonne fois pour toutes. Plus stable et plus simple à suivre au quotidien : moins d'oscillations dans tes habitudes alimentaires, peu importe ta dépense du jour.",
  },
};

function ObjectifIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>
    </svg>
  );
}

function TdeeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}

export function CalRefToggle({ value, onChange, tdeeDisabled }: { value: Mode; onChange: (v: Mode) => void; tdeeDisabled?: boolean }) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex items-center gap-2">
        <div className="relative flex border border-[var(--t-border)] rounded-full p-1 bg-[var(--t-surface)] w-[248px]">
          <div className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full transition-transform duration-300 ease-out"
            style={{ backgroundColor: `${EXPLANATIONS[value].color}18`, transform: value === "tdee" ? "translateX(calc(100% + 4px))" : "translateX(0)" }}/>
          {(["objectif", "tdee"] as const).map(key => (
            <button key={key} onClick={() => onChange(key)} disabled={key === "tdee" && tdeeDisabled}
              title={key === "tdee" && tdeeDisabled ? "Profil incomplet" : undefined}
              className="relative z-10 flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-[0.66rem] tracking-[0.12em] uppercase transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ color: value === key ? EXPLANATIONS[key].color : "var(--t-text-30)" }}>
              {key === "objectif" ? <ObjectifIcon/> : <TdeeIcon/>}
              {EXPLANATIONS[key].label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowInfo(v => !v)}
          title="Comment ça marche ?"
          className={`w-[18px] h-[18px] rounded-full border flex items-center justify-center text-[0.6rem] shrink-0 transition-colors ${showInfo ? "border-[#c9a84c] text-[#c9a84c]" : "border-[var(--t-border)] text-[var(--t-text-30)] hover:text-[var(--t-text-60)] hover:border-[var(--t-text-25)]"}`}>
          ?
        </button>
      </div>

      <div className={`w-full grid transition-[grid-template-rows] duration-300 ease-in-out ${showInfo ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="mt-3 flex flex-col gap-3 text-left max-w-md mx-auto">
            {(["objectif", "tdee"] as const).map(key => (
              <div key={key}>
                <p className="text-[0.62rem] tracking-[0.15em] uppercase mb-1" style={{ color: EXPLANATIONS[key].color }}>{EXPLANATIONS[key].label}</p>
                <p className="text-[0.68rem] text-[var(--t-text-35)] leading-relaxed">{EXPLANATIONS[key].text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
