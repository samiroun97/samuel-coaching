"use client";
import { useState } from "react";
import { type Mesocycle } from "@/lib/mesocycles";
import { Icon } from "@/components/Icon";
import { ChevronLeft, ChevronRight, Copy, Plus } from "@/lib/solarIcons";

// Calendrier de planification façon TrueCoach / Everfit : une ligne par semaine, une colonne
// par jour. On clique un jour pour y créer une séance, on glisse une séance pour la déplacer,
// on duplique une semaine entière sur la suivante. Couvre la durée du mésocycle actif s'il y
// en a un (semaines numérotées S1, S2…), sinon 4 semaines à partir de la semaine en cours.
// Composant "bête" : toutes les écritures Supabase sont faites par la page via les callbacks.

export type CalendarSeance = {
  id: string; titre: string; type_seance: string | null; date_prevue: string | null;
  completed_at: string | null; created_by_client?: boolean;
};

export const TYPE_COLOR: Record<string, string> = {
  "Haut du corps": "#c9a84c", "Bas du corps": "#7eb8a0", "Full body": "#e0834a", "Cardio": "#6fa8d8",
  "Boxe": "#e07070", "Natation": "#4fb8c4", "CrossFit": "#c97ea0", "Yoga": "#8fb87e",
};
const DEFAULT_COLOR = "#9a9a9a";
const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export const toISO = (d: Date) => d.toLocaleDateString("sv-SE");
export const mondayOf = (d: Date) => { const n = new Date(d); n.setHours(12, 0, 0, 0); n.setDate(n.getDate() - ((n.getDay() + 6) % 7)); return n; };
export const addDays = (iso: string, n: number) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return toISO(d); };

// Numéro de semaine dans le mésocycle (S1 = semaine qui contient date_debut), null hors mésocycle.
export function mesoWeekNum(meso: Mesocycle | null, iso: string): number | null {
  if (!meso || iso < meso.date_debut || iso > meso.date_fin) return null;
  const start = mondayOf(new Date(meso.date_debut + "T12:00:00")).getTime();
  return Math.floor((mondayOf(new Date(iso + "T12:00:00")).getTime() - start) / (7 * 86400000)) + 1;
}

export function ProgrammeCalendar({ seances, meso, weeklyTarget, onCreate, onOpen, onMove, onDuplicateWeek, busyWeek }: {
  seances: CalendarSeance[];
  meso: Mesocycle | null;
  weeklyTarget: number;
  onCreate: (dateISO: string) => void;
  onOpen: (id: string) => void;
  onMove: (id: string, dateISO: string) => void;
  onDuplicateWeek: (mondayISO: string) => void;
  busyWeek: string | null;
}) {
  const todayISO = toISO(new Date());
  const baseMonday = mondayOf(new Date((meso?.date_debut ?? todayISO) + "T12:00:00"));
  const mesoWeeks = meso
    ? Math.max(1, Math.round((mondayOf(new Date(meso.date_fin + "T12:00:00")).getTime() - baseMonday.getTime()) / (7 * 86400000)) + 1)
    : 4;
  const [offset, setOffset] = useState(0); // en semaines, par pas de la taille de la vue
  const [dragId, setDragId] = useState<string | null>(null);
  const [overDay, setOverDay] = useState<string | null>(null);

  const weeksShown = Math.min(mesoWeeks, 6);
  const firstMonday = toISO(baseMonday);
  const weeks = Array.from({ length: weeksShown }, (_, w) => addDays(firstMonday, (offset + w) * 7));

  const byDay = new Map<string, CalendarSeance[]>();
  const undated: CalendarSeance[] = [];
  for (const s of seances) {
    if (!s.date_prevue) { if (!s.completed_at) undated.push(s); continue; }
    byDay.set(s.date_prevue, [...(byDay.get(s.date_prevue) ?? []), s]);
  }

  const drop = (iso: string) => { if (dragId) onMove(dragId, iso); setDragId(null); setOverDay(null); };

  const chip = (s: CalendarSeance) => {
    const color = TYPE_COLOR[s.type_seance ?? ""] ?? DEFAULT_COLOR;
    return (
      <button key={s.id} draggable={!s.completed_at}
        onDragStart={e => { setDragId(s.id); e.dataTransfer.effectAllowed = "move"; }}
        onDragEnd={() => { setDragId(null); setOverDay(null); }}
        onClick={e => { e.stopPropagation(); onOpen(s.id); }}
        title={s.completed_at ? `${s.titre} — faite` : `${s.titre} — glisser pour déplacer`}
        className={`w-full text-left rounded-md px-1.5 py-1 text-[0.58rem] leading-tight truncate transition-all hover:brightness-95 ${s.completed_at ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"} ${dragId === s.id ? "opacity-40" : ""}`}
        style={{ backgroundColor: `${color}${s.completed_at ? "18" : "26"}`, color: s.completed_at ? "var(--t-text-40)" : "var(--t-text-80)", boxShadow: `inset 2px 0 0 ${color}` }}>
        {s.completed_at && <span className="text-[#7eb8a0] mr-0.5">✓</span>}
        {s.created_by_client && <span className="text-[#6ea8d9] mr-0.5" title="Séance libre du client">●</span>}
        {s.titre}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => setOffset(o => o - weeksShown)} aria-label="Semaines précédentes"
          className="w-7 h-7 rounded-full border border-[var(--t-border)] flex items-center justify-center text-[var(--t-text-40)] hover:text-[var(--t-text-70)] hover:border-[var(--t-text-25)] transition-colors">
          <Icon icon={ChevronLeft} size={12} strokeWidth={2}/>
        </button>
        <div className="text-center">
          <p className="text-[0.55rem] tracking-[0.18em] uppercase text-[var(--t-text-40)]">
            {meso ? meso.nom : "Planning"} · {new Date(weeks[0] + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} → {new Date(addDays(weeks[weeks.length - 1], 6) + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
          </p>
          {offset !== 0 && <button onClick={() => setOffset(0)} className="text-[0.5rem] tracking-wider uppercase text-[#c9a84c] hover:underline">Revenir au début</button>}
        </div>
        <button onClick={() => setOffset(o => o + weeksShown)} aria-label="Semaines suivantes"
          className="w-7 h-7 rounded-full border border-[var(--t-border)] flex items-center justify-center text-[var(--t-text-40)] hover:text-[var(--t-text-70)] hover:border-[var(--t-text-25)] transition-colors">
          <Icon icon={ChevronRight} size={12} strokeWidth={2}/>
        </button>
      </div>

      <div className="overflow-x-auto -mx-1 px-1">
        <div className="min-w-[640px] flex flex-col gap-1.5">
          {/* En-têtes jours */}
          <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] gap-1.5">
            <div/>
            {DAY_LABELS.map(d => <p key={d} className="text-[0.5rem] tracking-[0.15em] uppercase text-[var(--t-text-30)] text-center">{d}</p>)}
          </div>

          {weeks.map(monday => {
            const weekNum = mesoWeekNum(meso, monday) ?? mesoWeekNum(meso, addDays(monday, 6));
            const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
            const count = days.reduce((a, d) => a + (byDay.get(d)?.filter(s => !s.created_by_client).length ?? 0), 0);
            const done = days.reduce((a, d) => a + (byDay.get(d)?.filter(s => s.completed_at).length ?? 0), 0);
            const isCurrent = days.includes(todayISO);
            return (
              <div key={monday} className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] gap-1.5 group/week">
                {/* En-tête de semaine */}
                <div className={`rounded-lg px-1.5 py-1.5 flex flex-col justify-between ${isCurrent ? "bg-[#c9a84c]/10" : ""}`}>
                  <div>
                    <p style={{ fontFamily: "var(--font-bebas)" }} className={`text-base leading-none tracking-wide ${isCurrent ? "text-[#c9a84c]" : "text-[var(--t-text-60)]"}`}>
                      {weekNum ? `S${weekNum}` : new Date(monday + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </p>
                    <p className="text-[0.5rem] text-[var(--t-text-30)] mt-0.5">{count}{weeklyTarget ? `/${weeklyTarget}` : ""} séance{count > 1 ? "s" : ""}{done ? ` · ${done}✓` : ""}</p>
                  </div>
                  <button onClick={() => onDuplicateWeek(monday)} disabled={count === 0 || busyWeek === monday}
                    title="Copier les séances de cette semaine sur la semaine suivante"
                    className="mt-1 flex items-center gap-1 text-[0.48rem] tracking-wider uppercase text-[var(--t-text-30)] hover:text-[#c9a84c] disabled:opacity-0 transition-all">
                    <Icon icon={Copy} size={9} strokeWidth={2}/>{busyWeek === monday ? "…" : "Dupliquer"}
                  </button>
                </div>

                {/* Jours */}
                {days.map(iso => {
                  const list = byDay.get(iso) ?? [];
                  const isOver = overDay === iso && dragId !== null;
                  const past = iso < todayISO;
                  return (
                    <div key={iso}
                      onDragOver={e => { e.preventDefault(); if (overDay !== iso) setOverDay(iso); }}
                      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverDay(null); }}
                      onDrop={e => { e.preventDefault(); drop(iso); }}
                      onClick={() => onCreate(iso)}
                      className={`group/day relative min-h-[76px] rounded-lg border p-1 flex flex-col gap-1 cursor-pointer transition-colors ${isOver ? "border-[#c9a84c] bg-[#c9a84c]/10" : iso === todayISO ? "border-[#c9a84c]/50 bg-[var(--t-surface)]" : "border-[var(--t-border-soft)] bg-[var(--t-surface)]/60 hover:border-[var(--t-border)]"} ${past && !list.length ? "opacity-60" : ""}`}>
                      <p className={`text-[0.52rem] ${iso === todayISO ? "text-[#c9a84c] font-bold" : "text-[var(--t-text-30)]"}`}>{new Date(iso + "T12:00:00").getDate()}</p>
                      {list.map(chip)}
                      <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#c9a84c]/15 text-[#c9a84c] items-center justify-center hidden group-hover/day:flex">
                        <Icon icon={Plus} size={9} strokeWidth={2.5}/>
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Séances sans date : à glisser sur un jour pour les planifier */}
      {undated.length > 0 && (
        <div className="rounded-lg border border-dashed border-[var(--t-border)] p-2">
          <p className="text-[0.5rem] tracking-[0.15em] uppercase text-[var(--t-text-30)] mb-1.5">Sans date · glisse-les sur un jour</p>
          <div className="flex flex-wrap gap-1.5">
            {undated.map(s => <div key={s.id} className="w-40">{chip(s)}</div>)}
          </div>
        </div>
      )}

      <p className="text-[0.52rem] text-[var(--t-text-25)]">Clique sur un jour pour créer une séance · glisse une séance pour la déplacer · clique dessus pour la modifier.</p>
    </div>
  );
}
