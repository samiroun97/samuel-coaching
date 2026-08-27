"use client";
import { useState, useEffect, useRef, useCallback, useId } from "react";
import { supabase } from "@/lib/supabase";
import { apiPost } from "@/lib/apiClient";
import { getMyCoachEmail } from "@/lib/coach";
import { DateNav } from "@/components/DateNav";
import { CalRefToggle, TdeeIcon } from "@/components/CalRefToggle";
import { WATER_GLASS_ICON } from "@/components/waterGlassIcon";
import { LIGHTBULB_ICON } from "@/components/lightbulbIcon";
import { MEAL_ICON_PETIT_DEJEUNER, MEAL_ICON_DEJEUNER, MEAL_ICON_DINER, MEAL_ICON_COLLATION } from "@/components/mealTypeIcons";
import { useSelectedDate, todayStr } from "@/lib/useSelectedDate";
import { syncSteps } from "@/lib/steps";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

// BarcodeDetector (API native) n'existe pas sur Safari/iOS — ZXing décode en JS pur
// via canvas, donc ça marche identiquement sur iPhone et Android.
const BARCODE_HINTS = new Map<DecodeHintType, unknown>([
  [DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.CODE_128,
  ]],
  // Sans ça, ZXing abandonne trop vite sur un code-barres légèrement flou/incliné —
  // très fréquent avec une caméra tenue à la main plutôt qu'une image nette.
  [DecodeHintType.TRY_HARDER, true],
]);

type Food  = { id: string; name: string; calories: number; proteines: number; glucides: number; lipides: number; fibres?: number; repas?: string };
type Goals = { calories: number; proteines: number; glucides: number; lipides: number; fibres: number };
type MacroKey = "proteines" | "glucides" | "lipides";
type AIResult = { name: string; calories: number; proteines: number; glucides: number; lipides: number; fibres?: number };
type IdeaResult = { name: string; description: string; calories: number; proteines: number; glucides: number; lipides: number; fibres?: number };
const MEAL_TYPES = ["Petit-déjeuner", "Déjeuner", "Dîner", "Collation"] as const;

const MEAL_TYPE_COLOR: Record<string, string> = {
  "Petit-déjeuner": "#e6b45c",
  "Déjeuner":       "#6fa3c4",
  "Dîner":          "#8a7fc4",
  "Collation":      "#d98f6c",
  "Autres":         "#8a8a8a",
};

const MEAL_TYPE_ICON_SRC: Record<string, string> = {
  "Petit-déjeuner": MEAL_ICON_PETIT_DEJEUNER,
  "Déjeuner":       MEAL_ICON_DEJEUNER,
  "Dîner":          MEAL_ICON_DINER,
  "Collation":      MEAL_ICON_COLLATION,
};

function MealTypeIcon({ type, className, size = 48 }: { type: string; className?: string; size?: number }) {
  const src = MEAL_TYPE_ICON_SRC[type];
  if (!src) { // Autres — points
    return (
      <svg width={size * 0.875} height={size * 0.875} viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}>
        <circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/>
      </svg>
    );
  }
  return <img src={src} alt="" width={size} height={size} className={`shrink-0 object-contain ${className ?? ""}`}/>;
}

// Thème unique (couleur de marque) pour le badge capsule des catégories.
const MEAL_BADGE_COLOR = "#c9a84c";

// Rond plein (badge circulaire) — les icônes fournies sont des illustrations à plat
// (pas de fond rond intégré), donc on leur donne toutes un fond rond assorti, avec
// une légère marge interne pour ne pas coller aux bords du cercle.
function MealTypeBadge({ type, size = 42 }: { type: string; size?: number }) {
  return (
    <div className="relative z-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden" style={{ width: size, height: size, backgroundColor: `${MEAL_BADGE_COLOR}18`, color: MEAL_BADGE_COLOR }}>
      <MealTypeIcon type={type} size={size * (MEAL_TYPE_ICON_SRC[type] ? 0.78 : 0.4)}/>
    </div>
  );
}

function MacroChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.62rem] tracking-wide whitespace-nowrap text-[var(--t-text-40)]">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }}/>
      {label} {Math.round(value)}g
    </span>
  );
}
type OFFProduct = { product_name: string; brands?: string; nutriments: { "energy-kcal_100g"?: number; proteins_100g?: number; carbohydrates_100g?: number; fat_100g?: number; fiber_100g?: number } };
// base_qty/unit : produit dont les macros valent pour une quantité de base (ex. 100 ml) — la quantité est choisie à l'ajout.
// Sans base_qty : repas à portion fixe (comportement historique).
type SavedMeal = { id: string; name: string; calories: number; proteines: number; glucides: number; lipides: number; fibres?: number; base_qty?: number; unit?: string };
type DayHistory = { date: string; label: string; calories: number };
type MealPlanItem = { id: string; meal_type: string; name: string; calories: number; proteines: number; glucides: number; lipides: number };
type MealPlan = { id: string; name: string; notes: string | null; items: MealPlanItem[] };
type PhotoDraft = { photoPreview: string | null; description: string; portionSize: "petite" | "moyenne" | "grande" | null; gramsInput?: string };

// Sur mobile (PWA), ouvrir l'appareil photo natif via <input capture> peut faire recharger
// la page au retour (l'OS libère la mémoire de la webview) : tout le state React est perdu,
// la modale se ferme et la photo/l'estimation en cours disparaissent. On sauvegarde donc le
// brouillon dans sessionStorage dès qu'une photo est prise, pour le restaurer après un reload.
const PHOTO_DRAFT_KEY = "nutrition_photo_draft";
// Posée avant la compression (l'étape risquée en mémoire) et retirée juste après : si l'onglet
// est tué pendant ce traitement, elle reste seule en sessionStorage et permet de distinguer
// « reload pendant le traitement » d'un simple abandon, pour prévenir l'utilisateur au lieu
// de le laisser deviner pourquoi sa photo a disparu.
const PHOTO_PENDING_KEY = "nutrition_photo_pending";

const MAX_PHOTO_DIM = 900;

// Repli qui passe par un <img> plutôt qu'un createImageBitmap. Contre-intuitif mais
// volontaire : sur mobile, le pipeline de décodage d'un <img> (utilisé aussi pour l'affichage
// normal des pages) sait sous-échantillonner une photo dès lors qu'on la dessine dans un
// canvas plus petit, alors que createImageBitmap matérialise le bitmap complet en mémoire
// quand ses options de redimensionnement ne sont pas honorées (voir supportsBitmapResize).
function downscaleViaImage(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(MAX_PHOTO_DIM / img.width, MAX_PHOTO_DIM / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(img.width * scale);
        canvas.height = Math.floor(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.6));
      } catch (err) {
        reject(err);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Image illisible")); };
    img.src = objectUrl;
  });
}

// createImageBitmap + resizeWidth est censé laisser le décodeur sous-échantillonner
// directement pendant le décodage au lieu de matérialiser la photo en pleine résolution —
// MAIS Safari/iOS avant la version 16.4 accepte ces options sans erreur et les ignore
// silencieusement : le bitmap ressort alors en pleine résolution (une photo de téléphone
// récent, 12-48 Mpx, peut peser 150-200 Mo décodée en brut), largement de quoi planter
// l'onglet — sans jamais déclencher de catch, puisqu'aucune exception n'est levée. On
// vérifie donc une fois pour toutes (résultat mis en cache pour la durée de vie de la page)
// si le résultat correspond vraiment à ce qui est demandé avant de faire confiance à ce
// chemin ; sinon on bascule directement sur downscaleViaImage.
let bitmapResizeSupport: Promise<boolean> | null = null;
function supportsBitmapResize(): Promise<boolean> {
  if (!bitmapResizeSupport) {
    bitmapResizeSupport = (async () => {
      try {
        const probe = document.createElement("canvas");
        probe.width = 20; probe.height = 20;
        const blob = await new Promise<Blob | null>(r => probe.toBlob(r, "image/png"));
        if (!blob) return false;
        const bitmap = await createImageBitmap(blob, { resizeWidth: 10, resizeQuality: "low" });
        const honored = bitmap.width === 10;
        bitmap.close();
        return honored;
      } catch {
        return false;
      }
    })();
  }
  return bitmapResizeSupport;
}

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
const defaultGoals: Goals = { calories: 2200, proteines: 150, glucides: 220, lipides: 70, fibres: 27 };
const macroConfig: { key: MacroKey; label: string; color: string }[] = [
  { key: "proteines", label: "Protéines", color: "#dd8790" },
  { key: "glucides",  label: "Glucides",  color: "#e8a374" },
  { key: "lipides",   label: "Lipides",   color: "#eed37a" },
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

// Consommées à gauche, cercle "restantes" au centre, dépense (TDEE) à droite —
// même lecture que sur l'accueil, sans surcharge de couleurs.
function CalorieRow({ consumed, target, expended, goalDefined }: { consumed: number; target: number; expended: number; goalDefined: boolean }) {
  const r = 90, circ = 2 * Math.PI * r;
  const remaining = target - consumed;
  const over    = consumed > target;
  const maint   = Math.abs(remaining) <= 100;
  const color   = !goalDefined ? "var(--t-text-15)" : over ? "#e07070" : maint ? "#c9a84c" : "#7eb8a0";
  const pct     = target > 0 ? Math.min(consumed / target, 1.3) : 0;
  const dash    = goalDefined ? circ * Math.min(pct, 1) : 0;

  return (
    <div className="flex items-start justify-center gap-0 sm:gap-1">
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
            style={{ transition: "stroke-dasharray 0.6s ease", ...(goalDefined ? { filter: `drop-shadow(0 0 2px ${color}55) drop-shadow(0 0 4px ${color}30)` } : {}) }}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p style={{ fontFamily: "var(--font-bebas)" }} className="text-3xl sm:text-4xl text-[var(--t-text)] tracking-wide leading-none">{consumed.toLocaleString("fr-FR")}</p>
          <p className="text-[0.55rem] sm:text-[0.6rem] tracking-[0.2em] uppercase text-[var(--t-text-30)] mt-1.5">Kcal<br/>consommées</p>
        </div>
      </div>

      <div className="flex flex-col items-center text-center w-16 sm:w-20 shrink-0">
        <div className="mb-1"><TdeeIcon size={15}/></div>
        <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl sm:text-3xl text-[var(--t-text)] tracking-wide leading-none">{Math.round(expended).toLocaleString("fr-FR")}</p>
        <p className="text-[0.55rem] sm:text-[0.6rem] tracking-[0.15em] uppercase text-[var(--t-text-30)] mt-1.5">TDEE</p>
      </div>
    </div>
  );
}

function MacroBar({ label, consumed, goal, color }: { label: string; consumed: number; goal: number; color: string }) {
  const r = 28, circ = 2 * Math.PI * r;
  const pct = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-[70px] h-[70px] shrink-0">
        <svg viewBox="0 0 68 68" className="-rotate-90 w-full h-full">
          <circle cx="34" cy="34" r={r} fill="none" stroke="var(--t-track)" strokeWidth="5"/>
          <circle cx="34" cy="34" r={r} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={`${circ * pct} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.7s ease", filter: `drop-shadow(0 0 2px ${color}55) drop-shadow(0 0 4px ${color}30)` }}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-sm font-bold text-[var(--t-text)] leading-none">{consumed}</span>
          <span className="text-[0.55rem] text-[var(--t-text-25)] mt-0.5">/{goal}g</span>
        </div>
      </div>
      <span className="text-[0.62rem] tracking-[0.15em] uppercase text-[var(--t-text-40)]">{label}</span>
    </div>
  );
}

function WaterDropIcon({ size = 15 }: { size?: number }) {
  const gradId = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#aed8ef"/>
          <stop offset="55%" stopColor="#6fa3c4"/>
          <stop offset="100%" stopColor="#3f7ca3"/>
        </linearGradient>
      </defs>
      <path fill={`url(#${gradId})`} d="M12 2C6 8 4 12 4 15a8 8 0 0016 0c0-3-2-7-8-13z"/>
      <ellipse cx="9.4" cy="14" rx="1.5" ry="2.3" fill="#ffffff" opacity="0.35"/>
    </svg>
  );
}

// Petit verre : plein une fois ce cran d'hydratation atteint, estompé sinon.
function GlassIcon({ filled }: { filled: boolean }) {
  return (
    <img src={WATER_GLASS_ICON} alt="" width={16} height={23} draggable={false}
      className={`shrink-0 transition-opacity ${filled ? "opacity-100" : "opacity-25 grayscale"}`}/>
  );
}

function WaterTracker({ water, goal, onAdd, onRemove }: { water: number; goal: number; onAdd: () => void; onRemove: () => void }) {
  const liters = (water * 0.25).toFixed(2).replace(/\.?0+$/, "");
  const goalLiters = (goal * 0.25).toFixed(1);
  return (
    <div className="border border-[var(--t-border)] bg-[var(--t-surface)] rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <WaterDropIcon/>
          <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c]">Hydratation</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[0.7rem] text-[var(--t-text-40)]">{liters}L / {goalLiters}L</span>
          <div className="flex gap-1">
            <button onClick={onRemove} disabled={water === 0}
              className="w-6 h-6 rounded-full border border-[var(--t-border)] text-[var(--t-text-30)] hover:text-[var(--t-text-60)] hover:border-[var(--t-text-20)] transition-colors disabled:opacity-20 flex items-center justify-center text-sm">−</button>
            <button onClick={onAdd} disabled={water >= goal}
              className="w-6 h-6 rounded-full border border-[#6fa3c4]/40 text-[#6fa3c4] hover:bg-[#6fa3c4]/10 transition-colors disabled:opacity-20 flex items-center justify-center text-sm">+</button>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {Array.from({ length: goal }).map((_, i) => (
          <button key={i} onClick={() => i < water ? onRemove() : onAdd()} title={`Verre ${i + 1}`}
            className="cursor-pointer hover:opacity-70 transition-opacity">
            <GlassIcon filled={i < water}/>
          </button>
        ))}
      </div>
      <p className="text-[0.62rem] tracking-wider text-[var(--t-text-20)] text-right">
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
      <div className="flex items-end gap-1.5 border-b border-[var(--t-border-soft)] pb-0" style={{ height: `${BAR + 16}px` }}>
        {history.map(d => {
          const barH = d.calories > 0 ? Math.max(Math.round((d.calories / max) * BAR), 3) : 2;
          const isToday = d.label === "Auj";
          const over = d.calories > goal && d.calories > 0;
          const background = isToday
            ? (over ? "linear-gradient(180deg, #ec9494 0%, #e07070 100%)" : "linear-gradient(180deg, #e2c97e 0%, #c9a84c 100%)")
            : d.calories > 0 ? (over ? "rgba(224,112,112,0.35)" : "var(--t-text-15)") : "var(--t-track)";
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5">
              {d.calories > 0 && <span className="text-[0.6rem] text-[var(--t-text-25)] leading-none">{d.calories}</span>}
              <div className="flex-1 flex items-end w-full">
                <div className="w-full rounded-t-[3px] transition-all duration-700"
                  style={{ height: `${barH}px`, background, boxShadow: isToday ? `0 0 6px -1px ${over ? "#e0707070" : "#c9a84c70"}` : undefined }}/>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 mt-1.5">
        {history.map(d => (
          <div key={d.date} className="flex-1 text-center">
            <span className={`text-[0.62rem] tracking-wider ${d.label === "Auj" ? "text-[#c9a84c] font-bold" : "text-[var(--t-text-20)]"}`}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NutritionPage() {
  const realToday = todayStr();
  const [selectedDate, setSelectedDate] = useSelectedDate();
  const [goals,     setGoals]     = useState<Goals>(defaultGoals);
  const [goalsSet,  setGoalsSet]  = useState(false);
  const [foods,     setFoods]     = useState<Food[]>([]);
  const [showAdd,   setShowAdd]   = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [goalDraft, setGoalDraft] = useState<Goals>(defaultGoals);
  const [rawGoal,   setRawGoal]   = useState({ calories: "2200", proteines: "150", glucides: "220", lipides: "70", fibres: "27" });
  const [water,     setWater]     = useState(0);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [pastHistory, setPastHistory] = useState<DayHistory[]>([]);
  const [calRef,      setCalRef]      = useState<"objectif" | "tdee">("objectif");
  const [miniProfile, setMiniProfile] = useState<MiniProfile | null>(null);
  const [bodyFat,     setBodyFat]     = useState<number | null>(null);
  const [tdeeParts,   setTdeeParts]   = useState({ neat: 0, eat: 0 });
  const [deletedFood, setDeletedFood] = useState<{ food: Food; index: number } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [deletedMeal, setDeletedMeal] = useState<{ meal: SavedMeal; index: number } | null>(null);
  const undoMealTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const removeSavedMeal = (id: string) => {
    const index = savedMeals.findIndex(m => m.id === id);
    if (index === -1) return;
    const meal = savedMeals[index];
    setSavedMeals(s => s.filter(m => m.id !== id));
    clearTimeout(undoMealTimer.current);
    setDeletedMeal({ meal, index });
    undoMealTimer.current = setTimeout(() => setDeletedMeal(null), 6000);
  };

  const [modalMode, setModalMode] = useState<"ai"|"search"|"saved">("ai");
  const [addMealType, setAddMealType] = useState<string>(MEAL_TYPES[0]);
  const [ideas,       setIdeas]       = useState<IdeaResult[]>([]);
  const [ideaMealType, setIdeaMealType] = useState<string>(MEAL_TYPES[0]);
  const [ideaLoading, setIdeaLoading] = useState(false);
  const [ideaError,   setIdeaError]   = useState("");
  const [respectBudget, setRespectBudget] = useState(true);
  const [mealPlan,    setMealPlan]    = useState<MealPlan | null>(null);
  const [description, setDescription] = useState("");
  const [showFoods,   setShowFoods]   = useState(true);
  const [showWeek,    setShowWeek]    = useState(false);
  const userIdRef       = useRef("");
  const userEmailRef    = useRef("");
  const coachEmailRef   = useRef<string | null>(null);
  const syncTimers      = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const selectedDateRef = useRef(realToday);
  const scanRef         = useRef<HTMLInputElement>(null);
  const [scanError, setScanError] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanTakingLong, setScanTakingLong] = useState(false);
  const scanTimeoutRef  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const videoRef        = useRef<HTMLVideoElement>(null);
  const scanControlsRef = useRef<IScannerControls | null>(null);
  const [aiResult,    setAiResult]    = useState<AIResult | null>(null);
  const [analyzing,   setAnalyzing]   = useState(false);
  const [aiError,     setAiError]     = useState("");
  const [listening,   setListening]   = useState(false);
  // Signalement d'une estimation qui semble fausse — envoie la photo à Samuel (contrairement
  // au reste du flux où elle n'est jamais conservée), pour recalibrer l'IA depuis le CRM.
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportComment,  setReportComment]  = useState("");
  const [reportSending,  setReportSending]  = useState(false);
  const [reportSent,     setReportSent]     = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [portionSize,  setPortionSize]  = useState<"petite" | "moyenne" | "grande" | null>(null);
  const [gramsInput,   setGramsInput]   = useState("");
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
  const emptyProd = { name: "", base: "100", unit: "g", calories: "", proteines: "", glucides: "", lipides: "", fibres: "" };
  const [newProd,       setNewProd]       = useState(emptyProd);

  const WATER_GOAL = 8;

  // Restaure un brouillon photo interrompu par un reload (retour d'appareil photo natif).
  useEffect(() => {
    try {
      const wasPending = sessionStorage.getItem(PHOTO_PENDING_KEY);
      if (wasPending) sessionStorage.removeItem(PHOTO_PENDING_KEY);
      const raw = sessionStorage.getItem(PHOTO_DRAFT_KEY);
      if (!raw) {
        // Marque encore posée mais aucun brouillon : le reload a eu lieu pendant la
        // compression elle-même, avant qu'il y ait quoi que ce soit à sauvegarder.
        if (wasPending) {
          setShowAdd(true); setModalMode("ai");
          setAiError("La photo précédente a fait planter la page (mémoire insuffisante). Réessaie — si ça persiste, choisis-la depuis ta galerie juste après l'avoir prise plutôt que directement depuis l'appareil photo.");
        }
        return;
      }
      const draft = JSON.parse(raw) as PhotoDraft;
      if (!draft.photoPreview) return;
      setShowAdd(true); setModalMode("ai");
      setPhotoPreview(draft.photoPreview);
      setDescription(draft.description ?? "");
      setPortionSize(draft.portionSize ?? null);
      setGramsInput(draft.gramsInput ?? "");
    } catch { /* ignore */ }
  }, []);

  // Garde le brouillon à jour tant qu'une photo est en attente d'estimation.
  useEffect(() => {
    if (!photoPreview) return;
    try {
      const draft: PhotoDraft = { photoPreview, description, portionSize, gramsInput };
      sessionStorage.setItem(PHOTO_DRAFT_KEY, JSON.stringify(draft));
    } catch { /* ignore */ }
  }, [photoPreview, description, portionSize, gramsInput]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userIdRef.current = user.id;
        userEmailRef.current = user.email ?? "";
        getMyCoachEmail(user.id).then(email => { coachEmailRef.current = email; });
        // Profil + body fat pour le calcul du TDEE
        const { data: p } = await supabase.from("profiles").select("poids,taille,age,sexe").eq("id", user.id).single();
        if (p) {
          setMiniProfile(p as MiniProfile);
          // Objectif protéines par défaut (tant que le client n'a pas personnalisé ses
          // objectifs) : 2g/kg de poids de corps, plus pertinent qu'une valeur fixe pour tous.
          if (!localStorage.getItem("nutrition_goals") && p.poids) {
            setGoals(g => ({ ...g, proteines: Math.round(p.poids * 2) }));
          }
        }
        try {
          const { data: bf } = await supabase.from("body_fat_entries")
            .select("body_fat").eq("user_id", user.id).order("date", { ascending: false }).limit(1);
          if (bf?.[0]?.body_fat) {
            setBodyFat(bf[0].body_fat);
          } else {
            const bfRaw = localStorage.getItem(`bodyfat_history_${user.id}`) ?? localStorage.getItem("bodyfat_history");
            const bfHist: { body_fat?: number }[] = bfRaw ? JSON.parse(bfRaw) : [];
            if (bfHist[0]?.body_fat) setBodyFat(bfHist[0].body_fat);
          }
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
    if (g) {
      const parsed = JSON.parse(g);
      // Anciens objectifs sauvegardés avant l'ajout des fibres : on complète avec la valeur par défaut.
      setGoals({ ...parsed, fibres: parsed.fibres ?? defaultGoals.fibres });
      setGoalsSet(true);
    }
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

  useEffect(() => { if (goalsSet) localStorage.setItem("nutrition_goals", JSON.stringify(goals)); }, [goals, goalsSet]);
  useEffect(() => { localStorage.setItem("nutrition_cal_ref", calRef); }, [calRef]);

  // NEAT (pas) + EAT (entraînements) du jour sélectionné, comme sur l'accueil
  useEffect(() => {
    const compute = () => {
      try {
        const steps = parseInt(localStorage.getItem(`steps_${selectedDate}`) ?? "0") || 0;
        const neat  = Math.round(steps * 0.04 * ((miniProfile?.poids ?? 70) / 70));
        const logs: { date: string; calories_burned: number }[] = JSON.parse(localStorage.getItem("programme_logs") ?? "[]");
        const eat   = logs.filter(l => l.date.startsWith(selectedDate)).reduce((s, l) => s + l.calories_burned, 0);
        setTdeeParts({ neat, eat });
      } catch { setTdeeParts({ neat: 0, eat: 0 }); }
    };
    compute();
    // Rattrape les pas reçus via le Raccourci iPhone (écriture serveur, jamais dans le
    // localStorage de cet appareil) et recalcule le NEAT si une valeur plus récente existe.
    if (userIdRef.current) syncSteps(userIdRef.current, [selectedDate]).then(compute);
  }, [selectedDate, miniProfile]);
  useEffect(() => {
    // Capturé ici (et non lu dans le setTimeout) : la ref peut déjà pointer sur un autre
    // jour par le temps que le minuteur se déclenche si l'utilisateur navigue entre-temps.
    const date = selectedDateRef.current;
    localStorage.setItem(`nutrition_${date}`, JSON.stringify(foods));
    // Sync différée vers Supabase, débounced PAR JOUR (Map plutôt qu'un minuteur unique) :
    // changer de jour dans les 3s ne doit jamais annuler la synchro d'un autre jour déjà
    // en attente, sinon cette modif n'est jamais renvoyée et le bilan hebdo devient faux.
    clearTimeout(syncTimers.current.get(date));
    syncTimers.current.set(date, setTimeout(async () => {
      syncTimers.current.delete(date);
      if (!userIdRef.current) return;
      const t = foods.reduce((acc, f) => ({
        calories: acc.calories + f.calories, proteines: acc.proteines + f.proteines,
        glucides: acc.glucides + f.glucides, lipides: acc.lipides + f.lipides,
        fibres: acc.fibres + (f.fibres || 0),
      }), { calories: 0, proteines: 0, glucides: 0, lipides: 0, fibres: 0 });
      await supabase.from("daily_summaries").upsert({
        user_id: userIdRef.current, date, ...t,
        foods: foods.map(f => ({ name: f.name, calories: f.calories, proteines: f.proteines, glucides: f.glucides, lipides: f.lipides, fibres: f.fibres ?? 0, repas: f.repas ?? null })),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,date" });
    }, 3000));
  }, [foods]);
  useEffect(() => { localStorage.setItem(`hydration_${selectedDateRef.current}`, water.toString()); }, [water]);
  useEffect(() => { localStorage.setItem("nutrition_saved_meals", JSON.stringify(savedMeals)); }, [savedMeals]);

  // Référence calorique : objectif fixe ou TDEE du jour (métabolisme + activité + sport)
  const bmrVal    = miniProfile ? bmr(miniProfile, bodyFat) : 0;
  const tdee      = bmrVal > 0 ? bmrVal + tdeeParts.neat + tdeeParts.eat : 0;
  const useTdee   = calRef === "tdee" && tdee > 0;
  const calTarget = useTdee ? tdee : goals.calories;

  // En mode TDEE, le budget calorique s'adapte à la dépense réelle du jour ; les macros
  // suivent proportionnellement le même ratio que dans "Mes objectifs" pour rester cohérentes.
  const macroScale = useTdee && goals.calories > 0 ? calTarget / goals.calories : 1;
  const consumed = foods.reduce((acc, f) => ({
    calories: acc.calories + f.calories, proteines: acc.proteines + f.proteines,
    glucides: acc.glucides + f.glucides, lipides: acc.lipides + f.lipides,
    fibres: acc.fibres + (f.fibres || 0),
  }), { calories: 0, proteines: 0, glucides: 0, lipides: 0, fibres: 0 });
  const remaining = {
    calories:  Math.max(0, calTarget - consumed.calories),
    proteines: Math.max(0, Math.round(goals.proteines * macroScale) - consumed.proteines),
    glucides:  Math.max(0, Math.round(goals.glucides  * macroScale) - consumed.glucides),
    fibres:    Math.max(0, Math.round(goals.fibres    * macroScale) - consumed.fibres),
    lipides:   Math.max(0, Math.round(goals.lipides   * macroScale) - consumed.lipides),
  };

  const canGenerateIdeas = !respectBudget || remaining.calories > 0;

  const generateIdeas = async () => {
    if (!canGenerateIdeas) return;
    setIdeaLoading(true); setIdeaError(""); setIdeas([]);
    try {
      const res = await apiPost("/api/nutrition/meal-idea", {
        mealType: ideaMealType,
        remaining: respectBudget ? remaining : null,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setIdeas(data.ideas ?? []);
    } catch (e: unknown) {
      setIdeaError(e instanceof Error ? e.message : "Erreur IA");
    }
    setIdeaLoading(false);
  };

  // Ajuster manuellement les calories d'une estimation IA doit rééquilibrer les macros
  // proportionnellement (même ratio), sinon le total calorique affiché devient incohérent
  // avec P/G/L (ex: +200 kcal sur un plat jugé plus riche que prévu par la photo).
  const adjustAiCalories = (newCalories: number) => setAiResult(r => {
    if (!r) return r;
    const scale = r.calories > 0 ? Math.max(0, newCalories) / r.calories : 1;
    return {
      ...r, calories: Math.max(0, newCalories),
      proteines: Math.max(0, Math.round(r.proteines * scale)),
      glucides:  Math.max(0, Math.round(r.glucides  * scale)),
      lipides:   Math.max(0, Math.round(r.lipides   * scale)),
      fibres:    r.fibres !== undefined ? Math.max(0, Math.round(r.fibres * scale)) : undefined,
    };
  });

  const addFoodDirect = (item: Omit<IdeaResult, "description">, repas?: string) => {
    setFoods(f => [...f, { id: Date.now().toString(), ...item, ...(repas ? { repas } : {}) }]);
  };

  const totals = foods.reduce((acc,f) => ({
    calories:  acc.calories  + f.calories,
    proteines: acc.proteines + f.proteines,
    glucides:  acc.glucides  + f.glucides,
    lipides:   acc.lipides   + f.lipides,
    fibres:    acc.fibres    + (f.fibres || 0),
  }), { calories:0, proteines:0, glucides:0, lipides:0, fibres:0 });

  const todayCalForChart = selectedDate === realToday
    ? totals.calories
    : (() => { const s = localStorage.getItem(`nutrition_${realToday}`); return s ? (JSON.parse(s) as Food[]).reduce((a, f) => a + f.calories, 0) : 0; })();
  const fullHistory: DayHistory[] = [...pastHistory, { date: realToday, label: "Auj", calories: todayCalForChart }];

  const runAnalysis = async () => {
    if (!photoPreview && !description.trim()) return;
    setAnalyzing(true); setAiError(""); setAiResult(null);
    setShowReportForm(false); setReportComment(""); setReportSent(false);
    try {
      const grams = parseFloat(gramsInput.replace(",", ".")) || undefined;
      const res = await apiPost("/api/nutrition/analyze", photoPreview
        ? { type: "photo", image: photoPreview, text: description, portion: portionSize, grams }
        : { type: "text", text: description, portion: portionSize, grams });
      if (!res.ok) { const t = await res.text(); throw new Error(t || `Erreur ${res.status}`); }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAiResult(data);
    } catch (e: unknown) { setAiError(e instanceof Error ? e.message : "Erreur IA"); }
    setAnalyzing(false);
  };

  // Signalement d'une estimation qui semble fausse — envoyé à Samuel via l'Inbox, avec la
  // photo utilisée pour l'estimation (jamais conservée sinon), pour recalibrer l'IA depuis
  // la rubrique IA du CRM (cf. app/crm/ia).
  const submitReport = async () => {
    if (!aiResult || !reportComment.trim() || !userEmailRef.current || !coachEmailRef.current) return;
    setReportSending(true);
    const payload = JSON.stringify({
      calories: aiResult.calories, proteines: aiResult.proteines,
      glucides: aiResult.glucides, lipides: aiResult.lipides, fibres: aiResult.fibres,
      name: aiResult.name, description: description.trim(),
      photo: photoPreview, comment: reportComment.trim(),
    });
    await supabase.from("messages").insert({
      from_email: userEmailRef.current,
      to_email: coachEmailRef.current,
      content: `[NUTRITION_FEEDBACK:${payload}]`,
    });
    setReportSending(false); setReportSent(true); setShowReportForm(false); setReportComment("");
  };

  const compressImage = async (file: File): Promise<string> => {
    if (await supportsBitmapResize()) {
      try {
        // bitmap.close() libère la mémoire immédiatement au lieu d'attendre le GC.
        const bitmap = await createImageBitmap(file, { resizeWidth: MAX_PHOTO_DIM, resizeQuality: "low" });
        try {
          const canvas = document.createElement("canvas");
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
          return canvas.toDataURL("image/jpeg", 0.6);
        } finally {
          bitmap.close();
        }
      } catch { /* repli ci-dessous */ }
    }
    return downscaleViaImage(file);
  };

  // Un fichier aussi lourd (photo RAW, Live Photo exportée, capture d'un appareil très
  // récent) fait courir un vrai risque de plantage à la compression, même avec les
  // protections ci-dessous. Mieux vaut prévenir tout de suite que tenter et planter.
  const MAX_PHOTO_FILE_BYTES = 30 * 1024 * 1024;

  const selectPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setAiError(""); setAiResult(null);
    if (file.size > MAX_PHOTO_FILE_BYTES) {
      if (photoRef.current) photoRef.current.value = "";
      if (galleryRef.current) galleryRef.current.value = "";
      setAiError("Cette photo est trop lourde et risquerait de faire planter la page. Reprends-la avec l'appareil photo plutôt que depuis un fichier haute résolution.");
      return;
    }
    if (photoRef.current) photoRef.current.value = "";
    if (galleryRef.current) galleryRef.current.value = "";
    // Posée avant compressImage (l'étape coûteuse en mémoire) : si l'onglet est tué pendant
    // le traitement, cette marque seule survit et permet d'expliquer le crash au retour.
    try { sessionStorage.setItem(PHOTO_PENDING_KEY, "1"); } catch { /* ignore */ }
    try {
      const compressed = await compressImage(file);
      setPhotoPreview(compressed);
      // Sauvegarde immédiate : si le retour de l'appareil photo recharge la page,
      // ce brouillon permet de retrouver la photo au lieu de tout perdre.
      try {
        const draft: PhotoDraft = { photoPreview: compressed, description, portionSize, gramsInput };
        sessionStorage.setItem(PHOTO_DRAFT_KEY, JSON.stringify(draft));
      } catch { /* quota dépassé, tant pis */ }
    } catch {
      setAiError("Impossible de traiter cette photo — réessaie ou choisis-en une autre.");
    } finally {
      try { sessionStorage.removeItem(PHOTO_PENDING_KEY); } catch { /* ignore */ }
    }
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

  // Résout un code-barres détecté (par la caméra live ou une photo) en produit OFF.
  // Passe par le même état `selected` que la recherche par nom : ça affiche la carte
  // de confirmation avec quantité éditable au lieu d'ajouter direct à 100g.
  const lookupBarcode = useCallback(async (code: string) => {
    setScanError(""); setSelected(null); setSearching(true);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
      const data = await res.json();
      if (data.status === 1 && data.product?.nutriments) {
        const p = data.product;
        setSelected({ product_name: p.product_name || code, brands: p.brands, nutriments: p.nutriments });
        setQuantity("100");
        setSearching(false);
      } else {
        setQuery(code);
        doSearch(code);
      }
    } catch { setScanError("Erreur lors du scan."); setSearching(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Repli : capture une seule photo via l'appareil photo natif (utilisé si la
  // caméra live n'est pas disponible sur ce navigateur/appareil).
  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanError("");
    const url = URL.createObjectURL(file);
    try {
      const reader = new BrowserMultiFormatReader(BARCODE_HINTS);
      const result = await reader.decodeFromImageUrl(url);
      await lookupBarcode(result.getText());
    } catch { setScanError("Code-barres non détecté. Réessaie."); }
    finally { URL.revokeObjectURL(url); }
    if (scanRef.current) scanRef.current.value = "";
  };

  const stopScanner = useCallback(() => {
    scanControlsRef.current?.stop();
    scanControlsRef.current = null;
    clearTimeout(scanTimeoutRef.current);
    setScannerOpen(false);
    setScanTakingLong(false);
    setTorchOn(false);
    setTorchAvailable(false);
  }, []);

  // La torche aide surtout contre le flou : en faible lumière la caméra allonge le
  // temps d'exposition, donc le moindre tremblement de main floute l'image (pas un
  // problème de mise au point). Support très inégal (quasi absent sur Safari/iOS),
  // donc le bouton n'apparaît que si le zxing détecte la capacité sur le stream.
  const toggleTorch = async () => {
    if (!scanControlsRef.current?.switchTorch) return;
    const next = !torchOn;
    try { await scanControlsRef.current.switchTorch(next); setTorchOn(next); } catch { /* non supporté */ }
  };

  // Ouvre un scanner caméra live avec cadre de visée. ZXing décode les frames
  // en JS pur (canvas), donc ça fonctionne aussi bien sur Safari/iPhone que
  // sur Chrome/Android — contrairement à l'API native BarcodeDetector, que
  // Safari n'a jamais implémentée.
  const openScanner = async () => {
    setScanError("");
    if (!navigator.mediaDevices?.getUserMedia) { scanRef.current?.click(); return; }
    setScannerOpen(true);
    setScanTakingLong(false);
    // Le décodage caméra live peut ramer selon l'éclairage/l'état du code-barres (froissé,
    // reflet...) — au-delà d'un certain temps, on propose une porte de sortie plutôt que de
    // laisser l'utilisateur bloqué face à un cadre qui ne détecte rien.
    clearTimeout(scanTimeoutRef.current);
    scanTimeoutRef.current = setTimeout(() => setScanTakingLong(true), 7000);
    requestAnimationFrame(async () => {
      if (!videoRef.current) return;
      try {
        const reader = new BrowserMultiFormatReader(BARCODE_HINTS);
        const controls = await reader.decodeFromConstraints(
          // Une résolution basse (souvent 640x480 par défaut) rend les barres d'un
          // EAN/UPC illisibles de trop près ou de loin ; on demande explicitement
          // mieux, en laissant le navigateur retomber sur une valeur plus faible
          // si la caméra ne supporte pas cette résolution ("ideal", pas "exact").
          // focusMode "continuous" : sans ça, certaines caméras gardent une mise au
          // point fixe pensée pour un cadrage lointain et ne refont jamais le point
          // quand on approche le code-barres — résultat systématiquement flou.
          {
            video: {
              facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              advanced: [{ focusMode: "continuous" } as any],
            },
          },
          videoRef.current,
          (result) => {
            if (result) {
              stopScanner();
              lookupBarcode(result.getText());
            }
          }
        );
        scanControlsRef.current = controls;
        setTorchAvailable(!!controls.switchTorch);
      } catch {
        clearTimeout(scanTimeoutRef.current);
        setScanError("Impossible d'accéder à la caméra. Vérifie les autorisations.");
        setScannerOpen(false);
      }
    });
  };

  // Coupe bien la caméra si l'utilisateur quitte la page pendant un scan.
  useEffect(() => () => { scanControlsRef.current?.stop(); clearTimeout(scanTimeoutRef.current); }, []);

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
    fibres:    Math.round((selected.nutriments.fiber_100g??0)*factor),
  } : null;

  const saveMeal = (meal: { name: string; calories: number; proteines: number; glucides: number; lipides: number; fibres?: number; base_qty?: number; unit?: string }) => {
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
      fibres:    parseFloat(newProd.fibres.replace(",", "."))    || 0,
      base_qty: base, unit: newProd.unit,
    });
    setShowNewProd(false); setNewProd(emptyProd);
  };

  // Macros du produit sauvegardé, recalculées pour la quantité choisie
  const savedFactor   = selectedSaved ? (parseFloat(savedQty.replace(",", ".")) || 0) / (selectedSaved.base_qty ?? 100) : 1;
  const savedComputed = selectedSaved ? {
    calories:  Math.round(selectedSaved.calories  * savedFactor),
    proteines: Math.round(selectedSaved.proteines * savedFactor),
    glucides:  Math.round(selectedSaved.glucides  * savedFactor),
    fibres:    Math.round((selectedSaved.fibres ?? 0) * savedFactor),
    lipides:   Math.round(selectedSaved.lipides   * savedFactor),
  } : null;

  const addFood = () => {
    if (modalMode === "ai" && aiResult) {
      setFoods(f => [...f, { id:Date.now().toString(), ...aiResult, repas: addMealType }]);
    } else if (modalMode === "search" && selected && computed) {
      setFoods(f => [...f, { id:Date.now().toString(), name:selected.product_name, ...computed, repas: addMealType }]);
    } else if (modalMode === "saved" && selectedSaved && savedComputed) {
      setFoods(f => [...f, { id:Date.now().toString(), name:selectedSaved.name, ...savedComputed, repas: addMealType }]);
    } else return;
    resetModal();
  };

  const resetModal = () => {
    setShowAdd(false); setModalMode("ai"); setAddMealType(MEAL_TYPES[0]);
    setDescription(""); setAiResult(null); setAiError(""); setListening(false);
    setPhotoPreview(null); setPortionSize(null); setGramsInput("");
    setQuery(""); setResults([]); setSelected(null); setQuantity("100"); setSelectedSaved(null);
    setSavedQty("100"); setShowNewProd(false); setNewProd(emptyProd);
    try { sessionStorage.removeItem(PHOTO_DRAFT_KEY); } catch { /* ignore */ }
  };

  const syncRaw = (g: Goals) => setRawGoal({
    calories:  g.calories.toString(),
    proteines: g.proteines.toString(),
    glucides:  g.glucides.toString(),
    lipides:   g.lipides.toString(),
    fibres:    g.fibres.toString(),
  });

  const commitCalories = () => {
    const val = parseInt(rawGoal.calories);
    if (isNaN(val) || val <= 0) { syncRaw(goalDraft); return; }
    const next = adjustCalories(goalDraft, val);
    setGoalDraft(next); syncRaw(next);
  };

  // Les fibres ne font pas partie du calcul calorique (P/G/L) : objectif independant,
  // sans rééquilibrage des autres macros.
  const commitFibres = () => {
    const val = parseInt(rawGoal.fibres);
    if (isNaN(val) || val < 0) { syncRaw(goalDraft); return; }
    const next = { ...goalDraft, fibres: val };
    setGoalDraft(next); syncRaw(next);
  };

  const commitMacro = (key: MacroKey) => {
    const val = parseInt(rawGoal[key]);
    if (isNaN(val) || val < 0) { syncRaw(goalDraft); return; }
    const next = adjustMacro(goalDraft, key, val);
    setGoalDraft(next); syncRaw(next);
  };

  const inputCls = "w-full bg-[var(--t-bg)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors";
  const labelCls = "text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c] block mb-1.5";
  const tabCls   = (active: boolean, border = true) =>
    `flex-1 py-2 text-[0.7rem] tracking-[0.1em] uppercase transition-colors ${border ? "border-r border-[var(--t-border)]" : ""} ${active ? "bg-[#c9a84c]/10 text-[#c9a84c]" : "text-[var(--t-text-30)] hover:text-[var(--t-text-50)]"}`;

  const daysWithData = fullHistory.filter(d => d.calories > 0);
  const avgCal = daysWithData.length ? Math.round(daysWithData.reduce((s,d) => s+d.calories,0)/daysWithData.length) : 0;

  return (
    <div className="p-4 sm:p-8 max-w-2xl">

      {/* Header */}
      <div className="mb-6">
        <p className="text-[0.7rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-2">Rubrique</p>
        <h1 style={{ fontFamily:"var(--font-bebas)" }} className="text-4xl sm:text-5xl text-[var(--t-text)] tracking-wide">NUTRITION</h1>
      </div>

      <DateNav date={selectedDate} onChange={setSelectedDate} />

      {/* Référence du compteur : objectif fixe ou dépense réelle (TDEE) */}
      <div className="flex justify-center mb-5">
        <CalRefToggle value={calRef} onChange={setCalRef} tdeeDisabled={tdee <= 0}/>
      </div>

      <button onClick={() => { if (!useTdee) { setGoalDraft(goals); syncRaw(goals); setShowGoals(true); } }}
        disabled={useTdee}
        title={useTdee ? undefined : "Cliquer pour définir ton objectif"}
        className="mx-auto block disabled:cursor-default">
        <CalorieRow consumed={totals.calories} target={calTarget} expended={tdee} goalDefined={useTdee || goalsSet}/>
      </button>

      <div className="border border-[var(--t-border)] bg-[var(--t-surface)] rounded-xl p-6 mb-6 mt-6">
        <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-4">Macronutriments</p>
        <div className="flex items-start justify-around">
          {macroConfig.map(m => <MacroBar key={m.key} label={m.label} consumed={totals[m.key]} goal={goals[m.key]} color={m.color}/>)}
          <MacroBar label="Fibres" consumed={totals.fibres} goal={goals.fibres} color="#b6a186"/>
        </div>
      </div>

      {/* Dépense totale — fluide, monochrome */}
      <div className="mt-6 pt-5 border-t border-[var(--t-border-soft)]">
        <p className="text-[0.6rem] tracking-[0.18em] uppercase text-[var(--t-text-20)] mb-3 text-center">Dépense totale</p>
        <div className="flex items-center justify-between">
          {[
            { label: "BMR",  val: bmrVal },
            { label: "NEAT", val: tdeeParts.neat },
            { label: "EAT",  val: tdeeParts.eat },
          ].map((row, i) => (
            <div key={row.label} className={`flex-1 text-center ${i > 0 ? "border-l border-[var(--t-border-soft)]" : ""}`}>
              <p style={{ fontFamily: "var(--font-bebas)" }} className="text-xl text-[var(--t-text-80)] tracking-wide">{row.val.toLocaleString("fr-FR")}</p>
              <p className="text-[0.58rem] tracking-[0.15em] uppercase text-[var(--t-text-25)] mt-1">{row.label}</p>
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => setShowAdd(true)}
        className="w-full bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.72rem] font-bold tracking-[0.22em] uppercase py-4 shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 rounded-xl mt-6 mb-9 flex items-center justify-center gap-2">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Ajouter un repas
      </button>

      <WaterTracker water={water} goal={WATER_GOAL}
        onAdd={() => setWater(w => Math.min(w+1, WATER_GOAL))}
        onRemove={() => setWater(w => Math.max(w-1, 0))}/>

      {/* ── Plan de Samuel ── */}
      {mealPlan && (
        <div className="border border-[#c9a84c]/20 bg-[var(--t-surface-gold)] rounded-xl mb-6">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#c9a84c]/10">
            <div>
              <div className="flex items-center gap-2">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span style={{ fontFamily: "var(--font-bebas)" }} className="text-sm tracking-wider text-[#c9a84c]">Plan de Samuel</span>
              </div>
              <p className="text-[0.65rem] tracking-wider text-[#c9a84c]/50 mt-0.5">{mealPlan.name}</p>
            </div>
            <span className="text-[0.65rem] tracking-wider text-[#c9a84c]/40">{mealPlan.items.length} repas</span>
          </div>
          {["Petit-déjeuner","Déjeuner","Dîner","Collation"].map(type => {
            const typeItems = mealPlan.items.filter(i => i.meal_type === type);
            if (!typeItems.length) return null;
            return (
              <div key={type} className="border-b border-[#c9a84c]/5 last:border-0">
                <p className="px-5 pt-3 pb-1 text-[0.65rem] tracking-wider uppercase text-[#c9a84c]/40">{type}</p>
                {typeItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between px-5 py-2.5 border-b border-[var(--t-border-soft)] last:border-0">
                    <div>
                      <p className="text-xs text-[var(--t-text-65)]">{item.name}</p>
                      <div className="flex gap-2 mt-0.5">
                        <span className="text-[0.62rem] text-[var(--t-text-30)]">{item.calories} kcal</span>
                        <span className="text-[0.62rem] text-[#c9a84c]/50">P {item.proteines}g</span>
                        <span className="text-[0.62rem] text-[#7eb8a0]/50">G {item.glucides}g</span>
                        <span className="text-[0.62rem] text-[#e07070]/50">L {item.lipides}g</span>
                      </div>
                    </div>
                    <button onClick={() => addFoodDirect(item)}
                      className="w-6 h-6 border border-[#c9a84c]/30 text-[#c9a84c] rounded-xl hover:bg-[#c9a84c]/10 transition-colors flex items-center justify-center text-sm shrink-0">
                      +
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
          {mealPlan.notes && (
            <p className="px-5 py-3 text-[0.65rem] text-[#c9a84c]/40 italic border-t border-[#c9a84c]/10">{mealPlan.notes}</p>
          )}
        </div>
      )}

      {/* ── Idée repas ── */}
      <div className="border border-[var(--t-border)] bg-[var(--t-surface)] rounded-xl mb-6">
        <div className="flex items-start justify-between px-5 py-4 border-b border-[var(--t-border-soft)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <img src={LIGHTBULB_ICON} alt="" width={18} height={18} className="shrink-0"/>
              <span style={{ fontFamily:"var(--font-bebas)" }} className="text-sm tracking-wider text-[var(--t-text)]">Idée repas</span>
            </div>
            {respectBudget ? (
              remaining.calories > 0 ? (
                <p className="text-[0.65rem] tracking-wider text-[var(--t-text-25)]">
                  Budget · {remaining.calories} kcal · P {remaining.proteines}g · G {remaining.glucides}g · L {remaining.lipides}g · F {remaining.fibres}g
                </p>
              ) : (
                <p className="text-[0.65rem] tracking-wider text-[#7eb8a0]/60">Objectif calorique atteint</p>
              )
            ) : (
              <p className="text-[0.65rem] tracking-wider text-[var(--t-text-25)]">Idées libres, sans contrainte de budget</p>
            )}
          </div>
          <button onClick={generateIdeas} disabled={ideaLoading || !canGenerateIdeas}
            className="shrink-0 ml-3 border border-[#c9a84c]/30 text-[#c9a84c] rounded-xl text-[0.7rem] tracking-[0.15em] uppercase px-3.5 py-2 hover:bg-[#c9a84c]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5">
            {ideaLoading
              ? <><div className="w-2.5 h-2.5 border border-[#c9a84c] border-t-transparent rounded-full animate-spin"/>Génération…</>
              : "Générer"}
          </button>
        </div>

        <div className="flex gap-1.5 px-5 pt-3 pb-1">
          {MEAL_TYPES.map(t => (
            <button key={t} onClick={() => setIdeaMealType(t)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[0.5rem] tracking-[0.06em] uppercase border transition-colors ${ideaMealType === t ? "" : "border-[var(--t-border)] text-[var(--t-text-30)] hover:border-[var(--t-text-20)] hover:text-[var(--t-text-50)]"}`}
              style={ideaMealType === t
                ? { borderColor: MEAL_TYPE_COLOR[t], color: MEAL_TYPE_COLOR[t], backgroundColor: `${MEAL_TYPE_COLOR[t]}18` }
                : undefined}>
              <MealTypeIcon type={t} size={44} className={`transition-opacity ${ideaMealType === t ? "opacity-100" : "opacity-45"}`}/>
              {t}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 px-5 pt-3 pb-1 cursor-pointer select-none">
          <input type="checkbox" checked={respectBudget} onChange={e => setRespectBudget(e.target.checked)}
            className="accent-[#c9a84c] w-3.5 h-3.5 cursor-pointer"/>
          <span className="text-[0.62rem] tracking-wider text-[var(--t-text-40)] uppercase">Respecter mon budget calorique restant</span>
        </label>

        {ideaError && (
          <p className="px-5 py-3 text-[0.7rem] text-[#e07070]">{ideaError}</p>
        )}

        {respectBudget && remaining.calories <= 0 && (
          <p className="px-5 py-3 text-[0.7rem] tracking-wider text-[var(--t-text-25)]">
            Plus de budget restant aujourd&apos;hui — décoche la case pour avoir quand même des idées.
          </p>
        )}

        {!ideaLoading && ideas.length === 0 && !ideaError && canGenerateIdeas && (
          <p className="px-5 py-4 text-[0.7rem] tracking-wider text-[var(--t-text-20)] uppercase">
            Clique sur &ldquo;Générer&rdquo; pour des idées {respectBudget ? "adaptées à ton budget" : "de repas"}
          </p>
        )}

        {ideas.length > 0 && (
          <div className="divide-y divide-[var(--t-border-soft)]">
            {ideas.map((idea, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-4">
                <div className="flex-1">
                  <p className="text-xs text-[var(--t-text-70)] mb-0.5">{idea.name}</p>
                  <p className="text-[0.65rem] text-[var(--t-text-30)] leading-relaxed mb-2">{idea.description}</p>
                  <div className="flex gap-3">
                    <span className="text-[0.65rem] text-[var(--t-text-40)]">{idea.calories} kcal</span>
                    <span className="text-[0.65rem] text-[#c9a84c]/70">P {idea.proteines}g</span>
                    <span className="text-[0.65rem] text-[#7eb8a0]/70">G {idea.glucides}g</span>
                    <span className="text-[0.65rem] text-[#e07070]/70">L {idea.lipides}g</span>
                    <span className="text-[0.65rem] text-[#b6a186]/70">F {idea.fibres ?? 0}g</span>
                  </div>
                </div>
                <button onClick={() => addFoodDirect(idea, ideaMealType)}
                  className="shrink-0 w-7 h-7 border border-[#c9a84c]/30 text-[#c9a84c] rounded-xl hover:bg-[#c9a84c]/10 transition-colors flex items-center justify-center text-sm">
                  +
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Aliments du jour ── */}
      <div className="mb-6">
        <button onClick={() => setShowFoods(v => !v)}
          className="w-full text-left flex items-center justify-between px-1 py-2 hover:opacity-80 transition-opacity">
          <span style={{ fontFamily:"var(--font-bebas)" }} className="text-sm tracking-wider text-[var(--t-text)]">
            {selectedDate === realToday ? "Aliments du jour" : `Aliments · ${new Date(selectedDate + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[0.7rem] tracking-wider text-[var(--t-text-30)]">{totals.calories} kcal</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              className={`text-[var(--t-text-25)] shrink-0 transition-transform duration-300 ${showFoods ? "rotate-180" : ""}`}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </button>
        <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${showFoods ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
          <div className="overflow-hidden pt-3">
        {foods.length === 0
          ? <p className="px-1 py-4 text-[0.7rem] tracking-wider text-[var(--t-text-20)] uppercase">Aucun aliment ajouté</p>
          : [...MEAL_TYPES, "Autres"].map(type => {
            const items = foods.filter(f => (f.repas ?? "Autres") === type);
            if (!items.length) return null;
            const groupCal = items.reduce((s, f) => s + f.calories, 0);
            return (
              <div key={type} className="rounded-xl border border-[var(--t-border)] bg-[var(--t-surface)] mb-3 last:mb-0 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--t-border-soft)]">
                  <MealTypeBadge type={type} size={44}/>
                  <p className="flex-1 text-[0.65rem] tracking-[0.15em] uppercase text-[var(--t-text-50)]">{type}</p>
                  <p className="text-[0.62rem] text-[var(--t-text-30)]">{groupCal} kcal</p>
                </div>
                <div className="divide-y divide-[var(--t-border-soft)]">
                {items.map(f => {
                  const favMeal = savedMeals.find(s => s.name === f.name);
                  const isFav = !!favMeal;
                  return (
                  <div key={f.id} className="px-4 py-3 group">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-xs text-[var(--t-text-70)] truncate">{f.name}</p>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-[var(--t-text-50)]">{f.calories} kcal</span>
                        <button onClick={() => setFoods(fs => [...fs, { ...f, id: Date.now().toString() }])}
                          title="Reprendre cet aliment aujourd'hui"
                          className="text-[var(--t-text-35)] hover:text-[#c9a84c] transition-colors opacity-70 group-hover:opacity-100">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                        </button>
                        <button
                          onClick={() => favMeal ? removeSavedMeal(favMeal.id) : saveMeal({ ...f, base_qty: 100, unit: "g" })}
                          title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                          className={`transition-colors ${isFav ? "text-[#c9a84c] opacity-100" : "text-[var(--t-text-35)] hover:text-[#c9a84c] opacity-70 group-hover:opacity-100"}`}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        </button>
                        <button
                          onClick={() => {
                            const index = foods.findIndex(x => x.id === f.id);
                            setFoods(fs => fs.filter(x => x.id !== f.id));
                            clearTimeout(undoTimer.current);
                            setDeletedFood({ food: f, index });
                            undoTimer.current = setTimeout(() => setDeletedFood(null), 6000);
                          }}
                          title="Supprimer"
                          className="text-[#e07070]/60 hover:text-[#e07070] transition-colors opacity-70 group-hover:opacity-100">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-3.5 gap-y-1">
                      <MacroChip label="P" value={f.proteines} color="#dd8790"/>
                      <MacroChip label="G" value={f.glucides} color="#e8a374"/>
                      <MacroChip label="L" value={f.lipides} color="#eed37a"/>
                      <MacroChip label="F" value={f.fibres ?? 0} color="#b6a186"/>
                    </div>
                  </div>
                );})}
                </div>
              </div>
            );
          })
        }
          </div>
        </div>
      </div>

      {/* ── Week history ── */}
      <div className="border border-[var(--t-border)] bg-[var(--t-surface)] rounded-xl mt-6">
        <button onClick={() => setShowWeek(v => !v)}
          className="w-full text-left flex items-center justify-between px-5 py-3 hover:bg-[var(--t-glass-bg)] transition-colors rounded-xl">
          <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c]">Cette semaine</p>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            className={`text-[var(--t-text-25)] shrink-0 transition-transform duration-300 ${showWeek ? "rotate-180" : ""}`}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${showWeek ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
          <div className="overflow-hidden">
            <div className="px-5 pb-5 pt-1 border-t border-[var(--t-border-soft)]">
              <div className="flex items-center justify-end gap-3 mb-4">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#c9a84c]"/><span className="text-[0.62rem] text-[var(--t-text-25)]">{useTdee ? "TDEE" : "Objectif"}</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#e07070]"/><span className="text-[0.62rem] text-[var(--t-text-25)]">Excédent</span></div>
              </div>
              <WeekChart history={fullHistory} goal={calTarget}/>
              <div className="mt-4 pt-4 border-t border-[var(--t-border-soft)] grid grid-cols-3 text-center">
                {[
                  { label:"Moyenne / jour", val: avgCal ? `${avgCal} kcal` : "—" },
                  { label:"Jours suivis",   val: daysWithData.length },
                  { label: useTdee ? "TDEE" : "Objectif", val: `${calTarget} kcal` },
                ].map((s, i) => (
                  <div key={s.label} className={i > 0 ? "border-l border-[var(--t-border-soft)]" : ""}>
                    <p style={{ fontFamily:"var(--font-bebas)" }} className="text-lg text-[var(--t-text)] tracking-wide">{s.val}</p>
                    <p className="text-[0.62rem] tracking-wider text-[var(--t-text-25)] uppercase mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ ADD FOOD MODAL ══ */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center px-4" onClick={resetModal}>
          <div className="bg-[var(--t-surface-2)] rounded-xl border border-[var(--t-border)] w-full max-w-lg h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--t-border-soft)]">
              <h3 style={{ fontFamily:"var(--font-bebas)" }} className="text-xl tracking-wider text-[var(--t-text)]">Ajouter un repas</h3>
              <button onClick={resetModal} className="text-[var(--t-text-30)] hover:text-[var(--t-text-60)] transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-5">

              {/* Mode tabs */}
              <div className="flex border border-[var(--t-border)] rounded-xl overflow-hidden">
                <button onClick={() => { setModalMode("ai"); setSelectedSaved(null); }} className={tabCls(modalMode==="ai")}>Estimation IA</button>
                <button onClick={() => { setModalMode("search"); setSelectedSaved(null); }} className={tabCls(modalMode==="search")}>Scan</button>
                <button onClick={() => { setModalMode("saved"); setSelectedSaved(null); }} className={tabCls(modalMode==="saved", false)}>
                  Mes repas{savedMeals.length > 0 && <span className="ml-1 opacity-50">({savedMeals.length})</span>}
                </button>
              </div>

              {/* Moment de la journée : s'applique aux 3 modes ci-dessous */}
              <div>
                <label className={labelCls}>Moment du repas</label>
                <div className="flex gap-1.5">
                  {MEAL_TYPES.map(t => (
                    <button key={t} onClick={() => setAddMealType(t)}
                      className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[0.5rem] tracking-[0.06em] uppercase border transition-colors ${addMealType === t ? "" : "border-[var(--t-border)] text-[var(--t-text-30)] hover:border-[var(--t-text-20)] hover:text-[var(--t-text-50)]"}`}
                      style={addMealType === t
                        ? { borderColor: MEAL_TYPE_COLOR[t], color: MEAL_TYPE_COLOR[t], backgroundColor: `${MEAL_TYPE_COLOR[t]}18` }
                        : undefined}>
                      <MealTypeIcon type={t} size={44} className={`transition-opacity ${addMealType === t ? "opacity-100" : "opacity-45"}`}/>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── AI MODE ── */}
              {modalMode === "ai" && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => photoRef.current?.click()} disabled={analyzing}
                      className="flex items-center justify-center gap-2 border border-[var(--t-border)] text-[var(--t-text-40)] rounded-xl text-[0.7rem] tracking-[0.1em] uppercase px-3 py-2.5 hover:border-[var(--t-text-20)] hover:text-[var(--t-text-60)] transition-colors disabled:opacity-40">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
                      </svg>
                      {photoPreview ? "Reprendre une photo" : "Prendre une photo"}
                    </button>
                    <button onClick={() => galleryRef.current?.click()} disabled={analyzing}
                      className="flex items-center justify-center gap-2 border border-[var(--t-border)] text-[var(--t-text-40)] rounded-xl text-[0.7rem] tracking-[0.1em] uppercase px-3 py-2.5 hover:border-[var(--t-text-20)] hover:text-[var(--t-text-60)] transition-colors disabled:opacity-40">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                      </svg>
                      {photoPreview ? "Changer la photo" : "Choisir une photo"}
                    </button>
                  </div>
                  <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={selectPhoto}/>
                  <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={selectPhoto}/>

                  {photoPreview && (
                    <div className="relative w-24 h-24 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photoPreview} alt="Photo du repas" className="w-full h-full object-cover rounded-xl border border-[var(--t-border)]"/>
                      <button onClick={() => { setPhotoPreview(null); setAiResult(null); try { sessionStorage.removeItem(PHOTO_DRAFT_KEY); } catch { /* ignore */ } }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-black border border-[var(--t-text-20)] rounded-full flex items-center justify-center text-[var(--t-text-60)] hover:text-[var(--t-text)] transition-colors">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  )}

                  <div>
                    <label className={labelCls}>{photoPreview ? "Précisions sur la photo (optionnel)" : "Décris ton repas"}</label>
                    <div className="relative">
                      <textarea
                        className="w-full bg-[var(--t-bg)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/40 transition-colors resize-none pr-12"
                        rows={3} placeholder={photoPreview ? "Ex : sauce à part, pas de fromage…" : "Ex : un bowl de riz avec du saumon grillé et des brocolis…"}
                        value={description} onChange={e => { setDescription(e.target.value); setAiResult(null); }}/>
                      <button onClick={listening ? stopVoice : startVoice}
                        className={`absolute right-3 top-3 p-1.5 rounded-full border transition-colors ${listening?"border-[#e07070] text-[#e07070] animate-pulse":"border-[var(--t-border)] text-[var(--t-text-30)] hover:text-[var(--t-text-60)] hover:border-[var(--t-text-20)]"}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                          <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>
                        </svg>
                      </button>
                    </div>
                    <p className="text-[0.65rem] text-[var(--t-text-20)] mt-1">Tu peux aussi dicter en cliquant sur le micro</p>
                  </div>

                  <div>
                    <label className={labelCls}>Poids en grammes (optionnel)</label>
                    <input className={inputCls} type="number" inputMode="decimal" placeholder="Ex : 150"
                      value={gramsInput}
                      onChange={e => { setGramsInput(e.target.value); if (e.target.value.trim()) setPortionSize(null); setAiResult(null); }}/>
                    <p className="text-[0.65rem] text-[var(--t-text-20)] mt-1">Plus précis que la taille de portion ci-dessous — l&apos;IA l&apos;utilisera comme poids exact du repas.</p>
                  </div>

                  <div>
                    <label className={labelCls}>Taille de la portion (optionnel)</label>
                    <div className={`grid grid-cols-3 gap-2 transition-opacity ${gramsInput.trim() ? "opacity-30 pointer-events-none" : ""}`}>
                      {(["petite", "moyenne", "grande"] as const).map(p => (
                        <button key={p} onClick={() => { setPortionSize(v => v === p ? null : p); setAiResult(null); }}
                          className={`border text-[0.68rem] tracking-[0.1em] uppercase py-2 capitalize transition-colors ${portionSize === p ? "border-[#c9a84c] text-[#c9a84c] bg-[#c9a84c]/10 rounded-xl" : "border-[var(--t-border)] text-[var(--t-text-40)] hover:border-[var(--t-text-20)] hover:text-[var(--t-text-60)] rounded-xl"}`}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {!aiResult && (
                    <button onClick={runAnalysis} disabled={analyzing || (!photoPreview && !description.trim())}
                      className="bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.7rem] font-bold tracking-[0.2em] uppercase py-3.5 shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {analyzing ? <><div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"/>Analyse en cours…</> : "Estimer les macros avec l'IA →"}
                    </button>
                  )}

                  {aiError && <p className="text-xs text-[#e07070] rounded-xl border border-[#e07070]/20 bg-[#e07070]/5 px-3 py-2">{aiError}</p>}

                  {aiResult && (
                    <div className="flex flex-col gap-4">
                      <div className="border border-[#c9a84c]/20 bg-[#c9a84c]/5 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[0.7rem] tracking-[0.15em] uppercase text-[#c9a84c]">Estimation IA</p>
                          <button onClick={() => setAiResult(null)} className="text-[0.65rem] tracking-wider uppercase text-[var(--t-text-25)] hover:text-[var(--t-text-50)] transition-colors">Réestimer</button>
                        </div>
                        <p className="text-xs text-[var(--t-text-70)] mb-3">{aiResult.name}</p>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label:"Calories",  val:aiResult.calories,      unit:"kcal", color:"text-[var(--t-text-60)]" },
                            { label:"Protéines", val:aiResult.proteines,     unit:"g",    color:"text-[#c9a84c]" },
                            { label:"Glucides",  val:aiResult.glucides,      unit:"g",    color:"text-[#7eb8a0]" },
                            { label:"Lipides",   val:aiResult.lipides,       unit:"g",    color:"text-[#e07070]" },
                            { label:"Fibres",    val:aiResult.fibres ?? 0,   unit:"g",    color:"text-[#b6a186]" },
                          ].map(s => (
                            <div key={s.label} className="text-center rounded-xl bg-[var(--t-bg)] border border-[var(--t-border)] py-3">
                              <p style={{ fontFamily:"var(--font-bebas)" }} className={`text-xl tracking-wide ${s.color}`}>{s.val}</p>
                              <p className="text-[0.62rem] tracking-wider text-[var(--t-text-20)] uppercase mt-0.5">{s.unit}</p>
                              <p className="text-[0.62rem] text-[var(--t-text-15)] mt-0.5">{s.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[0.65rem] tracking-wider uppercase text-[var(--t-text-20)] mb-2">Ajuster si nécessaire <span className="normal-case tracking-normal text-[var(--t-text-15)]">(les macros suivent les calories)</span></p>
                        <div className="flex flex-col gap-2">
                          <div><label className={labelCls}>Nom</label><input className={inputCls} value={aiResult.name} onChange={e => setAiResult(r => r ? {...r, name:e.target.value} : r)}/></div>
                          <div className="grid grid-cols-3 gap-2">
                            <div><label className={labelCls}>Cal</label><input className={inputCls} type="number" value={aiResult.calories} onChange={e => adjustAiCalories(+e.target.value)}/></div>
                            <div><label className={labelCls} style={{ color:"#c9a84c" }}>Prot</label><input className={inputCls} type="number" value={aiResult.proteines} onChange={e => setAiResult(r => r ? {...r, proteines:+e.target.value} : r)}/></div>
                            <div><label className={labelCls} style={{ color:"#7eb8a0" }}>Gluc</label><input className={inputCls} type="number" value={aiResult.glucides} onChange={e => setAiResult(r => r ? {...r, glucides:+e.target.value} : r)}/></div>
                            <div><label className={labelCls} style={{ color:"#e07070" }}>Lip</label><input className={inputCls} type="number" value={aiResult.lipides} onChange={e => setAiResult(r => r ? {...r, lipides:+e.target.value} : r)}/></div>
                            <div><label className={labelCls} style={{ color:"#b6a186" }}>Fib</label><input className={inputCls} type="number" value={aiResult.fibres ?? 0} onChange={e => setAiResult(r => r ? {...r, fibres:+e.target.value} : r)}/></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => saveMeal({ ...aiResult, base_qty: 100, unit: "g" })} disabled={savedMeals.some(s => s.name === aiResult.name)}
                          className="flex-1 border border-[var(--t-border)] text-[var(--t-text-40)] rounded-xl text-[0.7rem] tracking-[0.15em] uppercase py-2.5 hover:border-[var(--t-text-20)] hover:text-[var(--t-text-60)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                          {savedMeals.some(s => s.name === aiResult.name) ? "Déjà sauvegardé" : "Sauvegarder"}
                        </button>
                        <button onClick={addFood} className="flex-1 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.7rem] font-bold tracking-[0.2em] uppercase py-2.5 shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 rounded-xl">
                          Ajouter au journal →
                        </button>
                      </div>

                      {/* Signalement d'une estimation qui semble fausse — envoie la photo à
                          Samuel, contrairement au reste du flux où elle n'est jamais conservée. */}
                      {!reportSent && (
                        showReportForm ? (
                          <div className="border border-[var(--t-border)] bg-[var(--t-bg)] rounded-xl p-4 flex flex-col gap-3">
                            <p className="text-[0.62rem] text-[var(--t-text-40)] leading-relaxed">
                              Décris ce qui te semble incorrect. Ta photo sera envoyée à Samuel avec ton message pour l&apos;aider à améliorer l&apos;IA (normalement elle n&apos;est jamais conservée).
                            </p>
                            <textarea className="w-full bg-[var(--t-surface-2)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors resize-none" rows={3}
                              placeholder="Ex : ce plat fait bien plus que 400 kcal, il y avait de l'huile et du fromage en plus..."
                              value={reportComment} onChange={e => setReportComment(e.target.value)}/>
                            <div className="flex gap-2">
                              <button onClick={() => { setShowReportForm(false); setReportComment(""); }}
                                className="flex-1 border border-[var(--t-border)] text-[var(--t-text-40)] rounded-xl text-[0.65rem] tracking-[0.15em] uppercase py-2.5 hover:border-[var(--t-text-20)] hover:text-[var(--t-text-60)] transition-colors">
                                Annuler
                              </button>
                              <button onClick={submitReport} disabled={reportSending || !reportComment.trim()}
                                className="flex-1 bg-[#e07070] text-black text-[0.65rem] font-bold tracking-[0.15em] uppercase py-2.5 hover:bg-[#e58888] transition-colors disabled:opacity-40 rounded-xl">
                                {reportSending ? "Envoi…" : "Envoyer le signalement →"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setShowReportForm(true)}
                            className="text-[0.6rem] tracking-wider uppercase text-[var(--t-text-20)] hover:text-[#e07070]/70 transition-colors text-center py-1">
                            Cette estimation te semble fausse ? Signale-la à Samuel →
                          </button>
                        )
                      )}
                      {reportSent && <p className="text-[0.62rem] text-[#7eb8a0] text-center py-1">Signalement envoyé, merci ! 🙏</p>}
                    </div>
                  )}
                </div>
              )}

              {/* ── SEARCH MODE ── */}
              {modalMode === "search" && (
                <div className="flex flex-col gap-4">
                  <button onClick={openScanner}
                    className="flex items-center justify-center gap-2.5 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.72rem] font-bold tracking-[0.15em] uppercase py-3.5 shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 rounded-xl">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 5h2M3 5v2M21 5h-2M21 5v2M3 19h2M3 19v-2M21 19h-2M21 19v-2"/>
                      <line x1="7" y1="8" x2="7" y2="16"/><line x1="10" y1="8" x2="10" y2="16"/>
                      <line x1="13" y1="8" x2="13" y2="16"/><line x1="16" y1="8" x2="16" y2="11"/>
                      <line x1="16" y1="13" x2="16" y2="16"/>
                    </svg>
                    Scanner un code-barres
                  </button>
                  <input ref={scanRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScan}/>
                  {/* Repli manuel : l'appli caméra native fait sa propre mise au point/exposition
                      avant la capture, donc le résultat est souvent bien plus net qu'une frame
                      prise en direct sur le flux vidéo — utile quand le scan live reste flou. */}
                  <button onClick={() => scanRef.current?.click()}
                    className="text-[0.68rem] tracking-[0.15em] uppercase text-[var(--t-text-30)] hover:text-[var(--t-text-55)] transition-colors -mt-1">
                    Ou prendre une photo du code-barres
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-[var(--t-border)]"/>
                    <span className="text-[0.6rem] tracking-[0.2em] uppercase text-[var(--t-text-20)]">ou</span>
                    <div className="h-px flex-1 bg-[var(--t-border)]"/>
                  </div>

                  <div className="relative">
                    <input className="w-full bg-[var(--t-bg)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-sm pl-4 pr-10 py-3 focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
                      placeholder="Rechercher un aliment par nom…" value={query} onChange={e => { setQuery(e.target.value); setSelected(null); setScanError(""); }}/>
                    {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="w-3 h-3 border border-[#c9a84c] border-t-transparent rounded-full animate-spin"/></div>}
                  </div>
                  {scanError && <p className="text-[0.7rem] text-[#e07070]">{scanError}</p>}

                  {results.length > 0 && !selected && (
                    <div className="flex flex-col border border-[var(--t-border)] rounded-xl overflow-hidden divide-y divide-[var(--t-border-soft)]">
                      {results.map((p,i) => (
                        <button key={i} onClick={() => { setSelected(p); setResults([]); }}
                          className="flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--t-glass-bg)] transition-colors">
                          <div>
                            <p className="text-xs text-[var(--t-text-70)]">{p.product_name}</p>
                            {p.brands && <p className="text-[0.7rem] text-[var(--t-text-25)] mt-0.5">{p.brands}</p>}
                          </div>
                          <span className="text-[0.7rem] text-[var(--t-text-30)] shrink-0 ml-4">{Math.round(p.nutriments["energy-kcal_100g"]??0)} kcal/100g</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {selected && computed && (
                    <div className="border border-[#c9a84c]/20 bg-[#c9a84c]/5 rounded-xl p-4 flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-[var(--t-text-70)]">{selected.product_name}</p>
                          {selected.brands && <p className="text-[0.7rem] text-[var(--t-text-30)] mt-0.5">{selected.brands}</p>}
                        </div>
                        <button onClick={() => { setSelected(null); setQuery(""); }} className="text-[0.7rem] tracking-wider uppercase text-[var(--t-text-25)] hover:text-[var(--t-text-50)] transition-colors">Changer</button>
                      </div>
                      <div><label className={labelCls}>Quantité (g)</label><input className={inputCls} type="number" value={quantity} onChange={e => setQuantity(e.target.value)}/></div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label:"Calories",  val:computed.calories,  color:"text-[var(--t-text-60)]" },
                          { label:"Protéines", val:computed.proteines, color:"text-[#c9a84c]" },
                          { label:"Glucides",  val:computed.glucides,  color:"text-[#7eb8a0]" },
                          { label:"Lipides",   val:computed.lipides,   color:"text-[#e07070]" },
                          { label:"Fibres",    val:computed.fibres,    color:"text-[#b6a186]" },
                        ].map(s => (
                          <div key={s.label} className="text-center rounded-xl bg-[var(--t-bg)] border border-[var(--t-border)] py-3">
                            <p style={{ fontFamily:"var(--font-bebas)" }} className={`text-xl tracking-wide ${s.color}`}>{s.val}</p>
                            <p className="text-[0.62rem] text-[var(--t-text-20)] mt-0.5">{s.label}</p>
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
                            fibres:    selected.nutriments.fiber_100g ?? 0,
                            base_qty: 100, unit: "g",
                          })} disabled={savedMeals.some(s => s.name === selected.product_name)}
                          className="flex-1 border border-[var(--t-border)] text-[var(--t-text-40)] rounded-xl text-[0.7rem] tracking-[0.15em] uppercase py-2.5 hover:border-[var(--t-text-20)] hover:text-[var(--t-text-60)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                          {savedMeals.some(s => s.name === selected.product_name) ? "Déjà sauvegardé" : "Sauvegarder"}
                        </button>
                        <button onClick={addFood} className="flex-1 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.7rem] font-bold tracking-[0.2em] uppercase py-2.5 shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 rounded-xl">
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
                      className="border border-dashed border-[var(--t-border-15)] rounded-xl text-[var(--t-text-35)] text-[0.7rem] tracking-[0.12em] uppercase py-2.5 hover:border-[#c9a84c]/40 hover:text-[#c9a84c]/70 transition-colors">
                      + Créer un produit
                    </button>
                  ) : (
                    <div className="border border-[#c9a84c]/20 bg-[var(--t-surface-gold)] rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c]">Nouveau produit</p>
                        <button onClick={() => { setShowNewProd(false); setNewProd(emptyProd); }} className="text-[var(--t-text-25)] hover:text-[var(--t-text-50)] transition-colors">
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
                                className={`flex-1 py-2.5 rounded-xl text-xs border transition-all ${newProd.unit === u ? "border-[#c9a84c] text-[#c9a84c] bg-[#c9a84c]/5" : "border-[var(--t-border)] text-[var(--t-text-30)] hover:border-[var(--t-text-20)]"}`}>
                                {u}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-[0.65rem] text-[var(--t-text-25)]">Macros pour {newProd.base || "?"} {newProd.unit} :</p>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { key: "calories",  label: "Kcal", color: "text-[var(--t-text-40)]" },
                          { key: "proteines", label: "Prot", color: "text-[#c9a84c]" },
                          { key: "glucides",  label: "Gluc", color: "text-[#7eb8a0]" },
                          { key: "lipides",   label: "Lip",  color: "text-[#e07070]" },
                          { key: "fibres",    label: "Fib",  color: "text-[#b6a186]" },
                        ] as const).map(({ key, label, color }) => (
                          <div key={key}>
                            <label className={`text-[0.62rem] tracking-wider uppercase block mb-1 ${color}`}>{label}</label>
                            <input className={inputCls} type="number" inputMode="decimal" placeholder="0" value={newProd[key]} onChange={e => setNewProd(p => ({ ...p, [key]: e.target.value }))}/>
                          </div>
                        ))}
                      </div>
                      <button onClick={createProduct} disabled={!newProd.name.trim() || !(parseFloat(newProd.base.replace(",", ".")) > 0)}
                        className="bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.58rem] font-bold tracking-[0.18em] uppercase py-2.5 shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed">
                        Enregistrer le produit →
                      </button>
                    </div>
                  )}

                  {savedMeals.length === 0 && !showNewProd ? (
                    <div className="text-center py-10 rounded-xl border border-[var(--t-border-soft)]">
                      <p className="text-[var(--t-text-20)] text-xs mb-1">Aucun repas sauvegardé</p>
                      <p className="text-[var(--t-text-10)] text-[0.7rem]">Crée un produit ci-dessus, ou utilise l&apos;IA / la recherche et clique sur &quot;Sauvegarder&quot;</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {savedMeals.map(meal => (
                        <div key={meal.id} onClick={() => { setShowNewProd(false); setSelectedSaved(s => s?.id === meal.id ? null : meal); setSavedQty(String(meal.base_qty ?? 100)); }}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-all ${selectedSaved?.id === meal.id ? "border-[#c9a84c] bg-[#c9a84c]/5" : "border-[var(--t-border)] hover:border-[var(--t-text-20)]"}`}>
                          <div>
                            <p className="text-xs text-[var(--t-text-70)]">{meal.name}</p>
                            <p className="text-[0.65rem] text-[var(--t-text-25)] mt-0.5">
                              {meal.base_qty ? `Pour ${meal.base_qty} ${meal.unit ?? "g"} · ` : ""}P {Math.round(meal.proteines)}g · G {Math.round(meal.glucides)}g · L {Math.round(meal.lipides)}g · F {Math.round(meal.fibres ?? 0)}g
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-[var(--t-text-40)]">{Math.round(meal.calories)} kcal</span>
                            <button onClick={e => { e.stopPropagation(); removeSavedMeal(meal.id); if (selectedSaved?.id === meal.id) setSelectedSaved(null); }}
                              className="text-[var(--t-text-15)] hover:text-[#e07070] transition-colors p-1.5 -m-1.5">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quantité + macros recalculées pour les produits à quantité de base */}
                  {selectedSaved && savedComputed && (
                    <div className="border border-[#c9a84c]/20 bg-[#c9a84c]/5 rounded-xl p-4 flex flex-col gap-4">
                      <div><label className={labelCls}>Quantité ({selectedSaved.unit ?? "g"})</label>
                        <input className={inputCls} type="number" inputMode="decimal" value={savedQty} onChange={e => setSavedQty(e.target.value)}/>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label:"Calories",  val:savedComputed.calories,  color:"text-[var(--t-text-60)]" },
                          { label:"Protéines", val:savedComputed.proteines, color:"text-[#c9a84c]" },
                          { label:"Glucides",  val:savedComputed.glucides,  color:"text-[#7eb8a0]" },
                          { label:"Lipides",   val:savedComputed.lipides,   color:"text-[#e07070]" },
                          { label:"Fibres",    val:savedComputed.fibres,    color:"text-[#b6a186]" },
                        ].map(s => (
                          <div key={s.label} className="text-center rounded-xl bg-[var(--t-bg)] border border-[var(--t-border)] py-3">
                            <p style={{ fontFamily:"var(--font-bebas)" }} className={`text-xl tracking-wide ${s.color}`}>{s.val}</p>
                            <p className="text-[0.62rem] text-[var(--t-text-20)] mt-0.5">{s.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedSaved && (
                    <button onClick={addFood} className="bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.7rem] font-bold tracking-[0.2em] uppercase py-3.5 shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 rounded-xl">
                      Ajouter &quot;{selectedSaved.name}&quot; ({savedQty || 0} {selectedSaved.unit ?? "g"}) au journal →
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
          <div className="bg-[var(--t-surface-2)] rounded-xl border border-[var(--t-border)] w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 style={{ fontFamily:"var(--font-bebas)" }} className="text-xl tracking-wider text-[var(--t-text)]">Objectifs journaliers</h3>
              <button onClick={() => setShowGoals(false)} className="text-[var(--t-text-30)] hover:text-[var(--t-text-60)] transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="mb-5">
              <label className={labelCls}>Calories totales (kcal)</label>
              <input className={inputCls} type="number" value={rawGoal.calories}
                onChange={e => setRawGoal(r => ({ ...r, calories: e.target.value }))}
                onBlur={commitCalories}
                onKeyDown={e => { if (e.key === "Enter") commitCalories(); }}/>
              <p className="text-[0.65rem] text-[var(--t-text-20)] mt-1">Modifier les calories redistribue les macros proportionnellement</p>
            </div>
            <div className="flex flex-col gap-4 mb-5">
              {macroConfig.map(({ key, label, color }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[0.7rem] tracking-[0.2em] uppercase block" style={{ color }}>{label} (g)</label>
                    <span className="text-[0.65rem] text-[var(--t-text-20)]">{Math.round(goalDraft[key]*CAL[key])} kcal</span>
                  </div>
                  <input className={inputCls} type="number" value={rawGoal[key]}
                    onChange={e => setRawGoal(r => ({ ...r, [key]: e.target.value }))}
                    onBlur={() => commitMacro(key)}
                    onKeyDown={e => { if (e.key === "Enter") commitMacro(key); }}/>
                  <p className="text-[0.65rem] text-[var(--t-text-15)] mt-1">Les autres macros s&apos;ajustent pour rester à {goalDraft.calories} kcal</p>
                </div>
              ))}
              <div>
                <label className="text-[0.7rem] tracking-[0.2em] uppercase block mb-1.5 text-[var(--t-text-40)]">Fibres (g)</label>
                <input className={inputCls} type="number" value={rawGoal.fibres}
                  onChange={e => setRawGoal(r => ({ ...r, fibres: e.target.value }))}
                  onBlur={commitFibres}
                  onKeyDown={e => { if (e.key === "Enter") commitFibres(); }}/>
                <p className="text-[0.65rem] text-[var(--t-text-15)] mt-1">Objectif indépendant, non lié aux calories</p>
              </div>
            </div>
            <button onClick={() => { setGoals(goalDraft); setGoalsSet(true); setShowGoals(false); }}
              className="w-full bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.7rem] font-bold tracking-[0.2em] uppercase py-3.5 shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 rounded-xl">
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* ══ SCANNER CAMÉRA LIVE ══ */}
      {scannerOpen && (
        <div className="fixed inset-0 bg-black z-[60] flex flex-col">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover"/>
          <div className="absolute inset-0 bg-black/35"/>

          {/* Cadre de visée */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-8 gap-4">
            <div className="relative w-full max-w-sm aspect-[16/10]">
              <div className="absolute inset-0 border border-[#c9a84c]/40"/>
              <div className="absolute -top-px -left-px w-7 h-7 border-t-[3px] border-l-[3px] border-[#e2c97e]"/>
              <div className="absolute -top-px -right-px w-7 h-7 border-t-[3px] border-r-[3px] border-[#e2c97e]"/>
              <div className="absolute -bottom-px -left-px w-7 h-7 border-b-[3px] border-l-[3px] border-[#e2c97e]"/>
              <div className="absolute -bottom-px -right-px w-7 h-7 border-b-[3px] border-r-[3px] border-[#e2c97e]"/>
            </div>
            <p className="text-[var(--t-text-40)] text-[0.6rem] tracking-[0.12em] uppercase text-center max-w-[220px]">
              Tiens le téléphone stable, à 15-20 cm (trop près = flou), code-barres bien à plat
            </p>
            {scanTakingLong && (
              <button onClick={stopScanner}
                className="pointer-events-auto bg-[var(--t-surface)] text-[var(--t-text-70)] text-[0.62rem] tracking-[0.12em] uppercase px-4 py-2.5 rounded-full border border-[var(--t-border-15)] hover:border-[#c9a84c]/40 hover:text-[#c9a84c] transition-colors">
                Toujours rien ? Recherche le nom manuellement
              </button>
            )}
          </div>

          <div className="relative z-10 flex items-center justify-between px-5 pt-6">
            <p className="text-[var(--t-text-70)] text-[0.68rem] tracking-[0.15em] uppercase">Aligne le code-barres dans le cadre</p>
            <div className="flex items-center gap-3">
              {torchAvailable && (
                <button onClick={toggleTorch}
                  className={`p-1.5 rounded-full transition-colors ${torchOn ? "text-[#e2c97e] bg-[#c9a84c]/15" : "text-[var(--t-text-70)] hover:text-[var(--t-text)]"}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={torchOn ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18h6M10 22h4M15 14c1.5-1.26 2-2.5 2-4a5 5 0 0 0-10 0c0 1.5.5 2.74 2 4 .93.78 1 1.5 1 2h4c0-.5.07-1.22 1-2Z"/>
                  </svg>
                </button>
              )}
              <button onClick={stopScanner} className="text-[var(--t-text-70)] hover:text-[var(--t-text)] transition-colors p-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          {scanError && (
            <p className="relative z-10 text-center text-[#e07070] text-xs mt-6 px-8">{scanError}</p>
          )}
        </div>
      )}

      {/* ══ ANNULER SUPPRESSION ══ */}
      {deletedFood && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-4 bg-[var(--t-surface)] border border-[var(--t-border-15)] rounded-xl px-5 py-3 shadow-lg">
          <span className="text-xs text-[var(--t-text-70)]">
            &quot;{deletedFood.food.name}&quot; supprimé
          </span>
          <button
            onClick={() => {
              clearTimeout(undoTimer.current);
              setFoods(fs => {
                const copy = [...fs];
                copy.splice(Math.min(deletedFood.index, copy.length), 0, deletedFood.food);
                return copy;
              });
              setDeletedFood(null);
            }}
            className="text-[0.7rem] tracking-[0.15em] uppercase text-[#c9a84c] hover:text-[#e2c97e] transition-colors">
            Annuler
          </button>
        </div>
      )}

      {/* ══ ANNULER SUPPRESSION FAVORI ══ */}
      {deletedMeal && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-4 bg-[var(--t-surface)] border border-[var(--t-border-15)] rounded-xl px-5 py-3 shadow-lg">
          <span className="text-xs text-[var(--t-text-70)]">
            &quot;{deletedMeal.meal.name}&quot; retiré des favoris
          </span>
          <button
            onClick={() => {
              clearTimeout(undoMealTimer.current);
              setSavedMeals(s => {
                const copy = [...s];
                copy.splice(Math.min(deletedMeal.index, copy.length), 0, deletedMeal.meal);
                return copy;
              });
              setDeletedMeal(null);
            }}
            className="text-[0.7rem] tracking-[0.15em] uppercase text-[#c9a84c] hover:text-[#e2c97e] transition-colors">
            Annuler
          </button>
        </div>
      )}
    </div>
  );
}
