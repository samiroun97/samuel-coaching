"use client";
import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { X } from "@/lib/solarIcons";

// Primitives visuelles de l'espace Business — mêmes codes que le reste du CRM
// (cartes blanches, bordure douce, halo doré léger, accents or).
export const card = "rounded-2xl border border-[var(--t-border-soft)] bg-[var(--t-surface)] shadow-[0_2px_14px_-8px_rgba(0,0,0,0.15)]";
export const inp = "w-full bg-[var(--t-bg)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/50";
export const lbl = "text-[0.62rem] font-semibold tracking-[0.1em] uppercase text-[var(--t-text-50)] block mb-1.5";
export const btnGold = "px-4 py-2.5 rounded-xl bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.7rem] font-bold tracking-[0.08em] uppercase shadow-[0_4px_16px_-6px_rgba(201,168,76,0.6)] hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:hover:translate-y-0";
export const btnGhost = "px-3.5 py-2 rounded-xl border border-[var(--t-border)] text-[var(--t-text-60)] text-[0.68rem] font-semibold hover:border-[#c9a84c]/40 hover:text-[var(--t-text)] transition-colors disabled:opacity-40";

export function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-[0.58rem] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border whitespace-nowrap"
      style={{ color, borderColor: `${color}55`, backgroundColor: `${color}14` }}>{label}</span>
  );
}

export function Stat({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className={`${card} px-4 py-3 shadow-[0_2px_14px_-8px_rgba(0,0,0,0.15),0_0_22px_-6px_rgba(201,168,76,0.22)]`}>
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[var(--t-text-50)]">{label}</p>
      <p style={{ fontFamily: "var(--font-bebas)", color: accent }} className="text-3xl text-[var(--t-text)] tracking-wide leading-none mt-1">{value}</p>
      {sub && <p className="text-[0.66rem] text-[var(--t-text-40)] mt-1">{sub}</p>}
    </div>
  );
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className={card}>
      <div className="px-4 py-3 border-b border-[var(--t-border-soft)] flex items-center justify-between gap-3">
        <p className="text-[0.9rem] font-semibold text-[var(--t-text)]">{title}</p>
        {action}
      </div>
      {children}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="px-4 py-6 text-center text-xs text-[var(--t-text-30)]">{text}</p>;
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={onClose}>
      <div className="w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto bg-[var(--t-bg)] rounded-t-2xl sm:rounded-2xl border border-[var(--t-border-soft)] shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-[var(--t-bg)] px-5 py-4 border-b border-[var(--t-border-soft)] flex items-center justify-between">
          <p className="text-[0.95rem] font-bold text-[var(--t-text)]">{title}</p>
          <button onClick={onClose} aria-label="Fermer" className="text-[var(--t-text-40)] hover:text-[var(--t-text)]"><Icon icon={X} size={14}/></button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-4">{children}</div>
      </div>
    </div>
  );
}

export function ClientSelect({ clients, value, onChange }: { clients: { id: string; prenom: string; nom: string; email: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <select className={inp} value={value} onChange={e => onChange(e.target.value)}>
      <option value="">Choisir un client…</option>
      {clients.map(c => <option key={c.id} value={c.id}>{`${c.prenom} ${c.nom}`.trim() || c.email}</option>)}
    </select>
  );
}
