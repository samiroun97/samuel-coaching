"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Profile = {
  prenom: string; nom: string; age: number; poids: number; taille: number; sexe: string;
  niveau_activite: string; experience: string; seances_par_semaine: number;
  duree_seance: string; lieu_entrainement: string;
  blessures: string; alimentation: string; sommeil_stress: string; objectifs: string;
};
type Goals = { calories: number; proteines: number; glucides: number; lipides: number };
type Food  = { calories: number; proteines: number; glucides: number; lipides: number };
type Log   = { date: string; calories_burned: number };

const today = () => new Date().toISOString().split("T")[0];

function bmr(p: Profile, bodyFatPct: number | null): number {
  if (bodyFatPct !== null) {
    // Katch-McArdle : basé sur la masse maigre (LBM)
    const lbm = p.poids * (1 - bodyFatPct / 100);
    return Math.round(370 + 21.6 * lbm);
  }
  // Mifflin-St Jeor : estimation sans composition corporelle
  const base = 10 * p.poids + 6.25 * p.taille - 5 * p.age;
  return Math.round(p.sexe === "Femme" ? base - 161 : base + 5);
}

function CalRing({ consumed, tdee, label = "TDEE", goalDefined = true }: { consumed: number; tdee: number; label?: string; goalDefined?: boolean }) {
  const r = 90, circ = 2 * Math.PI * r;
  const pct     = tdee > 0 ? Math.min(consumed / tdee, 1.3) : 0;
  const over    = consumed > tdee;
  const balance = consumed - tdee;
  const maint   = Math.abs(balance) <= 100;
  const color   = !goalDefined ? "rgba(255,255,255,0.15)" : over ? "#e07070" : maint ? "#c9a84c" : "#7eb8a0";
  const dash    = goalDefined ? circ * Math.min(pct, 1) : 0;

  return (
    <div className="relative flex items-center justify-center w-[210px] h-[210px] sm:w-[240px] sm:h-[240px]">
      <svg viewBox="0 0 220 220" className="-rotate-90 w-full h-full">
        <circle cx="110" cy="110" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10"/>
        <circle cx="110" cy="110" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}/>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl text-white tracking-wide leading-none">{consumed.toLocaleString("fr-FR")}</p>
        <p className="text-[0.6rem] tracking-[0.2em] uppercase text-white/30 mt-1">kcal consommés</p>
        <div className="w-8 h-px bg-white/10 my-2"/>
        {goalDefined ? (
          <p style={{ fontFamily: "var(--font-bebas)", color }} className="text-lg tracking-wide leading-none">{tdee.toLocaleString("fr-FR")}</p>
        ) : (
          <p style={{ fontFamily: "var(--font-bebas)" }} className="text-lg tracking-wide leading-none text-white/25">À définir</p>
        )}
        <p className="text-[0.6rem] tracking-[0.18em] uppercase mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{label}</p>
        {goalDefined && consumed > 0 && (
          <p className="text-[0.62rem] font-bold tracking-wider mt-1.5" style={{ color }}>
            {over ? "+" : ""}{balance.toLocaleString("fr-FR")} kcal
          </p>
        )}
      </div>
    </div>
  );
}

function MiniBar({ label, consumed, goal, color }: { label: string; consumed: number; goal: number; color: string }) {
  const pct = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  return (
    <div>
      <div className="flex justify-between text-[0.62rem] tracking-wider mb-1.5">
        <span className="uppercase text-white/30">{label}</span>
        <span style={{ color }}>{consumed}g <span className="text-white/20">/ {goal}g</span></span>
      </div>
      <div className="h-1 bg-white/5 rounded-full">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct * 100}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}80` }}/>
      </div>
    </div>
  );
}

type WeightEntry = { id: string; date: string; weight: number };
type BFEntry     = { id: string; date: string; body_fat: number };

function DateNav({ date, onChange }: { date: string; onChange: (d: string) => void }) {
  const todayD  = new Date().toISOString().split("T")[0];
  const isToday = date === todayD;
  const dateInputRef = useRef<HTMLInputElement>(null);
  const go = (n: number) => {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() + n);
    onChange(d.toISOString().split("T")[0]);
  };
  const openPicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      try { input.showPicker(); } catch { input.focus(); input.click(); }
    } else {
      input.focus();
      input.click();
    }
  };
  return (
    <div className="flex items-center justify-between mb-5">
      <button onClick={() => go(-1)} className="text-white/30 hover:text-white/60 transition-colors w-8 h-8 flex items-center justify-center text-lg">‹</button>
      <div className="flex items-center gap-3">
        <label className="relative cursor-pointer group flex items-center gap-1.5" onClick={openPicker}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/30 group-hover:text-white/50 transition-colors shrink-0">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span className="text-[0.7rem] tracking-[0.15em] uppercase text-white/50 select-none group-hover:text-white/70 transition-colors">
            {isToday ? "Aujourd'hui" : new Date(date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
          </span>
          <input
            ref={dateInputRef}
            type="date" value={date} max={todayD}
            onChange={e => { if (e.target.value) onChange(e.target.value); }}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>
        {!isToday && (
          <button onClick={() => onChange(todayD)}
            className="text-[0.45rem] tracking-wider uppercase text-[#c9a84c]/60 hover:text-[#c9a84c] transition-colors border border-[#c9a84c]/20 hover:border-[#c9a84c]/40 px-2 py-0.5">
            Aujourd'hui
          </button>
        )}
      </div>
      <button onClick={() => go(1)} disabled={isToday}
        className="text-white/30 hover:text-white/60 disabled:opacity-20 transition-colors w-8 h-8 flex items-center justify-center text-lg">›</button>
    </div>
  );
}

export default function AccueilPage() {
  const [profile,      setProfile]      = useState<Profile | null>(null);
  const [userId,       setUserId]       = useState<string | null>(null);
  const [consumed,     setConsumed]     = useState({ calories: 0, proteines: 0, glucides: 0, lipides: 0 });
  const [goals,        setGoals]        = useState<Goals>({ calories: 2200, proteines: 150, glucides: 220, lipides: 70 });
  const [goalsSet,     setGoalsSet]     = useState(false);
  const [neat,         setNeat]         = useState(0);
  const [eat,          setEat]          = useState(0);
  const [bodyFat,      setBodyFat]      = useState<number | null>(null);
  const [weightHist,   setWeightHist]   = useState<WeightEntry[]>([]);
  const [weightInput,  setWeightInput]  = useState("");
  const [weightSaving, setWeightSaving] = useState(false);
  const [weightSaved,  setWeightSaved]  = useState(false);
  const [daysSinceBF,  setDaysSinceBF]  = useState<number | null>(null);
  const [calView,      setCalView]      = useState<"tdee" | "goal">("tdee");
  const [selectedDate, setSelectedDate] = useState(today());

  // Static data — loads once on mount
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const uid = data.user.id;
      setUserId(uid);
      const { data: p } = await supabase.from("profiles").select("*").eq("id", uid).single();
      if (p) setProfile(p as Profile);

      // Weight history
      try {
        const wRaw = localStorage.getItem(`weight_history_${uid}`);
        const wh: WeightEntry[] = wRaw ? JSON.parse(wRaw) : [];
        setWeightHist(wh);
        const lastW = wh[0]?.weight ?? (p as Profile | null)?.poids;
        if (lastW) setWeightInput(String(lastW));
      } catch { /* ignore */ }

      // Body fat (source de vérité : Supabase, partagé entre appareils)
      try {
        const { data: bf } = await supabase.from("body_fat_entries")
          .select("date,body_fat").eq("user_id", uid).order("date", { ascending: false }).limit(1);
        let latest: { date: string; body_fat: number } | null = bf?.[0] ?? null;
        if (!latest) {
          const bfRaw = localStorage.getItem(`bodyfat_history_${uid}`) ?? localStorage.getItem("bodyfat_history");
          const bfHist: BFEntry[] = bfRaw ? JSON.parse(bfRaw) : [];
          latest = bfHist[0] ?? null;
        }
        if (latest?.body_fat) setBodyFat(latest.body_fat);
        if (latest?.date) {
          const days = Math.floor((Date.now() - new Date(latest.date).getTime()) / 86400000);
          setDaysSinceBF(days);
        } else {
          setDaysSinceBF(null);
        }
      } catch { /* ignore */ }
    });

    // Goals (static)
    try {
      const g = localStorage.getItem("nutrition_goals");
      if (g) { setGoals(JSON.parse(g)); setGoalsSet(true); }
    } catch { /* ignore */ }

    // Restore saved selected date
    try {
      const saved = localStorage.getItem("selected_date");
      if (saved) setSelectedDate(saved);
    } catch { /* ignore */ }
  }, []);

  // Date-specific data — reloads when selected date or profile changes
  useEffect(() => {
    try { localStorage.setItem("selected_date", selectedDate); } catch { /* ignore */ }

    // Nutrition consumed
    try {
      const f = localStorage.getItem(`nutrition_${selectedDate}`);
      if (f) {
        const foods: Food[] = JSON.parse(f);
        setConsumed(foods.reduce((acc, x) => ({
          calories: acc.calories + x.calories,
          proteines: acc.proteines + x.proteines,
          glucides: acc.glucides + x.glucides,
          lipides: acc.lipides + x.lipides,
        }), { calories: 0, proteines: 0, glucides: 0, lipides: 0 }));
      } else {
        setConsumed({ calories: 0, proteines: 0, glucides: 0, lipides: 0 });
      }
    } catch { /* ignore */ }

    // Steps → NEAT (uses profile weight when available)
    try {
      const steps = parseInt(localStorage.getItem(`steps_${selectedDate}`) ?? "0") || 0;
      setNeat(Math.round(steps * 0.04 * ((profile?.poids ?? 70) / 70)));
    } catch { /* ignore */ }

    // EAT (workouts for selected day)
    try {
      const logs: Log[] = JSON.parse(localStorage.getItem("programme_logs") ?? "[]");
      setEat(logs.filter(l => l.date.startsWith(selectedDate)).reduce((s, l) => s + l.calories_burned, 0));
    } catch { /* ignore */ }
  }, [selectedDate, profile]);

  const lastWeight   = weightHist[0]?.weight ?? profile?.poids ?? null;
  const needsBF      = daysSinceBF === null || daysSinceBF >= 14;
  const entryForDate = weightHist.find(e => e.date === selectedDate);

  // Pré-remplir avec la pesée existante quand on change de date
  useEffect(() => {
    const e = weightHist.find(x => x.date === selectedDate);
    if (e) setWeightInput(String(e.weight));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const saveWeight = async () => {
    const val = parseFloat(weightInput.replace(",", "."));
    if (isNaN(val) || val < 20 || val > 300 || !userId) return;
    setWeightSaving(true);
    const entry: WeightEntry = { id: Date.now().toString(), date: selectedDate, weight: +val.toFixed(1) };
    const next = [entry, ...weightHist.filter(e => e.date !== selectedDate)]
      .sort((a, b) => b.date.localeCompare(a.date));
    setWeightHist(next);
    localStorage.setItem(`weight_history_${userId}`, JSON.stringify(next));
    // Le poids du profil ne suit que la pesée la plus récente
    if (next[0]?.date === selectedDate) {
      await supabase.from("profiles").update({ poids: val }).eq("id", userId);
    }
    setWeightSaving(false); setWeightSaved(true);
    setTimeout(() => setWeightSaved(false), 2000);
  };


  if (!profile) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  const bmrVal     = bmr(profile, bodyFat);
  const tdee       = bmrVal + neat + eat;
  const refCal     = calView === "goal" ? goals.calories : tdee;
  const balance    = consumed.calories - refCal;
  const surplus    = balance > 0;
  const isMaint    = Math.abs(balance) <= 100;
  const bannerColor = isMaint ? "#c9a84c" : surplus ? "#e07070" : "#7eb8a0";
  const bannerLabel = isMaint ? "Maintenance" : surplus ? "Surplus calorique" : "Déficit calorique";

  return (
    <div className="p-4 sm:p-8 max-w-3xl">

      {/* ── Header ── */}
      <div className="mb-4 sm:mb-6">
        <p className="text-[0.7rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-1">Espace client</p>
        <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl sm:text-5xl text-white tracking-wide">
          {profile.prenom} {profile.nom}
        </h1>
        <p className="text-white/30 text-xs mt-1 capitalize">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* ── Sélecteur de date global ── */}
      <DateNav date={selectedDate} onChange={setSelectedDate} />

      {/* ── Pesée ── */}
      <div className={`border p-4 mb-4 flex flex-wrap items-center gap-3 sm:gap-4 ${entryForDate ? "border-white/5 bg-[#0d0d0d]" : "border-[#c9a84c]/20 bg-[#c9a84c]/5"}`}>
        <div className="flex-1 min-w-[130px]">
          <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-0.5">
            Pesée {selectedDate === today() ? "du jour" : `· ${new Date(selectedDate + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`}
          </p>
          {entryForDate
            ? <p className="text-[0.65rem] text-white/30 tracking-wider">✓ Enregistrée — {entryForDate.weight} kg</p>
            : <p className="text-[0.65rem] text-white/30 tracking-wider">Dernière : {lastWeight ? `${lastWeight} kg` : "—"}</p>
          }
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <input
            type="number" min="20" max="300" step="0.1"
            value={weightInput}
            onChange={e => setWeightInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") saveWeight(); }}
            className="w-20 bg-[#0a0a0a] border border-white/10 text-white text-sm px-3 py-1.5 text-center focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
            placeholder="70.0"
          />
          <span className="text-white/25 text-xs">kg</span>
          <button onClick={saveWeight} disabled={weightSaving || !weightInput}
            className={`text-[0.68rem] font-bold tracking-[0.12em] uppercase px-4 py-1.5 transition-colors disabled:opacity-30 ${
              weightSaved ? "bg-[#7eb8a0] text-black" : "bg-[#c9a84c] text-black hover:bg-[#e2c97e]"
            }`}>
            {weightSaved ? "✓" : entryForDate ? "Modifier" : "Enregistrer"}
          </button>
        </div>
      </div>


{/* ── CICO Hero ── */}
      <div className="border border-white/10 bg-[#111] p-6 mb-4">
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard/nutrition" className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c] hover:text-[#e2c97e] transition-colors">
            {selectedDate === today() ? "Bilan calorique du jour" : `Bilan calorique · ${new Date(selectedDate + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`}
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">

          {/* Ring */}
          <div className="shrink-0 flex justify-center">
            <CalRing consumed={consumed.calories} tdee={refCal} label={calView === "goal" ? "Objectif" : "TDEE"} goalDefined={calView === "tdee" || goalsSet}/>
          </div>

          {/* Right panel */}
          <div className="flex-1 min-w-0 w-full sm:w-auto">

            {/* Toggle vue */}
            <div className="flex gap-1.5 mb-4">
              {([["tdee", "TDEE"], ["goal", "Objectif"]] as const).map(([key, label]) => (
                <button key={key} onClick={() => setCalView(key)}
                  className={`px-3 py-1.5 text-[0.65rem] tracking-[0.12em] uppercase border transition-all ${calView === key ? "border-[#c9a84c] text-[#c9a84c] bg-[#c9a84c]/10" : "border-white/10 text-white/30 hover:border-white/20 hover:text-white/50"}`}>
                  {label}
                </button>
              ))}
            </div>

            {calView === "tdee" ? (
              /* ── Vue TDEE ── */
              <div className="mb-5">
                <Link href="/dashboard/programme" className="text-[0.65rem] tracking-[0.18em] uppercase text-white/20 hover:text-white/40 transition-colors mb-3 block">Dépense totale (TDEE)</Link>
                <div className="flex flex-col gap-2">
                  {[
                    { label: "BMR",  val: bmrVal, desc: "Métabolisme de base",   color: "#c9a84c" },
                    { label: "NEAT", val: neat,   desc: "Activité quotidienne",  color: "#7eb8a0" },
                    { label: "EAT",  val: eat,    desc: "Entraînement",          color: "#a08ec9" },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-5" style={{ backgroundColor: row.color }}/>
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm tracking-[0.12em] uppercase font-bold" style={{ color: row.color }}>{row.label}</span>
                          <span className="text-[0.65rem] text-white/30">{row.desc}</span>
                        </div>
                      </div>
                      <span style={{ fontFamily: "var(--font-bebas)" }} className="text-xl text-white/70 tracking-wide">{row.val.toLocaleString("fr-FR")}</span>
                    </div>
                  ))}
                  <div className="border-t border-white/5 pt-2 flex items-center justify-between mt-1">
                    <span className="text-[0.65rem] tracking-[0.15em] uppercase text-white/40">Total TDEE</span>
                    <span style={{ fontFamily: "var(--font-bebas)" }} className="text-xl text-white tracking-wide">{tdee.toLocaleString("fr-FR")} <span className="text-sm text-white/30">kcal</span></span>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Vue Objectif ── */
              <div className="mb-5">
                <p className="text-[0.65rem] tracking-[0.18em] uppercase text-white/20 mb-3">Calories · objectif vs consommé</p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-5 bg-[#c9a84c]"/>
                      <span className="text-[0.65rem] text-white/30">Objectif journalier</span>
                    </div>
                    {goalsSet ? (
                      <span style={{ fontFamily: "var(--font-bebas)" }} className="text-xl text-white/70 tracking-wide">{goals.calories.toLocaleString("fr-FR")}</span>
                    ) : (
                      <Link href="/dashboard/nutrition" style={{ fontFamily: "var(--font-bebas)" }} className="text-xl text-white/25 tracking-wide hover:text-[#c9a84c] transition-colors">À définir</Link>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-5" style={{ backgroundColor: consumed.calories > goals.calories ? "#e07070" : "#7eb8a0" }}/>
                      <span className="text-[0.65rem] text-white/30">Consommés aujourd&apos;hui</span>
                    </div>
                    <span style={{ fontFamily: "var(--font-bebas)" }} className="text-xl text-white/70 tracking-wide">{consumed.calories.toLocaleString("fr-FR")}</span>
                  </div>
                  <div className="mt-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${goalsSet ? Math.min(goals.calories > 0 ? (consumed.calories / goals.calories) * 100 : 0, 100) : 0}%`,
                        backgroundColor: consumed.calories > goals.calories ? "#e07070" : "#7eb8a0",
                      }}/>
                  </div>
                  <div className="border-t border-white/5 pt-2 flex items-center justify-between mt-1">
                    <span className="text-[0.65rem] tracking-[0.15em] uppercase text-white/40">
                      {consumed.calories > goals.calories ? "Surplus" : "Restant"}
                    </span>
                    {goalsSet ? (
                      <span style={{ fontFamily: "var(--font-bebas)" }} className={`text-xl tracking-wide ${consumed.calories > goals.calories ? "text-[#e07070]" : "text-[#7eb8a0]"}`}>
                        {Math.abs(goals.calories - consumed.calories).toLocaleString("fr-FR")} <span className="text-sm text-white/30">kcal</span>
                      </span>
                    ) : (
                      <span style={{ fontFamily: "var(--font-bebas)" }} className="text-xl tracking-wide text-white/20">—</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Macros */}
            <div className="flex flex-col gap-2.5">
              <MiniBar label="Protéines" consumed={consumed.proteines} goal={goals.proteines} color="#F3F4F6"/>
              <MiniBar label="Glucides"  consumed={consumed.glucides}  goal={goals.glucides}  color="#F97316"/>
              <MiniBar label="Lipides"   consumed={consumed.lipides}   goal={goals.lipides}   color="#CA8A04"/>
            </div>
          </div>
        </div>

        {/* Balance banner */}
        {refCal > 0 && (calView === "tdee" || goalsSet) && (
          <div className="mt-5 px-4 py-2.5 border flex items-center justify-between"
            style={{ borderColor: `${bannerColor}25`, backgroundColor: `${bannerColor}08` }}>
            <span className="text-[0.7rem] tracking-[0.15em] uppercase" style={{ color: bannerColor }}>{bannerLabel}</span>
            <span style={{ fontFamily: "var(--font-bebas)", color: bannerColor }} className="text-xl tracking-wide">
              {surplus ? "+" : ""}{balance.toLocaleString("fr-FR")} kcal
            </span>
          </div>
        )}

        <Link href="/dashboard/nutrition"
          className="mt-4 flex items-center justify-center gap-2 w-full border border-[#c9a84c]/20 text-[#c9a84c] text-[0.7rem] tracking-[0.15em] uppercase py-3 hover:bg-[#c9a84c]/5 transition-colors">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Ajouter un repas / modifier mes objectifs
        </Link>
      </div>

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {/* Poids */}
        <div className="border border-white/10 bg-[#111] p-4">
          <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-1.5">Poids</p>
          <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-white tracking-wide">{lastWeight ? `${lastWeight} kg` : `${profile.poids} kg`}</p>
        </div>
        {/* Taille */}
        <div className="border border-white/10 bg-[#111] p-4">
          <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-1.5">Taille</p>
          <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-white tracking-wide">{profile.taille} cm</p>
        </div>
        {/* Body fat — lien vers suivi avec flèche si check-in requis */}
        <Link href="/dashboard/suivi" className={`border p-4 flex flex-col justify-between group transition-colors ${needsBF ? "border-[#c9a84c]/25 bg-[#c9a84c]/5 hover:bg-[#c9a84c]/8" : "border-white/10 bg-[#111] hover:border-white/15"}`}>
          <div className="flex items-center justify-between">
            <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c]">Body fat</p>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={needsBF ? "#c9a84c" : "rgba(255,255,255,0.2)"} strokeWidth="2" strokeLinecap="round" className="transition-transform group-hover:translate-x-0.5"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <p style={{ fontFamily: "var(--font-bebas)", color: needsBF && bodyFat === null ? "#c9a84c" : "white" }} className="text-2xl tracking-wide mt-1.5">
            {bodyFat !== null ? `${bodyFat}%` : "—"}
          </p>
        </Link>
        {/* Balance */}
        {(() => {
          const balDefined = calView === "tdee" || goalsSet;
          const balColor = !balDefined ? "rgba(255,255,255,0.25)" : Math.abs(balance) <= 100 ? "#c9a84c" : surplus ? "#e07070" : "#7eb8a0";
          const balLabel = !balDefined ? "Déficit" : Math.abs(balance) <= 100 ? "Maintenance" : surplus ? "Surplus" : "Déficit";
          return (
            <div className="border bg-[#111] p-4" style={{ borderColor: `${balDefined ? balColor : "#ffffff"}30` }}>
              <p className="text-[0.65rem] tracking-[0.2em] uppercase mb-1.5" style={{ color: balColor }}>{balLabel}</p>
              <p style={{ fontFamily: "var(--font-bebas)", color: balColor }} className="text-2xl tracking-wide">
                {balDefined ? `${surplus ? "+" : ""}${balance.toLocaleString("fr-FR")} kcal` : "À définir"}
              </p>
            </div>
          );
        })()}
      </div>

      {/* ── Profil entraînement ── */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="border border-white/10 bg-[#111] p-6">
          <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-4">Entraînement</p>
          <div className="flex flex-col gap-3">
            {[
              { label: "Niveau",       val: profile.niveau_activite },
              { label: "Expérience",   val: profile.experience },
              { label: "Séances/sem.", val: `${profile.seances_par_semaine}×` },
              { label: "Durée",        val: profile.duree_seance },
              { label: "Lieu",         val: profile.lieu_entrainement },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-start border-b border-white/5 pb-2.5 last:border-0 last:pb-0">
                <span className="text-[0.7rem] tracking-wider uppercase text-white/25 shrink-0">{r.label}</span>
                <span className="text-xs text-white/60 text-right ml-4">{r.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-white/10 bg-[#111] p-6">
          <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-4">Santé & objectifs</p>
          <div className="flex flex-col gap-4">
            {[
              { label: "Blessures",      val: profile.blessures },
              { label: "Alimentation",   val: profile.alimentation },
              { label: "Sommeil/stress", val: profile.sommeil_stress },
            ].map(r => (
              <div key={r.label}>
                <p className="text-[0.65rem] tracking-[0.18em] uppercase text-white/25 mb-1">{r.label}</p>
                <p className="text-xs text-white/55 leading-relaxed">{r.val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border border-white/10 bg-[#111] p-6 mb-6">
        <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-3">Objectifs</p>
        <p className="text-sm text-white/55 leading-relaxed">{profile.objectifs}</p>
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-4">
        <Link href="/dashboard/onboarding"
          className="flex-1 border border-white/10 text-white/40 text-[0.7rem] tracking-[0.15em] uppercase py-4 text-center hover:border-white/20 hover:text-white/60 transition-colors">
          Modifier mon profil
        </Link>
        <Link href="/dashboard/coach"
          className="flex-1 bg-[#c9a84c] text-black text-[0.7rem] font-bold tracking-[0.15em] uppercase py-4 text-center hover:bg-[#e2c97e] transition-colors">
          Contacter Samuel →
        </Link>
      </div>

    </div>
  );
}
