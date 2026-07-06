"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

type Profile = { poids: number; taille: number; age: number; sexe: string };
type LoggedWorkout = {
  id: string; date: string; activity: string;
  duration_minutes: number; description: string;
  calories_burned: number; note: string;
};

const DURATIONS = [
  { label: "15 min", min: 15 }, { label: "30 min", min: 30 }, { label: "45 min", min: 45 },
  { label: "1h",     min: 60 }, { label: "1h15",   min: 75 }, { label: "1h30",   min: 90 },
  { label: "2h",     min: 120 },
];

const today = () => new Date().toISOString().split("T")[0];

export default function ProgrammePage() {
  const [profile,   setProfile]   = useState<Profile | null>(null);
  const [workouts,  setWorkouts]  = useState<LoggedWorkout[]>([]);

  /* form */
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
    const saved = localStorage.getItem("programme_logs");
    if (saved) setWorkouts(JSON.parse(saved));
  }, []);

  const todayWorkouts = workouts.filter(w => w.date.startsWith(today()));
  const todayCalories = todayWorkouts.reduce((s, w) => s + w.calories_burned, 0);

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
      date: new Date().toISOString(),
      activity,
      duration_minutes: durationMin,
      description,
      calories_burned: calResult.calories_brulees,
      note: calResult.note,
    };
    const next = [entry, ...workouts].slice(0, 50);
    setWorkouts(next);
    localStorage.setItem("programme_logs", JSON.stringify(next));
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

  const chip = (active: boolean) =>
    `px-3 py-2 text-[0.6rem] tracking-[0.1em] uppercase border cursor-pointer transition-all ${active ? "border-[#c9a84c] text-[#c9a84c] bg-[#c9a84c]/10" : "border-white/10 text-white/40 hover:border-white/30 hover:text-white/60"}`;
  const inputCls = "w-full bg-[#0a0a0a] border border-white/10 text-white placeholder-white/20 text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors";

  /* group past workouts by date */
  const pastDates = [...new Set(
    workouts.filter(w => !w.date.startsWith(today())).map(w => w.date.split("T")[0])
  )].slice(0, 6);

  return (
    <div className="p-8 max-w-2xl">

      {/* Header */}
      <div className="mb-10">
        <p className="text-[0.55rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-2">Rubrique</p>
        <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-5xl text-white tracking-wide">PROGRAMME</h1>
        <p className="text-white/30 text-xs mt-1 capitalize">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* ── Aujourd'hui ── */}
      {todayWorkouts.length > 0 && (
        <div className="border border-white/10 bg-[#111] mb-8">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
            <p style={{ fontFamily: "var(--font-bebas)" }} className="text-sm tracking-wider text-white">Aujourd&apos;hui</p>
            <div className="flex items-center gap-1.5">
              <span style={{ fontFamily: "var(--font-bebas)" }} className="text-lg text-[#c9a84c] tracking-wide">{todayCalories}</span>
              <span className="text-[0.45rem] text-white/25 uppercase tracking-wider">kcal brûlées</span>
            </div>
          </div>
          {todayWorkouts.map(w => (
            <div key={w.id} className="flex items-center justify-between px-5 py-3 border-b border-white/5 last:border-0 group">
              <div>
                <p className="text-xs text-white/70">{w.activity}</p>
                <p className="text-[0.5rem] text-white/25 mt-0.5">{w.duration_minutes} min{w.description ? ` · ${w.description}` : ""}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/50">{w.calories_burned} kcal</span>
                <button onClick={() => removeWorkout(w.id)}
                  className="text-white/10 hover:text-[#e07070] transition-colors opacity-0 group-hover:opacity-100">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Formulaire d'enregistrement ── */}
      <div className="border border-white/10 bg-[#111] p-6 mb-8 flex flex-col gap-5">
        <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c]">Enregistrer une séance</p>

        {/* Activity free input */}
        <div>
          <label className="text-[0.55rem] tracking-[0.2em] uppercase text-white/40 block mb-1.5">Activité</label>
          <input className={inputCls} placeholder="Ex : musculation, boxe, natation, vélo…"
            value={activity} onChange={e => { setActivity(e.target.value); setCalResult(null); }}/>
        </div>

        {/* Duration */}
        <div>
          <label className="text-[0.55rem] tracking-[0.2em] uppercase text-white/40 block mb-2">Durée</label>
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map(d => (
              <button key={d.min} onClick={() => { setDurationMin(d.min); setCalResult(null); }} className={chip(durationMin === d.min)}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description + voice */}
        <div>
          <label className="text-[0.55rem] tracking-[0.2em] uppercase text-white/40 block mb-1.5">
            Décris ta séance <span className="text-white/20">(optionnel — améliore l&apos;estimation)</span>
          </label>
          <div className="relative">
            <textarea
              className="w-full bg-[#0a0a0a] border border-white/10 text-white placeholder-white/20 text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/40 transition-colors resize-none pr-12"
              rows={2}
              placeholder="Ex : séance intense, supersets, bonne récupération…"
              value={description}
              onChange={e => { setDescription(e.target.value); setCalResult(null); }}
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

        {/* Result */}
        {calResult ? (
          <div className="flex flex-col gap-4">
            <div className="border border-[#c9a84c]/20 bg-[#c9a84c]/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-[0.5rem] tracking-[0.15em] uppercase text-[#c9a84c] mb-1">Estimation IA</p>
                <p className="text-[0.55rem] text-white/40 italic">{calResult.note}</p>
              </div>
              <div className="text-right">
                <p style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl text-white tracking-wide leading-none">{calResult.calories_brulees}</p>
                <p className="text-[0.45rem] tracking-[0.15em] uppercase text-white/30">kcal brûlées</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCalResult(null)}
                className="flex-1 border border-white/10 text-white/40 text-[0.55rem] tracking-[0.15em] uppercase py-2.5 hover:border-white/20 hover:text-white/60 transition-colors">
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

      {/* ── Historique ── */}
      {pastDates.length > 0 && (
        <div>
          <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-4">Historique</p>
          {pastDates.map(date => {
            const dayWorkouts = workouts.filter(w => w.date.startsWith(date));
            const dayCal = dayWorkouts.reduce((s, w) => s + w.calories_burned, 0);
            const label = new Date(date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" });
            return (
              <div key={date} className="border border-white/10 bg-[#111] mb-3">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
                  <span className="text-[0.55rem] tracking-wider text-white/40 capitalize">{label}</span>
                  <span className="text-[0.55rem] tracking-wider text-white/30">{dayCal} kcal</span>
                </div>
                {dayWorkouts.map(w => (
                  <div key={w.id} className="flex items-center justify-between px-5 py-2.5 border-b border-white/5 last:border-0 group">
                    <div>
                      <p className="text-xs text-white/60">{w.activity}</p>
                      <p className="text-[0.5rem] text-white/20 mt-0.5">{w.duration_minutes} min</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-white/40">{w.calories_burned} kcal</span>
                      <button onClick={() => removeWorkout(w.id)}
                        className="text-white/10 hover:text-[#e07070] transition-colors opacity-0 group-hover:opacity-100">
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
