"use client";
import { useEffect, useState } from "react";
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

function CalRing({ consumed, tdee }: { consumed: number; tdee: number }) {
  const r = 90, circ = 2 * Math.PI * r;
  const pct     = tdee > 0 ? Math.min(consumed / tdee, 1.3) : 0;
  const over    = consumed > tdee;
  const balance = consumed - tdee;
  const maint   = Math.abs(balance) <= 100;
  const color   = over ? "#e07070" : maint ? "#c9a84c" : "#7eb8a0";
  const dash    = circ * Math.min(pct, 1);

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
        <p className="text-[0.42rem] tracking-[0.2em] uppercase text-white/30 mt-1">kcal consommés</p>
        <div className="w-8 h-px bg-white/10 my-2"/>
        <p style={{ fontFamily: "var(--font-bebas)", color }} className="text-lg tracking-wide leading-none">{tdee.toLocaleString("fr-FR")}</p>
        <p className="text-[0.4rem] tracking-[0.18em] uppercase mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>TDEE</p>
        {consumed > 0 && (
          <p className="text-[0.45rem] font-bold tracking-wider mt-1.5" style={{ color }}>
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
      <div className="flex justify-between text-[0.48rem] tracking-wider mb-1.5">
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

export default function AccueilPage() {
  const [profile,      setProfile]      = useState<Profile | null>(null);
  const [userId,       setUserId]       = useState<string | null>(null);
  const [consumed,     setConsumed]     = useState({ calories: 0, proteines: 0, glucides: 0, lipides: 0 });
  const [goals,        setGoals]        = useState<Goals>({ calories: 2200, proteines: 150, glucides: 220, lipides: 70 });
  const [neat,         setNeat]         = useState(0);
  const [eat,          setEat]          = useState(0);
  const [bodyFat,      setBodyFat]      = useState<number | null>(null);
  const [weightHist,   setWeightHist]   = useState<WeightEntry[]>([]);
  const [weightInput,  setWeightInput]  = useState("");
  const [weightDate,   setWeightDate]   = useState(today());
  const [weightSaving, setWeightSaving] = useState(false);
  const [weightSaved,  setWeightSaved]  = useState(false);
  const [daysSinceBF,  setDaysSinceBF]  = useState<number | null>(null);

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

      // Body fat
      try {
        const bfRaw = localStorage.getItem(`bodyfat_history_${uid}`) ?? localStorage.getItem("bodyfat_history");
        const bfHist: BFEntry[] = bfRaw ? JSON.parse(bfRaw) : [];
        if (bfHist[0]?.body_fat) setBodyFat(bfHist[0].body_fat);
        if (bfHist[0]?.date) {
          const days = Math.floor((Date.now() - new Date(bfHist[0].date).getTime()) / 86400000);
          setDaysSinceBF(days);
        } else {
          setDaysSinceBF(null);
        }
      } catch { /* ignore */ }
    });

    // Nutrition
    try {
      const g = localStorage.getItem("nutrition_goals");
      if (g) setGoals(JSON.parse(g));
      const f = localStorage.getItem(`nutrition_${today()}`);
      if (f) {
        const foods: Food[] = JSON.parse(f);
        setConsumed(foods.reduce((acc, x) => ({
          calories: acc.calories + x.calories,
          proteines: acc.proteines + x.proteines,
          glucides: acc.glucides + x.glucides,
          lipides: acc.lipides + x.lipides,
        }), { calories: 0, proteines: 0, glucides: 0, lipides: 0 }));
      }
    } catch { /* ignore */ }

    // Steps → NEAT
    try {
      const steps = parseInt(localStorage.getItem(`steps_${today()}`) ?? "0") || 0;
      setNeat(Math.round(steps * 0.04));
    } catch { /* ignore */ }

    // EAT (workouts today)
    try {
      const logs: Log[] = JSON.parse(localStorage.getItem("programme_logs") ?? "[]");
      const todayEat = logs
        .filter(l => l.date.startsWith(today()))
        .reduce((s, l) => s + l.calories_burned, 0);
      setEat(todayEat);
    } catch { /* ignore */ }
  }, []);

  const lastWeight   = weightHist[0]?.weight ?? profile?.poids ?? null;
  const needsBF      = daysSinceBF === null || daysSinceBF >= 14;
  const entryForDate = weightHist.find(e => e.date === weightDate);

  // Pré-remplir avec la pesée existante quand on change de date
  useEffect(() => {
    const e = weightHist.find(x => x.date === weightDate);
    if (e) setWeightInput(String(e.weight));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weightDate]);

  const saveWeight = async () => {
    const val = parseFloat(weightInput.replace(",", "."));
    if (isNaN(val) || val < 20 || val > 300 || !userId) return;
    setWeightSaving(true);
    const entry: WeightEntry = { id: Date.now().toString(), date: weightDate, weight: +val.toFixed(1) };
    const next = [entry, ...weightHist.filter(e => e.date !== weightDate)]
      .sort((a, b) => b.date.localeCompare(a.date));
    setWeightHist(next);
    localStorage.setItem(`weight_history_${userId}`, JSON.stringify(next));
    // Le poids du profil ne suit que la pesée la plus récente
    if (next[0]?.date === weightDate) {
      await supabase.from("profiles").update({ poids: val }).eq("id", userId);
    }
    setWeightSaving(false); setWeightSaved(true);
    setTimeout(() => setWeightSaved(false), 2000);
  };

  // Recalc NEAT with actual weight once profile loaded
  useEffect(() => {
    if (!profile) return;
    try {
      const steps = parseInt(localStorage.getItem(`steps_${today()}`) ?? "0") || 0;
      setNeat(Math.round(steps * 0.04 * (profile.poids / 70)));
    } catch { /* ignore */ }
  }, [profile]);

  if (!profile) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  const bmrVal     = bmr(profile, bodyFat);
  const tdee       = bmrVal + neat + eat;
  const balance    = consumed.calories - tdee;
  const surplus    = balance > 0;
  const isMaint    = Math.abs(balance) <= 100;
  const bannerColor = isMaint ? "#c9a84c" : surplus ? "#e07070" : "#7eb8a0";
  const bannerLabel = isMaint ? "Maintenance" : surplus ? "Surplus calorique" : "Déficit calorique";

  return (
    <div className="p-4 sm:p-8 max-w-3xl">

      {/* ── Header ── */}
      <div className="mb-5 sm:mb-8">
        <p className="text-[0.7rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-1">Espace client</p>
        <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl sm:text-5xl text-white tracking-wide">
          {profile.prenom} {profile.nom}
        </h1>
        <p className="text-white/30 text-xs mt-1 capitalize">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* ── Pesée (date sélectionnable) ── */}
      <div className={`border p-4 mb-4 flex flex-wrap items-center gap-3 sm:gap-4 ${entryForDate ? "border-white/5 bg-[#0d0d0d]" : "border-[#c9a84c]/20 bg-[#c9a84c]/5"}`}>
        <div className="flex-1 min-w-[130px]">
          <p className="text-[0.6rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-0.5">
            Pesée {weightDate === today() ? "du jour" : `· ${new Date(weightDate + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`}
          </p>
          {entryForDate
            ? <p className="text-[0.5rem] text-white/30 tracking-wider">✓ Enregistrée — {entryForDate.weight} kg</p>
            : <p className="text-[0.5rem] text-white/30 tracking-wider">Dernière : {lastWeight ? `${lastWeight} kg` : "—"}</p>
          }
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <input
            type="date" value={weightDate} max={today()}
            onChange={e => { if (e.target.value) setWeightDate(e.target.value); }}
            className="bg-[#0a0a0a] border border-white/10 text-white/60 text-[0.7rem] px-2 py-1.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
          />
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
            className={`text-[0.55rem] font-bold tracking-[0.12em] uppercase px-4 py-1.5 transition-colors disabled:opacity-30 ${
              weightSaved ? "bg-[#7eb8a0] text-black" : "bg-[#c9a84c] text-black hover:bg-[#e2c97e]"
            }`}>
            {weightSaved ? "✓" : entryForDate ? "Modifier" : "Enregistrer"}
          </button>
        </div>
      </div>


{/* ── CICO Hero ── */}
      <div className="border border-white/10 bg-[#111] p-6 mb-4">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c]">Bilan calorique du jour</p>
          <Link href="/dashboard/nutrition" className="text-[0.5rem] tracking-[0.15em] uppercase text-white/30 hover:text-[#c9a84c] transition-colors">
            Gérer →
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">

          {/* Ring */}
          <div className="shrink-0 flex justify-center">
            <CalRing consumed={consumed.calories} tdee={tdee}/>
          </div>

          {/* TDEE breakdown + macros */}
          <div className="flex-1 min-w-0 w-full sm:w-auto">

            {/* TDEE breakdown */}
            <div className="mb-5">
              <p className="text-[0.5rem] tracking-[0.18em] uppercase text-white/20 mb-3">Dépense totale (TDEE)</p>
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
                        <span className="text-[0.5rem] text-white/30">{row.desc}</span>
                      </div>
                    </div>
                    <span style={{ fontFamily: "var(--font-bebas)" }} className="text-xl text-white/70 tracking-wide">{row.val.toLocaleString("fr-FR")}</span>
                  </div>
                ))}
                <div className="border-t border-white/5 pt-2 flex items-center justify-between mt-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[0.5rem] tracking-[0.15em] uppercase text-white/40">Total TDEE</span>
                    <Link href="/dashboard/nutrition" className="text-[0.45rem] tracking-[0.1em] uppercase text-[#c9a84c]/50 hover:text-[#c9a84c] transition-colors border border-[#c9a84c]/20 px-1.5 py-0.5">
                      Modifier →
                    </Link>
                  </div>
                  <span style={{ fontFamily: "var(--font-bebas)" }} className="text-xl text-white tracking-wide">{tdee.toLocaleString("fr-FR")} <span className="text-sm text-white/30">kcal</span></span>
                </div>
              </div>
            </div>

            {/* Macros */}
            <div className="flex flex-col gap-2.5">
              <MiniBar label="Protéines" consumed={consumed.proteines} goal={goals.proteines} color="#F3F4F6"/>
              <MiniBar label="Glucides"  consumed={consumed.glucides}  goal={goals.glucides}  color="#F97316"/>
              <MiniBar label="Lipides"   consumed={consumed.lipides}   goal={goals.lipides}   color="#CA8A04"/>
            </div>
          </div>
        </div>

        {/* Balance banner */}
        {tdee > 0 && (
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
          <p className="text-[0.5rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-1.5">Poids</p>
          <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-white tracking-wide">{lastWeight ? `${lastWeight} kg` : `${profile.poids} kg`}</p>
        </div>
        {/* Taille */}
        <div className="border border-white/10 bg-[#111] p-4">
          <p className="text-[0.5rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-1.5">Taille</p>
          <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-white tracking-wide">{profile.taille} cm</p>
        </div>
        {/* Body fat — lien vers suivi avec flèche si check-in requis */}
        <Link href="/dashboard/suivi" className={`border p-4 flex flex-col justify-between group transition-colors ${needsBF ? "border-[#c9a84c]/25 bg-[#c9a84c]/5 hover:bg-[#c9a84c]/8" : "border-white/10 bg-[#111] hover:border-white/15"}`}>
          <div className="flex items-center justify-between">
            <p className="text-[0.5rem] tracking-[0.2em] uppercase text-[#c9a84c]">Body fat</p>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={needsBF ? "#c9a84c" : "rgba(255,255,255,0.2)"} strokeWidth="2" strokeLinecap="round" className="transition-transform group-hover:translate-x-0.5"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <p style={{ fontFamily: "var(--font-bebas)", color: needsBF && bodyFat === null ? "#c9a84c" : "white" }} className="text-2xl tracking-wide mt-1.5">
            {bodyFat !== null ? `${bodyFat}%` : "—"}
          </p>
        </Link>
        {/* Balance */}
        {(() => {
          const balColor = Math.abs(balance) <= 100 ? "#c9a84c" : surplus ? "#e07070" : "#7eb8a0";
          const balLabel = Math.abs(balance) <= 100 ? "Maintenance" : surplus ? "Surplus" : "Déficit";
          return (
            <div className="border bg-[#111] p-4" style={{ borderColor: `${balColor}30` }}>
              <p className="text-[0.5rem] tracking-[0.2em] uppercase mb-1.5" style={{ color: balColor }}>{balLabel}</p>
              <p style={{ fontFamily: "var(--font-bebas)", color: balColor }} className="text-2xl tracking-wide">
                {surplus ? "+" : ""}{balance.toLocaleString("fr-FR")} kcal
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
                <p className="text-[0.5rem] tracking-[0.18em] uppercase text-white/25 mb-1">{r.label}</p>
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
          className="flex-1 border border-white/10 text-white/40 text-[0.6rem] tracking-[0.15em] uppercase py-4 text-center hover:border-white/20 hover:text-white/60 transition-colors">
          Modifier mon profil
        </Link>
        <Link href="/dashboard/coach"
          className="flex-1 bg-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.15em] uppercase py-4 text-center hover:bg-[#e2c97e] transition-colors">
          Contacter Samuel →
        </Link>
      </div>

    </div>
  );
}
