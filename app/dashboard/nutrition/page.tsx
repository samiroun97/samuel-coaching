"use client";
import { useState, useEffect, useRef, useCallback } from "react";

type Repas = "matin" | "midi" | "soir" | "snack";
type Food  = { id: string; name: string; calories: number; proteines: number; glucides: number; lipides: number; repas: Repas };
type Goals = { calories: number; proteines: number; glucides: number; lipides: number };
type MacroKey = "proteines" | "glucides" | "lipides";
type AIResult = { name: string; calories: number; proteines: number; glucides: number; lipides: number };
type OFFProduct = { product_name: string; brands?: string; nutriments: { "energy-kcal_100g"?: number; proteins_100g?: number; carbohydrates_100g?: number; fat_100g?: number } };

const CAL: Record<MacroKey, number> = { proteines: 4, glucides: 4, lipides: 9 };
const defaultGoals: Goals = { calories: 2200, proteines: 150, glucides: 220, lipides: 70 };
const macroConfig: { key: MacroKey; label: string; color: string }[] = [
  { key: "proteines", label: "Protéines", color: "#c9a84c" },
  { key: "glucides",  label: "Glucides",  color: "#7eb8a0" },
  { key: "lipides",   label: "Lipides",   color: "#e07070" },
];
const meals: { key: Repas; label: string }[] = [
  { key: "matin", label: "Petit-déjeuner" },
  { key: "midi",  label: "Déjeuner" },
  { key: "soir",  label: "Dîner" },
  { key: "snack", label: "Collation" },
];

function macroKcal(g: Goals) { return Math.round(g.proteines*4 + g.glucides*4 + g.lipides*9); }
function adjustCalories(draft: Goals, newCal: number, locked: Set<MacroKey>): Goals {
  newCal = Math.max(0, Math.round(newCal));
  const lockedKcal = Array.from(locked).reduce((s,k) => s + draft[k]*CAL[k], 0);
  const available  = Math.max(0, newCal - lockedKcal);
  const unlocked   = (["proteines","glucides","lipides"] as MacroKey[]).filter(k => !locked.has(k));
  const curKcal    = unlocked.reduce((s,k) => s + draft[k]*CAL[k], 0);
  const out = { ...draft, calories: newCal };
  if (curKcal > 0) unlocked.forEach(k => { out[k] = Math.max(0, Math.round((available * (draft[k]*CAL[k]/curKcal)) / CAL[k])); });
  return out;
}
function adjustMacro(draft: Goals, key: MacroKey, grams: number): Goals {
  const out = { ...draft, [key]: Math.max(0, Math.round(grams)) };
  out.calories = macroKcal(out);
  return out;
}

/* ─── sub-components ─── */
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
      <div className="h-1.5 bg-white/5 w-full">
        <div className="h-full transition-all duration-700 rounded-full" style={{ width:`${pct}%`, backgroundColor:color }}/>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════ MAIN PAGE ══════════════════════════════════════════ */
export default function NutritionPage() {
  const today = new Date().toISOString().split("T")[0];
  const [goals,     setGoals]     = useState<Goals>(defaultGoals);
  const [foods,     setFoods]     = useState<Food[]>([]);
  const [showAdd,   setShowAdd]   = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [goalDraft, setGoalDraft] = useState<Goals>(defaultGoals);
  const [locked,    setLocked]    = useState<Set<MacroKey>>(new Set());

  /* modal mode: "ai" | "search" */
  const [modalMode, setModalMode] = useState<"ai"|"search">("ai");

  /* AI mode state */
  const [repas,       setRepas]       = useState<Repas>("matin");
  const [description, setDescription] = useState("");
  const [aiResult,    setAiResult]    = useState<AIResult | null>(null);
  const [analyzing,   setAnalyzing]   = useState(false);
  const [aiError,     setAiError]     = useState("");
  const [listening,   setListening]   = useState(false);
  const photoRef       = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<{ start(): void; stop(): void } | null>(null);

  /* search mode state */
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState<OFFProduct[]>([]);
  const [searching,setSearching]= useState(false);
  const [selected, setSelected] = useState<OFFProduct|null>(null);
  const [quantity, setQuantity] = useState("100");

  /* persistence */
  useEffect(() => {
    const g = localStorage.getItem("nutrition_goals");
    const f = localStorage.getItem(`nutrition_${today}`);
    if (g) setGoals(JSON.parse(g));
    if (f) setFoods(JSON.parse(f));
  }, [today]);
  useEffect(() => { localStorage.setItem("nutrition_goals", JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem(`nutrition_${today}`, JSON.stringify(foods)); }, [foods, today]);

  const totals = foods.reduce((acc,f) => ({
    calories:  acc.calories  + f.calories,
    proteines: acc.proteines + f.proteines,
    glucides:  acc.glucides  + f.glucides,
    lipides:   acc.lipides   + f.lipides,
  }), { calories:0, proteines:0, glucides:0, lipides:0 });

  /* ─── AI analysis ─── */
  const analyzeText = async () => {
    if (!description.trim()) return;
    setAnalyzing(true); setAiError(""); setAiResult(null);
    try {
      const res = await fetch("/api/nutrition/analyze", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ type:"text", text:description }),
      });
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
        const res = await fetch("/api/nutrition/analyze", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ type:"photo", image:reader.result }),
        });
        if (!res.ok) { const t = await res.text(); throw new Error(t || `Erreur ${res.status}`); }
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setAiResult(data);
      } catch (e: unknown) { setAiError(e instanceof Error ? e.message : "Erreur analyse photo"); }
      setAnalyzing(false);
      if (photoRef.current) photoRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  /* ─── voice ─── */
  const startVoice = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setAiError("Reconnaissance vocale non supportée."); return; }
    const rec = new SR();
    rec.lang = "fr-FR"; rec.continuous = false; rec.interimResults = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (ev: any) => { setDescription(ev.results[0][0].transcript); setListening(false); };
    rec.onerror  = () => setListening(false);
    rec.onend    = () => setListening(false);
    recognitionRef.current = rec; rec.start(); setListening(true);
  };
  const stopVoice = () => { recognitionRef.current?.stop(); setListening(false); };

  /* ─── search (Open Food Facts) ─── */
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

  /* ─── add food ─── */
  const addFood = () => {
    if (modalMode === "ai" && aiResult) {
      setFoods(f => [...f, { id:Date.now().toString(), repas, ...aiResult }]);
    } else if (modalMode === "search" && selected && computed) {
      setFoods(f => [...f, { id:Date.now().toString(), repas, name:selected.product_name, ...computed }]);
    } else return;
    resetModal();
  };

  const resetModal = () => {
    setShowAdd(false); setModalMode("ai");
    setDescription(""); setAiResult(null); setAiError(""); setListening(false);
    setQuery(""); setResults([]); setSelected(null); setQuantity("100");
  };

  /* goals */
  const kcalFromMacros = macroKcal(goalDraft);
  const isCoherent     = Math.abs(kcalFromMacros - goalDraft.calories) <= 5;
  const toggleLock     = (k: MacroKey) => setLocked(s => { const n=new Set(s); n.has(k)?n.delete(k):n.add(k); return n; });

  const inputCls = "w-full bg-[#0a0a0a] border border-white/10 text-white placeholder-white/20 text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors";
  const labelCls = "text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] block mb-1.5";

  return (
    <div className="p-8 max-w-2xl">

      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-[0.55rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-2">Rubrique</p>
          <h1 style={{ fontFamily:"var(--font-bebas)" }} className="text-5xl text-white tracking-wide">NUTRITION</h1>
          <p className="text-white/30 text-xs mt-1 capitalize">
            {new Date().toLocaleDateString("fr-FR",{ weekday:"long", day:"numeric", month:"long" })}
          </p>
        </div>
        <button onClick={() => { setGoalDraft(goals); setLocked(new Set()); setShowGoals(true); }}
          className="text-[0.55rem] tracking-[0.15em] uppercase text-white/30 border border-white/10 px-4 py-2 hover:text-white/60 hover:border-white/20 transition-colors">
          Mes objectifs
        </button>
      </div>

      <CalorieRing consumed={totals.calories} goal={goals.calories}/>

      <div className="flex justify-center gap-8 mt-6 mb-8">
        {[{ label:"Objectif", val:goals.calories }, { label:"Consommé", val:totals.calories }, { label:"Restant", val:Math.max(goals.calories-totals.calories,0) }].map(s => (
          <div key={s.label} className="text-center">
            <p style={{ fontFamily:"var(--font-bebas)" }} className="text-2xl text-white tracking-wide leading-none">{s.val}</p>
            <p className="text-[0.5rem] tracking-[0.15em] uppercase text-white/25 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="border border-white/10 bg-[#111] p-6 mb-6 flex flex-col gap-5">
        <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-1">Macronutriments</p>
        {macroConfig.map(m => <MacroBar key={m.key} label={m.label} consumed={totals[m.key]} goal={goals[m.key]} color={m.color}/>)}
      </div>

      <button onClick={() => setShowAdd(true)}
        className="w-full border border-[#c9a84c]/30 text-[#c9a84c] text-[0.6rem] tracking-[0.2em] uppercase py-3.5 hover:bg-[#c9a84c]/5 transition-colors mb-6 flex items-center justify-center gap-2">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Ajouter un repas
      </button>

      {meals.map(({ key, label }) => {
        const mf  = foods.filter(f => f.repas === key);
        const cal = mf.reduce((s,f) => s+f.calories, 0);
        return (
          <div key={key} className="border border-white/10 bg-[#111] mb-3">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
              <span style={{ fontFamily:"var(--font-bebas)" }} className="text-sm tracking-wider text-white">{label}</span>
              <span className="text-[0.55rem] tracking-wider text-white/30">{cal} kcal</span>
            </div>
            {mf.length === 0
              ? <p className="px-5 py-4 text-[0.6rem] tracking-wider text-white/20 uppercase">Aucun aliment ajouté</p>
              : mf.map(f => (
                <div key={f.id} className="flex items-center justify-between px-5 py-3 border-b border-white/5 last:border-0 group">
                  <div>
                    <p className="text-xs text-white/70">{f.name}</p>
                    <p className="text-[0.55rem] text-white/25 mt-0.5">P {f.proteines}g · G {f.glucides}g · L {f.lipides}g</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/50">{f.calories} kcal</span>
                    <button onClick={() => setFoods(fs => fs.filter(x => x.id !== f.id))}
                      className="text-white/10 hover:text-[#e07070] transition-colors opacity-0 group-hover:opacity-100">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        );
      })}

      {/* ══ ADD FOOD MODAL ══ */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center px-4" onClick={resetModal}>
          <div className="bg-[#0f0f0f] border border-white/10 w-full max-w-lg h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
              <h3 style={{ fontFamily:"var(--font-bebas)" }} className="text-xl tracking-wider text-white">Ajouter un repas</h3>
              <button onClick={resetModal} className="text-white/30 hover:text-white/60 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-5">

              {/* Repas selector */}
              <div className="flex gap-2 flex-wrap">
                {meals.map(m => (
                  <button key={m.key} type="button" onClick={() => setRepas(m.key)}
                    className={`px-3 py-1.5 text-[0.6rem] tracking-[0.1em] uppercase border transition-all ${repas===m.key?"border-[#c9a84c] text-[#c9a84c] bg-[#c9a84c]/10":"border-white/10 text-white/40 hover:border-white/30"}`}>
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Mode tabs */}
              <div className="flex border border-white/10">
                <button onClick={() => setModalMode("ai")}
                  className={`flex-1 py-2 text-[0.6rem] tracking-[0.1em] uppercase transition-colors ${modalMode==="ai"?"bg-[#c9a84c]/10 text-[#c9a84c] border-r border-[#c9a84c]/20":"text-white/30 hover:text-white/50 border-r border-white/10"}`}>
                  Estimation IA
                </button>
                <button onClick={() => setModalMode("search")}
                  className={`flex-1 py-2 text-[0.6rem] tracking-[0.1em] uppercase transition-colors ${modalMode==="search"?"bg-[#c9a84c]/10 text-[#c9a84c]":"text-white/30 hover:text-white/50"}`}>
                  Recherche aliment
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
                        rows={3}
                        placeholder="Ex : un bowl de riz avec du saumon grillé et des brocolis…"
                        value={description}
                        onChange={e => { setDescription(e.target.value); setAiResult(null); }}
                      />
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

                  {/* Photo button */}
                  <button onClick={() => photoRef.current?.click()} disabled={analyzing}
                    className="flex items-center justify-center gap-2 border border-white/10 text-white/40 text-[0.6rem] tracking-[0.1em] uppercase py-2.5 hover:border-white/20 hover:text-white/60 transition-colors disabled:opacity-40">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    Prendre une photo du plat
                  </button>
                  <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={analyzePhoto}/>

                  {/* Analyze button */}
                  {!aiResult && (
                    <button onClick={analyzeText} disabled={analyzing || !description.trim()}
                      className="bg-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.2em] uppercase py-3.5 hover:bg-[#e2c97e] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {analyzing
                        ? <><div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"/>Analyse en cours…</>
                        : "Estimer les macros avec l'IA →"
                      }
                    </button>
                  )}

                  {aiError && <p className="text-xs text-[#e07070] border border-[#e07070]/20 bg-[#e07070]/5 px-3 py-2">{aiError}</p>}

                  {/* AI Result */}
                  {aiResult && (
                    <div className="flex flex-col gap-4">
                      <div className="border border-[#c9a84c]/20 bg-[#c9a84c]/5 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[0.55rem] tracking-[0.15em] uppercase text-[#c9a84c]">Estimation IA</p>
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

                      {/* Editable override */}
                      <div>
                        <p className="text-[0.5rem] tracking-wider uppercase text-white/20 mb-2">Ajuster si nécessaire</p>
                        <div className="grid grid-cols-5 gap-2">
                          <div>
                            <label className={labelCls}>Nom</label>
                            <input className={inputCls} value={aiResult.name} onChange={e => setAiResult(r => r ? {...r, name:e.target.value} : r)}/>
                          </div>
                          <div>
                            <label className={labelCls}>Cal</label>
                            <input className={inputCls} type="number" value={aiResult.calories} onChange={e => setAiResult(r => r ? {...r, calories:+e.target.value} : r)}/>
                          </div>
                          <div>
                            <label className={`${labelCls}`} style={{ color:"#c9a84c" }}>Prot</label>
                            <input className={inputCls} type="number" value={aiResult.proteines} onChange={e => setAiResult(r => r ? {...r, proteines:+e.target.value} : r)}/>
                          </div>
                          <div>
                            <label className={labelCls} style={{ color:"#7eb8a0" }}>Gluc</label>
                            <input className={inputCls} type="number" value={aiResult.glucides} onChange={e => setAiResult(r => r ? {...r, glucides:+e.target.value} : r)}/>
                          </div>
                          <div>
                            <label className={labelCls} style={{ color:"#e07070" }}>Lip</label>
                            <input className={inputCls} type="number" value={aiResult.lipides} onChange={e => setAiResult(r => r ? {...r, lipides:+e.target.value} : r)}/>
                          </div>
                        </div>
                      </div>

                      <button onClick={addFood}
                        className="bg-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.2em] uppercase py-3.5 hover:bg-[#e2c97e] transition-colors">
                        Ajouter à mon journal
                      </button>
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
                        placeholder="Rechercher un aliment…" value={query} onChange={e => { setQuery(e.target.value); setSelected(null); }} autoFocus/>
                      {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="w-3 h-3 border border-[#c9a84c] border-t-transparent rounded-full animate-spin"/></div>}
                    </div>
                  </div>

                  {results.length > 0 && !selected && (
                    <div className="flex flex-col border border-white/10 divide-y divide-white/5">
                      {results.map((p,i) => (
                        <button key={i} onClick={() => { setSelected(p); setResults([]); }}
                          className="flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.03] transition-colors">
                          <div>
                            <p className="text-xs text-white/70">{p.product_name}</p>
                            {p.brands && <p className="text-[0.55rem] text-white/25 mt-0.5">{p.brands}</p>}
                          </div>
                          <span className="text-[0.55rem] text-white/30 shrink-0 ml-4">{Math.round(p.nutriments["energy-kcal_100g"]??0)} kcal/100g</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {selected && computed && (
                    <div className="border border-[#c9a84c]/20 bg-[#c9a84c]/5 p-4 flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-white/70">{selected.product_name}</p>
                          {selected.brands && <p className="text-[0.55rem] text-white/30 mt-0.5">{selected.brands}</p>}
                        </div>
                        <button onClick={() => { setSelected(null); setQuery(""); }} className="text-[0.55rem] tracking-wider uppercase text-white/25 hover:text-white/50 transition-colors">Changer</button>
                      </div>
                      <div>
                        <label className={labelCls}>Quantité (g)</label>
                        <input className={inputCls} type="number" value={quantity} onChange={e => setQuantity(e.target.value)}/>
                      </div>
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
                      <button onClick={addFood} className="bg-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.2em] uppercase py-3.5 hover:bg-[#e2c97e] transition-colors">
                        Ajouter à mon journal
                      </button>
                    </div>
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
              <input className={inputCls} type="number" value={goalDraft.calories} onChange={e => setGoalDraft(adjustCalories(goalDraft,+e.target.value,locked))}/>
              <p className="text-[0.5rem] text-white/20 mt-1">Modifier les calories recalcule les macros proportionnellement (hors verrous)</p>
            </div>
            <div className="flex flex-col gap-4 mb-5">
              {macroConfig.map(({ key, label, color }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[0.55rem] tracking-[0.2em] uppercase block" style={{ color }}>{label} (g)</label>
                    <button onClick={() => toggleLock(key)}
                      className={`flex items-center gap-1 text-[0.5rem] tracking-wider uppercase px-2 py-0.5 border transition-colors ${locked.has(key)?"border-[#c9a84c]/40 text-[#c9a84c]":"border-white/10 text-white/20 hover:text-white/40"}`}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        {locked.has(key)
                          ? <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>
                          : <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></>}
                      </svg>
                      {locked.has(key)?"Verrouillé":"Verrouiller"}
                    </button>
                  </div>
                  <input className={inputCls} type="number" value={goalDraft[key]} onChange={e => setGoalDraft(adjustMacro(goalDraft,key,+e.target.value))}/>
                  <p className="text-[0.5rem] text-white/15 mt-1">= {Math.round(goalDraft[key]*CAL[key])} kcal</p>
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
