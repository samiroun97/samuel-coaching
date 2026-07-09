"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

type Profile = { poids: number; taille: number; age: number; sexe: string };
type LoggedWorkout = {
  id: string; date: string; activity: string;
  duration_minutes: number; description: string;
  calories_burned: number; note: string;
};
type PerfRecord = { date: string; calories: number; duration: number; description: string };
type PerfHistory = Record<string, PerfRecord[]>;

const DURATIONS = [
  { label: "15 min", min: 15 }, { label: "30 min", min: 30 }, { label: "45 min", min: 45 },
  { label: "1h",     min: 60 }, { label: "1h15",   min: 75 }, { label: "1h30",   min: 90 },
  { label: "2h",     min: 120 },
];

const todayStr = () => new Date().toISOString().split("T")[0];

const neatFromSteps = (steps: number, poids: number) =>
  Math.round(steps * 0.04 * (poids / 70));

function DateNav({ date, onChange }: { date: string; onChange: (d: string) => void }) {
  const todayD = new Date().toISOString().split("T")[0];
  const isToday = date === todayD;
  const move = (delta: number) => {
    const d = new Date(date + "T12:00:00"); d.setDate(d.getDate() + delta);
    onChange(d.toISOString().split("T")[0]);
  };
  const label = isToday ? "Aujourd'hui" : new Date(date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  return (
    <div className="flex items-center gap-2 mb-6">
      <button onClick={() => move(-1)} className="w-7 h-7 border border-white/10 text-white/40 hover:text-white/60 hover:border-white/20 transition-colors flex items-center justify-center shrink-0">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div className="flex-1 relative flex items-center justify-center gap-1.5 cursor-pointer group">
        <input
          type="date" value={date} max={todayD}
          onChange={e => { if (e.target.value) onChange(e.target.value); }}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/30 group-hover:text-white/50 transition-colors shrink-0">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <p className="text-[0.6rem] tracking-[0.15em] uppercase text-white/50 group-hover:text-white/70 transition-colors capitalize select-none">{label}</p>
      </div>
      <button onClick={() => move(1)} disabled={isToday} className="w-7 h-7 border border-white/10 text-white/40 hover:text-white/60 hover:border-white/20 transition-colors flex items-center justify-center shrink-0 disabled:opacity-20 disabled:cursor-not-allowed">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
      {!isToday && (
        <button onClick={() => onChange(todayD)} className="text-[0.45rem] tracking-[0.12em] uppercase text-[#c9a84c] border border-[#c9a84c]/30 px-2 py-1 hover:bg-[#c9a84c]/10 transition-colors shrink-0">
          Auj.
        </button>
      )}
    </div>
  );
}

export default function ProgrammePage() {
  const [profile,      setProfile]      = useState<Profile | null>(null);
  const [workouts,     setWorkouts]     = useState<LoggedWorkout[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [steps,        setSteps]        = useState(0);
  const [stepsInput,   setStepsInput]   = useState("0");
  const [stepGoal,     setStepGoal]     = useState(10000);
  const [goalInput,    setGoalInput]    = useState("10000");
  const [editingGoal,  setEditingGoal]  = useState(false);

  /* form */
  const [perfHistory, setPerfHistory] = useState<PerfHistory>({});
  const [activity,    setActivity]    = useState("");
  const [durationMin, setDurationMin] = useState(60);
  const [description, setDescription] = useState("");
  const [listening,   setListening]   = useState(false);
  const [estimating,  setEstimating]  = useState(false);
  const [calResult,   setCalResult]   = useState<{ calories_brulees: number; note: string } | null>(null);
  const [calError,    setCalError]    = useState("");
  const recognitionRef = useRef<{ start(): void; stop(): void } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from("profiles").select("poids,taille,age,sexe").eq("id", user.id).single();
      if (p) setProfile(p as Profile);
    })();
    const saved  = localStorage.getItem("programme_logs");
    const savedG = localStorage.getItem("steps_goal");
    const savedP = localStorage.getItem("perf_history");
    if (saved)  setWorkouts(JSON.parse(saved));
    if (savedG) { const g = parseInt(savedG); setStepGoal(g); setGoalInput(g.toString()); }
    if (savedP) setPerfHistory(JSON.parse(savedP));
  }, []);

  useEffect(() => {
    const savedS = localStorage.getItem(`steps_${selectedDate}`);
    if (savedS) { const n = parseInt(savedS); setSteps(n); setStepsInput(n.toString()); }
    else { setSteps(0); setStepsInput("0"); }
  }, [selectedDate]);

  const saveSteps = (n: number) => {
    const clamped = Math.max(0, n);
    setSteps(clamped);
    setStepsInput(clamped.toString());
    localStorage.setItem(`steps_${selectedDate}`, clamped.toString());
  };

  const saveGoal = (g: number) => {
    const clamped = Math.max(1000, g);
    setStepGoal(clamped); setGoalInput(clamped.toString()); setEditingGoal(false);
    localStorage.setItem("steps_goal", clamped.toString());
  };

  const todayWorkouts = workouts.filter(w => w.date.startsWith(selectedDate));
  const eatCal        = todayWorkouts.reduce((s, w) => s + w.calories_burned, 0);
  const neatCal       = neatFromSteps(steps, profile?.poids ?? 70);
  const totalCal      = eatCal + neatCal;
  const stepsPct      = Math.min((steps / stepGoal) * 100, 100);
  const stepsKm       = (steps * 0.0007).toFixed(1);

  const estimate = async () => {
    if (!activity.trim() || !durationMin) return;
    setEstimating(true); setCalError(""); setCalResult(null);
    try {
      const res = await fetch("/api/programme/calories", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activity, duration_minutes: durationMin, description, profile }),
      });
      if (!res.ok) { const t = await res.text(); throw new Error(t || `Erreur ${res.status}`); }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCalResult(data);
    } catch (e: unknown) { setCalError(e instanceof Error ? e.message : "Erreur"); }
    setEstimating(false);
  };

  const addWorkout = () => {
    if (!activity.trim() || !calResult) return;
    const entry: LoggedWorkout = {
      id: Date.now().toString(),
      date: new Date(selectedDate + "T12:00:00").toISOString(),
      activity, duration_minutes: durationMin, description,
      calories_burned: calResult.calories_brulees,
      note: calResult.note,
    };
    const next = [entry, ...workouts].slice(0, 50);
    setWorkouts(next);
    localStorage.setItem("programme_logs", JSON.stringify(next));

    // Historique perfs par activité
    const key = activity.trim().toLowerCase();
    const rec: PerfRecord = { date: entry.date, calories: calResult.calories_brulees, duration: durationMin, description };
    const prevPerf = perfHistory[key] ?? [];
    const newPerf = { ...perfHistory, [key]: [rec, ...prevPerf].slice(0, 5) };
    setPerfHistory(newPerf);
    localStorage.setItem("perf_history", JSON.stringify(newPerf));

    setActivity(""); setDurationMin(60); setDescription(""); setCalResult(null); setCalError("");
  };

  const removeWorkout = (id: string) => {
    const next = workouts.filter(w => w.id !== id);
    setWorkouts(next);
    localStorage.setItem("programme_logs", JSON.stringify(next));
  };

  const startVoice = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setCalError("Reconnaissance vocale non supportée."); return; }
    const rec = new SR(); rec.lang = "fr-FR"; rec.continuous = false; rec.interimResults = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (ev: any) => { setDescription(ev.results[0][0].transcript); setListening(false); };
    rec.onerror = () => setListening(false); rec.onend = () => setListening(false);
    recognitionRef.current = rec; rec.start(); setListening(true);
  };
  const stopVoice = () => { recognitionRef.current?.stop(); setListening(false); };

  const lastPerf = activity.trim()
    ? (perfHistory[activity.trim().toLowerCase()]?.[0] ?? null)
    : null;

  const chip = (active: boolean) =>
    `px-3 py-2 text-[0.6rem] tracking-[0.1em] uppercase border cursor-pointer transition-all ${active ? "border-[#c9a84c] text-[#c9a84c] bg-[#c9a84c]/10" : "border-white/10 text-white/40 hover:border-white/30 hover:text-white/60"}`;
  const inputCls = "w-full bg-[#0a0a0a] border border-white/10 text-white placeholder-white/20 text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors";

  const pastDates = [...new Set(
    workouts.filter(w => !w.date.startsWith(selectedDate)).map(w => w.date.split("T")[0])
  )].slice(0, 6);

  return (
    <div className="p-4 sm:p-8 max-w-2xl">

      {/* Header */}
      <div className="mb-6">
        <p className="text-[0.7rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-2">Rubrique</p>
        <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl sm:text-5xl text-white tracking-wide">PROGRAMME</h1>
      </div>

      <DateNav date={selectedDate} onChange={setSelectedDate} />

      {/* ── Séances du jour ── */}
      {todayWorkouts.length > 0 && (
        <div className="border border-white/10 bg-[#111] mb-6">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
            <p style={{ fontFamily: "var(--font-bebas)" }} className="text-sm tracking-wider text-white">
              {selectedDate === todayStr() ? "Séances du jour" : `Séances · ${new Date(selectedDate + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`}
            </p>
            <div className="flex items-center gap-1.5">
              <span style={{ fontFamily: "var(--font-bebas)" }} className="text-lg text-[#c9a84c] tracking-wide">{eatCal}</span>
              <span className="text-[0.45rem] text-white/25 uppercase tracking-wider">kcal</span>
            </div>
          </div>
          {todayWorkouts.map(w => (
            <div key={w.id} className="flex items-center justify-between px-5 py-3 border-b border-white/5 last:border-0">
              <div>
                <p className="text-xs text-white/70">{w.activity}</p>
                <p className="text-[0.5rem] text-white/25 mt-0.5">{w.duration_minutes} min{w.description ? ` · ${w.description}` : ""}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/50">{w.calories_burned} kcal</span>
                <button onClick={() => removeWorkout(w.id)}
                  className="text-white/20 hover:text-[#e07070] transition-colors">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pas ── */}
      <div className="border border-white/10 bg-[#111] p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
<p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c]">
                  {selectedDate === todayStr() ? "Pas aujourd'hui" : `Pas · ${new Date(selectedDate + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`}
                </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[0.7rem] text-white/30">{stepsKm} km</span>
            <button onClick={() => saveSteps(steps - 500)} disabled={steps === 0}
              className="w-7 h-7 border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-colors disabled:opacity-20 flex items-center justify-center text-sm">−</button>
            <input
              type="number" min="0"
              className="w-20 bg-[#0a0a0a] border border-white/10 text-white text-center text-sm py-1 focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
              value={stepsInput}
              onChange={e => setStepsInput(e.target.value)}
              onBlur={() => saveSteps(parseInt(stepsInput) || 0)}
              onKeyDown={e => { if (e.key === "Enter") saveSteps(parseInt(stepsInput) || 0); }}
            />
            <button onClick={() => saveSteps(steps + 500)}
              className="w-7 h-7 border border-[#7eb8a0]/40 text-[#7eb8a0] hover:bg-[#7eb8a0]/10 transition-colors flex items-center justify-center text-sm">+</button>
          </div>
        </div>

        <div className="h-1.5 bg-white/5 mb-2">
          <div className="h-full transition-all duration-500 rounded-full" style={{ width: `${stepsPct}%`, backgroundColor: steps >= stepGoal ? "#c9a84c" : "#7eb8a0" }}/>
        </div>

        <div className="flex items-center justify-between text-[0.45rem] text-white/20 tracking-wider">
          <span>{steps.toLocaleString("fr-FR")} pas</span>
          <span className={steps >= stepGoal ? "text-[#c9a84c]" : ""}>
            {steps >= stepGoal ? "Objectif atteint ✓" : `${(stepGoal - steps).toLocaleString("fr-FR")} restants`}
          </span>
          {/* Objectif modifiable */}
          <div className="flex items-center gap-1">
            <span>Objectif :</span>
            {editingGoal ? (
              <input
                type="number" autoFocus
                className="w-16 bg-[#0a0a0a] border border-[#c9a84c]/40 text-[#c9a84c] text-center text-[0.45rem] py-0.5 focus:outline-none"
                value={goalInput}
                onChange={e => setGoalInput(e.target.value)}
                onBlur={() => saveGoal(parseInt(goalInput) || 10000)}
                onKeyDown={e => { if (e.key === "Enter") saveGoal(parseInt(goalInput) || 10000); if (e.key === "Escape") setEditingGoal(false); }}
              />
            ) : (
              <button onClick={() => { setEditingGoal(true); setGoalInput(stepGoal.toString()); }}
                className="text-white/30 hover:text-[#c9a84c] transition-colors underline decoration-dotted">
                {stepGoal.toLocaleString("fr-FR")}
              </button>
            )}
            <span>pas</span>
          </div>
        </div>
      </div>

      {/* ── Formulaire séance ── */}
      <div className="border border-white/10 bg-[#111] p-6 mb-6 flex flex-col gap-5">
        <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c]">Enregistrer une séance</p>

        <div>
          <label className="text-[0.7rem] tracking-[0.2em] uppercase text-white/40 block mb-1.5">Activité</label>
          <input className={inputCls} placeholder="Ex : musculation, boxe, natation, vélo…"
            value={activity} onChange={e => { setActivity(e.target.value); setCalResult(null); }}/>
          {lastPerf && (
            <div className="mt-1.5 flex items-center justify-between bg-[#0a0a0a] border border-white/5 px-3 py-2">
              <span className="text-[0.5rem] tracking-wider text-white/25 uppercase">Dernière fois</span>
              <div className="flex items-center gap-3">
                <span className="text-[0.5rem] text-white/35">{lastPerf.duration} min</span>
                <span className="text-[0.5rem] text-[#c9a84c]/70">{lastPerf.calories} kcal</span>
                <span className="text-[0.45rem] text-white/20">
                  {new Date(lastPerf.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </span>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="text-[0.7rem] tracking-[0.2em] uppercase text-white/40 block mb-2">Durée</label>
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map(d => (
              <button key={d.min} onClick={() => { setDurationMin(d.min); setCalResult(null); }} className={chip(durationMin === d.min)}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[0.7rem] tracking-[0.2em] uppercase text-white/40 block mb-1.5">
            Décris ta séance <span className="text-white/20">(optionnel)</span>
          </label>
          <div className="relative">
            <textarea
              className="w-full bg-[#0a0a0a] border border-white/10 text-white placeholder-white/20 text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/40 transition-colors resize-none pr-12"
              rows={2} placeholder="Ex : séance intense, supersets, bonne récupération…"
              value={description} onChange={e => { setDescription(e.target.value); setCalResult(null); }}
            />
            <button onClick={listening ? stopVoice : startVoice}
              className={`absolute right-3 top-3 p-1.5 border transition-colors ${listening ? "border-[#e07070] text-[#e07070] animate-pulse" : "border-white/10 text-white/30 hover:text-white/60 hover:border-white/20"}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>
              </svg>
            </button>
          </div>
        </div>

        {calError && <p className="text-xs text-[#e07070] border border-[#e07070]/20 bg-[#e07070]/5 px-3 py-2">{calError}</p>}

        {calResult ? (
          <div className="flex flex-col gap-3">
            <div className="border border-[#c9a84c]/20 bg-[#c9a84c]/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-[0.5rem] tracking-[0.15em] uppercase text-[#c9a84c] mb-1">Estimation IA</p>
                <p className="text-[0.7rem] text-white/40 italic">{calResult.note}</p>
              </div>
              <div className="text-right">
                <p style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl text-white tracking-wide leading-none">{calResult.calories_brulees}</p>
                <p className="text-[0.45rem] tracking-[0.15em] uppercase text-white/30">kcal</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCalResult(null)}
                className="flex-1 border border-white/10 text-white/40 text-[0.7rem] tracking-[0.15em] uppercase py-2.5 hover:border-white/20 hover:text-white/60 transition-colors">
                Ré-estimer
              </button>
              <button onClick={addWorkout}
                className="flex-1 bg-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.2em] uppercase py-2.5 hover:bg-[#e2c97e] transition-colors">
                Ajouter à ma journée →
              </button>
            </div>
          </div>
        ) : (
          <button onClick={estimate} disabled={!activity.trim() || estimating}
            className="bg-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.2em] uppercase py-3.5 hover:bg-[#e2c97e] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {estimating
              ? <><div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"/>Estimation en cours…</>
              : "Estimer les calories brûlées →"}
          </button>
        )}
      </div>

      {/* ── EAT / NEAT / TOTAL ── */}
      <div className="border border-white/10 bg-[#111] p-5 mb-8">
        <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-4">Dépense du jour</p>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* EAT */}
          <div className="border border-white/5 bg-[#0a0a0a] py-4 px-3 text-center">
            <p style={{ fontFamily: "var(--font-bebas)" }} className="text-3xl text-[#c9a84c] tracking-wide leading-none">{eatCal}</p>
            <p className="text-[0.5rem] tracking-[0.15em] uppercase text-white/30 mt-1.5">EAT</p>
            <p className="text-[0.45rem] text-white/15 mt-0.5">Exercice intentionnel</p>
          </div>
          {/* NEAT */}
          <div className="border border-white/5 bg-[#0a0a0a] py-4 px-3 text-center">
            <p style={{ fontFamily: "var(--font-bebas)" }} className="text-3xl text-[#7eb8a0] tracking-wide leading-none">{neatCal}</p>
            <p className="text-[0.5rem] tracking-[0.15em] uppercase text-white/30 mt-1.5">NEAT</p>
            <p className="text-[0.45rem] text-white/15 mt-0.5">Activité quotidienne</p>
          </div>
          {/* Total */}
          <div className="border border-[#c9a84c]/15 bg-[#c9a84c]/5 py-4 px-3 text-center">
            <p style={{ fontFamily: "var(--font-bebas)" }} className="text-3xl text-white tracking-wide leading-none">{totalCal}</p>
            <p className="text-[0.5rem] tracking-[0.15em] uppercase text-white/30 mt-1.5">Total</p>
            <p className="text-[0.45rem] text-white/15 mt-0.5">kcal brûlées</p>
          </div>
        </div>

        {/* Barre EAT / NEAT */}
        {totalCal > 0 && (
          <div className="mb-3">
            <div className="flex h-1.5 w-full overflow-hidden">
              <div className="h-full transition-all duration-700" style={{ width: `${totalCal > 0 ? (eatCal / totalCal) * 100 : 0}%`, backgroundColor: "#c9a84c" }}/>
              <div className="h-full transition-all duration-700" style={{ width: `${totalCal > 0 ? (neatCal / totalCal) * 100 : 0}%`, backgroundColor: "#7eb8a0" }}/>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[0.45rem] text-white/20 tracking-wider">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="w-2 h-2 inline-block" style={{ backgroundColor: "#c9a84c" }}/>EAT : exercice</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 inline-block" style={{ backgroundColor: "#7eb8a0" }}/>NEAT : {steps.toLocaleString("fr-FR")} pas</span>
          </div>
          {!profile && <span className="text-white/15">Complète ton profil pour personnaliser</span>}
        </div>
      </div>

      {/* ── Historique ── */}
      {pastDates.length > 0 && (
        <div>
          <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-4">Historique</p>
          {pastDates.map(date => {
            const dayWorkouts = workouts.filter(w => w.date.startsWith(date));
            const dayCal = dayWorkouts.reduce((s, w) => s + w.calories_burned, 0);
            const label = new Date(date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" });
            return (
              <div key={date} className="border border-white/10 bg-[#111] mb-3">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
                  <span className="text-[0.7rem] tracking-wider text-white/40 capitalize">{label}</span>
                  <span className="text-[0.7rem] tracking-wider text-white/30">{dayCal} kcal</span>
                </div>
                {dayWorkouts.map(w => (
                  <div key={w.id} className="flex items-center justify-between px-5 py-2.5 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-xs text-white/60">{w.activity}</p>
                      <p className="text-[0.5rem] text-white/20 mt-0.5">{w.duration_minutes} min</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-white/40">{w.calories_burned} kcal</span>
                      <button onClick={() => removeWorkout(w.id)}
                        className="text-white/20 hover:text-[#e07070] transition-colors">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
