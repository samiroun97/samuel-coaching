"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

const SAMUEL_EMAIL = "sam97waelti@gmail.com";

const ACTIVITIES = [
  { key: "upper",    label: "Haut du corps" },
  { key: "lower",    label: "Bas du corps" },
  { key: "fullbody", label: "Full body" },
  { key: "cardio",   label: "Course à pied" },
  { key: "velo",     label: "Vélo" },
  { key: "natation", label: "Natation" },
  { key: "boxe",     label: "Boxe / MMA" },
  { key: "hiit",     label: "CrossFit / HIIT" },
  { key: "yoga",     label: "Yoga / Pilates" },
  { key: "foot",     label: "Football" },
  { key: "tennis",   label: "Tennis" },
  { key: "autre",    label: "Autre" },
];
const DURATIONS = [
  { label: "15 min", min: 15 }, { label: "30 min", min: 30 }, { label: "45 min", min: 45 },
  { label: "1h",     min: 60 }, { label: "1h15",   min: 75 }, { label: "1h30",   min: 90 },
  { label: "2h",     min: 120 },
];
const SEANCE_TYPES = ["Haut du corps", "Bas du corps", "Full body", "Cardio", "Boxe", "Natation", "CrossFit", "Yoga", "Autre"];

type Profile = { poids: number; taille: number; age: number; sexe: string };
type AssignedSeance = { id: string; titre: string; description: string | null; exercices: string | null; type_seance: string | null; date_prevue: string | null; assigned_to_email?: string };
type LoggedWorkout = { id: string; date: string; activity_label: string; duration_minutes: number; description: string; calories_burned: number; note: string };

export default function ProgrammePage() {
  const [profile,         setProfile]         = useState<Profile | null>(null);
  const [isSamuel,        setIsSamuel]        = useState(false);
  const [assignedSeances, setAssignedSeances] = useState<AssignedSeance[]>([]);
  const [doneIds,         setDoneIds]         = useState<string[]>([]);
  const [loggedWorkouts,  setLoggedWorkouts]  = useState<LoggedWorkout[]>([]);
  const [allSeances,      setAllSeances]      = useState<AssignedSeance[]>([]);
  const [dbReady,         setDbReady]         = useState(true);

  /* log modal */
  const [showLog,     setShowLog]     = useState(false);
  const [activity,    setActivity]    = useState("");
  const [durationMin, setDurationMin] = useState(60);
  const [description, setDescription] = useState("");
  const [listening,   setListening]   = useState(false);
  const [estimating,  setEstimating]  = useState(false);
  const [calResult,   setCalResult]   = useState<{ calories_brulees: number; note: string } | null>(null);
  const [calError,    setCalError]    = useState("");
  const recognitionRef = useRef<{ start(): void; stop(): void } | null>(null);

  /* admin modal */
  const [adminForm,   setAdminForm]   = useState({ assigned_to_email: "", titre: "", type_seance: "", date_prevue: "", description: "", exercices: "" });
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminError,  setAdminError]  = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const email = user.email ?? "";
      const isSam = email === SAMUEL_EMAIL;
      setIsSamuel(isSam);

      const { data: p } = await supabase.from("profiles").select("poids,taille,age,sexe").eq("id", user.id).single();
      if (p) setProfile(p as Profile);

      const { data: seances, error } = await supabase.from("programme_seances")
        .select("*").eq("assigned_to_email", email).order("date_prevue", { ascending: true, nullsFirst: false });
      if (error?.code === "42P01") { setDbReady(false); }
      else if (seances) setAssignedSeances(seances as AssignedSeance[]);

      if (isSam) {
        const { data: all } = await supabase.from("programme_seances").select("*").order("created_at", { ascending: false });
        if (all) setAllSeances(all as AssignedSeance[]);
      }

      const done = localStorage.getItem("programme_done");
      const logs = localStorage.getItem("programme_logs");
      if (done) setDoneIds(JSON.parse(done));
      if (logs) setLoggedWorkouts(JSON.parse(logs));
    })();
  }, []);

  const markDone = (id: string) => {
    setDoneIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem("programme_done", JSON.stringify(next));
      return next;
    });
  };

  const estimateCalories = async () => {
    if (!activity || !durationMin) return;
    setEstimating(true); setCalError(""); setCalResult(null);
    try {
      const res = await fetch("/api/programme/calories", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activity: ACTIVITIES.find(a => a.key === activity)?.label ?? activity, duration_minutes: durationMin, description, profile }),
      });
      if (!res.ok) { const t = await res.text(); throw new Error(t || `Erreur ${res.status}`); }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCalResult(data);
    } catch (e: unknown) { setCalError(e instanceof Error ? e.message : "Erreur"); }
    setEstimating(false);
  };

  const logWorkout = () => {
    if (!activity || !calResult) return;
    const entry: LoggedWorkout = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      activity_label: ACTIVITIES.find(a => a.key === activity)?.label ?? activity,
      duration_minutes: durationMin,
      description,
      calories_burned: calResult.calories_brulees,
      note: calResult.note,
    };
    setLoggedWorkouts(prev => {
      const next = [entry, ...prev].slice(0, 30);
      localStorage.setItem("programme_logs", JSON.stringify(next));
      return next;
    });
    resetLog();
  };

  const resetLog = () => {
    setShowLog(false); setActivity(""); setDurationMin(60); setDescription("");
    setCalResult(null); setCalError(""); setListening(false);
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

  const createSeance = async () => {
    if (!adminForm.titre || !adminForm.assigned_to_email) { setAdminError("Email client et titre requis"); return; }
    setAdminSaving(true); setAdminError("");
    const { error } = await supabase.from("programme_seances").insert({
      assigned_to_email: adminForm.assigned_to_email,
      titre: adminForm.titre,
      type_seance: adminForm.type_seance || null,
      date_prevue: adminForm.date_prevue || null,
      description: adminForm.description || null,
      exercices: adminForm.exercices || null,
    });
    if (error) { setAdminError(error.message); setAdminSaving(false); return; }
    const { data: all } = await supabase.from("programme_seances").select("*").order("created_at", { ascending: false });
    if (all) setAllSeances(all as AssignedSeance[]);
    setAdminForm({ assigned_to_email: "", titre: "", type_seance: "", date_prevue: "", description: "", exercices: "" });
    setAdminSaving(false);
  };

  const deleteSeance = async (id: string) => {
    await supabase.from("programme_seances").delete().eq("id", id);
    setAllSeances(prev => prev.filter(s => s.id !== id));
    setAssignedSeances(prev => prev.filter(s => s.id !== id));
  };

  const chip = (active: boolean) =>
    `px-3 py-2 text-[0.6rem] tracking-[0.1em] uppercase border cursor-pointer transition-all ${active ? "border-[#c9a84c] text-[#c9a84c] bg-[#c9a84c]/10" : "border-white/10 text-white/40 hover:border-white/30 hover:text-white/60"}`;
  const inputCls = "w-full bg-[#0a0a0a] border border-white/10 text-white placeholder-white/20 text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors";
  const labelCls = "text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] block mb-1.5";

  return (
    <div className="p-8 max-w-2xl">

      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-[0.55rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-2">Rubrique</p>
          <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-5xl text-white tracking-wide">PROGRAMME</h1>
        </div>
        <button onClick={() => { setShowLog(true); setCalResult(null); setCalError(""); }}
          className="border border-[#c9a84c]/30 text-[#c9a84c] text-[0.55rem] tracking-[0.15em] uppercase px-4 py-2 hover:bg-[#c9a84c]/5 transition-colors flex items-center gap-2">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Enregistrer une séance
        </button>
      </div>

      {/* ── Programme assigné (visible uniquement si des séances existent) ── */}
      {!dbReady && (
        <div className="border border-[#e07070]/20 bg-[#e07070]/5 p-4 text-xs text-[#e07070] mb-8">
          La table <code>programme_seances</code> n&apos;existe pas encore — exécute le SQL fourni dans Supabase.
        </div>
      )}
      {dbReady && assignedSeances.length > 0 && (
        <div className="mb-8">
          <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-4">Mon programme</p>
          {assignedSeances.map(s => {
            const done = doneIds.includes(s.id);
            return (
              <div key={s.id} className={`border bg-[#111] mb-3 transition-opacity ${done ? "border-[#7eb8a0]/20 opacity-50" : "border-white/10"}`}>
                <div className="flex items-start justify-between px-5 py-4 border-b border-white/5">
                  <div>
                    {s.type_seance && <p className="text-[0.5rem] tracking-[0.15em] text-[#c9a84c] uppercase mb-1">{s.type_seance}</p>}
                    <p style={{ fontFamily: "var(--font-bebas)" }} className="text-lg tracking-wider text-white">{s.titre}</p>
                    {s.date_prevue && (
                      <p className="text-[0.55rem] text-white/30 mt-0.5 capitalize">
                        {new Date(s.date_prevue + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                      </p>
                    )}
                  </div>
                  <button onClick={() => markDone(s.id)}
                    className={`shrink-0 text-[0.5rem] tracking-wider uppercase px-2.5 py-1 border transition-all ml-4 ${done ? "border-[#7eb8a0]/40 text-[#7eb8a0] bg-[#7eb8a0]/10" : "border-white/10 text-white/30 hover:border-[#7eb8a0]/40 hover:text-[#7eb8a0]"}`}>
                    {done ? "✓ Terminé" : "Marquer terminé"}
                  </button>
                </div>
                {(s.description || s.exercices) && (
                  <div className="px-5 py-4 flex flex-col gap-3">
                    {s.description && <p className="text-xs text-white/50 leading-relaxed">{s.description}</p>}
                    {s.exercices && (
                      <div>
                        <p className="text-[0.5rem] tracking-[0.15em] uppercase text-white/20 mb-2">Exercices</p>
                        <pre className="text-xs text-white/50 leading-relaxed font-sans whitespace-pre-wrap">{s.exercices}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      {/* ── Historique séances ── */}
      {loggedWorkouts.length > 0 && (
        <div className="mb-8">
          <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-4">Mes séances récentes</p>
          {loggedWorkouts.slice(0, 7).map(w => (
            <div key={w.id} className="border border-white/10 bg-[#111] mb-2 px-5 py-3.5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-xs text-white/70">{w.activity_label}</p>
                  <span className="text-[0.5rem] text-white/20 border border-white/10 px-1.5 py-0.5">{w.duration_minutes} min</span>
                </div>
                {w.description && <p className="text-[0.55rem] text-white/30 truncate max-w-xs">{w.description}</p>}
                <p className="text-[0.5rem] text-white/15 mt-1">
                  {new Date(w.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                </p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-[#c9a84c] tracking-wide leading-none">{w.calories_burned}</p>
                <p className="text-[0.45rem] text-white/25 uppercase tracking-wider">kcal brûlées</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Admin panel (Samuel only) ── */}
      {isSamuel && (
        <div className="border border-[#c9a84c]/20 bg-[#0f0d07]">
          <div className="px-5 py-4 border-b border-white/5">
            <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c]">Panel coach — Envoyer une séance</p>
          </div>
          <div className="p-5 flex flex-col gap-4">
            <div>
              <label className={labelCls}>Email du client</label>
              <input className={inputCls} placeholder="client@email.com" value={adminForm.assigned_to_email}
                onChange={e => setAdminForm(f => ({ ...f, assigned_to_email: e.target.value }))}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Titre</label>
                <input className={inputCls} placeholder="Séance haut du corps" value={adminForm.titre}
                  onChange={e => setAdminForm(f => ({ ...f, titre: e.target.value }))}/>
              </div>
              <div>
                <label className={labelCls}>Type</label>
                <select className={`${inputCls} cursor-pointer`} value={adminForm.type_seance}
                  onChange={e => setAdminForm(f => ({ ...f, type_seance: e.target.value }))}>
                  <option value="">Choisir…</option>
                  {SEANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Date prévue</label>
              <input className={inputCls} type="date" value={adminForm.date_prevue}
                onChange={e => setAdminForm(f => ({ ...f, date_prevue: e.target.value }))}/>
            </div>
            <div>
              <label className={labelCls}>Description / contexte</label>
              <textarea className={`${inputCls} resize-none`} rows={2}
                placeholder="Objectif de la séance, intensité…" value={adminForm.description}
                onChange={e => setAdminForm(f => ({ ...f, description: e.target.value }))}/>
            </div>
            <div>
              <label className={labelCls}>Exercices (un par ligne)</label>
              <textarea className={`${inputCls} resize-none`} rows={6}
                placeholder={"Développé couché 4×8 @ 80kg\nTirage poulie 3×12\nCurl haltères 3×15\n…"} value={adminForm.exercices}
                onChange={e => setAdminForm(f => ({ ...f, exercices: e.target.value }))}/>
            </div>
            {adminError && <p className="text-xs text-[#e07070] border border-[#e07070]/20 bg-[#e07070]/5 px-3 py-2">{adminError}</p>}
            <button onClick={createSeance} disabled={adminSaving}
              className="bg-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.2em] uppercase py-3.5 hover:bg-[#e2c97e] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {adminSaving ? <><div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"/>Envoi…</> : "Envoyer la séance →"}
            </button>
          </div>

          {allSeances.length > 0 && (
            <div className="border-t border-white/5 px-5 py-4">
              <p className="text-[0.5rem] tracking-wider uppercase text-white/20 mb-3">Séances envoyées ({allSeances.length})</p>
              <div className="flex flex-col">
                {allSeances.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-xs text-white/60">{s.titre}</p>
                      <p className="text-[0.5rem] text-white/25 mt-0.5">
                        {s.assigned_to_email}
                        {s.date_prevue ? ` · ${new Date(s.date_prevue + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}` : ""}
                        {s.type_seance ? ` · ${s.type_seance}` : ""}
                      </p>
                    </div>
                    <button onClick={() => deleteSeance(s.id)}
                      className="text-white/15 hover:text-[#e07070] transition-colors ml-4 shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ LOG WORKOUT MODAL ══ */}
      {showLog && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center px-4" onClick={resetLog}>
          <div className="bg-[#0f0f0f] border border-white/10 w-full max-w-lg h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
              <h3 style={{ fontFamily: "var(--font-bebas)" }} className="text-xl tracking-wider text-white">Enregistrer ma séance</h3>
              <button onClick={resetLog} className="text-white/30 hover:text-white/60 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-6">

              {/* Activity */}
              <div>
                <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-3">Activité</p>
                <div className="grid grid-cols-3 gap-2">
                  {ACTIVITIES.map(a => (
                    <button key={a.key} onClick={() => { setActivity(a.key); setCalResult(null); }}
                      className={chip(activity === a.key)}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-3">Durée</p>
                <div className="flex flex-wrap gap-2">
                  {DURATIONS.map(d => (
                    <button key={d.min} onClick={() => { setDurationMin(d.min); setCalResult(null); }}
                      className={chip(durationMin === d.min)}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description + voice */}
              <div>
                <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-3">Décris ta séance <span className="text-white/20">(optionnel)</span></p>
                <div className="relative">
                  <textarea
                    className="w-full bg-[#0a0a0a] border border-white/10 text-white placeholder-white/20 text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/40 transition-colors resize-none pr-12"
                    rows={3}
                    placeholder="Ex : séance intense, j'ai fait du gainage et des tractions, bonne récup…"
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
                <p className="text-[0.5rem] text-white/20 mt-1">Plus tu décris, plus l&apos;estimation sera précise</p>
              </div>

              {/* Estimate button */}
              {!calResult && (
                <button onClick={estimateCalories} disabled={!activity || estimating}
                  className="bg-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.2em] uppercase py-3.5 hover:bg-[#e2c97e] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {estimating
                    ? <><div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"/>Estimation en cours…</>
                    : "Estimer les calories brûlées →"}
                </button>
              )}

              {calError && <p className="text-xs text-[#e07070] border border-[#e07070]/20 bg-[#e07070]/5 px-3 py-2">{calError}</p>}

              {/* Result */}
              {calResult && (
                <div className="flex flex-col gap-4">
                  <div className="border border-[#c9a84c]/20 bg-[#c9a84c]/5 p-5 text-center">
                    <p className="text-[0.5rem] tracking-[0.15em] uppercase text-[#c9a84c] mb-3">Estimation IA</p>
                    <p style={{ fontFamily: "var(--font-bebas)" }} className="text-6xl text-white tracking-wide leading-none mb-1">{calResult.calories_brulees}</p>
                    <p className="text-[0.55rem] tracking-[0.2em] uppercase text-white/30">kcal brûlées</p>
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-[0.55rem] text-white/40 italic">{calResult.note}</p>
                      {!profile && <p className="text-[0.5rem] text-white/20 mt-1">Complète ton profil pour une estimation personnalisée</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="border border-white/10 bg-[#111] py-3">
                      <p style={{ fontFamily: "var(--font-bebas)" }} className="text-lg text-white/60 tracking-wide">{ACTIVITIES.find(a => a.key === activity)?.label}</p>
                      <p className="text-[0.45rem] tracking-wider text-white/20 uppercase mt-0.5">Activité</p>
                    </div>
                    <div className="border border-white/10 bg-[#111] py-3">
                      <p style={{ fontFamily: "var(--font-bebas)" }} className="text-lg text-white/60 tracking-wide">{durationMin} min</p>
                      <p className="text-[0.45rem] tracking-wider text-white/20 uppercase mt-0.5">Durée</p>
                    </div>
                    <div className="border border-white/10 bg-[#111] py-3">
                      <p style={{ fontFamily: "var(--font-bebas)" }} className="text-lg text-white/60 tracking-wide">{profile?.poids ?? "?"} kg</p>
                      <p className="text-[0.45rem] tracking-wider text-white/20 uppercase mt-0.5">Poids</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => setCalResult(null)}
                      className="flex-1 border border-white/10 text-white/40 text-[0.55rem] tracking-[0.15em] uppercase py-2.5 hover:border-white/20 hover:text-white/60 transition-colors">
                      Ré-estimer
                    </button>
                    <button onClick={logWorkout}
                      className="flex-1 bg-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.2em] uppercase py-2.5 hover:bg-[#e2c97e] transition-colors">
                      Enregistrer →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
