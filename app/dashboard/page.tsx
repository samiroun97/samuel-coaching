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
  const pct   = tdee > 0 ? Math.min(consumed / tdee, 1.3) : 0;
  const over  = consumed > tdee;
  const color = over ? "#e07070" : consumed / tdee > 0.85 ? "#c9a84c" : "#7eb8a0";
  const dash  = circ * Math.min(pct, 1);
  const balance = consumed - tdee;

  return (
    <div className="relative flex items-center justify-center w-[180px] h-[180px] sm:w-[220px] sm:h-[220px]">
      <svg viewBox="0 0 220 220" className="-rotate-90 w-full h-full">
        <circle cx="110" cy="110" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10"/>
        <circle cx="110" cy="110" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}/>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p style={{ fontFamily: "var(--font-bebas)" }} className="text-5xl text-white tracking-wide leading-none">{consumed.toLocaleString("fr-FR")}</p>
        <p className="text-[0.45rem] tracking-[0.2em] uppercase text-white/30 mt-1">kcal consommés</p>
        <div className="w-8 h-px bg-white/10 my-2"/>
        <p style={{ fontFamily: "var(--font-bebas)", color }} className="text-xl tracking-wide leading-none">{tdee.toLocaleString("fr-FR")}</p>
        <p className="text-[0.42rem] tracking-[0.18em] uppercase mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>TDEE</p>
        {consumed > 0 && (
          <p className={`text-[0.5rem] font-bold tracking-wider mt-2 ${over ? "text-[#e07070]" : "text-[#7eb8a0]"}`}>
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
      <div className="h-1 bg-white/5">
        <div className="h-full transition-all duration-500" style={{ width: `${pct * 100}%`, backgroundColor: color }}/>
      </div>
    </div>
  );
}

export default function AccueilPage() {
  const [profile,  setProfile]  = useState<Profile | null>(null);
  const [consumed, setConsumed] = useState({ calories: 0, proteines: 0, glucides: 0, lipides: 0 });
  const [goals,    setGoals]    = useState<Goals>({ calories: 2200, proteines: 150, glucides: 220, lipides: 70 });
  const [neat,     setNeat]     = useState(0);
  const [eat,      setEat]      = useState(0);
  const [bodyFat,  setBodyFat]  = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
      if (p) setProfile(p as Profile);
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
      const poids = (() => { try { return JSON.parse(localStorage.getItem("nutrition_goals") ?? "{}"); } catch { return {}; } })();
      // We'll recalc with profile once loaded, store steps for now
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

    // Body fat
    try {
      const bfHistory = JSON.parse(localStorage.getItem("bodyfat_history") ?? "[]");
      if (bfHistory[0]?.body_fat) setBodyFat(bfHistory[0].body_fat);
    } catch { /* ignore */ }
  }, []);

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

  const bmrVal  = bmr(profile, bodyFat);
  const tdee    = bmrVal + neat + eat;
  const balance = consumed.calories - tdee;
  const surplus = balance > 0;

  return (
    <div className="p-4 sm:p-8 max-w-3xl">

      {/* ── Header ── */}
      <div className="mb-5 sm:mb-8">
        <p className="text-[0.55rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-1">Espace client</p>
        <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl sm:text-5xl text-white tracking-wide">
          {profile.prenom} {profile.nom}
        </h1>
        <p className="text-white/30 text-xs mt-1 capitalize">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* ── CICO Hero ── */}
      <div className="border border-white/10 bg-[#111] p-6 mb-4">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c]">Bilan calorique du jour</p>
          <Link href="/dashboard/nutrition" className="text-[0.5rem] tracking-[0.15em] uppercase text-white/30 hover:text-[#c9a84c] transition-colors">
            Gérer →
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">

          {/* Ring */}
          <div className="shrink-0">
            <CalRing consumed={consumed.calories} tdee={tdee}/>
          </div>

          {/* TDEE breakdown + macros */}
          <div className="flex-1 min-w-0">

            {/* TDEE breakdown */}
            <div className="mb-5">
              <p className="text-[0.5rem] tracking-[0.18em] uppercase text-white/20 mb-3">Dépense totale (TDEE)</p>
              <div className="flex flex-col gap-2">
                {[
                  { label: "BMR", val: bmrVal, desc: bodyFat !== null ? "Katch-McArdle · masse maigre" : "Mifflin-St Jeor · estimation", color: "#c9a84c" },
                  { label: "NEAT", val: neat, desc: "Activité quotidienne · pas", color: "#7eb8a0" },
                  { label: "EAT", val: eat, desc: "Entraînements du jour", color: "#a08ec9" },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4" style={{ backgroundColor: row.color }}/>
                      <div>
                        <span className="text-[0.5rem] tracking-[0.15em] uppercase font-bold" style={{ color: row.color }}>{row.label}</span>
                        <span className="text-[0.45rem] text-white/20 ml-1.5">{row.desc}</span>
                      </div>
                    </div>
                    <span style={{ fontFamily: "var(--font-bebas)" }} className="text-lg text-white/70 tracking-wide">{row.val.toLocaleString("fr-FR")}</span>
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
              <MiniBar label="Protéines" consumed={consumed.proteines} goal={goals.proteines} color="#c9a84c"/>
              <MiniBar label="Glucides"  consumed={consumed.glucides}  goal={goals.glucides}  color="#7eb8a0"/>
              <MiniBar label="Lipides"   consumed={consumed.lipides}   goal={goals.lipides}   color="#e07070"/>
            </div>
          </div>
        </div>

        {/* Balance banner */}
        {tdee > 0 && (
          <div className={`mt-5 px-4 py-2.5 border flex items-center justify-between ${surplus ? "border-[#e07070]/20 bg-[#e07070]/5" : "border-[#7eb8a0]/20 bg-[#7eb8a0]/5"}`}>
            <span className="text-[0.55rem] tracking-[0.15em] uppercase" style={{ color: surplus ? "#e07070" : "#7eb8a0" }}>
              {surplus ? "Surplus calorique" : "Déficit calorique"}
            </span>
            <span style={{ fontFamily: "var(--font-bebas)", color: surplus ? "#e07070" : "#7eb8a0" }} className="text-xl tracking-wide">
              {surplus ? "+" : ""}{balance.toLocaleString("fr-FR")} kcal
            </span>
          </div>
        )}

        <Link href="/dashboard/nutrition"
          className="mt-4 flex items-center justify-center gap-2 w-full border border-[#c9a84c]/20 text-[#c9a84c] text-[0.55rem] tracking-[0.15em] uppercase py-3 hover:bg-[#c9a84c]/5 transition-colors">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Ajouter un repas / modifier mes objectifs
        </Link>
      </div>

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Poids",    val: `${profile.poids} kg` },
          { label: "Taille",   val: `${profile.taille} cm` },
          { label: "Body fat", val: bodyFat !== null ? `${bodyFat}%` : "—" },
          {
            label: Math.abs(balance) <= 100 ? "Maintenance" : surplus ? "Surplus" : "Déficit",
            val: `${surplus ? "+" : ""}${balance.toLocaleString("fr-FR")} kcal`,
          },
        ].map((s, i) => {
          const isBalance = i === 3;
          const balColor  = Math.abs(balance) <= 100 ? "#7eb8a0" : surplus ? "#e07070" : "#7eb8a0";
          return (
            <div key={s.label} className={`border p-4 ${isBalance ? "bg-[#111]" : "border-white/10 bg-[#111]"}`}
              style={isBalance ? { borderColor: `${balColor}30` } : {}}>
              <p className="text-[0.5rem] tracking-[0.2em] uppercase mb-1.5" style={{ color: isBalance ? balColor : "#c9a84c" }}>{s.label}</p>
              <p style={{ fontFamily: "var(--font-bebas)", color: isBalance ? balColor : "white" }} className="text-2xl tracking-wide">{s.val}</p>
            </div>
          );
        })}
      </div>

      {/* ── Profil entraînement ── */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="border border-white/10 bg-[#111] p-6">
          <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-4">Entraînement</p>
          <div className="flex flex-col gap-3">
            {[
              { label: "Niveau",       val: profile.niveau_activite },
              { label: "Expérience",   val: profile.experience },
              { label: "Séances/sem.", val: `${profile.seances_par_semaine}×` },
              { label: "Durée",        val: profile.duree_seance },
              { label: "Lieu",         val: profile.lieu_entrainement },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-start border-b border-white/5 pb-2.5 last:border-0 last:pb-0">
                <span className="text-[0.55rem] tracking-wider uppercase text-white/25 shrink-0">{r.label}</span>
                <span className="text-xs text-white/60 text-right ml-4">{r.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-white/10 bg-[#111] p-6">
          <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-4">Santé & objectifs</p>
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
        <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-3">Objectifs</p>
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
