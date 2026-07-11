"use client";
import { type ExerciceItem, EXERCICE_TYPES, emptyExercice } from "@/lib/exercices";

const inp = "w-full bg-[#060606] border border-white/10 text-white placeholder-white/20 text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors";
const inpSm = "w-full bg-[#060606] border border-white/10 text-white placeholder-white/20 text-xs px-2.5 py-2 text-center focus:outline-none focus:border-[#c9a84c]/40 transition-colors";
const lblSm = "flex items-center justify-center gap-1 text-[0.42rem] tracking-[0.18em] uppercase text-white/30 mb-1";

const IconSeries = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M17 2v4M7 2v4M3 10h18M5 22h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>;
const IconReps = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3"/></svg>;
const IconPoids = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6.5 6.5h11a2 2 0 012 2v7a2 2 0 01-2 2h-11a2 2 0 01-2-2v-7a2 2 0 012-2zM2 9v6M22 9v6"/></svg>;
const IconRepos = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>;

export default function ExerciceEditor({ items, onChange }: { items: ExerciceItem[]; onChange: (items: ExerciceItem[]) => void }) {
  const update = (i: number, patch: Partial<ExerciceItem>) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));
  const add = () => onChange([...items, emptyExercice()]);

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((ex, i) => (
        <div key={i} className="border border-white/8 bg-[#0a0a0a] p-3.5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="shrink-0 w-6 h-6 flex items-center justify-center text-[0.6rem] font-bold text-[#c9a84c] border border-[#c9a84c]/25 bg-[#c9a84c]/5">{i + 1}</span>
            <input className={inp} placeholder="Nom de l'exercice" value={ex.nom} onChange={e => update(i, { nom: e.target.value })} />
            <button type="button" onClick={() => remove(i)} className="shrink-0 text-white/15 hover:text-[#e07070] transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>

          <div className="pl-8">
            <select className={`${inpSm} cursor-pointer text-left`} value={ex.type} onChange={e => update(i, { type: e.target.value })}>
              <option value="">Type d&apos;exercice…</option>
              {EXERCICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-4 gap-2 pl-8">
            <div><label className={lblSm}><IconSeries />Séries</label><input className={inpSm} placeholder="4" value={ex.series} onChange={e => update(i, { series: e.target.value })} /></div>
            <div><label className={lblSm}><IconReps />Reps</label><input className={inpSm} placeholder="12" value={ex.repetitions} onChange={e => update(i, { repetitions: e.target.value })} /></div>
            <div><label className={lblSm}><IconPoids />Poids</label><input className={inpSm} placeholder="20 kg" value={ex.poids} onChange={e => update(i, { poids: e.target.value })} /></div>
            <div><label className={lblSm}><IconRepos />Repos</label><input className={inpSm} placeholder="90 sec" value={ex.repos} onChange={e => update(i, { repos: e.target.value })} /></div>
          </div>

          <div className="pl-8">
            <input className={`${inpSm} text-left`} placeholder="Note technique (optionnel)" value={ex.note} onChange={e => update(i, { note: e.target.value })} />
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className="border border-white/10 text-white/30 text-[0.55rem] tracking-[0.12em] uppercase py-2.5 hover:border-white/20 hover:text-white/50 transition-colors">
        + Ajouter un exercice
      </button>
    </div>
  );
}
