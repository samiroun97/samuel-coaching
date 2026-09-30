"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { type Mesocycle } from "@/lib/mesocycles";
import { toISO, mondayOf, addDays, mesoWeekNum, typeColor, DAY_SHORT } from "@/lib/planning";
import { Icon } from "@/components/Icon";
import { Plus, X } from "@/lib/solarIcons";
import type { WeekSeance } from "@/components/ProgrammeWeekView";

// Vue « Calendrier » du planning coach (CRM > Programmes) : toutes les semaines à la suite dans
// une seule zone qui défile (comme Google Agenda en vue mois continue), au lieu de naviguer
// semaine par semaine. Un séparateur marque chaque nouveau mois, la bande dorée le mésocycle.
// Ordinateur : pastilles de séance glissables d'un jour à l'autre, clic sur un jour vide = créer.
// Téléphone : cases compactes (barres de couleur), toucher un jour ouvre son détail en bas.

type Props = {
  seances: WeekSeance[];
  meso: Mesocycle | null;
  weeklyTarget: number;
  onCreate: (dateISO: string) => void;
  onOpen: (id: string) => void;
  onMove: (id: string, dateISO: string) => void;
};

const MONTH = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

function status(s: WeekSeance, today: string) {
  if (s.completed_at) return { label: "Faite", color: "#7eb8a0" };
  if (s.date_prevue && s.date_prevue < today) return { label: "Manquée", color: "#e07070" };
  if (s.created_by_client) return { label: "Libre", color: "#6ea8d9" };
  return { label: "Prévue", color: "var(--t-text-40)" };
}

export function ProgrammeCalendar({ seances, meso, weeklyTarget, onCreate, onOpen, onMove }: Props) {
  const today = toISO(new Date());
  const currentMonday = toISO(mondayOf(new Date()));
  const [dragId, setDragId] = useState<string | null>(null);
  const [overDay, setOverDay] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  // Semaines affichées autour d'aujourd'hui, extensibles des deux côtés.
  const [before, setBefore] = useState(6);
  const [after, setAfter] = useState(14);
  const scroller = useRef<HTMLDivElement>(null);
  const todayRow = useRef<HTMLDivElement>(null);

  const byDay = useMemo(() => {
    const m = new Map<string, WeekSeance[]>();
    for (const s of seances) if (s.date_prevue) m.set(s.date_prevue, [...(m.get(s.date_prevue) ?? []), s]);
    return m;
  }, [seances]);

  // La plage couvre au moins toutes les séances existantes et la fin du mésocycle.
  const { first, count } = useMemo(() => {
    const dates = seances.map(s => s.date_prevue).filter(Boolean) as string[];
    const mondayISO = (iso: string) => toISO(mondayOf(new Date(iso + "T12:00:00")));
    let start = addDays(currentMonday, -7 * before);
    let end = addDays(currentMonday, 7 * after);
    // Historique : on remonte jusqu'à la première séance, au maximum 6 mois en arrière par défaut.
    const earliest = dates.length ? mondayISO(dates.reduce((a, b) => (a < b ? a : b))) : null;
    const floor = addDays(currentMonday, -7 * 26);
    if (earliest && earliest < start) start = earliest > floor ? earliest : (floor < start ? floor : start);
    const latest = [...dates, meso?.date_fin ?? ""].reduce((a, b) => (a > b ? a : b), "");
    if (latest && latest > end) end = mondayISO(latest);
    const n = Math.round((new Date(end + "T12:00:00").getTime() - new Date(start + "T12:00:00").getTime()) / (7 * 86400000)) + 1;
    return { first: start, count: n };
  }, [seances, meso, before, after, currentMonday]);

  const weeks = Array.from({ length: count }, (_, i) => addDays(first, i * 7));

  const scrollToToday = (smooth: boolean) => {
    const box = scroller.current, row = todayRow.current;
    if (box && row) box.scrollTo({ top: row.offsetTop - 40, behavior: smooth ? "smooth" : "auto" });
  };
  // Ouverture : on se place directement sur la semaine en cours.
  useEffect(() => { scrollToToday(false); }, []);

  // Ajout de semaines au-dessus : on garde à l'écran ce qui y était (pas de saut).
  const keep = useRef<{ h: number; top: number } | null>(null);
  const showEarlier = () => {
    const box = scroller.current;
    if (box) keep.current = { h: box.scrollHeight, top: box.scrollTop };
    setBefore(b => b + 8);
  };
  useLayoutEffect(() => {
    const box = scroller.current, k = keep.current;
    if (box && k) { box.scrollTop = k.top + (box.scrollHeight - k.h); keep.current = null; }
  }, [first]);

  const dropProps = (iso: string) => ({
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); if (overDay !== iso) setOverDay(iso); },
    onDragLeave: (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverDay(null); },
    onDrop: (e: React.DragEvent) => { e.preventDefault(); if (dragId) onMove(dragId, iso); setDragId(null); setOverDay(null); },
  });

  const inMeso = (iso: string) => !!meso && iso >= meso.date_debut && iso <= meso.date_fin;
  const pickedList = picked ? byDay.get(picked) ?? [] : [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-[0.72rem] text-[var(--t-text-50)] flex-wrap">
          {meso && <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#c9a84c]/15 border border-[#c9a84c]/40"/>{meso.nom}</span>}
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#7eb8a0]"/>Faite</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#e07070]"/>Manquée</span>
        </div>
        <button onClick={() => scrollToToday(true)}
          className="shrink-0 px-3 py-2 rounded-xl border border-[var(--t-border)] bg-[var(--t-surface)] text-[0.72rem] text-[var(--t-text-60)] hover:border-[#c9a84c]/50 hover:text-[#c9a84c] transition-colors">
          Aujourd&apos;hui
        </button>
      </div>

      <div ref={scroller} className="relative max-h-[72vh] overflow-y-auto no-scrollbar rounded-2xl border border-[var(--t-border-soft)] bg-[var(--t-surface)] shadow-[0_2px_12px_-8px_rgba(0,0,0,0.18)]">
        {/* En-tête des jours, collé en haut pendant le défilement */}
        <div className="sticky top-0 z-10 grid grid-cols-[28px_repeat(7,minmax(0,1fr))] md:grid-cols-[52px_repeat(7,minmax(0,1fr))] bg-[var(--t-surface)]/95 backdrop-blur border-b border-[var(--t-border-soft)]">
          <span/>
          {DAY_SHORT.map(d => <span key={d} className="py-2 text-center text-[0.66rem] font-semibold uppercase tracking-wide text-[var(--t-text-50)]">{d}</span>)}
        </div>

        <button onClick={showEarlier} className="w-full py-2.5 text-[0.72rem] text-[var(--t-text-40)] hover:text-[#c9a84c] transition-colors">
          Afficher les semaines précédentes
        </button>

        {weeks.map(monday => {
          const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
          const firstOfMonth = days.find(d => d.endsWith("-01"));
          const n = mesoWeekNum(meso, monday) ?? mesoWeekNum(meso, addDays(monday, 6));
          const list = days.flatMap(d => byDay.get(d) ?? []).filter(s => !s.created_by_client);
          const done = list.filter(s => s.completed_at).length;
          const target = weeklyTarget || list.length;
          const isCurrent = monday === currentMonday;
          return (
            <div key={monday} ref={isCurrent ? todayRow : undefined}>
              {(firstOfMonth || monday === first) && (
                <p className="px-3 md:px-4 pt-4 pb-2 text-[0.8rem] md:text-[0.85rem] font-semibold capitalize text-[var(--t-text-80)]">
                  {MONTH(firstOfMonth ?? monday)}
                </p>
              )}
              <div className="grid grid-cols-[28px_repeat(7,minmax(0,1fr))] md:grid-cols-[52px_repeat(7,minmax(0,1fr))] border-t border-[var(--t-border-soft)]">
                {/* Gouttière : n° de semaine du bloc + séances faites / objectif */}
                <div className="flex flex-col items-center justify-start pt-2 gap-0.5">
                  {n && <span className="text-[0.6rem] md:text-[0.68rem] font-bold text-[#c9a84c]">S{n}</span>}
                  {target > 0 && (
                    <span className={`hidden md:block text-[0.62rem] tabular-nums ${done >= target ? "text-[#7eb8a0] font-semibold" : "text-[var(--t-text-40)]"}`}>{done}/{target}</span>
                  )}
                </div>
                {days.map(iso => {
                  const items = byDay.get(iso) ?? [];
                  const d = new Date(iso + "T12:00:00");
                  const isToday = iso === today;
                  const isOver = overDay === iso && dragId !== null;
                  const past = iso < today;
                  return (
                    <div key={iso} {...dropProps(iso)}
                      onClick={() => { if (window.matchMedia("(min-width: 768px)").matches) { if (!items.length) onCreate(iso); } else setPicked(iso); }}
                      className={`group/day relative min-h-[64px] md:min-h-[104px] border-l border-[var(--t-border-soft)] p-1 md:p-1.5 flex flex-col gap-1 cursor-pointer transition-colors ${
                        isOver ? "bg-[#c9a84c]/15" : picked === iso ? "bg-[#c9a84c]/10" : inMeso(iso) ? "bg-[#c9a84c]/[0.05] hover:bg-[#c9a84c]/10" : "hover:bg-[var(--t-glass-bg)]"}`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[0.7rem] md:text-[0.75rem] tabular-nums font-semibold ${
                          isToday ? "w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#c9a84c] text-on-gold flex items-center justify-center" : past ? "text-[var(--t-text-30)]" : "text-[var(--t-text-70)]"}`}>
                          {d.getDate()}
                        </span>
                        <span className="hidden md:group-hover/day:flex text-[var(--t-text-40)]"
                          onClick={e => { e.stopPropagation(); onCreate(iso); }} title="Ajouter une séance">
                          <Icon icon={Plus} size={13} strokeWidth={2.2}/>
                        </span>
                      </div>
                      {items.map(s => {
                        const st = status(s, today);
                        const color = typeColor(s.type_seance);
                        return (
                          <div key={s.id}
                            draggable={!s.completed_at}
                            onDragStart={e => { e.stopPropagation(); setDragId(s.id); e.dataTransfer.effectAllowed = "move"; }}
                            onDragEnd={() => { setDragId(null); setOverDay(null); }}
                            onClick={e => { if (window.matchMedia("(min-width: 768px)").matches) { e.stopPropagation(); onOpen(s.id); } }}
                            title={s.titre}
                            className={`rounded-md md:rounded-lg overflow-hidden transition-opacity ${dragId === s.id ? "opacity-40" : ""} ${s.completed_at ? "" : "md:cursor-grab md:active:cursor-grabbing"}`}
                            style={{ backgroundColor: `${color}22`, boxShadow: `inset 3px 0 0 ${st.label === "Manquée" ? "#e07070" : color}` }}>
                            {/* Téléphone : simple barre de couleur ; ordinateur : titre lisible */}
                            <div className="h-1.5 md:hidden" style={{ backgroundColor: st.label === "Manquée" ? "#e07070" : s.completed_at ? "#7eb8a0" : color }}/>
                            <p className="hidden md:flex items-center gap-1 pl-2 pr-1 py-1 text-[0.68rem] font-medium text-[var(--t-text-80)] leading-tight">
                              {s.completed_at && <span className="text-[#7eb8a0] shrink-0">✓</span>}
                              <span className="truncate">{s.titre}</span>
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <button onClick={() => setAfter(a => a + 8)} className="w-full py-3 border-t border-[var(--t-border-soft)] text-[0.72rem] text-[var(--t-text-40)] hover:text-[#c9a84c] transition-colors">
          Afficher les semaines suivantes
        </button>
      </div>

      {/* Téléphone : détail du jour touché */}
      {picked && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setPicked(null)}>
          <div className="absolute inset-0 bg-black/40"/>
          <div onClick={e => e.stopPropagation()}
            className="absolute left-0 right-0 bottom-0 rounded-t-3xl bg-[var(--t-bg)] border-t border-[var(--t-border-soft)] px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+20px)] max-h-[70vh] overflow-y-auto">
            <div className="w-10 h-1 rounded-full bg-[var(--t-border)] mx-auto mb-3"/>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[1rem] font-semibold capitalize text-[var(--t-text)]">
                {new Date(picked + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <button onClick={() => setPicked(null)} aria-label="Fermer" className="w-9 h-9 flex items-center justify-center text-[var(--t-text-40)]">
                <Icon icon={X} size={18}/>
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {pickedList.length === 0 && <p className="text-[0.85rem] text-[var(--t-text-50)] py-2">Aucune séance ce jour-là.</p>}
              {pickedList.map(s => {
                const st = status(s, today);
                const color = typeColor(s.type_seance);
                return (
                  <button key={s.id} onClick={() => { setPicked(null); onOpen(s.id); }}
                    className="flex items-center gap-3 rounded-xl border border-[var(--t-border-soft)] bg-[var(--t-surface)] px-3 py-3 text-left"
                    style={{ boxShadow: `inset 4px 0 0 ${color}` }}>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.9rem] font-semibold text-[var(--t-text)] truncate">{s.titre}</p>
                      <p className="text-[0.72rem] font-medium uppercase tracking-wide" style={{ color }}>{s.type_seance || "Séance"}</p>
                    </div>
                    <span className="text-[0.7rem] font-medium px-2 py-0.5 rounded-full shrink-0"
                      style={{ color: st.color, backgroundColor: st.color.startsWith("#") ? `${st.color}18` : "var(--t-track)" }}>
                      {st.label === "Faite" ? "✓ " : ""}{st.label}
                    </span>
                  </button>
                );
              })}
              <button onClick={() => { const d = picked; setPicked(null); onCreate(d); }}
                className="mt-1 min-h-[48px] rounded-xl border border-dashed border-[#c9a84c]/60 text-[#c9a84c] text-[0.85rem] font-medium flex items-center justify-center gap-1.5">
                <Icon icon={Plus} size={14} strokeWidth={2.2}/> Ajouter une séance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
