"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { DateNav } from "@/components/DateNav";

type Profile = {
  prenom: string; nom: string; age: number; poids: number; taille: number; sexe: string;
  niveau_activite: string; experience: string; seances_par_semaine: number;
  duree_seance: string; lieu_entrainement: string;
  blessures: string; alimentation: string; sommeil_stress: string; objectifs: string;
  objectif_echeance: string | null; objectif_pending: boolean;
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

// kcal restantes à gauche, cercle "consommées" au centre, dépense (TDEE) à droite —
// une seule ligne, sans surcharge de couleurs.
function CalorieRow({ consumed, target, expended, goalDefined }: { consumed: number; target: number; expended: number; goalDefined: boolean }) {
  const r = 90, circ = 2 * Math.PI * r;
  const remaining = target - consumed;
  const over    = consumed > target;
  const maint   = Math.abs(remaining) <= 100;
  const color   = !goalDefined ? "var(--t-text-15)" : over ? "#e07070" : maint ? "#c9a84c" : "#7eb8a0";
  const pct     = target > 0 ? Math.min(consumed / target, 1.3) : 0;
  const dash    = goalDefined ? circ * Math.min(pct, 1) : 0;

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-6">
      <div className="flex flex-col items-center text-center w-16 sm:w-20 shrink-0">
        <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl sm:text-3xl text-[var(--t-text)] tracking-wide leading-none">
          {goalDefined ? Math.abs(remaining).toLocaleString("fr-FR") : "—"}
        </p>
        <p className="text-[0.55rem] sm:text-[0.6rem] tracking-[0.15em] uppercase text-[var(--t-text-30)] mt-1.5">
          kcal {goalDefined ? (over ? "en surplus" : "restantes") : "à définir"}
        </p>
      </div>

      <div className="relative shrink-0 w-[160px] h-[160px] sm:w-[190px] sm:h-[190px]">
        <svg viewBox="0 0 220 220" className="-rotate-90 w-full h-full">
          <circle cx="110" cy="110" r={r} fill="none" stroke="var(--t-track)" strokeWidth="10"/>
          <circle cx="110" cy="110" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.6s ease" }}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p style={{ fontFamily: "var(--font-bebas)" }} className="text-3xl sm:text-4xl text-[var(--t-text)] tracking-wide leading-none">{consumed.toLocaleString("fr-FR")}</p>
          <p className="text-[0.55rem] sm:text-[0.6rem] tracking-[0.2em] uppercase text-[var(--t-text-30)] mt-1.5">Kcal<br/>consommées</p>
        </div>
      </div>

      <div className="flex flex-col items-center text-center w-16 sm:w-20 shrink-0">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--t-text-25)] mb-1">
          <path d="M12 2c-3.5 4-5.5 7-5.5 10.5a5.5 5.5 0 0011 0c0-1.3-.4-2.6-1.3-3.6.2 1.7-.9 2.6-1.9 2.6-1.3 0-2-1.2-1.2-2.7C13.9 7 14 4.5 12 2z"/>
        </svg>
        <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl sm:text-3xl text-[var(--t-text)] tracking-wide leading-none">{Math.round(expended).toLocaleString("fr-FR")}</p>
        <p className="text-[0.55rem] sm:text-[0.6rem] tracking-[0.15em] uppercase text-[var(--t-text-30)] mt-1.5">TDEE</p>
      </div>
    </div>
  );
}

function MacroRing({ label, consumed, goal, color }: { label: string; consumed: number; goal: number; color: string }) {
  const r = 26, circ = 2 * Math.PI * r;
  const pct = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-16 h-16 sm:w-[70px] sm:h-[70px] shrink-0">
        <svg viewBox="0 0 64 64" className="-rotate-90 w-full h-full">
          <circle cx="32" cy="32" r={r} fill="none" stroke="var(--t-track)" strokeWidth="5"/>
          <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={`${circ * pct} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.6s ease" }}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs sm:text-sm font-bold text-[var(--t-text)] leading-none">{consumed}</span>
          <span className="text-[0.5rem] text-[var(--t-text-25)] mt-0.5">/{goal}g</span>
        </div>
      </div>
      <span className="text-[0.58rem] tracking-[0.12em] uppercase text-[var(--t-text-30)]">{label}</span>
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
        <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl sm:text-5xl text-[var(--t-text)] tracking-wide">
          {profile.prenom} {profile.nom}
        </h1>
        <p className="text-[var(--t-text-30)] text-xs mt-1 capitalize">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* ── Sélecteur de date global ── */}
      <DateNav date={selectedDate} onChange={setSelectedDate} />

      {/* ── Pesée ── */}
      <div className={`rounded-lg border p-4 mb-4 flex items-center gap-4 ${entryForDate ? "border-[var(--t-border-soft)] bg-[var(--t-surface-2)]" : "border-[#c9a84c]/25 bg-[#c9a84c]/5"}`}>
        <div className="flex-1 min-w-0">
          <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-0.5">
            Pesée {selectedDate === today() ? "du jour" : `· ${new Date(selectedDate + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`}
          </p>
          {entryForDate
            ? <p className="text-[0.65rem] text-[var(--t-text-30)] tracking-wider">Enregistrée — {entryForDate.weight} kg</p>
            : <p className="text-[0.65rem] text-[var(--t-text-30)] tracking-wider">Dernière : {lastWeight ? `${lastWeight} kg` : "—"}</p>
          }
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-[var(--t-bg)] border border-[var(--t-border)] rounded-full pl-3 pr-2.5 py-1.5 focus-within:border-[#c9a84c]/40 transition-colors">
            <input
              type="number" min="20" max="300" step="0.1"
              value={weightInput}
              onChange={e => setWeightInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") saveWeight(); }}
              className="w-12 bg-transparent text-[var(--t-text)] text-sm text-center focus:outline-none"
              placeholder="70.0"
            />
            <span className="text-[var(--t-text-25)] text-[0.62rem]">kg</span>
          </div>
          <button onClick={saveWeight} disabled={weightSaving || !weightInput}
            aria-label={entryForDate ? "Modifier la pesée" : "Enregistrer la pesée"}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0 disabled:opacity-30 ${
              weightSaved ? "bg-[#7eb8a0] text-black" : "bg-[#c9a84c] text-black hover:bg-[#e2c97e]"
            }`}>
            {weightSaved ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            ) : entryForDate ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            )}
          </button>
        </div>
      </div>


{/* ── CICO Hero ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard/nutrition" className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c] hover:text-[#e2c97e] transition-colors">
            {selectedDate === today() ? "Bilan calorique du jour" : `Bilan calorique · ${new Date(selectedDate + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`}
          </Link>
        </div>
        <CalorieRow consumed={consumed.calories} target={refCal} expended={tdee} goalDefined={calView === "tdee" || goalsSet}/>

        {/* Toggle référence du cercle */}
        <div className="flex justify-center gap-1.5 mt-6">
          {([["tdee", "TDEE"], ["goal", "Objectif"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setCalView(key)}
              className={`px-3 py-1.5 rounded-lg text-[0.65rem] tracking-[0.12em] uppercase border transition-all ${calView === key ? "border-[#c9a84c] text-[#c9a84c] bg-[#c9a84c]/10" : "border-[var(--t-border)] text-[var(--t-text-30)] hover:border-[var(--t-border-15)] hover:text-[var(--t-text-50)]"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Balance banner */}
        {refCal > 0 && (calView === "tdee" || goalsSet) && (
          <div className="mt-5 px-4 py-2.5 rounded-lg border flex items-center justify-between"
            style={{ borderColor: `${bannerColor}25`, backgroundColor: `${bannerColor}08` }}>
            <span className="text-[0.7rem] tracking-[0.15em] uppercase" style={{ color: bannerColor }}>{bannerLabel}</span>
            <span style={{ fontFamily: "var(--font-bebas)", color: bannerColor }} className="text-xl tracking-wide">
              {surplus ? "+" : ""}{balance.toLocaleString("fr-FR")} kcal
            </span>
          </div>
        )}

        {/* Dépense totale — fluide, monochrome */}
        <div className="mt-6 pt-5 border-t border-[var(--t-border-soft)]">
          <p className="text-[0.6rem] tracking-[0.18em] uppercase text-[var(--t-text-20)] mb-3 text-center">Dépense totale</p>
          <div className="flex items-center justify-between">
            {[
              { label: "BMR",  val: bmrVal },
              { label: "NEAT", val: neat },
              { label: "EAT",  val: eat },
            ].map((row, i) => (
              <div key={row.label} className={`flex-1 text-center ${i > 0 ? "border-l border-[var(--t-border-soft)]" : ""}`}>
                <p style={{ fontFamily: "var(--font-bebas)" }} className="text-xl text-[var(--t-text-80)] tracking-wide">{row.val.toLocaleString("fr-FR")}</p>
                <p className="text-[0.58rem] tracking-[0.15em] uppercase text-[var(--t-text-25)] mt-1">{row.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Macros */}
        <div className="mt-6 pt-5 border-t border-[var(--t-border-soft)] flex items-start justify-around">
          <MacroRing label="Protéines" consumed={consumed.proteines} goal={goals.proteines} color="#F3F4F6"/>
          <MacroRing label="Glucides"  consumed={consumed.glucides}  goal={goals.glucides}  color="#e0834a"/>
          <MacroRing label="Lipides"   consumed={consumed.lipides}   goal={goals.lipides}   color="#9c8563"/>
        </div>

        <Link href="/dashboard/nutrition"
          className="mt-6 flex items-center justify-center gap-2 w-full rounded-lg border border-[#c9a84c]/20 text-[#c9a84c] text-[0.7rem] tracking-[0.15em] uppercase py-3 hover:bg-[#c9a84c]/5 transition-colors">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Ajouter un repas / modifier mes objectifs
        </Link>
      </div>

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {/* Poids */}
        <div className="border border-[var(--t-border)] bg-[var(--t-surface)] rounded-lg p-4">
          <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-1.5">Poids</p>
          <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-[var(--t-text)] tracking-wide">{lastWeight ? `${lastWeight} kg` : `${profile.poids} kg`}</p>
        </div>
        {/* Taille */}
        <div className="border border-[var(--t-border)] bg-[var(--t-surface)] rounded-lg p-4">
          <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-1.5">Taille</p>
          <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-[var(--t-text)] tracking-wide">{profile.taille} cm</p>
        </div>
        {/* Body fat — lien vers suivi avec flèche si check-in requis */}
        <Link href="/dashboard/suivi" className={`border rounded-lg p-4 flex flex-col justify-between group transition-colors ${needsBF ? "border-[#c9a84c]/25 bg-[#c9a84c]/5 hover:bg-[#c9a84c]/8" : "border-[var(--t-border)] bg-[var(--t-surface)] hover:border-[var(--t-border-15)]"}`}>
          <div className="flex items-center justify-between">
            <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c]">Body fat</p>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={needsBF ? "#c9a84c" : "var(--t-text-20)"} strokeWidth="2" strokeLinecap="round" className="transition-transform group-hover:translate-x-0.5"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <p style={{ fontFamily: "var(--font-bebas)", color: needsBF && bodyFat === null ? "#c9a84c" : "var(--t-text)" }} className="text-2xl tracking-wide mt-1.5">
            {bodyFat !== null ? `${bodyFat}%` : "—"}
          </p>
        </Link>
        {/* Balance */}
        {(() => {
          const balDefined = calView === "tdee" || goalsSet;
          const balColor = !balDefined ? "var(--t-text-25)" : Math.abs(balance) <= 100 ? "#c9a84c" : surplus ? "#e07070" : "#7eb8a0";
          const balLabel = !balDefined ? "Déficit" : Math.abs(balance) <= 100 ? "Maintenance" : surplus ? "Surplus" : "Déficit";
          return (
            <div className="border bg-[var(--t-surface)] rounded-lg p-4" style={{ borderColor: balDefined ? `${balColor}30` : "var(--t-border)" }}>
              <p className="text-[0.65rem] tracking-[0.2em] uppercase mb-1.5" style={{ color: balColor }}>{balLabel}</p>
              <p style={{ fontFamily: "var(--font-bebas)", color: balColor }} className="text-2xl tracking-wide">
                {balDefined ? `${surplus ? "+" : ""}${balance.toLocaleString("fr-FR")} kcal` : "À définir"}
              </p>
            </div>
          );
        })()}
      </div>

    </div>
  );
}
