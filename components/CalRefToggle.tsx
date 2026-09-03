"use client";

import { useState } from "react";
import { RichIcon } from "@/components/RichIcon";

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

function ObjectifIcon({ size = 26, active = true }: { size?: number; active?: boolean }) {
  return <RichIcon name="targetGoal" size={size} className={`transition-opacity ${active ? "opacity-100" : "opacity-40"}`}/>;
}

export function TdeeIcon({ size = 24, active = true }: { size?: number; active?: boolean }) {
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-md pointer-events-none transition-opacity"
        style={{ width: size * 0.9, height: size * 0.9, backgroundColor: "#e0472f", opacity: active ? 0.6 : 0.2 }}/>
      <RichIcon name="burn" size={size} className={`relative transition-opacity ${active ? "opacity-100" : "opacity-40"}`}/>
    </div>
  );
}

export function CalRefToggle({ value, onChange, tdeeDisabled }: { value: Mode; onChange: (v: Mode) => void; tdeeDisabled?: boolean }) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full flex justify-center">
        <div className="relative flex border border-[var(--t-border)] rounded-full p-1 bg-[var(--t-surface)] w-[248px]">
          <div className="absolute top-1.5 bottom-1.5 rounded-full transition-[left,width] duration-300 ease-out"
            style={{ backgroundColor: `${EXPLANATIONS[value].color}18`, left: value === "tdee" ? "127px" : "7px", width: value === "tdee" ? "108px" : "114px" }}/>
          {(["objectif", "tdee"] as const).map(key => (
            <button key={key} onClick={() => onChange(key)} disabled={key === "tdee" && tdeeDisabled}
              title={key === "tdee" && tdeeDisabled ? "Profil incomplet" : undefined}
              className="relative z-10 flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-[0.66rem] tracking-[0.12em] uppercase transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ color: value === key ? EXPLANATIONS[key].color : "var(--t-text-30)" }}>
              {key === "objectif" ? <ObjectifIcon active={value === key}/> : <TdeeIcon active={value === key}/>}
              {EXPLANATIONS[key].label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowInfo(v => !v)}
          title="Comment ça marche ?"
          className={`absolute right-0 top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full border flex items-center justify-center text-[0.6rem] shrink-0 transition-colors ${showInfo ? "border-[#c9a84c] text-[#c9a84c]" : "border-[var(--t-border)] text-[var(--t-text-30)] hover:text-[var(--t-text-60)] hover:border-[var(--t-text-25)]"}`}>
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
