"use client";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";
import { SESSION_STATUS_CFG, chf, packUsage, type CoachSession, type SessionStatus } from "@/lib/business";
import { clientName, type BusinessData } from "@/components/business/useBusinessData";
import { NewSessionModal } from "@/components/business/SessionsTab";
import { Modal, Pill, btnGhost, btnGold, card, inp, lbl } from "@/components/business/ui";
import { Icon } from "@/components/Icon";
import { ChevronLeft, ChevronRight } from "@/lib/solarIcons";

// Agenda des séances (CRM > Business) : vue semaine façon Google Agenda sur ordinateur,
// vue jour avec bandeau de dates sur téléphone. Clic sur un créneau vide = réserver une
// séance à cette heure ; glisser une séance = la déplacer (pas de 15 min) ; clic sur une
// séance = détail (statut, déplacement, suppression). Écritures directes dans coach_sessions
// (RLS : uniquement les séances du coach connecté).

const START_H = 6, END_H = 23;            // plage affichée
const HOUR_PX = 56;                        // hauteur d'une heure
const DAY_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const dayKey = (d: Date) => d.toLocaleDateString("sv-SE");
const mondayOf = (d: Date) => { const n = new Date(d); n.setHours(12, 0, 0, 0); n.setDate(n.getDate() - ((n.getDay() + 6) % 7)); return dayKey(n); };
const addDays = (iso: string, n: number) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return dayKey(d); };
const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const minutesOf = (d: Date) => d.getHours() * 60 + d.getMinutes();

// Couleurs des blocs par statut (planifiée = or de la marque).
const BLOCK_COLOR: Record<SessionStatus, string> = { planifiee: "#c9a84c", effectuee: "#7eb8a0", absent: "#e0a070", annulee: "#9a9a9a" };

function useIsDesktop() {
  return useSyncExternalStore(
    cb => { const m = window.matchMedia("(min-width: 768px)"); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); },
    () => window.matchMedia("(min-width: 768px)").matches,
    () => true,
  );
}

// Séances qui se chevauchent le même jour : réparties côte à côte.
function layoutDay(list: CoachSession[]) {
  const items = list.map(s => { const d = new Date(s.scheduled_at); const start = minutesOf(d); return { s, start, end: start + (s.duration_min || 60) }; })
    .sort((a, b) => a.start - b.start);
  const out: { s: CoachSession; start: number; end: number; col: number; cols: number }[] = [];
  let group: typeof out = [];
  let groupEnd = -1;
  const flush = () => { const cols = Math.max(...group.map(g => g.col)) + 1; group.forEach(g => { g.cols = cols; out.push(g); }); group = []; };
  for (const it of items) {
    if (group.length && it.start >= groupEnd) flush();
    const used = new Set(group.filter(g => g.end > it.start).map(g => g.col));
    let col = 0; while (used.has(col)) col++;
    group.push({ ...it, col, cols: 1 });
    groupEnd = Math.max(groupEnd, it.end);
  }
  if (group.length) flush();
  return out;
}

type Props = { data: BusinessData; reload: () => Promise<void> };

export function AgendaTab({ data, reload }: Props) {
  const isDesktop = useIsDesktop();
  const today = dayKey(new Date());
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [day, setDay] = useState(today);              // jour affiché sur téléphone
  const [create, setCreate] = useState<{ date: string; time: string } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [nowMin, setNowMin] = useState(() => minutesOf(new Date()));
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNowMin(minutesOf(new Date())), 60_000);
    return () => clearInterval(t);
  }, []);
  // Ouverture : on se place vers 7h.
  useEffect(() => { scroller.current?.scrollTo({ top: (7 - START_H) * HOUR_PX }); }, []);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const shownDays = isDesktop ? weekDays : [day];

  const byDay = useMemo(() => {
    const m = new Map<string, CoachSession[]>();
    for (const s of data.sessions) { const k = dayKey(new Date(s.scheduled_at)); m.set(k, [...(m.get(k) ?? []), s]); }
    return m;
  }, [data.sessions]);

  const weekSessions = weekDays.flatMap(d => byDay.get(d) ?? []).filter(s => s.status !== "annulee");
  const weekHours = weekSessions.reduce((a, s) => a + (s.duration_min || 60), 0) / 60;
  const weekValue = weekSessions.reduce((a, s) => {
    if (s.price_chf != null) return a + Number(s.price_chf);
    const p = s.pack_id ? data.packs.find(x => x.id === s.pack_id) : null;
    return a + (p && p.sessions_total ? Number(p.price_chf) / p.sessions_total : 0);
  }, 0);

  const goWeek = (n: number) => { const w = addDays(weekStart, 7 * n); setWeekStart(w); setDay(n === 0 ? today : w); };
  const goToday = () => { setWeekStart(mondayOf(new Date())); setDay(today); };
  const pickDay = (d: string) => { setDay(d); };

  const monthLabel = new Date(weekStart + "T12:00:00").toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  // Position verticale → heure (arrondie au quart d'heure).
  const minuteAt = (e: React.MouseEvent | React.DragEvent, el: HTMLElement, step: number) => {
    const y = e.clientY - el.getBoundingClientRect().top;
    const m = START_H * 60 + Math.round((y / HOUR_PX) * 60 / step) * step;
    return Math.max(START_H * 60, Math.min(END_H * 60 - step, m));
  };

  const move = async (id: string, date: string, minute: number) => {
    const iso = new Date(`${date}T${hhmm(minute)}:00`).toISOString();
    await supabase.from("coach_sessions").update({ scheduled_at: iso }).eq("id", id);
    await reload();
  };

  const nowTop = (nowMin - START_H * 60) / 60 * HOUR_PX;
  const hours = Array.from({ length: END_H - START_H }, (_, i) => START_H + i);
  const open = openId ? data.sessions.find(s => s.id === openId) ?? null : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-[var(--t-border)] bg-[var(--t-surface)] overflow-hidden">
            <button onClick={() => goWeek(-1)} aria-label="Semaine précédente" className="px-2.5 py-2 text-[var(--t-text-50)] hover:text-[var(--t-text)] hover:bg-[var(--t-glass-bg)]"><Icon icon={ChevronLeft} size={15}/></button>
            <button onClick={goToday} className="px-3 py-2 text-[0.72rem] font-medium text-[var(--t-text-60)] border-x border-[var(--t-border)] hover:bg-[var(--t-glass-bg)]">Aujourd&apos;hui</button>
            <button onClick={() => goWeek(1)} aria-label="Semaine suivante" className="px-2.5 py-2 text-[var(--t-text-50)] hover:text-[var(--t-text)] hover:bg-[var(--t-glass-bg)]"><Icon icon={ChevronRight} size={15}/></button>
          </div>
          <p className="text-[1rem] font-semibold capitalize text-[var(--t-text)]">{monthLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="hidden sm:block text-[0.75rem] text-[var(--t-text-50)]">
            <b className="text-[var(--t-text)]">{weekSessions.length}</b> séance{weekSessions.length > 1 ? "s" : ""} · {weekHours.toLocaleString("fr-CH", { maximumFractionDigits: 1 })} h · <b className="text-[#c9a84c]">{chf(weekValue)}</b>
          </p>
          <button onClick={() => setCreate({ date: isDesktop ? (weekDays.includes(today) ? today : weekStart) : day, time: "18:00" })} className={btnGold} disabled={!data.clients.length}>Réserver</button>
        </div>
      </div>

      {/* Téléphone : bandeau des 7 jours */}
      {!isDesktop && (
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((d, i) => {
            const n = (byDay.get(d) ?? []).filter(s => s.status !== "annulee").length;
            const on = d === day;
            return (
              <button key={d} onClick={() => pickDay(d)}
                className={`flex flex-col items-center gap-0.5 py-2 rounded-xl transition-colors ${on ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-on-gold" : d === today ? "text-[#c9a84c]" : "text-[var(--t-text-60)]"}`}>
                <span className="text-[0.62rem] font-semibold uppercase">{DAY_SHORT[i]}</span>
                <span className="text-[0.95rem] font-bold tabular-nums">{new Date(d + "T12:00:00").getDate()}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${n ? (on ? "bg-white" : "bg-[#c9a84c]") : "bg-transparent"}`}/>
              </button>
            );
          })}
        </div>
      )}

      <div className={`${card} overflow-hidden`}>
        {/* En-tête des jours (ordinateur) */}
        {isDesktop && (
          <div className="grid border-b border-[var(--t-border-soft)]" style={{ gridTemplateColumns: `56px repeat(7, minmax(0, 1fr))` }}>
            <span/>
            {weekDays.map((d, i) => {
              const isToday = d === today;
              return (
                <div key={d} className="py-2.5 text-center border-l border-[var(--t-border-soft)]">
                  <p className={`text-[0.62rem] font-semibold uppercase tracking-wide ${isToday ? "text-[#c9a84c]" : "text-[var(--t-text-50)]"}`}>{DAY_SHORT[i]}</p>
                  <p className={`mx-auto mt-0.5 text-[1.05rem] font-bold tabular-nums ${isToday ? "w-8 h-8 rounded-full bg-[#c9a84c] text-on-gold flex items-center justify-center" : "text-[var(--t-text)]"}`}>
                    {new Date(d + "T12:00:00").getDate()}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <div ref={scroller} className="relative max-h-[68vh] overflow-y-auto no-scrollbar">
          <div className="grid relative" style={{ gridTemplateColumns: `56px repeat(${shownDays.length}, minmax(0, 1fr))`, height: (END_H - START_H) * HOUR_PX }}>
            {/* Heures */}
            <div className="relative">
              {hours.map(h => (
                <span key={h} className="absolute right-2 -translate-y-1/2 text-[0.66rem] tabular-nums text-[var(--t-text-40)]" style={{ top: (h - START_H) * HOUR_PX }}>
                  {h > START_H ? `${h}:00` : ""}
                </span>
              ))}
            </div>

            {shownDays.map(d => {
              const items = layoutDay(byDay.get(d) ?? []);
              return (
                <div key={d}
                  className={`relative border-l border-[var(--t-border-soft)] ${d === today ? "bg-[#c9a84c]/[0.04]" : ""} cursor-pointer`}
                  onClick={e => { if (e.target === e.currentTarget) setCreate({ date: d, time: hhmm(minuteAt(e, e.currentTarget, 30)) }); }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); if (dragId) { move(dragId, d, minuteAt(e, e.currentTarget, 15)); setDragId(null); } }}>
                  {/* lignes des heures et demi-heures */}
                  {hours.map(h => (
                    <div key={h} className="absolute inset-x-0 pointer-events-none" style={{ top: (h - START_H) * HOUR_PX }}>
                      <div className="border-t border-[var(--t-border-soft)]"/>
                      <div className="border-t border-dashed border-[var(--t-border-soft)] opacity-50" style={{ marginTop: HOUR_PX / 2 - 1 }}/>
                    </div>
                  ))}
                  {/* heure actuelle */}
                  {d === today && nowTop > 0 && nowTop < (END_H - START_H) * HOUR_PX && (
                    <div className="absolute inset-x-0 z-10 pointer-events-none" style={{ top: nowTop }}>
                      <div className="h-[2px] bg-[#e07070]"/>
                      <div className="absolute -left-1 -top-[4px] w-2.5 h-2.5 rounded-full bg-[#e07070]"/>
                    </div>
                  )}
                  {items.map(({ s, start, end, col, cols }) => {
                    const color = BLOCK_COLOR[s.status];
                    const top = Math.max(0, (start - START_H * 60) / 60 * HOUR_PX);
                    const height = Math.max(22, (end - start) / 60 * HOUR_PX - 2);
                    const pack = s.pack_id ? data.packs.find(p => p.id === s.pack_id) : null;
                    return (
                      <button key={s.id}
                        draggable={isDesktop}
                        onDragStart={e => { setDragId(s.id); e.dataTransfer.effectAllowed = "move"; }}
                        onDragEnd={() => setDragId(null)}
                        onClick={() => setOpenId(s.id)}
                        className={`absolute z-[5] rounded-lg px-2 py-1 text-left overflow-hidden transition-all hover:brightness-105 hover:shadow-md ${dragId === s.id ? "opacity-40" : ""}`}
                        style={{
                          top, height,
                          left: `calc(${(col / cols) * 100}% + 2px)`, width: `calc(${100 / cols}% - 4px)`,
                          backgroundColor: `${color}26`, boxShadow: `inset 3px 0 0 ${color}`, color: "var(--t-text)",
                        }}>
                        <p className={`text-[0.74rem] font-semibold leading-tight truncate ${s.status === "annulee" ? "line-through opacity-60" : ""}`}>{clientName(data.clients, s.client_id)}</p>
                        {height > 34 && <p className="text-[0.66rem] text-[var(--t-text-60)] tabular-nums truncate">{hhmm(start)} – {hhmm(end)}</p>}
                        {height > 54 && <p className="text-[0.64rem] text-[var(--t-text-50)] truncate">{s.location || (pack ? pack.label : s.price_chf != null ? chf(Number(s.price_chf)) : "")}</p>}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-[0.7rem] text-[var(--t-text-50)]">
        {(Object.keys(BLOCK_COLOR) as SessionStatus[]).map(k => (
          <span key={k} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: BLOCK_COLOR[k] }}/>{SESSION_STATUS_CFG[k].label}</span>
        ))}
        <span className="hidden md:inline">· Clique sur un créneau libre pour réserver, glisse une séance pour la déplacer.</span>
        <span className="md:hidden">· Touche un créneau libre pour réserver.</span>
      </div>

      {create && (
        <NewSessionModal data={data} initialDate={create.date} initialTime={create.time}
          onClose={() => setCreate(null)} onSaved={reload}/>
      )}
      {open && <SessionDetail s={open} data={data} onClose={() => setOpenId(null)} reload={reload}/>}
    </div>
  );
}

function SessionDetail({ s, data, onClose, reload }: { s: CoachSession; data: BusinessData; onClose: () => void; reload: () => Promise<void> }) {
  const d = new Date(s.scheduled_at);
  const [date, setDate] = useState(dayKey(d));
  const [time, setTime] = useState(hhmm(minutesOf(d)));
  const [duration, setDuration] = useState(String(s.duration_min || 60));
  const [busy, setBusy] = useState(false);
  const pack = s.pack_id ? data.packs.find(p => p.id === s.pack_id) : null;

  const run = async (fn: () => PromiseLike<unknown>) => { setBusy(true); await fn(); await reload(); setBusy(false); onClose(); };
  const setStatus = (status: SessionStatus) => run(() => supabase.from("coach_sessions").update({ status }).eq("id", s.id));
  const saveTime = () => run(() => supabase.from("coach_sessions").update({
    scheduled_at: new Date(`${date}T${time}:00`).toISOString(), duration_min: parseInt(duration) || 60,
  }).eq("id", s.id));
  const remove = () => { if (window.confirm("Supprimer cette séance ?")) run(() => supabase.from("coach_sessions").delete().eq("id", s.id)); };

  return (
    <Modal title={clientName(data.clients, s.client_id)} onClose={onClose}>
      <div className="flex items-center gap-2 flex-wrap">
        <Pill {...SESSION_STATUS_CFG[s.status]}/>
        <span className="text-[0.78rem] text-[var(--t-text-60)] capitalize">
          {d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} · {hhmm(minutesOf(d))} · {s.duration_min} min
        </span>
      </div>
      <p className="text-[0.78rem] text-[var(--t-text-60)]">
        {pack ? `${pack.label} — ${packUsage(pack, data.sessions).remaining} séance(s) restante(s)` : s.price_chf != null ? `Séance à l'unité · ${chf(Number(s.price_chf))}` : "Hors pack"}
        {s.location ? ` · ${s.location}` : ""}
      </p>
      {s.notes && <p className="text-[0.78rem] text-[var(--t-text-70)] rounded-xl bg-[var(--t-surface)] border border-[var(--t-border-soft)] px-3 py-2">{s.notes}</p>}

      <div>
        <label className={lbl}>Statut</label>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(SESSION_STATUS_CFG) as SessionStatus[]).filter(k => k !== s.status).map(k => (
            <button key={k} disabled={busy} onClick={() => setStatus(k)} className={btnGhost}>{SESSION_STATUS_CFG[k].label}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div><label className={lbl}>Date</label><input type="date" className={inp} value={date} onChange={e => setDate(e.target.value)}/></div>
        <div><label className={lbl}>Heure</label><input type="time" className={inp} value={time} onChange={e => setTime(e.target.value)}/></div>
        <div><label className={lbl}>Durée</label><input type="number" className={inp} value={duration} onChange={e => setDuration(e.target.value)}/></div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <button onClick={remove} disabled={busy} className="text-[0.72rem] text-[var(--t-text-40)] hover:text-[#e07070]">Supprimer</button>
        <button onClick={saveTime} disabled={busy} className={btnGold}>{busy ? "…" : "Enregistrer"}</button>
      </div>
    </Modal>
  );
}
