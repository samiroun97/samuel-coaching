"use client";
import { useState } from "react";
import { type Mesocycle } from "@/lib/mesocycles";
import { parseExercices } from "@/lib/exercices";
import { summarizeExercice } from "@/lib/surchargeProgressive";
import { toISO, mondayOf, addDays, mesoWeekNum, typeColor, DAY_SHORT, fmtShort } from "@/lib/planning";
import { Icon } from "@/components/Icon";
import { ChevronLeft, ChevronRight, Copy, Plus } from "@/lib/solarIcons";

// Vue "Semaine focus" du planning coach (CRM > Programmes), inspirée d'Everfit / TrueCoach :
// la semaine affichée en grand (une colonne par jour, cartes de séance détaillées), puis les
// semaines suivantes en frises compactes. Clic sur un jour vide → créer, glisser une carte →
// déplacer (y compris vers une frise), clic sur une carte → ouvrir. Composant "bête" : les
// écritures Supabase sont faites par la page via les callbacks.

export type WeekSeance = {
  id: string; titre: string; type_seance: string | null; date_prevue: string | null;
  completed_at: string | null; created_by_client?: boolean; exercices?: string | null;
};

type Props = {
  seances: WeekSeance[];
  meso: Mesocycle | null;
  weeklyTarget: number;
  onCreate: (dateISO: string) => void;
  onOpen: (id: string) => void;
  onMove: (id: string, dateISO: string) => void;
  onDuplicateWeek: (mondayISO: string) => void;
  busyWeek: string | null;
};

function status(s: WeekSeance, today: string) {
  if (s.completed_at) return { label: "Faite", color: "#7eb8a0" };
  if (s.date_prevue && s.date_prevue < today) return { label: "Manquée", color: "#e07070" };
  if (s.created_by_client) return { label: "Libre", color: "#6ea8d9" };
  return { label: "Prévue", color: "var(--t-text-40)" };
}

export function ProgrammeWeekView({ seances, meso, weeklyTarget, onCreate, onOpen, onMove, onDuplicateWeek, busyWeek }: Props) {
  const today = toISO(new Date());
  const currentMonday = toISO(mondayOf(new Date()));
  const [focus, setFocus] = useState(currentMonday);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overDay, setOverDay] = useState<string | null>(null);

  const byDay = new Map<string, WeekSeance[]>();
  const undated: WeekSeance[] = [];
  for (const s of seances) {
    if (!s.date_prevue) { if (!s.completed_at) undated.push(s); continue; }
    byDay.set(s.date_prevue, [...(byDay.get(s.date_prevue) ?? []), s]);
  }
  const weekStats = (monday: string) => {
    const list = Array.from({ length: 7 }, (_, i) => byDay.get(addDays(monday, i)) ?? []).flat().filter(s => !s.created_by_client);
    return { planned: list.length, done: list.filter(s => s.completed_at).length };
  };

  const dropProps = (iso: string) => ({
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); if (overDay !== iso) setOverDay(iso); },
    onDragLeave: (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverDay(null); },
    onDrop: (e: React.DragEvent) => { e.preventDefault(); if (dragId) onMove(dragId, iso); setDragId(null); setOverDay(null); },
  });
  const dragProps = (s: WeekSeance) => ({
    draggable: !s.completed_at,
    onDragStart: (e: React.DragEvent) => { setDragId(s.id); e.dataTransfer.effectAllowed = "move"; },
    onDragEnd: () => { setDragId(null); setOverDay(null); },
  });

  const days = Array.from({ length: 7 }, (_, i) => addDays(focus, i));
  const focusNum = mesoWeekNum(meso, focus) ?? mesoWeekNum(meso, addDays(focus, 6));
  const focusStats = weekStats(focus);
  const target = weeklyTarget || focusStats.planned;

  // Semaines suivantes : jusqu'à la fin du mésocycle (max 6), sinon 3.
  const upcomingCount = meso
    ? Math.min(6, Math.max(1, Math.round((mondayOf(new Date(meso.date_fin + "T12:00:00")).getTime() - new Date(focus + "T12:00:00").getTime()) / (7 * 86400000))))
    : 3;
  const upcoming = Array.from({ length: upcomingCount }, (_, i) => addDays(focus, (i + 1) * 7));

  const card = (s: WeekSeance) => {
    const color = typeColor(s.type_seance);
    const st = status(s, today);
    const exs = parseExercices(s.exercices).filter(e => e.nom.trim());
    return (
      <button key={s.id} {...dragProps(s)} onClick={e => { e.stopPropagation(); onOpen(s.id); }}
        className={`group/card w-full text-left rounded-xl bg-[var(--t-surface)] border border-[var(--t-border-soft)] overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-12px_rgba(0,0,0,0.35)] hover:border-[var(--t-border)] ${s.completed_at ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"} ${dragId === s.id ? "opacity-40" : ""}`}>
        <div className="h-1" style={{ backgroundColor: st.label === "Manquée" ? "#e07070" : color }}/>
        <div className="p-2.5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[0.62rem] font-semibold uppercase tracking-wide truncate" style={{ color }}>{s.type_seance || "Séance"}</span>
            <span className="text-[0.6rem] font-medium px-1.5 py-0.5 rounded-full shrink-0"
              style={{ color: st.color, backgroundColor: st.color.startsWith("#") ? `${st.color}18` : "var(--t-track)" }}>
              {st.label === "Faite" ? "✓ " : ""}{st.label}
            </span>
          </div>
          <p className="text-[0.82rem] font-semibold text-[var(--t-text)] leading-snug line-clamp-2">{s.titre}</p>
          {exs.length > 0 && (
            <ul className="flex flex-col gap-0.5 pt-0.5 border-t border-[var(--t-border-soft)]">
              {exs.slice(0, 3).map((ex, i) => (
                <li key={i} className="flex items-baseline justify-between gap-2 text-[0.68rem] pt-1">
                  <span className="text-[var(--t-text-70)] truncate capitalize min-w-0">{ex.nom}</span>
                  {ex.mode !== "libre" && <span className="text-[var(--t-text-40)] shrink-0 tabular-nums max-w-[60%] truncate">{summarizeExercice(ex)}</span>}
                </li>
              ))}
              {exs.length > 3 && <li className="text-[0.65rem] text-[var(--t-text-40)] pt-0.5">+ {exs.length - 3} exercice{exs.length - 3 > 1 ? "s" : ""}</li>}
            </ul>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Semaine en cours (ou choisie) ── */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#c9a84c]">
              {focus === currentMonday ? "Cette semaine" : focus < currentMonday ? "Semaine passée" : "Semaine à venir"}
            </p>
            <h3 style={{ fontFamily: "var(--font-bebas)" }} className="text-[1.9rem] leading-none tracking-wide text-[var(--t-text)] mt-1">
              {focusNum ? `Semaine ${focusNum} · ` : ""}{fmtShort(focus)} – {fmtShort(addDays(focus, 6))}
            </h3>
            <p className="text-[0.78rem] text-[var(--t-text-50)] mt-1">
              <span className="text-[#7eb8a0] font-semibold">{focusStats.done}</span> / {target || 0} séance{target > 1 ? "s" : ""} faite{target > 1 ? "s" : ""}
              {focusStats.planned > 0 && focusStats.planned !== target ? ` · ${focusStats.planned} planifiée${focusStats.planned > 1 ? "s" : ""}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {focusStats.planned > 0 && (
              <button onClick={() => onDuplicateWeek(focus)} disabled={busyWeek === focus}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--t-border)] bg-[var(--t-surface)] text-[0.72rem] text-[var(--t-text-60)] hover:border-[#c9a84c]/50 hover:text-[#c9a84c] transition-colors disabled:opacity-40">
                <Icon icon={Copy} size={13} strokeWidth={2}/> {busyWeek === focus ? "Copie…" : "Dupliquer sur la suivante"}
              </button>
            )}
            <div className="flex items-center rounded-xl border border-[var(--t-border)] bg-[var(--t-surface)] overflow-hidden">
              <button onClick={() => setFocus(f => addDays(f, -7))} aria-label="Semaine précédente" className="px-2.5 py-2 text-[var(--t-text-50)] hover:text-[var(--t-text)] hover:bg-[var(--t-glass-bg)] transition-colors">
                <Icon icon={ChevronLeft} size={14} strokeWidth={2}/>
              </button>
              <button onClick={() => setFocus(currentMonday)} disabled={focus === currentMonday}
                className="px-2.5 py-2 text-[0.72rem] text-[var(--t-text-60)] border-x border-[var(--t-border)] hover:bg-[var(--t-glass-bg)] disabled:text-[var(--t-text-30)] transition-colors">
                Aujourd&apos;hui
              </button>
              <button onClick={() => setFocus(f => addDays(f, 7))} aria-label="Semaine suivante" className="px-2.5 py-2 text-[var(--t-text-50)] hover:text-[var(--t-text)] hover:bg-[var(--t-glass-bg)] transition-colors">
                <Icon icon={ChevronRight} size={14} strokeWidth={2}/>
              </button>
            </div>
          </div>
        </div>

        {/* 7 jours : grille sur desktop, défilement horizontal au doigt sur mobile */}
        <div className="flex md:grid md:grid-cols-7 gap-2.5 overflow-x-auto md:overflow-visible snap-x snap-mandatory -mx-1 px-1 pb-1">
          {days.map(iso => {
            const list = byDay.get(iso) ?? [];
            const isToday = iso === today;
            const isOver = overDay === iso && dragId !== null;
            const d = new Date(iso + "T12:00:00");
            return (
              <div key={iso} {...dropProps(iso)}
                className={`snap-start shrink-0 w-[46vw] sm:w-[30vw] md:w-auto min-w-0 rounded-2xl border flex flex-col transition-colors ${isOver ? "border-[#c9a84c] bg-[#c9a84c]/10" : isToday ? "border-[#c9a84c]/50 bg-[#c9a84c]/[0.05]" : "border-[var(--t-border-soft)] bg-[var(--t-surface)] shadow-[0_2px_12px_-8px_rgba(0,0,0,0.18)]"}`}>
                <div className="flex items-baseline justify-between px-2.5 pt-2 pb-1.5">
                  <span className={`text-[0.72rem] font-semibold uppercase tracking-wide ${isToday ? "text-[#c9a84c]" : "text-[var(--t-text-50)]"}`}>{DAY_SHORT[(d.getDay() + 6) % 7]}</span>
                  <span className={`text-[0.8rem] font-semibold tabular-nums ${isToday ? "w-6 h-6 -my-1 rounded-full bg-[#c9a84c] text-on-gold flex items-center justify-center text-[0.72rem]" : iso < today ? "text-[var(--t-text-30)]" : "text-[var(--t-text-70)]"}`}>{d.getDate()}</span>
                </div>
                <div className="flex-1 flex flex-col gap-2 px-1.5 pb-1.5 min-h-[170px]">
                  {list.map(card)}
                  <button onClick={() => onCreate(iso)}
                    className={`group/add rounded-xl border border-dashed flex items-center justify-center gap-1 text-[0.7rem] transition-colors ${list.length ? "py-1.5 border-transparent text-transparent hover:border-[var(--t-border)] hover:text-[var(--t-text-40)]" : "flex-1 border-[var(--t-border)] text-[var(--t-text-30)] hover:border-[#c9a84c]/60 hover:text-[#c9a84c] hover:bg-[#c9a84c]/[0.04]"}`}>
                    <Icon icon={Plus} size={12} strokeWidth={2.2}/>{list.length ? "Ajouter" : ""}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {undated.length > 0 && (
          <div className="rounded-2xl border border-dashed border-[#c9a84c]/40 bg-[#c9a84c]/[0.04] p-3">
            <p className="text-[0.72rem] text-[var(--t-text-60)] mb-2"><span className="font-semibold text-[#c9a84c]">{undated.length} séance{undated.length > 1 ? "s" : ""} sans date</span> — glisse-les sur un jour pour les planifier</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">{undated.map(card)}</div>
          </div>
        )}
      </section>

      {/* ── Semaines suivantes : frises compactes ── */}
      <section className="flex flex-col gap-2">
        <p className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[var(--t-text-50)]">Semaines suivantes</p>
        {upcoming.map(monday => {
          const n = mesoWeekNum(meso, monday) ?? mesoWeekNum(meso, addDays(monday, 6));
          const st = weekStats(monday);
          return (
            <div key={monday} className="flex items-center gap-3 rounded-2xl border border-[var(--t-border-soft)] bg-[var(--t-surface)]/70 px-3 py-2.5 hover:border-[var(--t-border)] transition-colors">
              <button onClick={() => setFocus(monday)} className="w-28 shrink-0 text-left group/wk">
                <p className="text-[0.8rem] font-semibold text-[var(--t-text-80)] group-hover/wk:text-[#c9a84c] transition-colors">{n ? `Semaine ${n}` : fmtShort(monday)}</p>
                <p className="text-[0.68rem] text-[var(--t-text-40)]">{fmtShort(monday)} – {fmtShort(addDays(monday, 6))}</p>
              </button>
              <div className="flex-1 grid grid-cols-7 gap-1.5 min-w-0">
                {Array.from({ length: 7 }, (_, i) => addDays(monday, i)).map((iso, i) => {
                  const list = byDay.get(iso) ?? [];
                  const s = list[0];
                  const isOver = overDay === iso && dragId !== null;
                  return (
                    <div key={iso} {...dropProps(iso)}
                      onClick={() => s ? onOpen(s.id) : onCreate(iso)}
                      title={s ? list.map(x => x.titre).join(" · ") : `Ajouter une séance le ${fmtShort(iso)}`}
                      className={`h-9 rounded-lg flex items-center px-1.5 cursor-pointer transition-colors min-w-0 ${isOver ? "ring-2 ring-[#c9a84c]" : ""} ${s ? "" : "bg-[var(--t-track)] hover:bg-[#c9a84c]/15"}`}
                      style={s ? { backgroundColor: `${typeColor(s.type_seance)}26`, boxShadow: `inset 3px 0 0 ${typeColor(s.type_seance)}` } : undefined}>
                      {s ? (
                        <span {...dragProps(s)} className="text-[0.62rem] font-medium text-[var(--t-text-75)] truncate">{s.titre}{list.length > 1 ? ` +${list.length - 1}` : ""}</span>
                      ) : <span className="text-[0.6rem] text-[var(--t-text-25)] mx-auto">{DAY_SHORT[i][0]}</span>}
                    </div>
                  );
                })}
              </div>
              <span className="w-12 text-right text-[0.72rem] tabular-nums text-[var(--t-text-50)] shrink-0 hidden sm:block">{st.planned}{weeklyTarget ? ` / ${weeklyTarget}` : ""}</span>
              <button onClick={() => setFocus(monday)} aria-label="Afficher cette semaine" className="shrink-0 text-[var(--t-text-30)] hover:text-[#c9a84c] transition-colors">
                <Icon icon={ChevronRight} size={14} strokeWidth={2}/>
              </button>
            </div>
          );
        })}
      </section>
    </div>
  );
}
