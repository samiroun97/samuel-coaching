"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { apiPost } from "@/lib/apiClient";
import { getMyCoachEmail, getMyCoachBusinessName } from "@/lib/coach";
import { SeanceBody } from "@/components/SeancePreview";
import { SeanceLive } from "@/components/SeanceLive";
import { DateNav } from "@/components/DateNav";
import { useSelectedDate, todayStr } from "@/lib/useSelectedDate";
import { syncSteps } from "@/lib/steps";
import { parseExercices, hasLoggableSets } from "@/lib/exercices";
import { TdeeIcon } from "@/components/CalRefToggle";

type Profile = { prenom: string; poids: number; taille: number; age: number; sexe: string };
type LoggedWorkout = {
  id: string; date: string; activity: string;
  duration_minutes: number; description: string;
  calories_burned: number; note: string;
};
type PerfRecord = { date: string; calories: number; duration: number; description: string };
type PerfHistory = Record<string, PerfRecord[]>;
type CoachSeance = { id: string; titre: string; type_seance: string | null; date_prevue: string | null; semaine: number | null; description: string | null; exercices: string | null; notes_libres: string | null; completed_at: string | null; created_by_client?: boolean };

const DURATIONS = [
  { label: "15 min", min: 15 }, { label: "30 min", min: 30 }, { label: "45 min", min: 45 },
  { label: "1h",     min: 60 }, { label: "1h15",   min: 75 }, { label: "1h30",   min: 90 },
  { label: "2h",     min: 120 },
];

const INTENSITIES = [
  { label: "Faible",  key: "faible",  mult: 0.55 },
  { label: "Modérée", key: "moderee", mult: 0.75 },
  { label: "Haute",   key: "haute",   mult: 1.1  },
] as const;
type IntensityKey = "faible" | "moderee" | "haute";
const INTENSITY_COLOR: Record<IntensityKey, string> = { faible: "#7eb8a0", moderee: "#c9a84c", haute: "#e0834a" };

function IntensityBars({ level, color }: { level: 1 | 2 | 3; color: string }) {
  const heights = [5, 8, 11];
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
      {heights.map((h, i) => (
        <rect key={i} x={i * 5} y={12 - h} width="3" height={h} rx="1" fill={i < level ? color : "var(--t-border)"}/>
      ))}
    </svg>
  );
}

const neatFromSteps = (steps: number, poids: number) =>
  Math.round(steps * 0.04 * (poids / 70));

function WorkoutCard({ w, onRemove }: { w: LoggedWorkout; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--t-border-soft)] bg-[var(--t-bg)] px-4 py-3 group">
      <div className="w-9 h-9 rounded-full bg-[#c9a84c]/10 text-[#c9a84c] flex items-center justify-center shrink-0">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 12 8 12 10 6 14 18 16 12 21 12"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[var(--t-text-70)] truncate">{w.activity}</p>
        <p className="text-[0.65rem] text-[var(--t-text-25)] mt-0.5">{w.duration_minutes} min{w.description ? ` · ${w.description}` : ""}</p>
      </div>
      <span className="text-xs text-[var(--t-text-50)] shrink-0">{w.calories_burned} kcal</span>
      <button onClick={onRemove}
        className="text-[var(--t-text-20)] hover:text-[#e07070] transition-colors shrink-0 opacity-70 group-hover:opacity-100">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}

export default function ProgrammePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile,      setProfile]      = useState<Profile | null>(null);
  const [userId,       setUserId]       = useState<string | null>(null);
  const [workouts,     setWorkouts]     = useState<LoggedWorkout[]>([]);
  const [selectedDate, setSelectedDate] = useSelectedDate();
  const [steps,        setSteps]        = useState(0);
  const [stepsInput,   setStepsInput]   = useState("0");
  const [stepGoal,     setStepGoal]     = useState(10000);
  const [goalInput,    setGoalInput]    = useState("10000");
  const [editingGoal,  setEditingGoal]  = useState(false);
  const [coachSeances, setCoachSeances] = useState<CoachSeance[]>([]);
  const [openSeance,   setOpenSeance]   = useState<string | null>(null);
  const [liveSeance,   setLiveSeance]   = useState<CoachSeance | null>(null);

  const [seancesJourOpen, setSeancesJourOpen] = useState(false);
  const [histSectionOpen, setHistSectionOpen] = useState(false);
  const [openHistDates,   setOpenHistDates]   = useState<Set<string>>(new Set());
  const [exportingPdf, setExportingPdf] = useState(false);

  const toggleSeanceDone = async (s: CoachSeance) => {
    const done = s.completed_at ? null : new Date().toISOString();
    setCoachSeances(prev => prev.map(x => x.id === s.id ? { ...x, completed_at: done } : x));
    await supabase.from("programme_seances").update({ completed_at: done }).eq("id", s.id);
  };

  const downloadPdf = async () => {
    if (exportingPdf || !coachSeances.length) return;
    setExportingPdf(true);
    try {
      const { generateProgrammePdf } = await import("@/lib/pdf");
      generateProgrammePdf(coachSeances, profile?.prenom, coachBusinessNameRef.current ?? undefined);
    } finally {
      setExportingPdf(false);
    }
  };

  /* form */
  const [perfHistory, setPerfHistory] = useState<PerfHistory>({});
  const [activity,    setActivity]    = useState("");
  const [durationMin, setDurationMin] = useState(60);
  const [description, setDescription] = useState("");
  const [listening,   setListening]   = useState(false);
  const [estimating,  setEstimating]  = useState(false);
  const [calResult,   setCalResult]   = useState<{ calories_brulees: number; note: string } | null>(null);
  const [calError,    setCalError]    = useState("");
  const [intensity,   setIntensity]   = useState<IntensityKey>("haute");
  const recognitionRef = useRef<{ start(): void; stop(): void } | null>(null);
  const userEmailRef = useRef("");
  const coachEmailRef = useRef<string | null>(null);
  const coachBusinessNameRef = useRef<string | null>(null);

  // Signalement d'une estimation d'activité qui semble fausse — envoyée à Samuel via
  // l'Inbox, pour recalibrer l'IA depuis la rubrique IA du CRM (cf. app/crm/ia).
  const [showActReportForm, setShowActReportForm] = useState(false);
  const [actReportComment,  setActReportComment]  = useState("");
  const [actReportSending,  setActReportSending]  = useState(false);
  const [actReportSent,     setActReportSent]     = useState(false);

  // Signalement d'un problème sur une séance du programme assigné par Samuel — par id de
  // séance, pour permettre de signaler plusieurs séances indépendamment.
  const [reportingSeanceId,   setReportingSeanceId]   = useState<string | null>(null);
  const [seanceReportComment, setSeanceReportComment] = useState("");
  const [seanceReportSending, setSeanceReportSending] = useState(false);
  const [seanceReportSentIds, setSeanceReportSentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      userEmailRef.current = user.email ?? "";
      getMyCoachEmail(user.id).then(email => { coachEmailRef.current = email; });
      getMyCoachBusinessName(user.id).then(name => { coachBusinessNameRef.current = name; });
      const { data: p } = await supabase.from("profiles").select("prenom,poids,taille,age,sexe").eq("id", user.id).single();
      if (p) setProfile(p as Profile);
      if (user.email) {
        const { data: cs } = await supabase.from("programme_seances").select("*")
          .eq("assigned_to_email", user.email).order("created_at", { ascending: true });
        setCoachSeances((cs ?? []) as CoachSeance[]);
      }
    })();
    const saved  = localStorage.getItem("programme_logs");
    const savedG = localStorage.getItem("steps_goal");
    const savedP = localStorage.getItem("perf_history");
    if (saved)  setWorkouts(JSON.parse(saved));
    if (savedG) { const g = parseInt(savedG); setStepGoal(g); setGoalInput(g.toString()); }
    if (savedP) setPerfHistory(JSON.parse(savedP));
  }, []);

  // Retour depuis la page "Créer ma séance" (?live=<id>) : la séance vient d'être créée
  // et enregistrée en base, on la démarre directement dès qu'elle apparaît dans la liste.
  useEffect(() => {
    const liveId = searchParams.get("live");
    if (!liveId) return;
    const found = coachSeances.find(s => s.id === liveId);
    if (found) {
      setLiveSeance(found);
      router.replace("/dashboard/programme");
    }
  }, [searchParams, coachSeances, router]);

  useEffect(() => {
    const savedS = localStorage.getItem(`steps_${selectedDate}`);
    if (savedS) { const n = parseInt(savedS); setSteps(n); setStepsInput(n.toString()); }
    else { setSteps(0); setStepsInput("0"); }

    // Les pas peuvent aussi arriver via le Raccourci iPhone (écriture serveur, jamais
    // dans le localStorage de cet appareil) — on les récupère en tâche de fond et on
    // met à jour l'affichage si Supabase a une valeur plus récente.
    if (!userId) return;
    let cancelled = false;
    syncSteps(userId, [selectedDate]).then(() => {
      if (cancelled) return;
      const s = localStorage.getItem(`steps_${selectedDate}`);
      if (s) { const n = parseInt(s); setSteps(n); setStepsInput(n.toString()); }
    });
    return () => { cancelled = true; };
  }, [selectedDate, userId]);

  const saveSteps = (n: number) => {
    const clamped = Math.max(0, n);
    setSteps(clamped);
    setStepsInput(clamped.toString());
    localStorage.setItem(`steps_${selectedDate}`, clamped.toString());
    if (userId) {
      supabase.from("steps_log").upsert({
        user_id: userId, date: selectedDate, steps: clamped, source: "manuel", updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,date" });
    }
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
    setShowActReportForm(false); setActReportComment(""); setActReportSent(false);
    try {
      const res = await apiPost("/api/programme/calories", { activity, duration_minutes: durationMin, description, profile });
      if (!res.ok) { const t = await res.text(); throw new Error(t || `Erreur ${res.status}`); }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCalResult(data);
    } catch (e: unknown) { setCalError(e instanceof Error ? e.message : "Erreur"); }
    setEstimating(false);
  };

  // Signalement d'une estimation de calories brûlées jugée fausse.
  const submitActReport = async () => {
    if (!calResult || !actReportComment.trim() || !userEmailRef.current || !coachEmailRef.current) return;
    setActReportSending(true);
    const payload = JSON.stringify({
      activity, duration_minutes: durationMin, description,
      calories_brulees: calResult.calories_brulees, comment: actReportComment.trim(),
    });
    await supabase.from("messages").insert({
      from_email: userEmailRef.current, to_email: coachEmailRef.current,
      content: `[ACTIVITE_FEEDBACK:${payload}]`,
    });
    setActReportSending(false); setActReportSent(true); setShowActReportForm(false); setActReportComment("");
  };

  // Signalement d'un problème sur une séance précise du programme assigné par Samuel.
  const submitSeanceReport = async (s: CoachSeance) => {
    if (!seanceReportComment.trim() || !userEmailRef.current || !coachEmailRef.current) return;
    setSeanceReportSending(true);
    const payload = JSON.stringify({
      titre: s.titre, type_seance: s.type_seance, description: s.description,
      comment: seanceReportComment.trim(),
    });
    await supabase.from("messages").insert({
      from_email: userEmailRef.current, to_email: coachEmailRef.current,
      content: `[PROGRAMME_FEEDBACK:${payload}]`,
    });
    setSeanceReportSending(false);
    setSeanceReportSentIds(prev => new Set(prev).add(s.id));
    setReportingSeanceId(null); setSeanceReportComment("");
  };

  const addWorkout = () => {
    if (!activity.trim() || !calResult) return;
    const entry: LoggedWorkout = {
      id: Date.now().toString(),
      date: new Date(selectedDate + "T12:00:00").toISOString(),
      activity, duration_minutes: durationMin, description,
      calories_burned: adjustedCal,
      note: calResult.note + (intensity !== "haute" ? ` · intensité ${intensity}` : ""),
    };
    const next = [entry, ...workouts].slice(0, 50);
    setWorkouts(next);
    localStorage.setItem("programme_logs", JSON.stringify(next));

    // Historique perfs par activité
    const key = activity.trim().toLowerCase();
    const rec: PerfRecord = { date: entry.date, calories: adjustedCal, duration: durationMin, description };
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

  const intensityMult = INTENSITIES.find(i => i.key === intensity)?.mult ?? 1;
  const adjustedCal   = calResult ? Math.round(calResult.calories_brulees * intensityMult) : 0;

  const chip = (active: boolean) =>
    `px-3.5 py-2 rounded-full text-[0.7rem] tracking-[0.1em] uppercase border transition-all duration-200 ${active ? "border-[#c9a84c] text-black bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] shadow-[0_3px_12px_-4px_rgba(201,168,76,0.6)] -translate-y-px" : "border-[var(--t-border)] text-[var(--t-text-40)] hover:border-[var(--t-text-30)] hover:text-[var(--t-text-60)]"}`;
  const inputCls = "w-full bg-[var(--t-bg)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors";

  const pastDates = [...new Set(
    workouts.filter(w => !w.date.startsWith(selectedDate)).map(w => w.date.split("T")[0])
  )].slice(0, 6);

  return (
    <div className="p-4 sm:p-8 max-w-2xl">

      {/* Header */}
      <div className="mb-6">
        <p className="text-[0.7rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-2">Rubrique</p>
        <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl sm:text-5xl text-[var(--t-text)] tracking-wide">ACTIVITÉ</h1>
      </div>

      <DateNav date={selectedDate} onChange={setSelectedDate} />

      {/* ── EAT / NEAT / TOTAL ── */}
      <div className="border border-[var(--t-border)] bg-[var(--t-surface)] rounded-xl p-5 mb-6">
        <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-4">Dépense du jour</p>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* EAT */}
          <div className="border border-[var(--t-border-soft)] bg-[var(--t-bg)] rounded-xl py-4 px-3 text-center">
            <p style={{ fontFamily: "var(--font-bebas)" }} className="text-3xl text-[#c9a84c] tracking-wide leading-none">{eatCal}</p>
            <p className="text-[0.65rem] tracking-[0.15em] uppercase text-[var(--t-text-30)] mt-1.5">EAT</p>
            <p className="text-[0.62rem] text-[var(--t-text-15)] mt-0.5">Exercice intentionnel</p>
          </div>
          {/* NEAT */}
          <div className="border border-[var(--t-border-soft)] bg-[var(--t-bg)] rounded-xl py-4 px-3 text-center">
            <p style={{ fontFamily: "var(--font-bebas)" }} className="text-3xl text-[#7eb8a0] tracking-wide leading-none">{neatCal}</p>
            <p className="text-[0.65rem] tracking-[0.15em] uppercase text-[var(--t-text-30)] mt-1.5">NEAT</p>
            <p className="text-[0.62rem] text-[var(--t-text-15)] mt-0.5">Activité quotidienne</p>
          </div>
          {/* Total */}
          <div className="border border-[#c9a84c]/15 bg-[#c9a84c]/5 rounded-xl py-4 px-3 text-center">
            <p style={{ fontFamily: "var(--font-bebas)" }} className="text-3xl text-[var(--t-text)] tracking-wide leading-none">{totalCal}</p>
            <p className="text-[0.65rem] tracking-[0.15em] uppercase text-[var(--t-text-30)] mt-1.5">Total</p>
            <p className="text-[0.62rem] text-[var(--t-text-15)] mt-0.5">kcal brûlées</p>
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

        <div className="flex items-center justify-between text-[0.62rem] text-[var(--t-text-20)] tracking-wider">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="w-2 h-2 inline-block" style={{ backgroundColor: "#c9a84c" }}/>EAT : exercice</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 inline-block" style={{ backgroundColor: "#7eb8a0" }}/>NEAT : {steps.toLocaleString("fr-FR")} pas</span>
          </div>
          {!profile && <span className="text-[var(--t-text-15)]">Complète ton profil pour personnaliser</span>}
        </div>
      </div>

      {/* ── Formulaire séance ── */}
      <div className="border border-[var(--t-border)] bg-[var(--t-surface)] rounded-xl p-6 mb-6 flex flex-col gap-5">
        <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c]">Estimer la dépense de mon entraînement</p>

        <div>
          <label className="text-[0.7rem] tracking-[0.2em] uppercase text-[var(--t-text-40)] block mb-1.5">Activité</label>
          <input className={inputCls} placeholder="Ex : musculation, boxe, natation, vélo…"
            value={activity} onChange={e => { setActivity(e.target.value); setCalResult(null); }}/>
          {lastPerf && (
            <div className="mt-1.5 flex items-center justify-between rounded-xl bg-[var(--t-bg)] border border-[var(--t-border-soft)] px-3 py-2">
              <span className="text-[0.65rem] tracking-wider text-[var(--t-text-25)] uppercase">Dernière fois</span>
              <div className="flex items-center gap-3">
                <span className="text-[0.65rem] text-[var(--t-text-35)]">{lastPerf.duration} min</span>
                <span className="text-[0.65rem] text-[#c9a84c]/70">{lastPerf.calories} kcal</span>
                <span className="text-[0.62rem] text-[var(--t-text-20)]">
                  {new Date(lastPerf.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </span>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="text-[0.7rem] tracking-[0.2em] uppercase text-[var(--t-text-40)] block mb-2">Durée</label>
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map(d => (
              <button key={d.min} onClick={() => { setDurationMin(d.min); setCalResult(null); }} className={chip(durationMin === d.min)}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[0.7rem] tracking-[0.2em] uppercase text-[var(--t-text-40)] block mb-2">Intensité</label>
          <div className="flex gap-1.5">
            {INTENSITIES.map((i, idx) => {
              const active = intensity === i.key;
              const color  = INTENSITY_COLOR[i.key];
              return (
                <button key={i.key} onClick={() => setIntensity(i.key)}
                  className={`flex items-center justify-center gap-1 px-2.5 py-2 rounded-full text-[0.62rem] tracking-[0.04em] uppercase border transition-all duration-200 ${active ? "-translate-y-px" : "border-[var(--t-border)] text-[var(--t-text-40)] hover:border-[var(--t-text-30)] hover:text-[var(--t-text-60)]"}`}
                  style={active ? { borderColor: color, color, backgroundColor: `${color}14`, boxShadow: `0 3px 12px -4px ${color}99` } : undefined}>
                  <IntensityBars level={(idx + 1) as 1 | 2 | 3} color={active ? color : "var(--t-text-30)"}/>
                  {i.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-[0.7rem] tracking-[0.2em] uppercase text-[var(--t-text-40)] block mb-1.5">
            Décris ta séance <span className="text-[var(--t-text-20)]">(optionnel)</span>
          </label>
          <div className="relative">
            <textarea
              className="w-full bg-[var(--t-bg)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/40 transition-colors resize-none pr-12"
              rows={2} placeholder="Ex : séance intense, supersets, bonne récupération…"
              value={description} onChange={e => { setDescription(e.target.value); setCalResult(null); }}
            />
            <button onClick={listening ? stopVoice : startVoice}
              className={`absolute right-3 top-3 p-1.5 rounded-full border transition-colors ${listening ? "border-[#e07070] text-[#e07070] animate-pulse" : "border-[var(--t-border)] text-[var(--t-text-30)] hover:text-[var(--t-text-60)] hover:border-[var(--t-text-20)]"}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>
              </svg>
            </button>
          </div>
        </div>

        {calError && <p className="text-xs text-[#e07070] rounded-xl border border-[#e07070]/20 bg-[#e07070]/5 px-3 py-2">{calError}</p>}

        {calResult ? (
          <div className="flex flex-col gap-3">
            <div className="border border-[#c9a84c]/20 bg-[#c9a84c]/5 rounded-xl p-4 flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[0.65rem] tracking-[0.15em] uppercase text-[#c9a84c]">Estimation IA</p>
                  {intensity !== "haute" && (
                    <span className="text-[0.6rem] tracking-[0.1em] uppercase rounded-full border border-[var(--t-border-15)] text-[var(--t-text-30)] px-1.5 py-0.5">
                      intensité {intensity} · ×{intensityMult}
                    </span>
                  )}
                </div>
                <p className="text-[0.7rem] text-[var(--t-text-40)] italic">{calResult.note}</p>
                {intensity !== "haute" && (
                  <p className="text-[0.65rem] text-[var(--t-text-20)] mt-1">Base haute intensité : {calResult.calories_brulees} kcal</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl text-[var(--t-text)] tracking-wide leading-none">{adjustedCal}</p>
                <p className="text-[0.62rem] tracking-[0.15em] uppercase text-[var(--t-text-30)]">kcal</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCalResult(null)}
                className="flex-1 border border-[var(--t-border)] text-[var(--t-text-40)] rounded-xl text-[0.7rem] tracking-[0.15em] uppercase py-2.5 hover:border-[var(--t-text-20)] hover:text-[var(--t-text-60)] transition-colors">
                Ré-estimer
              </button>
              <button onClick={addWorkout}
                className="flex-1 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.7rem] font-bold tracking-[0.2em] uppercase py-2.5 shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 rounded-xl">
                Ajouter à ma journée →
              </button>
            </div>

            {/* Signalement d'une estimation de calories brûlées jugée fausse. */}
            {actReportSent ? (
              <p className="text-[0.62rem] text-[#7eb8a0] text-center py-1">Signalement envoyé, merci ! 🙏</p>
            ) : showActReportForm ? (
              <div className="border border-[var(--t-border)] bg-[var(--t-bg)] rounded-xl p-4 flex flex-col gap-3">
                <textarea className="w-full bg-[var(--t-surface-2)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors resize-none" rows={3}
                  placeholder="Ex : pour cette durée et cette activité, ça me semble bien trop élevé..."
                  value={actReportComment} onChange={e => setActReportComment(e.target.value)}/>
                <div className="flex gap-2">
                  <button onClick={() => { setShowActReportForm(false); setActReportComment(""); }}
                    className="flex-1 border border-[var(--t-border)] text-[var(--t-text-40)] rounded-xl text-[0.65rem] tracking-[0.15em] uppercase py-2.5 hover:border-[var(--t-text-20)] hover:text-[var(--t-text-60)] transition-colors">
                    Annuler
                  </button>
                  <button onClick={submitActReport} disabled={actReportSending || !actReportComment.trim()}
                    className="flex-1 bg-[#e07070] text-black text-[0.65rem] font-bold tracking-[0.15em] uppercase py-2.5 hover:bg-[#e58888] transition-colors disabled:opacity-40 rounded-xl">
                    {actReportSending ? "Envoi…" : "Envoyer le signalement →"}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowActReportForm(true)}
                className="text-[0.6rem] tracking-wider uppercase text-[var(--t-text-20)] hover:text-[#e07070]/70 transition-colors text-center py-1">
                Cette estimation te semble fausse ? Signale-la à Samuel →
              </button>
            )}
          </div>
        ) : (
          <button onClick={estimate} disabled={!activity.trim() || estimating}
            className="border border-[var(--t-border)] text-[var(--t-text-40)] rounded-xl text-[0.7rem] tracking-[0.15em] uppercase py-3 hover:border-[#e0672f]/40 hover:text-[#e0672f] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {estimating
              ? <><div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"/>Estimation en cours…</>
              : <><TdeeIcon size={14}/>Estimer les calories brûlées</>}
          </button>
        )}
      </div>

      {/* ── Pas ── */}
      <div className="border border-[var(--t-border)] bg-[var(--t-surface)] rounded-xl p-5 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <img src="/icons/steps.svg" alt="" width={40} height={40} className="shrink-0"/>
          <div className="flex-1 min-w-0">
            <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c]">
              {selectedDate === todayStr() ? "Pas aujourd'hui" : `Pas · ${new Date(selectedDate + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`}
            </p>
            <p className="text-[0.62rem] text-[var(--t-text-25)] mt-0.5">{stepsKm} km parcourus</p>
          </div>
          <div className="text-right shrink-0">
            <p style={{ fontFamily: "var(--font-bebas)" }} className="text-3xl text-[var(--t-text)] tracking-wide leading-none">{steps.toLocaleString("fr-FR")}</p>
            <p className="text-[0.58rem] tracking-[0.15em] uppercase text-[var(--t-text-20)] mt-0.5">pas</p>
          </div>
        </div>

        <div className="h-2 bg-[var(--t-track)] rounded-full overflow-hidden mb-2">
          <div className="h-full transition-all duration-500 rounded-full" style={{ width: `${stepsPct}%`, backgroundColor: steps >= stepGoal ? "#c9a84c" : "#7eb8a0" }}/>
        </div>

        <div className="flex items-center justify-between text-[0.62rem] text-[var(--t-text-20)] tracking-wider mb-5">
          <span className={steps >= stepGoal ? "text-[#c9a84c]" : ""}>
            {steps >= stepGoal ? "Objectif atteint ✓" : `${(stepGoal - steps).toLocaleString("fr-FR")} restants`}
          </span>
          {/* Objectif modifiable */}
          <div className="flex items-center gap-1">
            <span>Objectif :</span>
            {editingGoal ? (
              <input
                type="number" autoFocus
                className="w-16 bg-[var(--t-bg)] border border-[#c9a84c]/40 rounded-xl text-[#c9a84c] text-center text-[0.62rem] py-0.5 focus:outline-none"
                value={goalInput}
                onChange={e => setGoalInput(e.target.value)}
                onBlur={() => saveGoal(parseInt(goalInput) || 10000)}
                onKeyDown={e => { if (e.key === "Enter") saveGoal(parseInt(goalInput) || 10000); if (e.key === "Escape") setEditingGoal(false); }}
              />
            ) : (
              <button onClick={() => { setEditingGoal(true); setGoalInput(stepGoal.toString()); }}
                className="text-[var(--t-text-30)] hover:text-[#c9a84c] transition-colors underline decoration-dotted">
                {stepGoal.toLocaleString("fr-FR")}
              </button>
            )}
            <span>pas</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-4 border-t border-[var(--t-border-soft)]">
          <button onClick={() => saveSteps(steps - 500)} disabled={steps === 0}
            className="w-9 h-9 rounded-full border border-[var(--t-border)] text-[var(--t-text-40)] hover:text-[var(--t-text-70)] hover:border-[var(--t-text-20)] transition-colors disabled:opacity-20 flex items-center justify-center text-base">−</button>
          <input
            type="number" min="0"
            className="w-24 bg-[var(--t-bg)] border border-[var(--t-border)] rounded-full text-[var(--t-text)] text-center text-sm py-2 focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
            value={stepsInput}
            onChange={e => setStepsInput(e.target.value)}
            onBlur={() => saveSteps(parseInt(stepsInput) || 0)}
            onKeyDown={e => { if (e.key === "Enter") saveSteps(parseInt(stepsInput) || 0); }}
          />
          <button onClick={() => saveSteps(steps + 500)}
            className="w-9 h-9 rounded-full border border-[#7eb8a0]/40 text-[#7eb8a0] hover:bg-[#7eb8a0]/10 transition-colors flex items-center justify-center text-base">+</button>
        </div>
      </div>

      {/* ── Explication pas ── */}
      <div className="border-t border-[var(--t-border-soft)] px-5 py-4 bg-[var(--t-bg)]/60 mb-6">
        <p className="text-[0.68rem] tracking-[0.15em] uppercase text-[var(--t-text-30)] mb-3">Pourquoi suivre tes pas est aussi important que tes séances</p>
        <div className="flex flex-col gap-2.5">
          <p className="text-[0.65rem] text-[var(--t-text-35)] leading-relaxed">On pense souvent que seule la séance de sport compte pour brûler des calories. Mais ce que tu fais en dehors de l&apos;entraînement, marcher, monter des escaliers, bouger dans la journée peut représenter une dépense calorique encore plus grande que ta séance elle-même.</p>
          <p className="text-[0.65rem] text-[var(--t-text-35)] leading-relaxed">Une journée où tu marches peu, même si ton entraînement était intense, peut au final brûler moins de calories qu&apos;une journée où tu t&apos;es beaucoup déplacé, même sans sport. C&apos;est pour ça que suivre tes pas n&apos;est pas un détail : c&apos;est une vraie pièce du puzzle qui influence directement tes résultats, au même titre que tes séances.</p>
        </div>
      </div>

      {/* ── Séances du jour ── */}
      {todayWorkouts.length > 0 && (
        <div className="border border-[var(--t-border)] bg-[var(--t-surface)] rounded-xl mb-6">
          <button onClick={() => setSeancesJourOpen(v => !v)}
            className="w-full text-left flex items-center justify-between px-5 py-3 hover:bg-[var(--t-glass-bg)] transition-colors">
            <p style={{ fontFamily: "var(--font-bebas)" }} className="text-sm tracking-wider text-[var(--t-text)]">
              {selectedDate === todayStr() ? "Séances du jour" : `Séances · ${new Date(selectedDate + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span style={{ fontFamily: "var(--font-bebas)" }} className="text-lg text-[#c9a84c] tracking-wide">{eatCal}</span>
                <span className="text-[0.62rem] text-[var(--t-text-25)] uppercase tracking-wider">kcal</span>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                className={`text-[var(--t-text-25)] shrink-0 transition-transform ${seancesJourOpen ? "rotate-180" : ""}`}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </button>
          {seancesJourOpen && (
            <div className="border-t border-[var(--t-border-soft)] p-3 flex flex-col gap-2">
              {todayWorkouts.map(w => <WorkoutCard key={w.id} w={w} onRemove={() => removeWorkout(w.id)}/>)}
            </div>
          )}
        </div>
      )}

      {/* ── Historique ── */}
      {pastDates.length > 0 && (
        <div>
          <button onClick={() => setHistSectionOpen(v => !v)}
            className="w-full flex items-center justify-between mb-4 hover:opacity-70 transition-opacity">
            <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c]">Historique</p>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              className={`text-[#c9a84c]/60 shrink-0 transition-transform ${histSectionOpen ? "rotate-180" : ""}`}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {histSectionOpen && pastDates.map(date => {
            const dayWorkouts = workouts.filter(w => w.date.startsWith(date));
            const dayCal = dayWorkouts.reduce((s, w) => s + w.calories_burned, 0);
            const label = new Date(date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" });
            const isOpen = openHistDates.has(date);
            const toggle = () => setOpenHistDates(prev => {
              const next = new Set(prev);
              if (next.has(date)) next.delete(date); else next.add(date);
              return next;
            });
            return (
              <div key={date} className="border border-[var(--t-border)] bg-[var(--t-surface)] rounded-xl mb-3">
                <button onClick={toggle}
                  className="w-full text-left flex items-center justify-between gap-2 px-5 py-3 hover:bg-[var(--t-glass-bg)] transition-colors">
                  <span className="text-[0.7rem] tracking-wider text-[var(--t-text-40)] capitalize">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[0.7rem] tracking-wider text-[var(--t-text-30)]">{dayCal} kcal</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                      className={`text-[var(--t-text-25)] shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-[var(--t-border-soft)] p-3 flex flex-col gap-2">
                    {dayWorkouts.map(w => <WorkoutCard key={w.id} w={w} onRemove={() => removeWorkout(w.id)}/>)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Mon programme (séances envoyées par Samuel + séances libres) ── */}
      {coachSeances.length > 0 && (
        <div className="border border-[#c9a84c]/20 bg-[var(--t-surface-gold)] rounded-xl mb-6">
          <div className="px-5 py-3 border-b border-[#c9a84c]/10 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p style={{ fontFamily: "var(--font-bebas)" }} className="text-sm tracking-wider text-[#c9a84c]">Mon programme</p>
              <span className="text-[0.62rem] text-[var(--t-text-25)] uppercase tracking-wider">{coachSeances.length} séance{coachSeances.length > 1 ? "s" : ""}</span>
            </div>
            <button onClick={downloadPdf} disabled={exportingPdf}
              className="shrink-0 flex items-center gap-1.5 border border-[#c9a84c]/30 text-[#c9a84c] rounded-xl text-[0.6rem] font-bold tracking-[0.12em] uppercase px-2.5 py-2 hover:bg-[#c9a84c]/10 transition-colors disabled:opacity-40">
              {exportingPdf ? (
                <div className="w-3 h-3 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin"/>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              )}
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
          {coachSeances.map(s => {
            const open = openSeance === s.id;
            const done = !!s.completed_at;
            return (
              <div key={s.id} className="border-b border-[var(--t-border-soft)] last:border-0">
                <button onClick={() => setOpenSeance(open ? null : s.id)}
                  className="w-full text-left px-5 py-3 flex items-center justify-between gap-2 hover:bg-[var(--t-glass-bg)] transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {done && <span className="text-[0.7rem] text-[#7eb8a0] shrink-0">✓</span>}
                      {s.created_by_client
                        ? <span className="text-[0.68rem] tracking-wider uppercase text-[var(--t-text-30)] rounded-full border border-[var(--t-border)] px-1.5 py-0.5 shrink-0">Toi</span>
                        : <span className="text-[0.68rem] tracking-wider uppercase text-[#c9a84c] rounded-full border border-[#c9a84c]/20 px-1.5 py-0.5 shrink-0">Samuel</span>}
                      {s.type_seance && <span className="text-[0.68rem] tracking-wider uppercase text-[#c9a84c] rounded-full border border-[#c9a84c]/20 px-1.5 py-0.5 shrink-0">{s.type_seance}</span>}
                      {s.semaine && <span className="text-[0.68rem] tracking-wider uppercase text-[var(--t-text-30)] rounded-full border border-[var(--t-border)] px-1.5 py-0.5 shrink-0">Sem. {s.semaine}</span>}
                      <p className={`text-xs truncate ${done ? "text-[var(--t-text-35)] line-through" : "text-[var(--t-text-70)]"}`}>{s.titre}</p>
                    </div>
                    {s.date_prevue && <p className="text-[0.7rem] text-[var(--t-text-25)] mt-0.5">{new Date(s.date_prevue + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>}
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    className={`text-[var(--t-text-25)] shrink-0 transition-transform ${open ? "rotate-180" : ""}`}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {open && (
                  <div className="px-5 pb-4">
                    <SeanceBody s={s} />
                    {!done && hasLoggableSets(parseExercices(s.exercices)) && (
                      <button onClick={() => setLiveSeance(s)}
                        className="w-full py-2.5 rounded-xl text-[0.7rem] font-bold tracking-[0.15em] uppercase transition-all duration-200 mb-2 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black shadow-[0_4px_16px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_20px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0">
                        ▶ Démarrer la séance
                      </button>
                    )}
                    <button onClick={() => toggleSeanceDone(s)}
                      className={`w-full py-2.5 rounded-xl text-[0.7rem] font-bold tracking-[0.15em] uppercase transition-all duration-200 ${
                        done ? "border border-[#7eb8a0]/40 text-[#7eb8a0] bg-[#7eb8a0]/5 hover:bg-[#7eb8a0]/10"
                             : "border border-[var(--t-border)] text-[var(--t-text-30)] hover:border-[var(--t-text-20)] hover:text-[var(--t-text-60)]"}`}>
                      {done ? "✓ Séance terminée — annuler" : "Marquer comme terminée sans logger"}
                    </button>

                    {/* Signalement d'un problème sur cette séance (exercice inadapté, charge
                        irréaliste...) — envoyé à Samuel pour ajuster les prochains programmes. */}
                    {seanceReportSentIds.has(s.id) ? (
                      <p className="text-[0.6rem] text-[#7eb8a0] text-center mt-2">Signalement envoyé, merci ! 🙏</p>
                    ) : reportingSeanceId === s.id ? (
                      <div className="border border-[var(--t-border)] bg-[var(--t-bg)] rounded-xl p-3 mt-2 flex flex-col gap-2">
                        <textarea className="w-full bg-[var(--t-surface-2)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-xs px-3 py-2 focus:outline-none focus:border-[#c9a84c]/40 transition-colors resize-none" rows={2}
                          placeholder="Ex : la charge suggérée est trop lourde pour cet exercice à mon niveau..."
                          value={seanceReportComment} onChange={e => setSeanceReportComment(e.target.value)}/>
                        <div className="flex gap-2">
                          <button onClick={() => { setReportingSeanceId(null); setSeanceReportComment(""); }}
                            className="flex-1 border border-[var(--t-border)] text-[var(--t-text-40)] rounded-xl text-[0.6rem] tracking-[0.1em] uppercase py-2 hover:border-[var(--t-text-20)] hover:text-[var(--t-text-60)] transition-colors">
                            Annuler
                          </button>
                          <button onClick={() => submitSeanceReport(s)} disabled={seanceReportSending || !seanceReportComment.trim()}
                            className="flex-1 bg-[#e07070] text-black text-[0.6rem] font-bold tracking-[0.1em] uppercase py-2 hover:bg-[#e58888] transition-colors disabled:opacity-40 rounded-xl">
                            {seanceReportSending ? "Envoi…" : "Envoyer →"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setReportingSeanceId(s.id)}
                        className="text-[0.55rem] tracking-wider uppercase text-[var(--t-text-20)] hover:text-[#e07070]/70 transition-colors text-center py-1 mt-2 w-full">
                        Un souci avec cette séance ? Signale-la à Samuel →
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {liveSeance && userId && (
        <SeanceLive
          seance={liveSeance}
          clientId={userId}
          onClose={() => setLiveSeance(null)}
          onFinish={() => {
            setCoachSeances(prev => prev.map(x => x.id === liveSeance.id ? { ...x, completed_at: new Date().toISOString() } : x));
            setLiveSeance(null);
          }}
        />
      )}
    </div>
  );
}
