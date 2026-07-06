"use client";
import { useState, useEffect } from "react";

type Repas = "matin" | "midi" | "soir" | "snack";
type Food = { id: string; name: string; calories: number; proteines: number; glucides: number; lipides: number; repas: Repas };
type Goals = { calories: number; proteines: number; glucides: number; lipides: number };

const defaultGoals: Goals = { calories: 2200, proteines: 150, glucides: 220, lipides: 70 };

function MacroBar({ label, consumed, goal, color }: { label: string; consumed: number; goal: number; color: string }) {
  const pct = Math.min((consumed / goal) * 100, 100);
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[0.6rem] tracking-[0.15em] uppercase text-white/40">{label}</span>
        <span className="text-xs text-white/60">{consumed}<span className="text-white/25"> / {goal}g</span></span>
      </div>
      <div className="h-1.5 bg-white/5 w-full">
        <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function CalorieRing({ consumed, goal }: { consumed: number; goal: number }) {
  const r = 82;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(consumed / goal, 1);
  const remaining = Math.max(goal - consumed, 0);
  const over = consumed > goal;

  return (
    <div className="relative flex items-center justify-center w-52 h-52 mx-auto">
      <svg width="208" height="208" viewBox="0 0 208 208" className="absolute inset-0">
        <circle cx="104" cy="104" r={r} fill="none" stroke="#ffffff07" strokeWidth="14" />
        <circle cx="104" cy="104" r={r} fill="none"
          stroke={over ? "#e07070" : "#c9a84c"} strokeWidth="14"
          strokeDasharray={`${pct * circ} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 104 104)"
          style={{ transition: "stroke-dasharray 0.9s ease" }}
        />
      </svg>
      <div className="flex flex-col items-center z-10">
        <span style={{ fontFamily: "var(--font-bebas)" }} className="text-5xl text-white tracking-wide leading-none">{consumed}</span>
        <span className="text-[0.5rem] tracking-[0.2em] uppercase text-white/30 mt-1">kcal consommés</span>
        <div className="mt-3 h-px w-10 bg-white/10" />
        <span className={`text-xs mt-3 font-medium ${over ? "text-[#e07070]" : "text-[#c9a84c]"}`}>
          {over ? `+${consumed - goal} excédent` : `${remaining} restants`}
        </span>
      </div>
    </div>
  );
}

const meals: { key: Repas; label: string }[] = [
  { key: "matin", label: "Petit-déjeuner" },
  { key: "midi", label: "Déjeuner" },
  { key: "soir", label: "Dîner" },
  { key: "snack", label: "Collation" },
];

const macroConfig = [
  { key: "proteines" as const, label: "Protéines", color: "#c9a84c" },
  { key: "glucides" as const, label: "Glucides", color: "#7eb8a0" },
  { key: "lipides" as const, label: "Lipides", color: "#e07070" },
];

const emptyFood = { name: "", calories: "", proteines: "", glucides: "", lipides: "", repas: "matin" as Repas };

export default function NutritionPage() {
  const today = new Date().toISOString().split("T")[0];
  const [goals, setGoals] = useState<Goals>(defaultGoals);
  const [foods, setFoods] = useState<Food[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [newFood, setNewFood] = useState(emptyFood);
  const [goalDraft, setGoalDraft] = useState<Goals>(defaultGoals);

  useEffect(() => {
    const g = localStorage.getItem("nutrition_goals");
    const f = localStorage.getItem(`nutrition_${today}`);
    if (g) setGoals(JSON.parse(g));
    if (f) setFoods(JSON.parse(f));
  }, [today]);

  useEffect(() => { localStorage.setItem("nutrition_goals", JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem(`nutrition_${today}`, JSON.stringify(foods)); }, [foods, today]);

  const totals = foods.reduce(
    (acc, f) => ({ calories: acc.calories + f.calories, proteines: acc.proteines + f.proteines, glucides: acc.glucides + f.glucides, lipides: acc.lipides + f.lipides }),
    { calories: 0, proteines: 0, glucides: 0, lipides: 0 }
  );

  const addFood = () => {
    if (!newFood.name.trim() || !newFood.calories) return;
    setFoods(f => [...f, { id: Date.now().toString(), name: newFood.name, calories: +newFood.calories || 0, proteines: +newFood.proteines || 0, glucides: +newFood.glucides || 0, lipides: +newFood.lipides || 0, repas: newFood.repas }]);
    setNewFood(emptyFood);
    setShowAdd(false);
  };

  const inputCls = "w-full bg-[#0a0a0a] border border-white/10 text-white placeholder-white/20 text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors";
  const labelCls = "text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] block mb-1.5";

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-[0.55rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-2">Rubrique</p>
          <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-5xl text-white tracking-wide">NUTRITION</h1>
          <p className="text-white/30 text-xs mt-1">{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
        <button onClick={() => { setGoalDraft(goals); setShowGoals(true); }}
          className="text-[0.55rem] tracking-[0.15em] uppercase text-white/30 border border-white/10 px-4 py-2 hover:text-white/60 hover:border-white/20 transition-colors">
          Mes objectifs
        </button>
      </div>

      {/* Calorie ring */}
      <CalorieRing consumed={totals.calories} goal={goals.calories} />

      {/* Goal summary row */}
      <div className="flex justify-center gap-8 mt-6 mb-8">
        {[
          { label: "Objectif", val: goals.calories, unit: "kcal" },
          { label: "Consommé", val: totals.calories, unit: "kcal" },
          { label: "Restant", val: Math.max(goals.calories - totals.calories, 0), unit: "kcal" },
        ].map(s => (
          <div key={s.label} className="text-center">
            <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-white tracking-wide leading-none">{s.val}</p>
            <p className="text-[0.5rem] tracking-[0.15em] uppercase text-white/25 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Macro bars */}
      <div className="border border-white/10 bg-[#111] p-6 mb-6 flex flex-col gap-5">
        <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-1">Macronutriments</p>
        {macroConfig.map(m => (
          <MacroBar key={m.key} label={m.label} consumed={totals[m.key]} goal={goals[m.key]} color={m.color} />
        ))}
      </div>

      {/* Add food button */}
      <button onClick={() => setShowAdd(true)}
        className="w-full border border-[#c9a84c]/30 text-[#c9a84c] text-[0.6rem] tracking-[0.2em] uppercase py-3.5 hover:bg-[#c9a84c]/5 transition-colors mb-6 flex items-center justify-center gap-2">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Ajouter un aliment
      </button>

      {/* Meal sections */}
      {meals.map(({ key, label }) => {
        const mealFoods = foods.filter(f => f.repas === key);
        const mealCal = mealFoods.reduce((s, f) => s + f.calories, 0);
        return (
          <div key={key} className="border border-white/10 bg-[#111] mb-3">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
              <span style={{ fontFamily: "var(--font-bebas)" }} className="text-sm tracking-wider text-white">{label}</span>
              <span className="text-[0.55rem] tracking-wider text-white/30">{mealCal} kcal</span>
            </div>
            {mealFoods.length === 0 ? (
              <p className="px-5 py-4 text-[0.6rem] tracking-wider text-white/20 uppercase">Aucun aliment ajouté</p>
            ) : (
              <div className="flex flex-col">
                {mealFoods.map(f => (
                  <div key={f.id} className="flex items-center justify-between px-5 py-3 border-b border-white/5 last:border-0 group">
                    <div>
                      <p className="text-xs text-white/70">{f.name}</p>
                      <p className="text-[0.55rem] text-white/25 mt-0.5">
                        P {f.proteines}g · G {f.glucides}g · L {f.lipides}g
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-white/50">{f.calories} kcal</span>
                      <button onClick={() => setFoods(fs => fs.filter(x => x.id !== f.id))}
                        className="text-white/10 hover:text-[#e07070] transition-colors opacity-0 group-hover:opacity-100">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Add food modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center" onClick={() => setShowAdd(false)}>
          <div className="bg-[#111] border border-white/10 w-full max-w-lg p-6 mb-0" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 style={{ fontFamily: "var(--font-bebas)" }} className="text-xl tracking-wider text-white">Ajouter un aliment</h3>
              <button onClick={() => setShowAdd(false)} className="text-white/30 hover:text-white/60 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>Repas</label>
                <div className="flex gap-2 flex-wrap">
                  {meals.map(m => (
                    <button key={m.key} type="button" onClick={() => setNewFood(f => ({ ...f, repas: m.key }))}
                      className={`px-3 py-1.5 text-[0.6rem] tracking-[0.1em] uppercase border transition-all ${newFood.repas === m.key ? "border-[#c9a84c] text-[#c9a84c] bg-[#c9a84c]/10" : "border-white/10 text-white/40 hover:border-white/30"}`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Nom de l&apos;aliment</label>
                <input className={inputCls} placeholder="Ex: Poulet grillé" value={newFood.name} onChange={e => setNewFood(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div><label className={labelCls}>Calories</label><input className={inputCls} type="number" placeholder="kcal" value={newFood.calories} onChange={e => setNewFood(f => ({ ...f, calories: e.target.value }))} /></div>
                <div><label className={labelCls}>Protéines</label><input className={inputCls} type="number" placeholder="g" value={newFood.proteines} onChange={e => setNewFood(f => ({ ...f, proteines: e.target.value }))} /></div>
                <div><label className={labelCls}>Glucides</label><input className={inputCls} type="number" placeholder="g" value={newFood.glucides} onChange={e => setNewFood(f => ({ ...f, glucides: e.target.value }))} /></div>
                <div><label className={labelCls}>Lipides</label><input className={inputCls} type="number" placeholder="g" value={newFood.lipides} onChange={e => setNewFood(f => ({ ...f, lipides: e.target.value }))} /></div>
              </div>
              <button onClick={addFood} className="bg-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.2em] uppercase py-3.5 hover:bg-[#e2c97e] transition-colors mt-1">
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goals modal */}
      {showGoals && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center" onClick={() => setShowGoals(false)}>
          <div className="bg-[#111] border border-white/10 w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 style={{ fontFamily: "var(--font-bebas)" }} className="text-xl tracking-wider text-white">Mes objectifs journaliers</h3>
              <button onClick={() => setShowGoals(false)} className="text-white/30 hover:text-white/60 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-5">
              {([["calories", "Calories (kcal)"], ["proteines", "Protéines (g)"], ["glucides", "Glucides (g)"], ["lipides", "Lipides (g)"]] as [keyof Goals, string][]).map(([k, lbl]) => (
                <div key={k}>
                  <label className={labelCls}>{lbl}</label>
                  <input className={inputCls} type="number" value={goalDraft[k]}
                    onChange={e => setGoalDraft(g => ({ ...g, [k]: +e.target.value }))} />
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
