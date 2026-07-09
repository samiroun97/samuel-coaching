"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

type Food  = { id: string; name: string; calories: number; proteines: number; glucides: number; lipides: number; repas?: string };
type Goals = { calories: number; proteines: number; glucides: number; lipides: number };
type MacroKey = "proteines" | "glucides" | "lipides";
type AIResult = { name: string; calories: number; proteines: number; glucides: number; lipides: number };
type IdeaResult = { name: string; description: string; calories: number; proteines: number; glucides: number; lipides: number };
type OFFProduct = { product_name: string; brands?: string; nutriments: { "energy-kcal_100g"?: number; proteins_100g?: number; carbohydrates_100g?: number; fat_100g?: number } };
// base_qty/unit : produit dont les macros valent pour une quantité de base (ex. 100 ml) — la quantité est choisie à l'ajout.
// Sans base_qty : repas à portion fixe (comportement historique).
type SavedMeal = { id: string; name: string; calories: number; proteines: number; glucides: number; lipides: number; base_qty?: number; unit?: string };
type DayHistory = { date: string; label: string; calories: number };
type MealPlanItem = { id: string; meal_type: string; name: string; calories: number; proteines: number; glucides: number; lipides: number };
type MealPlan = { id: string; name: string; notes: string | null; items: MealPlanItem[] };
type MiniProfile = { poids: number; taille: number; age: number; sexe: string };

// Même calcul que l'accueil : Katch-McArdle si body fat connu, sinon Mifflin-St Jeor
function bmr(p: MiniProfile, bodyFatPct: number | null): number {
  if (bodyFatPct !== null) {
    const lbm = p.poids * (1 - bodyFatPct / 100);
    return Math.round(370 + 21.6 * lbm);
  }
  const base = 10 * p.poids + 6.25 * p.taille - 5 * p.age;
  return Math.round(p.sexe === "Femme" ? base - 161 : base + 5);
}

const CAL: Record<MacroKey, number> = { proteines: 4, glucides: 4, lipides: 9 };
const defaultGoals: Goals = { calories: 2200, proteines: 150, glucides: 220, lipides: 70 };
const macroConfig: { key: MacroKey; label: string; color: string }[] = [
  { key: "proteines", label: "Protéines", color: "#F3F4F6" },
  { key: "glucides",  label: "Glucides",  color: "#F97316" },
  { key: "lipides",   label: "Lipides",   color: "#CA8A04" },
];
const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function macroKcal(g: Goals) { return Math.round(g.proteines*4 + g.glucides*4 + g.lipides*9); }

function adjustCalories(draft: Goals, newCal: number): Goals {
  newCal = Math.max(0, Math.round(newCal));
  const curKcal = macroKcal(draft);
  const out = { ...draft, calories: newCal };
  if (curKcal > 0) {
    const scale = newCal / curKcal;
    out.proteines = Math.max(0, Math.round(draft.proteines * scale));
    out.glucides  = Math.max(0, Math.round(draft.glucides  * scale));
    out.lipides   = Math.max(0, Math.round(draft.lipides   * scale));
  } else {
    out.proteines = Math.round(newCal * 0.25 / 4);
    out.glucides  = Math.round(newCal * 0.50 / 4);
    out.lipides   = Math.round(newCal * 0.25 / 9);
  }
  return out;
}

function adjustMacro(draft: Goals, key: MacroKey, grams: number): Goals {
  grams = Math.max(0, Math.round(grams));
  const thisKcal  = grams * CAL[key];
  const remaining = Math.max(0, draft.calories - thisKcal);
  const others    = (["proteines","glucides","lipides"] as MacroKey[]).filter(k => k !== key);
  const othersKcal = others.reduce((s,k) => s + draft[k]*CAL[k], 0);
  const out = { ...draft, [key]: grams };
  if (othersKcal > 0) {
    others.forEach(k => { out[k] = Math.max(0, Math.round((remaining * (draft[k]*CAL[k]/othersKcal)) / CAL[k])); });
  } else {
    others.forEach(k => { out[k] = Math.max(0, Math.round((remaining/2) / CAL[k])); });
  }
  out.calories = draft.calories;
  return out;
}

function CalorieRing({ consumed, goal }: { consumed: number; goal: number }) {
  const r = 82, circ = 2*Math.PI*r, pct = Math.min(consumed/(goal||1), 1), over = consumed > goal;
  return (
    <div className="relative flex items-center justify-center w-52 h-52 mx-auto">
      <svg width="208" height="208" viewBox="0 0 208 208" className="absolute inset-0">
        <circle cx="104" cy="104" r={r} fill="none" stroke="#ffffff07" strokeWidth="14"/>
        <circle cx="104" cy="104" r={r} fill="none" stroke={over?"#e07070":"#c9a84c"} strokeWidth="14"
          strokeDasharray={`${pct*circ} ${circ}`} strokeLinecap="round" transform="rotate(-90 104 104)"
          style={{ transition:"stroke-dasharray 0.9s ease" }}/>
      </svg>
      <div className="flex flex-col items-center z-10">
        <span style={{ fontFamily:"var(--font-bebas)" }} className="text-5xl text-white tracking-wide leading-none">{consumed}</span>
        <span className="text-[0.5rem] tracking-[0.2em] uppercase text-white/30 mt-1">kcal consommés</span>
        <div className="mt-3 h-px w-10 bg-white/10"/>
        <span className={`text-xs mt-3 ${over?"text-[#e07070]":"text-[#c9a84c]"}`}>
          {over ? `+${consumed-goal} excédent` : `${Math.max(goal-consumed,0)} restants`}
        </span>
      </div>
    </div>
  );
}

function MacroBar({ label, consumed, goal, color }: { label: string; consumed: number; goal: number; color: string }) {
  const pct = Math.min((consumed/(goal||1))*100, 100);
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[0.6rem] tracking-[0.15em] uppercase text-white/40">{label}</span>
        <span className="text-xs text-white/60">{consumed}<span className="text-white/25"> / {goal}g</span></span>
      </div>
      <div className="h-1.5 bg-white/5 w-full rounded-full">
        <div className="h-full transition-all duration-700 rounded-full" style={{ width:`${pct}%`, backgroundColor:color, boxShadow:`0 0 8px ${color}80` }}/>
      </div>
    </div>
  );
}

function WaterTracker({ water, goal, onAdd, onRemove }: { water: number; goal: number; onAdd: () => void; onRemove: () => void }) {
  const liters = (water * 0.25).toFixed(2).replace(/\.?0+$/, "");
  const goalLiters = (goal * 0.25).toFixed(1);
  return (
    <div className="border border-white/10 bg-[#111] p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4a9fd5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C6 8 4 12 4 15a8 8 0 0016 0c0-3-2-7-8-13z"/>
          </svg>
          <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c]">Hydratation</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[0.6rem] text-white/40">{liters}L / {goalLiters}L</span>
          <div className="flex gap-1">
            <button onClick={onRemove} disabled={water === 0}
              className="w-6 h-6 border border-white/10 text-white/30 hover:text-white/60 hover:border-white/20 transition-colors disabled:opacity-20 flex items-center justify-center text-sm">−</button>
            <button onClick={onAdd} disabled={water >= goal}
              className="w-6 h-6 border border-[#4a9fd5]/40 text-[#4a9fd5] hover:bg-[#4a9fd5]/10 transition-colors disabled:opacity-20 flex items-center justify-center text-sm">+</button>
          </div>
        </div>
      </div>
      <div className="flex gap-1 mb-2">
        {Array.from({ length: goal }).map((_, i) => (
          <div key={i} onClick={() => i < water ? onRemove() : onAdd()}
            className={`flex-1 h-3 border cursor-pointer transition-all ${i < water ? "border-[#4a9fd5] bg-[#4a9fd5]/25" : "border-white/10 hover:border-white/20"}`}/>
        ))}
      </div>
      <p className="text-[0.45rem] tracking-wider text-white/20 text-right">
        {water >= goal ? "Objectif atteint ✓" : `${((goal - water) * 0.25).toFixed(2).replace(/\.?0+$/, "")}L restants`}
      </p>
    </div>
  );
}

function WeekChart({ history, goal }: { history: DayHistory[]; goal: number }) {
  const max = Math.max(goal * 1.2, ...history.map(d => d.calories), 1);
  const BAR = 64;
  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height: `${BAR + 16}px` }}>
        {history.map(d => {
          const barH = d.calories > 0 ? Math.max(Math.round((d.calories / max) * BAR), 3) : 2;
          const isToday = d.label === "Auj";
          const over = d.calories > goal && d.calories > 0;
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5">
              {d.calories > 0 && <span className="text-[0.4rem] text-white/25 leading-none">{d.calories}</span>}
              <div className="flex-1 flex items-end w-full">
                <div className="w-full transition-all duration-700" style={{
                  height: `${barH}px`,
                  backgroundColor: isToday
                    ? (over ? "#e07070" : "#c9a84c")
                    : d.calories > 0 ? (over ? "rgba(224,112,112,0.35)" : "rgba(255,255,255,0.13)") : "rgba(255,255,255,0.04)",
                }}/>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 mt-1.5">
        {history.map(d => (
          <div key={d.date} className="flex-1 text-center">
            <span className={`text-[0.45rem] tracking-wider ${d.label === "Auj" ? "text-[#c9a84c]" : "text-white/20"}`}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

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

export default function NutritionPage() {
  const realToday = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(realToday);
  const [goals,     setGoals]     = useState<Goals>(defaultGoals);
  const [foods,     setFoods]     = useState<Food[]>([]);
  const [showAdd,   setShowAdd]   = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [goalDraft, setGoalDraft] = useState<Goals>(defaultGoals);
  const [rawGoal,   setRawGoal]   = useState({ calories: "2200", proteines: "150", glucides: "220", lipides: "70" });
  const [water,     setWater]     = useState(0);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [pastHistory, setPastHistory] = useState<DayHistory[]>([]);
  const [calRef,      setCalRef]      = useState<"objectif" | "tdee">("objectif");
  const [miniProfile, setMiniProfile] = useState<MiniProfile | null>(null);
  const [bodyFat,     setBodyFat]     = useState<number | null>(null);
  const [tdeeParts,   setTdeeParts]   = useState({ neat: 0, eat: 0 });

  const [modalMode, setModalMode] = useState<"ai"|"search"|"saved">("ai");
  const [ideas,       setIdeas]       = useState<IdeaResult[]>([]);
  const [ideaLoading, setIdeaLoading] = useState(false);
  const [ideaError,   setIdeaError]   = useState("");
  const [mealPlan,    setMealPlan]    = useState<MealPlan | null>(null);
  const [description, setDescription] = useState("");
  const userIdRef       = useRef("");
  const syncTimer       = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const selectedDateRef = useRef(realToday);
  const scanRef         = useRef<HTMLInputElement>(null);
  const [scanError, setScanError] = useState("");
  const [aiResult,    setAiResult]    = useState<AIResult | null>(null);
  const [analyzing,   setAnalyzing]   = useState(false);
  const [aiError,     setAiError]     = useState("");
  const [listening,   setListening]   = useState(false);
  const photoRef       = useRef<HTMLInputElement>(null);
  const galleryRef     = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<{ start(): void; stop(): void } | null>(null);
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState<OFFProduct[]>([]);
  const [searching,setSearching]= useState(false);
  const [selected, setSelected] = useState<OFFProduct|null>(null);
  const [quantity, setQuantity] = useState("100");
  const [selectedSaved, setSelectedSaved] = useState<SavedMeal|null>(null);
  const [savedQty,      setSavedQty]      = useState("100");
  const [showNewProd,   setShowNewProd]   = useState(false);
  const emptyProd = { name: "", base: "100", unit: "g", calories: "", proteines: "", glucides: "", lipides: "" };
  const [newProd,       setNewProd]       = useState(emptyProd);

  const WATER_GOAL = 8;

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userIdRef.current = user.id;
        // Profil + body fat pour le calcul du TDEE
        const { data: p } = await supabase.from("profiles").select("poids,taille,age,sexe").eq("id", user.id).single();
        if (p) setMiniProfile(p as MiniProfile);
        try {
          const bfRaw = localStorage.getItem(`bodyfat_history_${user.id}`) ?? localStorage.getItem("bodyfat_history");
          const bfHist: { body_fat?: number }[] = bfRaw ? JSON.parse(bfRaw) : [];
          if (bfHist[0]?.body_fat) setBodyFat(bfHist[0].body_fat);
        } catch { /* ignore */ }
        // Charger plan repas actif
        const { data: plans } = await supabase
          .from("meal_plans").select("id,name,notes").eq("client_id", user.id).eq("is_active", true).limit(1);
        if (plans?.length) {
          const plan = plans[0];
          const { data: items } = await supabase
            .from("meal_plan_items").select("*").eq("plan_id", plan.id);
          setMealPlan({ ...plan, items: (items ?? []) as MealPlanItem[] });
        }
      }
    })();
    const g = localStorage.getItem("nutrition_goals");
    const s = localStorage.getItem("nutrition_saved_meals");
    const r = localStorage.getItem("nutrition_cal_ref");
    if (g) setGoals(JSON.parse(g));
    if (s) setSavedMeals(JSON.parse(s));
    if (r === "tdee" || r === "objectif") setCalRef(r);
    const hist: DayHistory[] = [];
    for (let i = 6; i >= 1; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const stored = localStorage.getItem(`nutrition_${dateStr}`);
      const cal = stored ? (JSON.parse(stored) as Food[]).reduce((s, x) => s + x.calories, 0) : 0;
      hist.push({ date: dateStr, label: DAY_LABELS[d.getDay()], calories: cal });
    }
    setPastHistory(hist);
  }, []);

  useEffect(() => {
    selectedDateRef.current = selectedDate;
    const f = localStorage.getItem(`nutrition_${selectedDate}`);
    const w = localStorage.getItem(`hydration_${selectedDate}`);
    setFoods(f ? JSON.parse(f) : []);
    setWater(w ? parseInt(w) : 0);
  }, [selectedDate]);

  useEffect(() => { localStorage.setItem("nutrition_goals", JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem("nutrition_cal_ref", calRef); }, [calRef]);

  // NEAT (pas) + EAT (entraînements) du jour sélectionné, comme sur l'accueil
  useEffect(() => {
    try {
      const steps = parseInt(localStorage.getItem(`steps_${selectedDate}`) ?? "0") || 0;
      const neat  = Math.round(steps * 0.04 * ((miniProfile?.poids ?? 70) / 70));
      const logs: { date: string; calories_burned: number }[] = JSON.parse(localStorage.getItem("programme_logs") ?? "[]");
      const eat   = logs.filter(l => l.date.startsWith(selectedDate)).reduce((s, l) => s + l.calories_burned, 0);
      setTdeeParts({ neat, eat });
    } catch { setTdeeParts({ neat: 0, eat: 0 }); }
  }, [selectedDate, miniProfile]);
  useEffect(() => {
    localStorage.setItem(`nutrition_${selectedDateRef.current}`, JSON.stringify(foods));
    // Sync différé vers Supabase
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      if (!userIdRef.current) return;
      const t = foods.reduce((acc, f) => ({
        calories: acc.calories + f.calories, proteines: acc.proteines + f.proteines,
        glucides: acc.glucides + f.glucides, lipides: acc.lipides + f.lipides,
      }), { calories: 0, proteines: 0, glucides: 0, lipides: 0 });
      await supabase.from("daily_summaries").upsert({
        user_id: userIdRef.current, date: selectedDateRef.current, ...t, updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,date" });
    }, 3000);
  }, [foods]);
  useEffect(() => { localStorage.setItem(`hydration_${selectedDateRef.current}`, water.toString()); }, [water]);
  useEffect(() => { localStorage.setItem("nutrition_saved_meals", JSON.stringify(savedMeals)); }, [savedMeals]);

  const remaining = {
    calories:  Math.max(0, goals.calories  - foods.reduce((s,f) => s+f.calories, 0)),
    proteines: Math.max(0, goals.proteines - foods.reduce((s,f) => s+f.proteines, 0)),
    glucides:  Math.max(0, goals.glucides  - foods.reduce((s,f) => s+f.glucides, 0)),
    lipides:   Math.max(0, goals.lipides   - foods.reduce((s,f) => s+f.lipides, 0)),
  };

  const generateIdeas = async () => {
    setIdeaLoading(true); setIdeaError(""); setIdeas([]);
    try {
      const res = await fetch("/api/nutrition/meal-idea", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remaining }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setIdeas(data.ideas ?? []);
    } catch (e: unknown) {
      setIdeaError(e instanceof Error ? e.message : "Erreur IA");
    }
    setIdeaLoading(false);
  };

  const addFoodDirect = (item: Omit<IdeaResult, "description">) => {
    setFoods(f => [...f, { id: Date.now().toString(), ...item }]);
  };

  const totals = foods.reduce((acc,f) => ({
    calories:  acc.calories  + f.calories,
    proteines: acc.proteines + f.proteines,
    glucides:  acc.glucides  + f.glucides,
    lipides:   acc.lipides   + f.lipides,
  }), { calories:0, proteines:0, glucides:0, lipides:0 });

  const todayCalForChart = selectedDate === realToday
    ? totals.calories
    : (() => { const s = localStorage.getItem(`nutrition_${realToday}`); return s ? (JSON.parse(s) as Food[]).reduce((a, f) => a + f.calories, 0) : 0; })();
  const fullHistory: DayHistory[] = [...pastHistory, { date: realToday, label: "Auj", calories: todayCalForChart }];

  const analyzeText = async () => {
    if (!description.trim()) return;
    setAnalyzing(true); setAiError(""); setAiResult(null);
    try {
      const res = await fetch("/api/nutrition/analyze", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ type:"text", text:description }) });
      if (!res.ok) { const t = await res.text(); throw new Error(t || `Erreur ${res.status}`); }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAiResult(data);
    } catch (e: unknown) { setAiError(e instanceof Error ? e.message : "Erreur IA"); }
    setAnalyzing(false);
  };

  const analyzePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setAnalyzing(true); setAiError(""); setAiResult(null); setDescription("Photo analysée par l'IA");
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await fetch("/api/nutrition/analyze", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ type:"photo", image:reader.result }) });
        if (!res.ok) { const t = await res.text(); throw new Error(t || `Erreur ${res.status}`); }
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setAiResult(data);
      } catch (e: unknown) { setAiError(e instanceof Error ? e.message : "Erreur analyse photo"); }
      setAnalyzing(false);
      if (photoRef.current) photoRef.current.value = "";
      if (galleryRef.current) galleryRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const startVoice = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setAiError("Reconnaissance vocale non supportée."); return; }
    const rec = new SR();
    rec.lang = "fr-FR"; rec.continuous = false; rec.interimResults = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (ev: any) => { setDescription(ev.results[0][0].transcript); setListening(false); };
    rec.onerror = () => setListening(false);
    rec.onend   = () => setListening(false);
    recognitionRef.current = rec; rec.start(); setListening(true);
  };
  const stopVoice = () => { recognitionRef.current?.stop(); setListening(false); };

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanError(""); setSearching(true); setSelected(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!("BarcodeDetector" in window)) {
        setScanError("Scan non supporté sur ce navigateur. Tape le code manuellement.");
        setSearching(false); return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"] });
      const bitmap = await createImageBitmap(file);
      const barcodes = await detector.detect(bitmap);
      if (!barcodes.length) { setScanError("Code-barres non détecté. Réessaie."); setSearching(false); return; }
      const code: string = barcodes[0].rawValue;
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
      const data = await res.json();
      if (data.status === 1 && data.product?.nutriments) {
        const p = data.product;
        setSelected({ product_name: p.product_name || code, brands: p.brands, nutriments: p.nutriments });
        setQuery(p.product_name || code);
        setResults([]);
      } else {
        setQuery(code);
        doSearch(code);
      }
    } catch { setScanError("Erreur lors du scan."); }
    setSearching(false);
    if (scanRef.current) scanRef.current.value = "";
  };

  const doSearch = useCallback(async (q: string) => {
    setSearching(true);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&json=1&page_size=8&fields=product_name,brands,nutriments&search_simple=1&action=process&lc=fr`);
      const data = await res.json();
      setResults((data.products as OFFProduct[])?.filter(p => p.product_name && p.nutriments?.["energy-kcal_100g"]) ?? []);
    } catch { setResults([]); }
    setSearching(false);
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(() => doSearch(query), 400);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  const factor   = parseFloat(quantity)/100;
  const computed = selected ? {
    calories:  Math.round((selected.nutriments["energy-kcal_100g"]??0)*factor),
    proteines: Math.round((selected.nutriments.proteins_100g??0)*factor),
    glucides:  Math.round((selected.nutriments.carbohydrates_100g??0)*factor),
    lipides:   Math.round((selected.nutriments.fat_100g??0)*factor),
  } : null;

  const saveMeal = (meal: { name: string; calories: number; proteines: number; glucides: number; lipides: number; base_qty?: number; unit?: string }) => {
    setSavedMeals(s => [...s, { id: Date.now().toString(), ...meal }]);
  };

  const createProduct = () => {
    const base = parseFloat(newProd.base.replace(",", "."));
    if (!newProd.name.trim() || !base || base <= 0) return;
    saveMeal({
      name: newProd.name.trim(),
      calories:  parseFloat(newProd.calories.replace(",", "."))  || 0,
      proteines: parseFloat(newProd.proteines.replace(",", ".")) || 0,
      glucides:  parseFloat(newProd.glucides.replace(",", "."))  || 0,
      lipides:   parseFloat(newProd.lipides.replace(",", "."))   || 0,
      base_qty: base, unit: newProd.unit,
    });
    setShowNewProd(false); setNewProd(emptyProd);
  };

  // Macros du produit sauvegardé, recalculées pour la quantité choisie
  const savedFactor   = selectedSaved?.base_qty ? (parseFloat(savedQty.replace(",", ".")) || 0) / selectedSaved.base_qty : 1;
  const savedComputed = selectedSaved ? {
    calories:  Math.round(selectedSaved.calories  * savedFactor),
    proteines: Math.round(selectedSaved.proteines * savedFactor),
    glucides:  Math.round(selectedSaved.glucides  * savedFactor),
    lipides:   Math.round(selectedSaved.lipides   * savedFactor),
  } : null;

  const addFood = () => {
    if (modalMode === "ai" && aiResult) {
      setFoods(f => [...f, { id:Date.now().toString(), ...aiResult }]);
    } else if (modalMode === "search" && selected && computed) {
      setFoods(f => [...f, { id:Date.now().toString(), name:selected.product_name, ...computed }]);
    } else if (modalMode === "saved" && selectedSaved && savedComputed) {
      setFoods(f => [...f, { id:Date.now().toString(), name:selectedSaved.name, ...savedComputed }]);
    } else return;
    resetModal();
  };

  const resetModal = () => {
    setShowAdd(false); setModalMode("ai");
    setDescription(""); setAiResult(null); setAiError(""); setListening(false);
    setQuery(""); setResults([]); setSelected(null); setQuantity("100"); setSelectedSaved(null);
    setSavedQty("100"); setShowNewProd(false); setNewProd(emptyProd);
  };

  const syncRaw = (g: Goals) => setRawGoal({
    calories:  g.calories.toString(),
    proteines: g.proteines.toString(),
    glucides:  g.glucides.toString(),
    lipides:   g.lipides.toString(),
  });

  const commitCalories = () => {
    const val = parseInt(rawGoal.calories);
    if (isNaN(val) || val <= 0) { syncRaw(goalDraft); return; }
    const next = adjustCalories(goalDraft, val);
    setGoalDraft(next); syncRaw(next);
  };

  const commitMacro = (key: MacroKey) => {
    const val = parseInt(rawGoal[key]);
    if (isNaN(val) || val < 0) { syncRaw(goalDraft); return; }
    const next = adjustMacro(goalDraft, key, val);
    setGoalDraft(next); syncRaw(next);
  };

  const kcalFromMacros = macroKcal(goalDraft);
  const isCoherent     = Math.abs(kcalFromMacros - goalDraft.calories) <= 5;

  const inputCls = "w-full bg-[#0a0a0a] border border-white/10 text-white placeholder-white/20 text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors";
  const labelCls = "text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c] block mb-1.5";
  const tabCls   = (active: boolean, border = true) =>
    `flex-1 py-2 text-[0.6rem] tracking-[0.1em] uppercase transition-colors ${border ? "border-r border-white/10" : ""} ${active ? "bg-[#c9a84c]/10 text-[#c9a84c]" : "text-white/30 hover:text-white/50"}`;

  const daysWithData = fullHistory.filter(d => d.calories > 0);
  const avgCal = daysWithData.length ? Math.round(daysWithData.reduce((s,d) => s+d.calories,0)/daysWithData.length) : 0;

  // Référence calorique : objectif fixe ou TDEE du jour
  const bmrVal    = miniProfile ? bmr(miniProfile, bodyFat) : 0;
  const tdee      = bmrVal > 0 ? bmrVal + tdeeParts.neat + tdeeParts.eat : 0;
  const useTdee   = calRef === "tdee" && tdee > 0;
  const calTarget = useTdee ? tdee : goals.calories;

  return (
    <div className="p-4 sm:p-8 max-w-2xl">

      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[0.7rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-2">Rubrique</p>
          <h1 style={{ fontFamily:"var(--font-bebas)" }} className="text-4xl sm:text-5xl text-white tracking-wide">NUTRITION</h1>
        </div>
        <button onClick={() => { setGoalDraft(goals); syncRaw(goals); setShowGoals(true); }}
          className="text-[0.7rem] tracking-[0.15em] uppercase text-white/30 border border-white/10 px-4 py-2 hover:text-white/60 hover:border-white/20 transition-colors">
          Mes objectifs
        </button>
      </div>

      <DateNav date={selectedDate} onChange={setSelectedDate} />

      {/* Référence du compteur : objectif fixe ou dépense réelle (TDEE) */}
      <div className="flex justify-center mb-5">
        <div className="flex border border-white/10">
          <button onClick={() => setCalRef("objectif")}
            className={`px-4 py-1.5 text-[0.55rem] tracking-[0.15em] uppercase transition-colors ${!useTdee ? "bg-[#c9a84c]/10 text-[#c9a84c]" : "text-white/30 hover:text-white/50"}`}>
            Objectif
          </button>
          <button onClick={() => setCalRef("tdee")} disabled={tdee <= 0}
            title={tdee <= 0 ? "Profil incomplet" : "Dépense totale du jour : métabolisme + activité + sport"}
            className={`px-4 py-1.5 text-[0.55rem] tracking-[0.15em] uppercase border-l border-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${useTdee ? "bg-[#7eb8a0]/10 text-[#7eb8a0]" : "text-white/30 hover:text-white/50"}`}>
            TDEE
          </button>
        </div>
      </div>

      <CalorieRing consumed={totals.calories} goal={calTarget}/>

      {useTdee && (
        <p className="text-center text-[0.5rem] tracking-[0.12em] uppercase text-white/25 mt-4">
          Métabolisme {bmrVal} · Activité {tdeeParts.neat} · Sport {tdeeParts.eat} kcal
        </p>
      )}

      <div className="flex justify-center gap-8 mt-6 mb-8">
        {[{ label: useTdee ? "TDEE" : "Objectif", val:calTarget }, { label:"Consommé", val:totals.calories }, { label:"Restant", val:Math.max(calTarget-totals.calories,0) }].map(s => (
          <div key={s.label} className="text-center">
            <p style={{ fontFamily:"var(--font-bebas)" }} className="text-2xl text-white tracking-wide leading-none">{s.val}</p>
            <p className="text-[0.5rem] tracking-[0.15em] uppercase text-white/25 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="border border-white/10 bg-[#111] p-6 mb-6 flex flex-col gap-5">
        <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-1">Macronutriments</p>
        {macroConfig.map(m => <MacroBar key={m.key} label={m.label} consumed={totals[m.key]} goal={goals[m.key]} color={m.color}/>)}
      </div>

      <WaterTracker water={water} goal={WATER_GOAL}
        onAdd={() => setWater(w => Math.min(w+1, WATER_GOAL))}
        onRemove={() => setWater(w => Math.max(w-1, 0))}/>

      {/* ── Plan de Samuel ── */}
      {mealPlan && (
        <div className="border border-[#c9a84c]/20 bg-[#0f0d07] mb-6">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#c9a84c]/10">
            <div>
              <div className="flex items-center gap-2">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span style={{ fontFamily: "var(--font-bebas)" }} className="text-sm tracking-wider text-[#c9a84c]">Plan de Samuel</span>
              </div>
              <p className="text-[0.5rem] tracking-wider text-[#c9a84c]/50 mt-0.5">{mealPlan.name}</p>
            </div>
            <span className="text-[0.5rem] tracking-wider text-[#c9a84c]/40">{mealPlan.items.length} repas</span>
          </div>
          {["Petit-déjeuner","Déjeuner","Dîner","Collation"].map(type => {
            const typeItems = mealPlan.items.filter(i => i.meal_type === type);
            if (!typeItems.length) return null;
            return (
              <div key={type} className="border-b border-[#c9a84c]/5 last:border-0">
                <p className="px-5 pt-3 pb-1 text-[0.5rem] tracking-wider uppercase text-[#c9a84c]/40">{type}</p>
                {typeItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between px-5 py-2.5 border-b border-white/[0.03] last:border-0">
                    <div>
                      <p className="text-xs text-white/65">{item.name}</p>
                      <div className="flex gap-2 mt-0.5">
                        <span className="text-[0.45rem] text-white/30">{item.calories} kcal</span>
                        <span className="text-[0.45rem] text-[#c9a84c]/50">P {item.proteines}g</span>
                        <span className="text-[0.45rem] text-[#7eb8a0]/50">G {item.glucides}g</span>
                        <span className="text-[0.45rem] text-[#e07070]/50">L {item.lipides}g</span>
                      </div>
                    </div>
                    <button onClick={() => addFoodDirect(item)}
                      className="w-6 h-6 border border-[#c9a84c]/30 text-[#c9a84c] hover:bg-[#c9a84c]/10 transition-colors flex items-center justify-center text-sm shrink-0">
                      +
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
          {mealPlan.notes && (
            <p className="px-5 py-3 text-[0.5rem] text-[#c9a84c]/40 italic border-t border-[#c9a84c]/10">{mealPlan.notes}</p>
          )}
        </div>
      )}

      <button onClick={() => setShowAdd(true)}
        className="w-full border border-[#c9a84c]/30 text-[#c9a84c] text-[0.6rem] tracking-[0.2em] uppercase py-3.5 hover:bg-[#c9a84c]/5 transition-colors mb-6 flex items-center justify-center gap-2">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Ajouter un repas
      </button>

      {/* ── Idée repas ── */}
      <div className="border border-white/10 bg-[#111] mb-6">
        <div className="flex items-start justify-between px-5 py-4 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a7 7 0 017 7c0 4-3 6-3 9H8c0-3-3-5-3-9a7 7 0 017-7z"/>
                <line x1="8" y1="22" x2="16" y2="22"/><line x1="12" y1="18" x2="12" y2="22"/>
              </svg>
              <span style={{ fontFamily:"var(--font-bebas)" }} className="text-sm tracking-wider text-white">Idée repas</span>
            </div>
            {remaining.calories > 0 ? (
              <p className="text-[0.5rem] tracking-wider text-white/25">
                Budget · {remaining.calories} kcal · P {remaining.proteines}g · G {remaining.glucides}g · L {remaining.lipides}g
              </p>
            ) : (
              <p className="text-[0.5rem] tracking-wider text-[#7eb8a0]/60">Objectif calorique atteint</p>
            )}
          </div>
          {remaining.calories > 0 && (
            <button onClick={generateIdeas} disabled={ideaLoading}
              className="shrink-0 border border-[#c9a84c]/30 text-[#c9a84c] text-[0.7rem] tracking-[0.15em] uppercase px-3.5 py-2 hover:bg-[#c9a84c]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5">
              {ideaLoading
                ? <><div className="w-2.5 h-2.5 border border-[#c9a84c] border-t-transparent rounded-full animate-spin"/>Génération…</>
                : "Générer →"}
            </button>
          )}
        </div>

        {ideaError && (
          <p className="px-5 py-3 text-[0.7rem] text-[#e07070]">{ideaError}</p>
        )}

        {!ideaLoading && ideas.length === 0 && !ideaError && remaining.calories > 0 && (
          <p className="px-5 py-4 text-[0.6rem] tracking-wider text-white/20 uppercase">
            Clique sur &ldquo;Générer&rdquo; pour des idées adaptées à ton budget
          </p>
        )}

        {ideas.length > 0 && (
          <div className="divide-y divide-white/5">
            {ideas.map((idea, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-4">
                <div className="flex-1">
                  <p className="text-xs text-white/70 mb-0.5">{idea.name}</p>
                  <p className="text-[0.5rem] text-white/30 leading-relaxed mb-2">{idea.description}</p>
                  <div className="flex gap-3">
                    <span className="text-[0.5rem] text-white/40">{idea.calories} kcal</span>
                    <span className="text-[0.5rem] text-[#c9a84c]/70">P {idea.proteines}g</span>
                    <span className="text-[0.5rem] text-[#7eb8a0]/70">G {idea.glucides}g</span>
                    <span className="text-[0.5rem] text-[#e07070]/70">L {idea.lipides}g</span>
                  </div>
                </div>
                <button onClick={() => addFoodDirect(idea)}
                  className="shrink-0 w-7 h-7 border border-[#c9a84c]/30 text-[#c9a84c] hover:bg-[#c9a84c]/10 transition-colors flex items-center justify-center text-sm">
                  +
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Aliments du jour ── */}
      <div className="border border-white/10 bg-[#111] mb-6">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
          <span style={{ fontFamily:"var(--font-bebas)" }} className="text-sm tracking-wider text-white">
            {selectedDate === realToday ? "Aliments du jour" : `Aliments · ${new Date(selectedDate + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`}
          </span>
          <span className="text-[0.7rem] tracking-wider text-white/30">{totals.calories} kcal</span>
        </div>
        {foods.length === 0
          ? <p className="px-5 py-4 text-[0.6rem] tracking-wider text-white/20 uppercase">Aucun aliment ajouté</p>
          : foods.map(f => (
            <div key={f.id} className="flex items-center justify-between px-5 py-3 border-b border-white/5 last:border-0 group">
              <div>
                <p className="text-xs text-white/70">{f.name}</p>
                <p className="text-[0.7rem] text-white/25 mt-0.5">P {f.proteines}g · G {f.glucides}g · L {f.lipides}g</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/50">{f.calories} kcal</span>
                <button onClick={() => setFoods(fs => fs.filter(x => x.id !== f.id))}
                  className="text-white/20 hover:text-[#e07070] transition-colors opacity-0 group-hover:opacity-100">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          ))
        }
      </div>

      {/* ── Week history ── */}
      <div className="border border-white/10 bg-[#111] p-5 mt-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c]">Cette semaine</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#c9a84c]"/><span className="text-[0.45rem] text-white/25">Objectif</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#e07070]"/><span className="text-[0.45rem] text-white/25">Excédent</span></div>
          </div>
        </div>
        <WeekChart history={fullHistory} goal={goals.calories}/>
        <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-4 text-center">
          {[
            { label:"Moyenne / jour", val: avgCal ? `${avgCal} kcal` : "—" },
            { label:"Jours suivis",   val: daysWithData.length },
            { label:"Objectif",       val: `${goals.calories} kcal` },
          ].map(s => (
            <div key={s.label}>
              <p style={{ fontFamily:"var(--font-bebas)" }} className="text-lg text-white tracking-wide">{s.val}</p>
              <p className="text-[0.45rem] tracking-wider text-white/25 uppercase mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══ ADD FOOD MODAL ══ */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center px-4" onClick={resetModal}>
          <div className="bg-[#0f0f0f] border border-white/10 w-full max-w-lg h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
              <h3 style={{ fontFamily:"var(--font-bebas)" }} className="text-xl tracking-wider text-white">Ajouter un repas</h3>
              <button onClick={resetModal} className="text-white/30 hover:text-white/60 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-5">

              {/* Mode tabs */}
              <div className="flex border border-white/10">
                <button onClick={() => { setModalMode("ai"); setSelectedSaved(null); }} className={tabCls(modalMode==="ai")}>Estimation IA</button>
                <button onClick={() => { setModalMode("search"); setSelectedSaved(null); }} className={tabCls(modalMode==="search")}>Recherche</button>
                <button onClick={() => { setModalMode("saved"); setSelectedSaved(null); }} className={tabCls(modalMode==="saved", false)}>
                  Mes repas{savedMeals.length > 0 && <span className="ml-1 opacity-50">({savedMeals.length})</span>}
                </button>
              </div>

              {/* ── AI MODE ── */}
              {modalMode === "ai" && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className={labelCls}>Décris ton repas</label>
                    <div className="relative">
                      <textarea
                        className="w-full bg-[#0a0a0a] border border-white/10 text-white placeholder-white/20 text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/40 transition-colors resize-none pr-12"
                        rows={3} placeholder="Ex : un bowl de riz avec du saumon grillé et des brocolis…"
                        value={description} onChange={e => { setDescription(e.target.value); setAiResult(null); }}/>
                      <button onClick={listening ? stopVoice : startVoice}
                        className={`absolute right-3 top-3 p-1.5 border transition-colors ${listening?"border-[#e07070] text-[#e07070] animate-pulse":"border-white/10 text-white/30 hover:text-white/60 hover:border-white/20"}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                          <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>
                        </svg>
                      </button>
                    </div>
                    <p className="text-[0.5rem] text-white/20 mt-1">Tu peux aussi dicter en cliquant sur le micro</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => photoRef.current?.click()} disabled={analyzing}
                      className="flex items-center justify-center gap-2 border border-white/10 text-white/40 text-[0.6rem] tracking-[0.1em] uppercase py-2.5 hover:border-white/20 hover:text-white/60 transition-colors disabled:opacity-40">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
                      </svg>
                      Prendre une photo
                    </button>
                    <button onClick={() => galleryRef.current?.click()} disabled={analyzing}
                      className="flex items-center justify-center gap-2 border border-white/10 text-white/40 text-[0.6rem] tracking-[0.1em] uppercase py-2.5 hover:border-white/20 hover:text-white/60 transition-colors disabled:opacity-40">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                      </svg>
                      Choisir une photo
                    </button>
                  </div>
                  <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={analyzePhoto}/>
                  <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={analyzePhoto}/>

                  {!aiResult && (
                    <button onClick={analyzeText} disabled={analyzing || !description.trim()}
                      className="bg-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.2em] uppercase py-3.5 hover:bg-[#e2c97e] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {analyzing ? <><div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"/>Analyse en cours…</> : "Estimer les macros avec l'IA →"}
                    </button>
                  )}

                  {aiError && <p className="text-xs text-[#e07070] border border-[#e07070]/20 bg-[#e07070]/5 px-3 py-2">{aiError}</p>}

                  {aiResult && (
                    <div className="flex flex-col gap-4">
                      <div className="border border-[#c9a84c]/20 bg-[#c9a84c]/5 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[0.7rem] tracking-[0.15em] uppercase text-[#c9a84c]">Estimation IA</p>
                          <button onClick={() => setAiResult(null)} className="text-[0.5rem] tracking-wider uppercase text-white/25 hover:text-white/50 transition-colors">Réestimer</button>
                        </div>
                        <p className="text-xs text-white/70 mb-3">{aiResult.name}</p>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { label:"Calories",  val:aiResult.calories,  unit:"kcal", color:"text-white/60" },
                            { label:"Protéines", val:aiResult.proteines, unit:"g",    color:"text-[#c9a84c]" },
                            { label:"Glucides",  val:aiResult.glucides,  unit:"g",    color:"text-[#7eb8a0]" },
                            { label:"Lipides",   val:aiResult.lipides,   unit:"g",    color:"text-[#e07070]" },
                          ].map(s => (
                            <div key={s.label} className="text-center bg-[#0a0a0a] border border-white/10 py-3">
                              <p style={{ fontFamily:"var(--font-bebas)" }} className={`text-xl tracking-wide ${s.color}`}>{s.val}</p>
                              <p className="text-[0.45rem] tracking-wider text-white/20 uppercase mt-0.5">{s.unit}</p>
                              <p className="text-[0.45rem] text-white/15 mt-0.5">{s.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[0.5rem] tracking-wider uppercase text-white/20 mb-2">Ajuster si nécessaire</p>
                        <div className="grid grid-cols-5 gap-2">
                          <div><label className={labelCls}>Nom</label><input className={inputCls} value={aiResult.name} onChange={e => setAiResult(r => r ? {...r, name:e.target.value} : r)}/></div>
                          <div><label className={labelCls}>Cal</label><input className={inputCls} type="number" value={aiResult.calories} onChange={e => setAiResult(r => r ? {...r, calories:+e.target.value} : r)}/></div>
                          <div><label className={labelCls} style={{ color:"#c9a84c" }}>Prot</label><input className={inputCls} type="number" value={aiResult.proteines} onChange={e => setAiResult(r => r ? {...r, proteines:+e.target.value} : r)}/></div>
                          <div><label className={labelCls} style={{ color:"#7eb8a0" }}>Gluc</label><input className={inputCls} type="number" value={aiResult.glucides} onChange={e => setAiResult(r => r ? {...r, glucides:+e.target.value} : r)}/></div>
                          <div><label className={labelCls} style={{ color:"#e07070" }}>Lip</label><input className={inputCls} type="number" value={aiResult.lipides} onChange={e => setAiResult(r => r ? {...r, lipides:+e.target.value} : r)}/></div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => saveMeal(aiResult)} disabled={savedMeals.some(s => s.name === aiResult.name)}
                          className="flex-1 border border-white/10 text-white/40 text-[0.7rem] tracking-[0.15em] uppercase py-2.5 hover:border-white/20 hover:text-white/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                          {savedMeals.some(s => s.name === aiResult.name) ? "Déjà sauvegardé" : "Sauvegarder"}
                        </button>
                        <button onClick={addFood} className="flex-1 bg-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.2em] uppercase py-2.5 hover:bg-[#e2c97e] transition-colors">
                          Ajouter au journal →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── SEARCH MODE ── */}
              {modalMode === "search" && (
                <div className="flex flex-col gap-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input className="w-full bg-[#0a0a0a] border border-white/10 text-white placeholder-white/20 text-sm pl-4 pr-10 py-3 focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
                        placeholder="Rechercher un aliment…" value={query} onChange={e => { setQuery(e.target.value); setSelected(null); setScanError(""); }} autoFocus/>
                      {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="w-3 h-3 border border-[#c9a84c] border-t-transparent rounded-full animate-spin"/></div>}
                    </div>
                    <button onClick={() => scanRef.current?.click()} title="Scanner un code-barres"
                      className="border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-colors px-3 flex items-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 5h2M3 5v2M21 5h-2M21 5v2M3 19h2M3 19v-2M21 19h-2M21 19v-2"/>
                        <line x1="7" y1="8" x2="7" y2="16"/><line x1="10" y1="8" x2="10" y2="16"/>
                        <line x1="13" y1="8" x2="13" y2="16"/><line x1="16" y1="8" x2="16" y2="11"/>
                        <line x1="16" y1="13" x2="16" y2="16"/>
                      </svg>
                    </button>
                    <input ref={scanRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScan}/>
                  </div>
                  {scanError && <p className="text-[0.7rem] text-[#e07070]">{scanError}</p>}

                  {results.length > 0 && !selected && (
                    <div className="flex flex-col border border-white/10 divide-y divide-white/5">
                      {results.map((p,i) => (
                        <button key={i} onClick={() => { setSelected(p); setResults([]); }}
                          className="flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.03] transition-colors">
                          <div>
                            <p className="text-xs text-white/70">{p.product_name}</p>
                            {p.brands && <p className="text-[0.7rem] text-white/25 mt-0.5">{p.brands}</p>}
                          </div>
                          <span className="text-[0.7rem] text-white/30 shrink-0 ml-4">{Math.round(p.nutriments["energy-kcal_100g"]??0)} kcal/100g</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {selected && computed && (
                    <div className="border border-[#c9a84c]/20 bg-[#c9a84c]/5 p-4 flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-white/70">{selected.product_name}</p>
                          {selected.brands && <p className="text-[0.7rem] text-white/30 mt-0.5">{selected.brands}</p>}
                        </div>
                        <button onClick={() => { setSelected(null); setQuery(""); }} className="text-[0.7rem] tracking-wider uppercase text-white/25 hover:text-white/50 transition-colors">Changer</button>
                      </div>
                      <div><label className={labelCls}>Quantité (g)</label><input className={inputCls} type="number" value={quantity} onChange={e => setQuantity(e.target.value)}/></div>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label:"Calories",  val:computed.calories,  color:"text-white/60" },
                          { label:"Protéines", val:computed.proteines, color:"text-[#c9a84c]" },
                          { label:"Glucides",  val:computed.glucides,  color:"text-[#7eb8a0]" },
                          { label:"Lipides",   val:computed.lipides,   color:"text-[#e07070]" },
                        ].map(s => (
                          <div key={s.label} className="text-center bg-[#0a0a0a] border border-white/10 py-3">
                            <p style={{ fontFamily:"var(--font-bebas)" }} className={`text-xl tracking-wide ${s.color}`}>{s.val}</p>
                            <p className="text-[0.45rem] text-white/20 mt-0.5">{s.label}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => saveMeal({
                            name: selected.product_name,
                            calories:  selected.nutriments["energy-kcal_100g"] ?? 0,
                            proteines: selected.nutriments.proteins_100g ?? 0,
                            glucides:  selected.nutriments.carbohydrates_100g ?? 0,
                            lipides:   selected.nutriments.fat_100g ?? 0,
                            base_qty: 100, unit: "g",
                          })} disabled={savedMeals.some(s => s.name === selected.product_name)}
                          className="flex-1 border border-white/10 text-white/40 text-[0.7rem] tracking-[0.15em] uppercase py-2.5 hover:border-white/20 hover:text-white/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                          {savedMeals.some(s => s.name === selected.product_name) ? "Déjà sauvegardé" : "Sauvegarder"}
                        </button>
                        <button onClick={addFood} className="flex-1 bg-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.2em] uppercase py-2.5 hover:bg-[#e2c97e] transition-colors">
                          Ajouter au journal →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── SAVED MEALS MODE ── */}
              {modalMode === "saved" && (
                <div className="flex flex-col gap-4">

                  {/* Créer un produit avec macros pour une quantité de base */}
                  {!showNewProd ? (
                    <button onClick={() => { setShowNewProd(true); setSelectedSaved(null); }}
                      className="border border-dashed border-white/15 text-white/35 text-[0.6rem] tracking-[0.12em] uppercase py-2.5 hover:border-[#c9a84c]/40 hover:text-[#c9a84c]/70 transition-colors">
                      + Créer un produit
                    </button>
                  ) : (
                    <div className="border border-[#c9a84c]/20 bg-[#0f0d07] p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c]">Nouveau produit</p>
                        <button onClick={() => { setShowNewProd(false); setNewProd(emptyProd); }} className="text-white/25 hover:text-white/50 transition-colors">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                      <div><label className={labelCls}>Nom</label><input className={inputCls} placeholder="Skyr nature, boisson protéinée…" value={newProd.name} onChange={e => setNewProd(p => ({ ...p, name: e.target.value }))}/></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className={labelCls}>Quantité de base</label><input className={inputCls} type="number" placeholder="100" value={newProd.base} onChange={e => setNewProd(p => ({ ...p, base: e.target.value }))}/></div>
                        <div>
                          <label className={labelCls}>Unité</label>
                          <div className="flex gap-2">
                            {["g", "ml"].map(u => (
                              <button key={u} onClick={() => setNewProd(p => ({ ...p, unit: u }))}
                                className={`flex-1 py-2.5 text-xs border transition-all ${newProd.unit === u ? "border-[#c9a84c] text-[#c9a84c] bg-[#c9a84c]/5" : "border-white/10 text-white/30 hover:border-white/20"}`}>
                                {u}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-[0.5rem] text-white/25">Macros pour {newProd.base || "?"} {newProd.unit} :</p>
                      <div className="grid grid-cols-4 gap-2">
                        {([
                          { key: "calories",  label: "Kcal", color: "text-white/40" },
                          { key: "proteines", label: "Prot", color: "text-[#c9a84c]" },
                          { key: "glucides",  label: "Gluc", color: "text-[#7eb8a0]" },
                          { key: "lipides",   label: "Lip",  color: "text-[#e07070]" },
                        ] as const).map(({ key, label, color }) => (
                          <div key={key}>
                            <label className={`text-[0.48rem] tracking-wider uppercase block mb-1 ${color}`}>{label}</label>
                            <input className={inputCls} type="number" inputMode="decimal" placeholder="0" value={newProd[key]} onChange={e => setNewProd(p => ({ ...p, [key]: e.target.value }))}/>
                          </div>
                        ))}
                      </div>
                      <button onClick={createProduct} disabled={!newProd.name.trim() || !(parseFloat(newProd.base.replace(",", ".")) > 0)}
                        className="bg-[#c9a84c] text-black text-[0.58rem] font-bold tracking-[0.18em] uppercase py-2.5 hover:bg-[#e2c97e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        Enregistrer le produit →
                      </button>
                    </div>
                  )}

                  {savedMeals.length === 0 && !showNewProd ? (
                    <div className="text-center py-10 border border-white/5">
                      <p className="text-white/20 text-xs mb-1">Aucun repas sauvegardé</p>
                      <p className="text-white/10 text-[0.7rem]">Crée un produit ci-dessus, ou utilise l&apos;IA / la recherche et clique sur &quot;Sauvegarder&quot;</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {savedMeals.map(meal => (
                        <div key={meal.id} onClick={() => { setShowNewProd(false); setSelectedSaved(s => s?.id === meal.id ? null : meal); setSavedQty(String(meal.base_qty ?? "")); }}
                          className={`flex items-center justify-between px-4 py-3 border cursor-pointer transition-all ${selectedSaved?.id === meal.id ? "border-[#c9a84c] bg-[#c9a84c]/5" : "border-white/10 hover:border-white/20"}`}>
                          <div>
                            <p className="text-xs text-white/70">{meal.name}</p>
                            <p className="text-[0.5rem] text-white/25 mt-0.5">
                              {meal.base_qty ? `Pour ${meal.base_qty} ${meal.unit ?? "g"} · ` : ""}P {Math.round(meal.proteines)}g · G {Math.round(meal.glucides)}g · L {Math.round(meal.lipides)}g
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-white/40">{Math.round(meal.calories)} kcal</span>
                            <button onClick={e => { e.stopPropagation(); setSavedMeals(s => s.filter(m => m.id !== meal.id)); if (selectedSaved?.id === meal.id) setSelectedSaved(null); }}
                              className="text-white/15 hover:text-[#e07070] transition-colors">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quantité + macros recalculées pour les produits à quantité de base */}
                  {selectedSaved?.base_qty && savedComputed && (
                    <div className="border border-[#c9a84c]/20 bg-[#c9a84c]/5 p-4 flex flex-col gap-4">
                      <div><label className={labelCls}>Quantité ({selectedSaved.unit ?? "g"})</label>
                        <input className={inputCls} type="number" inputMode="decimal" value={savedQty} onChange={e => setSavedQty(e.target.value)}/>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label:"Calories",  val:savedComputed.calories,  color:"text-white/60" },
                          { label:"Protéines", val:savedComputed.proteines, color:"text-[#c9a84c]" },
                          { label:"Glucides",  val:savedComputed.glucides,  color:"text-[#7eb8a0]" },
                          { label:"Lipides",   val:savedComputed.lipides,   color:"text-[#e07070]" },
                        ].map(s => (
                          <div key={s.label} className="text-center bg-[#0a0a0a] border border-white/10 py-3">
                            <p style={{ fontFamily:"var(--font-bebas)" }} className={`text-xl tracking-wide ${s.color}`}>{s.val}</p>
                            <p className="text-[0.45rem] text-white/20 mt-0.5">{s.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedSaved && (
                    <button onClick={addFood} className="bg-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.2em] uppercase py-3.5 hover:bg-[#e2c97e] transition-colors">
                      Ajouter &quot;{selectedSaved.name}&quot;{selectedSaved.base_qty ? ` (${savedQty || 0} ${selectedSaved.unit ?? "g"})` : ""} au journal →
                    </button>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ══ GOALS MODAL ══ */}
      {showGoals && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-end justify-center" onClick={() => setShowGoals(false)}>
          <div className="bg-[#0f0f0f] border border-white/10 w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 style={{ fontFamily:"var(--font-bebas)" }} className="text-xl tracking-wider text-white">Objectifs journaliers</h3>
              <button onClick={() => setShowGoals(false)} className="text-white/30 hover:text-white/60 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className={`flex items-center gap-2 mb-5 px-3 py-2 border text-[0.6rem] tracking-wider ${isCoherent?"border-[#7eb8a0]/30 text-[#7eb8a0] bg-[#7eb8a0]/5":"border-[#e07070]/30 text-[#e07070] bg-[#e07070]/5"}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isCoherent?"bg-[#7eb8a0]":"bg-[#e07070]"}`}/>
              {isCoherent ? `Cohérent — macros = ${kcalFromMacros} kcal` : `Incohérent — macros = ${kcalFromMacros} kcal · cible = ${goalDraft.calories} kcal`}
            </div>
            <div className="mb-5">
              <label className={labelCls}>Calories totales (kcal)</label>
              <input className={inputCls} type="number" value={rawGoal.calories}
                onChange={e => setRawGoal(r => ({ ...r, calories: e.target.value }))}
                onBlur={commitCalories}
                onKeyDown={e => { if (e.key === "Enter") commitCalories(); }}/>
              <p className="text-[0.5rem] text-white/20 mt-1">Modifier les calories redistribue les macros proportionnellement</p>
            </div>
            <div className="flex flex-col gap-4 mb-5">
              {macroConfig.map(({ key, label, color }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[0.7rem] tracking-[0.2em] uppercase block" style={{ color }}>{label} (g)</label>
                    <span className="text-[0.5rem] text-white/20">{Math.round(goalDraft[key]*CAL[key])} kcal</span>
                  </div>
                  <input className={inputCls} type="number" value={rawGoal[key]}
                    onChange={e => setRawGoal(r => ({ ...r, [key]: e.target.value }))}
                    onBlur={() => commitMacro(key)}
                    onKeyDown={e => { if (e.key === "Enter") commitMacro(key); }}/>
                  <p className="text-[0.5rem] text-white/15 mt-1">Les autres macros s&apos;ajustent pour rester à {goalDraft.calories} kcal</p>
                </div>
              ))}
            </div>
            <button onClick={() => { setGoals(goalDraft); setShowGoals(false); }}
              className="w-full bg-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.2em] uppercase py-3.5 hover:bg-[#e2c97e] transition-colors">
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
