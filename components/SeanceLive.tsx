"use client";
import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import { supabase } from "@/lib/supabase";
import { type ExerciceItem, type SetDetail, type RepKind, REP_KINDS, REP_KIND_LABELS, REP_KIND_COLUMN_LABEL, REP_KIND_PLACEHOLDER, REP_KIND_SUFFIX, parseExercices, serializeExercices, emptyExercice, groupExerciceRuns, targetSetsFor, effectiveLoad } from "@/lib/exercices";
import { useWakeLock } from "@/lib/useWakeLock";
import { getMyCoachEmail } from "@/lib/coach";
import {
  estimate1RM, isNewRecord, parseRestSeconds,
  loadSeanceLogs, saveSetLog, deleteSetLog, loadExerciceHistory, type LastPerformance,
} from "@/lib/workoutLog";
import { loadExerciceSessionOutcomes, suggestProgression, type ProgressionSuggestion } from "@/lib/progression";
import { loadCatalogue, type CatalogueEntry } from "@/lib/exercicesCatalogue";
import { ExercicePicker } from "@/components/ExercicePicker";
import { numOr } from "@/components/NumberStepper";
import { SetInputCell } from "@/components/SetInputCell";
import { Icon } from "@/components/Icon";
import { RichIcon } from "@/components/RichIcon";
import { TdeeIcon } from "@/components/CalRefToggle";
import { Check, X, ChevronLeft, ChevronRight, Plus, Trash2, Clock, Layers, Lock, Play, Pause } from "@/lib/solarIcons";
import { RoundTimer } from "@/components/RoundTimer";

type LiveSeance = { id: string; titre: string; exercices: string | null };
// Paliers d'une série dégressive (drop set) : une chute de charge enchaînée sans repos
// juste après la série principale — poids/reps propres à chaque palier. Comme `warmup`,
// c'est local à la séance en cours (pas de colonne dédiée dans seance_logs) : ça décrit la
// façon dont la série a été exécutée, pas une donnée que le programme doit se souvenir
// d'une séance à l'autre.
type DropStep = { poids: string; reps: string };
// Paliers d'une montée en charge d'échauffement (ex. 60/100/140 kg avant la série de travail) :
// même forme que DropStep, mais rattachés à une série marquée `warmup` — ni les paliers ni la
// série qui les porte ne comptent dans le volume/calories/records (cf. les gardes `l.warmup`
// plus bas, qui excluent la série et ne lisent jamais `warmupSteps`).
type SetLogState = { poids: string; reps: string; rir: string; done: boolean; warmup?: boolean; drops?: DropStep[]; warmupSteps?: DropStep[] };

const genId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`);

const fmtClock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const fmtDuration = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
};

// Pour une série en temps/distance, "poids×reps" n'a pas de sens ("0×12" pour 12 secondes) —
// on affiche juste la valeur avec son unité (Préc. 12sec / Préc. 400m) plutôt que de forcer
// le même gabarit poids×quantité que pour une série de force classique.
const fmtPrev = (p: { poids: number | null; reps: number | null } | undefined, repKind: RepKind = "reps") => {
  if (!p || (p.poids == null && p.reps == null)) return "—";
  if (repKind !== "reps") return p.reps != null ? `${p.reps}${REP_KIND_SUFFIX[repKind]}` : (p.poids != null ? `${p.poids}kg` : "—");
  return `${p.poids ?? "–"}×${p.reps ?? "–"}`;
};

// Une séance planifiée fixe un nombre de séries par exercice, mais le client peut vouloir en
// faire une de plus un bon jour — displaySets ajoute des slots "libres" (sans cible écrite par
// le coach) après les séries prévues, comptés localement tant qu'ils ne sont pas loggués.
function displaySetsFor(ex: ExerciceItem, extra: number): { target: SetDetail; isExtra: boolean }[] {
  const base = targetSetsFor(ex).map(target => ({ target, isExtra: false }));
  const lastRepos = base.length ? base[base.length - 1].target.repos : "";
  const extras = Array.from({ length: extra }, () => ({ target: { reps: "", poids: "", repos: lastRepos, rpe: "", tempo: "" }, isExtra: true }));
  return [...base, ...extras];
}

// Chips plutôt qu'un menu déroulant : 5 options seulement, autant les rendre toutes
// visibles et tapables d'un coup — plus rapide et plus "gros bouton" qu'ouvrir un select.
// Barre défilante (slider natif) plutôt que des chips figées à 0-4 : la plage complète
// RIR/RPE (0-10) reste accessible d'un glissement, et le chiffre au-dessus est un vrai
// champ éditable — on peut taper directement une valeur précise plutôt que de scruter le
// curseur.
const RIR_MAX = 10;
function RirSlider({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const n = numOr(value);
  const pct = n == null ? 0 : Math.min(100, Math.max(0, (n / RIR_MAX) * 100));
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[0.6rem] tracking-[0.15em] uppercase text-[var(--t-text-25)]">RIR / RPE</span>
        <input type="number" inputMode="decimal" min={0} max={RIR_MAX} step={0.5} placeholder="—" value={value}
          onChange={e => onChange(e.target.value)}
          className="w-14 bg-transparent text-right text-sm font-bold text-[var(--t-text)] placeholder-[var(--t-text-20)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
      </div>
      <div className="relative h-6 flex items-center">
        <div className="absolute inset-x-0 h-2 rounded-full bg-[var(--t-track)] overflow-hidden pointer-events-none">
          <div className="h-full bg-gradient-to-r from-[#e2c97e] to-[#c9a84c] rounded-full transition-all" style={{ width: `${pct}%` }}/>
        </div>
        <input type="range" min={0} max={RIR_MAX} step={0.5} value={n ?? 0}
          onChange={e => onChange(e.target.value)}
          className="relative w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-runnable-track]:bg-transparent [&::-moz-range-track]:bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#c9a84c] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--t-bg)] [&::-webkit-slider-thumb]:shadow-[0_2px_6px_rgba(0,0,0,0.3)] [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[var(--t-bg)] [&::-moz-range-thumb]:bg-[#c9a84c]"/>
      </div>
    </div>
  );
}

// Swipe pour supprimer, façon Forge : évite d'ajouter un bouton "supprimer" en plus dans une
// carte déjà dense — seule la dernière série "extra" d'un exercice est swipeable (canRemove),
// les séries prévues par le coach restent fixes. Le tirage suit le doigt (dragX), un relâcher
// au-delà du seuil déclenche la suppression, sinon la carte revient à sa place.
const SWIPE_THRESHOLD = -60;
const SWIPE_MAX = -88;

// Chaque série est sa propre carte (plutôt qu'une ligne de tableau compressée) : les
// chiffres poids/reps — l'info la plus regardée pendant l'effort — ont la place d'être
// gros, et le bouton de validation devient une vraie cible tactile plutôt qu'un point.
function SetRow({ target, idx, log, prev, isExtra, canRemove, bodyweight, repKind, onToggle, onChange, onCopyPrev, onToggleWarmup, onRemove, onAddDrop, onChangeDrop, onRemoveDrop, onAddWarmupStep, onChangeWarmupStep, onRemoveWarmupStep }: {
  target: SetDetail; idx: number; log: SetLogState | undefined; prev: { poids: number | null; reps: number | null } | undefined;
  isExtra: boolean; canRemove: boolean; bodyweight?: boolean; repKind: RepKind; onToggle: () => void; onChange: (field: "poids" | "reps" | "rir", val: string) => void;
  onCopyPrev: () => void; onToggleWarmup: () => void; onRemove: () => void;
  onAddDrop: () => void; onChangeDrop: (dropIdx: number, field: "poids" | "reps", val: string) => void; onRemoveDrop: (dropIdx: number) => void;
  onAddWarmupStep: () => void; onChangeWarmupStep: (stepIdx: number, field: "poids" | "reps", val: string) => void; onRemoveWarmupStep: (stepIdx: number) => void;
}) {
  const hasPrev = prev && (prev.poids != null || prev.reps != null);
  const done = !!log?.done;
  const warmup = !!log?.warmup;
  const drops = log?.drops ?? [];
  const warmupSteps = log?.warmupSteps ?? [];
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartX = useRef(0);

  const onTouchStart = (e: TouchEvent) => { e.stopPropagation(); setDragging(true); dragStartX.current = e.touches[0].clientX; };
  const onTouchMove = (e: TouchEvent) => {
    e.stopPropagation();
    setDragX(Math.max(SWIPE_MAX, Math.min(0, e.touches[0].clientX - dragStartX.current)));
  };
  const onTouchEndSwipe = (e: TouchEvent) => {
    e.stopPropagation();
    setDragging(false);
    if (dragX <= SWIPE_THRESHOLD) onRemove();
    setDragX(0);
  };

  // Placeholder "fantôme" : la valeur de la dernière fois plutôt qu'un simple libellé
  // générique — visible directement dans le champ sans avoir à taper sur le lien "Préc.".
  const kgPlaceholder = prev?.poids != null ? String(prev.poids) : (bodyweight ? "+kg" : target.poids || "kg");
  const repsPlaceholder = prev?.reps != null ? String(prev.reps) : (target.reps || REP_KIND_PLACEHOLDER[repKind]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl">
      {/* Le panneau rouge n'est révélé qu'à hauteur du tirage (largeur liée à dragX) plutôt
          que présent en pleine largeur derrière la carte au repos : certaines cartes (série
          "extra") ont un fond légèrement translucide, un panneau plein-largeur toujours
          présent transparaîtrait derrière même sans swipe. */}
      {canRemove && (
        <div className="absolute inset-y-0 right-0 overflow-hidden rounded-2xl" style={{ width: Math.max(0, -dragX) }}>
          <div className="absolute inset-y-0 right-0 w-20 bg-[#e07070] flex flex-col items-center justify-center gap-0.5 text-white">
            <Icon icon={Trash2} size={17} strokeWidth={2}/>
            <span className="text-[0.55rem] tracking-wide uppercase">Suppr.</span>
          </div>
        </div>
      )}
      <div {...(canRemove ? { onTouchStart, onTouchMove, onTouchEnd: onTouchEndSwipe } : {})}
        style={{ transform: `translateX(${dragX}px)` }}
        className={`relative w-full rounded-2xl border p-3.5 flex flex-col gap-3 ${dragging ? "" : "transition-[transform,background-color,border-color] duration-200"} ${
          done ? "border-[#7eb8a0]/40 bg-[#7eb8a0]/[0.08]" : warmup ? "border-[#e0834a]/35 bg-[#e0834a]/[0.06]" : drops.length > 0 ? "border-[#8aa0e0]/35 bg-[#8aa0e0]/[0.06]" : isExtra ? "border-[#c9a84c]/25 bg-[#c9a84c]/[0.04]" : "border-[var(--t-border-soft)] bg-[var(--t-bg)]"}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${done ? "bg-[#7eb8a0] text-black" : "bg-[var(--t-track)] text-[var(--t-text-40)]"}`}>{idx + 1}</span>
            {hasPrev && (
              done ? (
                <span className="text-xs text-[var(--t-text-20)] truncate">Préc. {fmtPrev(prev, repKind)}</span>
              ) : (
                <button onClick={onCopyPrev} className="text-xs text-[var(--t-text-30)] truncate hover:text-[#c9a84c] transition-colors underline decoration-dotted decoration-[var(--t-text-15)]">
                  Préc. {fmtPrev(prev, repKind)}
                </button>
              )
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {/* La suppression au swipe (gauche) reste dispo, mais sans aucun indice visuel
                au repos — le panneau rouge n'apparaît qu'une fois le doigt déjà en train de
                glisser. Un bouton explicite ici, comme dans SeanceBuilder, pour que "je ne
                peux pas supprimer cette série" ne se reproduise pas. */}
            {canRemove && (
              <button onClick={onRemove} title="Supprimer cette série" aria-label="Supprimer cette série"
                className="text-[var(--t-text-20)] hover:text-[#e07070] transition-colors p-2 -m-1">
                <Icon icon={Trash2} size={14} strokeWidth={2}/>
              </button>
            )}
            <button onClick={onToggleWarmup} title="Série d'échauffement — exclue du volume et des records"
              className={`text-[0.58rem] tracking-wide uppercase px-2 py-2 rounded-full border transition-colors ${warmup ? "border-[#e0834a]/50 bg-[#e0834a]/10 text-[#e0834a]" : "border-[var(--t-border)] text-[var(--t-text-20)] hover:text-[var(--t-text-50)]"}`}>
              Éch.
            </button>
            <button onClick={onToggle}
              className={`w-12 h-12 rounded-full border-2 shrink-0 flex items-center justify-center transition-all active:scale-90 ${done ? "bg-[#7eb8a0] border-[#7eb8a0] text-black" : "border-[var(--t-border)] text-transparent hover:border-[#7eb8a0]/50"}`}>
              <Icon icon={Check} size={22} strokeWidth={3}/>
            </button>
          </div>
        </div>

        {/* Montée en charge d'échauffement : plusieurs paliers (ex. 60/100/140 kg) avant la
            série de travail, saisis directement dans cette même carte plutôt que comme des
            séries à part — n'apparaît que sur une carte marquée "Éch.", puisque aucun palier
            ne doit compter comme une série effective (même exclusion que la carte elle-même). */}
        {warmup && (
          <div className="flex flex-col gap-2.5 pl-3 border-l-2 border-[#e0834a]/30">
            {warmupSteps.map((w, wi) => (
              <div key={wi} className="flex items-center gap-2">
                <span className="text-[0.58rem] tracking-wide uppercase text-[#e0834a] shrink-0 w-14">Palier {wi + 1}</span>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <SetInputCell kind="kg" value={w.poids} placeholder="kg" onChange={v => onChangeWarmupStep(wi, "poids", v)}/>
                  <SetInputCell kind={repKind} value={w.reps} placeholder={REP_KIND_PLACEHOLDER[repKind]} onChange={v => onChangeWarmupStep(wi, "reps", v)}/>
                </div>
                <button onClick={() => onRemoveWarmupStep(wi)} title="Retirer ce palier"
                  className="shrink-0 text-[var(--t-text-15)] hover:text-[#e07070] transition-colors p-2 -m-1">
                  <Icon icon={X} size={12} strokeWidth={2.5}/>
                </button>
              </div>
            ))}
            <button onClick={onAddWarmupStep}
              className="self-start flex items-center gap-1.5 text-[0.6rem] tracking-wide uppercase text-[#e0834a]/80 hover:text-[#e0834a] transition-colors py-1">
              <Icon icon={Plus} size={11} strokeWidth={2.5}/> Palier échauffement
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <SetInputCell kind="kg" label={bodyweight ? "Kg additionnels" : "Kg"} value={log?.poids ?? ""} placeholder={kgPlaceholder} onChange={v => onChange("poids", v)} accent/>
          <SetInputCell kind={repKind} label={REP_KIND_COLUMN_LABEL[repKind]} value={log?.reps ?? ""} placeholder={repsPlaceholder} onChange={v => onChange("reps", v)}/>
        </div>
        <RirSlider value={log?.rir ?? ""} onChange={v => onChange("rir", v)}/>

        {/* Paliers d'une série dégressive : chute de charge enchaînée juste après la série
            principale, sans repos — chaque palier a sa propre saisie kg/reps, indentée pour
            se lire comme un prolongement de la série plutôt qu'une nouvelle série à part. */}
        {drops.length > 0 && (
          <div className="flex flex-col gap-2.5 pl-3 border-l-2 border-[#8aa0e0]/30">
            {drops.map((d, di) => (
              <div key={di} className="flex items-center gap-2">
                <span className="text-[0.58rem] tracking-wide uppercase text-[#8aa0e0] shrink-0 w-14">Palier {di + 1}</span>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <SetInputCell kind="kg" value={d.poids} placeholder="kg" onChange={v => onChangeDrop(di, "poids", v)}/>
                  <SetInputCell kind={repKind} value={d.reps} placeholder={REP_KIND_PLACEHOLDER[repKind]} onChange={v => onChangeDrop(di, "reps", v)}/>
                </div>
                <button onClick={() => onRemoveDrop(di)} title="Retirer ce palier"
                  className="shrink-0 text-[var(--t-text-15)] hover:text-[#e07070] transition-colors p-2 -m-1">
                  <Icon icon={X} size={12} strokeWidth={2.5}/>
                </button>
              </div>
            ))}
          </div>
        )}
        <button onClick={onAddDrop}
          className="self-start flex items-center gap-1.5 text-[0.6rem] tracking-wide uppercase text-[#8aa0e0]/80 hover:text-[#8aa0e0] transition-colors py-1">
          <Icon icon={Plus} size={11} strokeWidth={2.5}/> Palier dégressif
        </button>
      </div>
    </div>
  );
}

function ExerciceLiveBlock({ ex, exIdx, logs, history, prBadge, extra, onToggle, onChange, onAddSet, onToggleWarmup, onRemoveExtra, onAddDrop, onChangeDrop, onRemoveDrop, onAddWarmupStep, onChangeWarmupStep, onRemoveWarmupStep, onChangeRepKind, onRemoveExercice }: {
  ex: ExerciceItem; exIdx: number; logs: Record<string, SetLogState>; history: LastPerformance; prBadge: boolean; extra: number;
  onToggle: (exIdx: number, setIdx: number, target: SetDetail) => void;
  onChange: (exIdx: number, setIdx: number, field: "poids" | "reps" | "rir", val: string) => void;
  onAddSet: (exIdx: number) => void;
  onToggleWarmup: (exIdx: number, setIdx: number) => void;
  onRemoveExtra: (exIdx: number) => void;
  onAddDrop: (exIdx: number, setIdx: number) => void;
  onChangeDrop: (exIdx: number, setIdx: number, dropIdx: number, field: "poids" | "reps", val: string) => void;
  onRemoveDrop: (exIdx: number, setIdx: number, dropIdx: number) => void;
  onAddWarmupStep: (exIdx: number, setIdx: number) => void;
  onChangeWarmupStep: (exIdx: number, setIdx: number, stepIdx: number, field: "poids" | "reps", val: string) => void;
  onRemoveWarmupStep: (exIdx: number, setIdx: number, stepIdx: number) => void;
  onChangeRepKind: (exIdx: number, kind: RepKind) => void;
  onRemoveExercice: (exIdx: number) => void;
}) {
  const [unlockedRepKind, setUnlockedRepKind] = useState(false);
  const rows = displaySetsFor(ex, extra);
  const doneCount = rows.filter((_, i) => logs[`${exIdx}-${i}`]?.done).length;
  const pct = rows.length ? Math.round((doneCount / rows.length) * 100) : 0;
  const complete = rows.length > 0 && doneCount === rows.length;
  return (
    <div className={`border rounded-2xl p-4 flex flex-col gap-4 transition-colors ${complete ? "border-[#7eb8a0]/30 bg-[#7eb8a0]/[0.04]" : "border-[var(--t-border-soft)] bg-[var(--t-surface)]"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-lg font-bold text-[var(--t-text)] truncate">{ex.nom}</p>
            {ex.bodyweight && <span className="text-[0.6rem] text-[var(--t-text-30)] shrink-0" title="Charge = poids de corps + lest">🏋️ PDC</span>}
            {prBadge && <span className="text-xs text-[#c9a84c] shrink-0 font-medium">🏆 Record</span>}
          </div>
          {rows.length > 0 && (
            <div className="flex items-center gap-2.5 mt-2">
              <div className="h-2 w-28 bg-[var(--t-track)] rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${complete ? "bg-[#7eb8a0]" : "bg-[#c9a84c]"}`} style={{ width: `${pct}%` }}/>
              </div>
              <span className={`text-xs tracking-wider shrink-0 font-bold ${complete ? "text-[#7eb8a0]" : "text-[var(--t-text-30)]"}`}>{doneCount}/{rows.length}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {complete && <span className="text-[#7eb8a0] text-2xl">✓</span>}
          {/* Aucun moyen de retirer un exercice entier de la séance en direct jusqu'ici —
              seules les séries "extra" ajoutées en trop l'étaient. Toujours visible (pas
              planqué dans un menu), avec confirmation qui prévient explicitement si des
              séries sont déjà loguées dessus. */}
          <button onClick={() => onRemoveExercice(exIdx)} aria-label={`Supprimer ${ex.nom}`} title="Supprimer cet exercice"
            className="text-[var(--t-text-20)] hover:text-[#e07070] transition-colors p-2 -m-2">
            <Icon icon={Trash2} size={16} strokeWidth={1.8}/>
          </button>
        </div>
      </div>

      {/* Un exercice ajouté en direct (Bibliothèque, Nom libre) n'est jamais passé par
          SeanceBuilder — sans ce toggle ici aussi, impossible de marquer un fractionné
          improvisé en "Temps" pendant la séance elle-même. Compact (pas la même taille que
          dans le builder) : ici c'est un réglage secondaire au milieu du logging, pas le
          point d'entrée principal de la carte.
          Verrouillé dès qu'une série est loguée : "10" veut dire une chose différente selon
          l'unité (10 reps ≠ 10 sec ≠ 10 m), donc changer l'unité après coup réinterprète
          silencieusement des séries déjà faites sans qu'aucune nouvelle saisie ne le signale
          — remonté par le user ("tu switch et ça retouche tout"). Un tap sur le cadenas
          déverrouille pour de bon (après confirmation), pas de retour en arrière automatique. */}
      {rows.length > 0 && (
        doneCount > 0 && !unlockedRepKind ? (
          <button onClick={() => { if (window.confirm(`"${ex.nom}" a déjà des séries loguées en ${REP_KIND_LABELS[ex.repKind].toLowerCase()}. Changer l'unité ne les convertit pas — un "10" resterait "10" mais ne voudrait plus dire la même chose. Déverrouiller quand même ?`)) setUnlockedRepKind(true); }}
            className="self-start flex items-center gap-1.5 -mt-1 text-[0.55rem] tracking-[0.06em] uppercase text-[var(--t-text-20)] hover:text-[var(--t-text-40)] transition-colors py-1">
            <Icon icon={Lock} size={11}/> {REP_KIND_LABELS[ex.repKind]} verrouillé
          </button>
        ) : (
          <div className="flex gap-1.5 -mt-1">
            {REP_KINDS.map(k => {
              const active = ex.repKind === k;
              return (
                <button key={k} onClick={() => onChangeRepKind(exIdx, k)}
                  className={`flex-1 text-[0.55rem] tracking-[0.06em] uppercase py-1 rounded-full border transition-colors ${
                    active ? "border-[#c9a84c]/50 bg-[#c9a84c]/10 text-[#c9a84c]" : "border-[var(--t-border)] text-[var(--t-text-20)] hover:text-[var(--t-text-50)]"}`}>
                  {REP_KIND_LABELS[k]}
                </button>
              );
            })}
          </div>
        )
      )}

      {rows.length > 0 ? (
        <>
          <div className="flex flex-col gap-2.5">
            {rows.map((row, setIdx) => (
              <SetRow key={setIdx} target={row.target} idx={setIdx} isExtra={row.isExtra} canRemove={row.isExtra && setIdx === rows.length - 1} bodyweight={ex.bodyweight} repKind={ex.repKind}
                log={logs[`${exIdx}-${setIdx}`]} prev={history[setIdx]}
                onToggle={() => onToggle(exIdx, setIdx, row.target)}
                onChange={(field, val) => onChange(exIdx, setIdx, field, val)}
                onCopyPrev={() => { const p = history[setIdx]; if (p?.poids != null) onChange(exIdx, setIdx, "poids", String(p.poids)); if (p?.reps != null) onChange(exIdx, setIdx, "reps", String(p.reps)); }}
                onToggleWarmup={() => onToggleWarmup(exIdx, setIdx)}
                onRemove={() => onRemoveExtra(exIdx)}
                onAddDrop={() => onAddDrop(exIdx, setIdx)}
                onChangeDrop={(dropIdx, field, val) => onChangeDrop(exIdx, setIdx, dropIdx, field, val)}
                onRemoveDrop={dropIdx => onRemoveDrop(exIdx, setIdx, dropIdx)}
                onAddWarmupStep={() => onAddWarmupStep(exIdx, setIdx)}
                onChangeWarmupStep={(stepIdx, field, val) => onChangeWarmupStep(exIdx, setIdx, stepIdx, field, val)}
                onRemoveWarmupStep={stepIdx => onRemoveWarmupStep(exIdx, setIdx, stepIdx)}/>
            ))}
          </div>
          <button onClick={() => onAddSet(exIdx)}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-[var(--t-border)] rounded-xl text-xs tracking-wider uppercase text-[var(--t-text-30)] hover:text-[#c9a84c] hover:border-[#c9a84c]/40 transition-colors py-3 font-bold">
            <Icon icon={Plus} size={14} strokeWidth={2.5}/> Ajouter une série
          </button>
        </>
      ) : ex.texteLibre ? (
        <p className="text-[0.72rem] text-[var(--t-text-50)] leading-relaxed whitespace-pre-wrap">{ex.texteLibre}</p>
      ) : null}
      {ex.note && <p className="text-[0.68rem] text-[var(--t-text-35)] italic">{ex.note}</p>}
    </div>
  );
}

export function SeanceLive({ seance, clientId, clientBodyweight = null, onFinish, onClose, onDelete }: {
  seance: LiveSeance; clientId: string; clientBodyweight?: number | null; onFinish: () => void; onClose: () => void; onDelete: () => void | Promise<void>;
}) {
  // Séance mutable en mémoire : on part de la liste planifiée, mais le client peut vouloir
  // ajouter un exercice non prévu en cours de séance (improvisation, machine libre trouvée
  // sur place…) — géré comme un état local plutôt qu'un simple useMemo dérivé de la prop.
  const [exercices, setExercices] = useState<ExerciceItem[]>(() => parseExercices(seance.exercices));
  const runs = useMemo(() => groupExerciceRuns(exercices), [exercices]);

  // Un exercice (ou superset) à la fois, avec flèches/points pour naviguer — plutôt qu'une
  // longue liste à faire défiler, façon Liftoff/Hevy : on sait toujours où on en est.
  const [runIdx, setRunIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const [addingExercice, setAddingExercice] = useState(false);
  const [newExerciceNom, setNewExerciceNom] = useState("");
  const [showLibrary, setShowLibrary] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [catalogue, setCatalogue] = useState<CatalogueEntry[]>([]);
  useEffect(() => { loadCatalogue().then(setCatalogue).catch(() => {}); }, []);
  // Lier le prochain exercice ajouté à celui actuellement affiché — même mécanisme que
  // "superset/biset/triset/circuit" en préparation (ExerciceEditor), mais construit à la
  // volée en direct plutôt qu'en éditant une liste complète.
  const [linkSuperset, setLinkSuperset] = useState(false);

  const [logs, setLogs] = useState<Record<string, SetLogState>>({});
  const [historyByNom, setHistoryByNom] = useState<Record<string, LastPerformance>>({});
  const [prByNom, setPrByNom] = useState<Record<string, boolean>>({});
  const [extraSets, setExtraSets] = useState<Record<number, number>>({});
  const [rest, setRest] = useState<{ left: number; total: number; paused?: boolean } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [summary, setSummary] = useState<{ duration: string; volume: number; sets: number; prs: number } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [suggestions, setSuggestions] = useState<{ nom: string; suggestion: ProgressionSuggestion }[] | null>(null);
  const [suggestionStatus, setSuggestionStatus] = useState<Record<string, "accepted" | "dismissed">>({});
  const [sendingNom, setSendingNom] = useState<string | null>(null);
  // Meilleur 1RM historique par exercice, pour détecter un record en direct sans re-render —
  // n'affecte que prByNom (affiché), donc une simple ref suffit.
  const bestRef = useRef<Record<string, number | null>>({});

  useWakeLock(!summary);

  // Horodatage de début persisté en localStorage : survit à un rafraîchissement accidentel
  // de page en cours de séance, sans avoir besoin d'une colonne dédiée en base.
  useEffect(() => {
    const key = `seance_start_${seance.id}`;
    let start = parseInt(localStorage.getItem(key) || "", 10);
    if (!Number.isFinite(start)) { start = Date.now(); localStorage.setItem(key, String(start)); }
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [seance.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const existing = await loadSeanceLogs(seance.id);
        if (cancelled) return;
        const map: Record<string, SetLogState> = {};
        const maxSetIdxByEx: Record<number, number> = {};
        for (const l of existing) {
          map[`${l.exercice_index}-${l.set_index}`] = {
            poids: l.poids_reel != null ? String(l.poids_reel) : "",
            reps: l.reps_reel != null ? String(l.reps_reel) : "",
            rir: l.rir_reel != null ? String(l.rir_reel) : "",
            done: true,
          };
          maxSetIdxByEx[l.exercice_index] = Math.max(maxSetIdxByEx[l.exercice_index] ?? -1, l.set_index);
        }
        setLogs(map);

        const extras: Record<number, number> = {};
        exercices.forEach((ex, exIdx) => {
          const targetLen = targetSetsFor(ex).length;
          const maxIdx = maxSetIdxByEx[exIdx];
          if (maxIdx != null && maxIdx >= targetLen) extras[exIdx] = maxIdx - targetLen + 1;
        });
        setExtraSets(extras);

        const noms = [...new Set(exercices.map(e => e.nom).filter(Boolean))];
        const histories = await Promise.all(noms.map(nom => loadExerciceHistory(clientId, nom, seance.id)));
        if (cancelled) return;
        const byNom: Record<string, LastPerformance> = {};
        const bestByNom: Record<string, number | null> = {};
        noms.forEach((nom, i) => { byNom[nom] = histories[i].lastPerformance; bestByNom[nom] = histories[i].best1RM; });
        setHistoryByNom(byNom);
        bestRef.current = bestByNom;
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seance.id, clientId]);

  useEffect(() => {
    if (!rest || rest.left <= 0 || rest.paused) return;
    const t = setTimeout(() => setRest(r => (r && r.left > 1 ? { ...r, left: r.left - 1 } : null)), 1000);
    return () => clearTimeout(t);
  }, [rest]);

  const flatSets = useMemo(() => {
    const list: { exIdx: number; setIdx: number }[] = [];
    exercices.forEach((ex, exIdx) => {
      const n = displaySetsFor(ex, extraSets[exIdx] ?? 0).length;
      for (let setIdx = 0; setIdx < n; setIdx++) list.push({ exIdx, setIdx });
    });
    return list;
  }, [exercices, extraSets]);
  const lastKey = flatSets.length ? `${flatSets[flatSets.length - 1].exIdx}-${flatSets[flatSets.length - 1].setIdx}` : null;

  const totalSets = flatSets.length;
  const doneEntries = Object.entries(logs).filter(([, l]) => l.done);
  const doneSets = doneEntries.length;
  // Le volume compte la charge réelle : pour un exercice au poids du corps, "poids" n'est que
  // le lest additionnel loggué — effectiveLoad y ajoute la fraction de poids de corps configurée
  // pour ne pas sous-évaluer le travail réel d'une série de tractions ou de dips.
  // Une série d'échauffement (warmup) est cochée comme les autres pour le compte de séries
  // faites, mais exclue du volume/calories/records — elle ne reflète pas l'effort de travail
  // réel de la séance, inclure sa charge y fausserait le chiffre.
  // Les paliers d'une série dégressive comptent en plus de la série principale — chacun est
  // un vrai travail supplémentaire (charge × reps), pas une répétition de la même série.
  // Un exercice en temps/distance (repKind "temps"/"distance") n'est pas exclu comme le
  // warmup, mais sa "quantité" n'est pas des reps — charge × secondes ou charge × mètres ne
  // veut rien dire en kg de volume, donc on l'exclut du total au même titre.
  const volume = doneEntries.reduce((s, [k, l]) => {
    const exIdx = parseInt(k.split("-")[0], 10);
    if (l.warmup || exercices[exIdx].repKind !== "reps") return s;
    const load = effectiveLoad(exercices[exIdx], numOr(l.poids), clientBodyweight);
    const dropsVolume = (l.drops ?? []).reduce((ds, d) => {
      const dropLoad = effectiveLoad(exercices[exIdx], numOr(d.poids), clientBodyweight);
      return ds + (dropLoad ?? 0) * (numOr(d.reps) ?? 0);
    }, 0);
    return s + (load ?? 0) * (numOr(l.reps) ?? 0) + dropsVolume;
  }, 0);

  // Estimation calorique live : calculée série par série à partir de ce qui est réellement
  // loggué (reps, charge, RIR) plutôt que du temps écoulé — deux séances ouvertes aussi
  // longtemps l'une que l'autre mais avec des exos différents doivent donner des chiffres
  // différents. Par série : durée approximée à ~3s/répétition, MET dérivé du RIR (plus proche
  // de l'échec = plus soutenu), et un bonus d'effort si la charge est lourde par rapport au
  // poids de corps. Pas un calcul physiologique exact (impossible sans VO2), juste un chiffre
  // qui réagit vraiment à la séance loguée.
  const bodyweightForCalc = clientBodyweight ?? 75;
  // Une série dégressive enchaîne ses paliers sans repos — même RIR de référence que la
  // série principale (pas de nouvelle échelle d'effort saisie par palier), seuls la charge
  // et les reps changent.
  const calcSetKcal = (load: number, durationSeconds: number, rir: number) => {
    const met = Math.min(8, Math.max(3, 8 - rir));
    const setDurationHours = durationSeconds / 3600;
    const loadFactor = 1 + Math.min(1, load / bodyweightForCalc);
    return met * bodyweightForCalc * setDurationHours * loadFactor;
  };
  // Une série "temps" donne sa vraie durée directement (la valeur saisie est déjà en
  // secondes) — plus fiable que l'approximation ~3s/répétition, réservée aux séries en
  // reps. Une série "distance" n'a pas de durée déductible simplement (pas d'allure
  // connue) : on garde l'approximation par défaut plutôt que d'ajouter un système d'allure.
  const setDurationSeconds = (exIdx: number, qty: number) => (exercices[exIdx].repKind === "temps" ? qty : qty * 3);
  const estimatedCalories = Math.round(doneEntries.reduce((sum, [k, l]) => {
    if (l.warmup) return sum;
    const exIdx = parseInt(k.split("-")[0], 10);
    const load = effectiveLoad(exercices[exIdx], numOr(l.poids), clientBodyweight) ?? 0;
    const reps = numOr(l.reps) ?? 0;
    const rir = numOr(l.rir) ?? 2.5;
    const dropsKcal = (l.drops ?? []).reduce((ds, d) => {
      const dropLoad = effectiveLoad(exercices[exIdx], numOr(d.poids), clientBodyweight) ?? 0;
      return ds + calcSetKcal(dropLoad, setDurationSeconds(exIdx, numOr(d.reps) ?? 0), rir);
    }, 0);
    return sum + calcSetKcal(load, setDurationSeconds(exIdx, reps), rir) + dropsKcal;
  }, 0));

  const runIsComplete = (run: { indices: number[] }) => run.indices.every(exIdx => {
    const rows = displaySetsFor(exercices[exIdx], extraSets[exIdx] ?? 0);
    return rows.length === 0 || rows.every((_, i) => logs[`${exIdx}-${i}`]?.done);
  });
  const clampRun = (i: number) => Math.max(0, Math.min(runs.length - 1, i));
  const goPrev = () => setRunIdx(i => clampRun(i - 1));
  const goNext = () => setRunIdx(i => clampRun(i + 1));

  // Fusionne l'exercice (ou groupe) affiché avec celui d'à côté, pour en faire un vrai
  // superset/biset/triset a posteriori — deux runs adjacents dans la liste correspondent
  // toujours à des indices contigus dans `exercices` (groupExerciceRuns parcourt le tableau
  // dans l'ordre), donc leur assigner le même groupId suffit à les regrouper correctement.
  const mergeWithAdjacentRun = async (dir: -1 | 1) => {
    const otherPos = runIdx + dir;
    if (otherPos < 0 || otherPos >= runs.length) return;
    const a = runs[Math.min(runIdx, otherPos)];
    const b = runs[Math.max(runIdx, otherPos)];
    const gid = a.groupId ?? b.groupId ?? genId();
    const label = a.groupLabel || b.groupLabel || "Superset";
    const merged = new Set([...a.indices, ...b.indices]);
    const next = exercices.map((it, j) => (merged.has(j) ? { ...it, groupId: gid, groupLabel: label } : it));
    setExercices(next);
    const newRuns = groupExerciceRuns(next);
    const landingIdx = newRuns.findIndex(r => r.indices.includes(a.indices[0]));
    setRunIdx(landingIdx >= 0 ? landingIdx : runIdx);
    await supabase.from("programme_seances").update({ exercices: serializeExercices(next) }).eq("id", seance.id);
  };
  const onTouchStart = (e: TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 60) return;
    if (dx < 0) goNext(); else goPrev();
  };

  const onChange = (exIdx: number, setIdx: number, field: "poids" | "reps" | "rir", val: string) => {
    const k = `${exIdx}-${setIdx}`;
    setLogs(prev => {
      const base: SetLogState = prev[k] ?? { poids: "", reps: "", rir: "", done: false };
      return { ...prev, [k]: { ...base, [field]: val } };
    });
  };

  const onAddSet = (exIdx: number) => setExtraSets(prev => ({ ...prev, [exIdx]: (prev[exIdx] ?? 0) + 1 }));

  // Exercice ajouté en cours de séance (non prévu par le coach) — series: "1" pour qu'il ait
  // tout de suite une ligne de série loggable (un exercice sans cible ni texte libre ne
  // s'afficherait sinon pas du tout, cf. ExerciceLiveBlock). Persisté immédiatement en base
  // pour survivre à un rafraîchissement, en best-effort : un échec réseau ne doit pas bloquer
  // l'ajout local, la séance reste utilisable et le prochain toggle de série retentera l'écriture.
  //
  // Si linkSuperset est actif, le nouvel exercice rejoint le run actuellement affiché
  // (groupId partagé) au lieu d'être ajouté isolé en fin de liste — même mécanisme que
  // "superset/biset/triset/circuit" en préparation, construit à la volée : rappeler cette
  // fonction plusieurs fois sur le même run l'étend en triset, quadset, etc.
  const pushExercice = async (nom: string) => {
    const newItem = { ...emptyExercice(), nom, series: "1" };
    const targetRun = linkSuperset ? runs[runIdx] : null;
    let next: ExerciceItem[];
    let insertAt: number;

    if (targetRun) {
      const gid = targetRun.groupId ?? genId();
      const label = targetRun.groupLabel || "Superset";
      insertAt = targetRun.indices[targetRun.indices.length - 1] + 1;
      const relabeled = exercices.map((it, j) => targetRun.indices.includes(j) ? { ...it, groupId: gid, groupLabel: label } : it);
      next = [...relabeled.slice(0, insertAt), { ...newItem, groupId: gid, groupLabel: label }, ...relabeled.slice(insertAt)];
    } else {
      insertAt = exercices.length;
      next = [...exercices, newItem];
    }

    setExercices(next);
    setLinkSuperset(false);
    const newRuns = groupExerciceRuns(next);
    const landingRunIdx = newRuns.findIndex(r => r.indices.includes(insertAt));
    setRunIdx(landingRunIdx >= 0 ? landingRunIdx : newRuns.length - 1);
    await supabase.from("programme_seances").update({ exercices: serializeExercices(next) }).eq("id", seance.id);
  };

  const addExercice = async () => {
    const nom = newExerciceNom.trim();
    if (!nom) return;
    setNewExerciceNom("");
    setAddingExercice(false);
    await pushExercice(nom);
  };

  const addFromCatalogue = async (nom: string) => {
    setShowLibrary(false);
    // Contrairement à SeanceBuilder, cette carte n'a pas de champ pour renommer l'exercice
    // après coup — "" (créer perso sans avoir tapé de recherche) doit donc garder un nom
    // lisible plutôt que rester vide et injoignable.
    await pushExercice(nom || "Nouvel exercice");
  };

  // Un exercice ajouté en direct (Bibliothèque ou Nom libre) part toujours en "reps" —
  // SeanceBuilder n'est pas dans la boucle pour les exercices improvisés pendant la séance
  // elle-même, donc l'unité doit rester modifiable ici aussi, pas seulement en préparation.
  const changeRepKind = async (exIdx: number, kind: RepKind) => {
    const next = exercices.map((e, i) => (i === exIdx ? { ...e, repKind: kind } : e));
    setExercices(next);
    await supabase.from("programme_seances").update({ exercices: serializeExercices(next) }).eq("id", seance.id);
  };

  const onToggle = async (exIdx: number, setIdx: number, target: SetDetail) => {
    const k = `${exIdx}-${setIdx}`;
    const ex = exercices[exIdx];
    const current = logs[k] ?? { poids: target.poids, reps: target.reps, rir: "", done: false };
    const next = { ...current, done: !current.done };
    setLogs(prev => ({ ...prev, [k]: next }));

    if (!next.done) {
      await deleteSetLog(seance.id, exIdx, setIdx);
      return;
    }

    const poidsNum = numOr(next.poids);
    const repsNum = numOr(next.reps);
    const rirNum = numOr(next.rir);
    await saveSetLog({
      seanceId: seance.id, clientId, exerciceIndex: exIdx, exerciceNom: ex.nom,
      setIndex: setIdx, poids: poidsNum, reps: repsNum, rir: rirNum,
    });

    // La détection de record historique (bestRef) vient de seance_logs, qui ne stocke que le
    // lest additionnel loggué — sans savoir quelle fraction de poids de corps s'y ajoutait à
    // l'époque. Comparer un 1RM "poids de corps inclus" à cet historique brut donnerait de
    // faux records à chaque série ; on désactive donc juste ce badge pour les exos au poids
    // du corps plutôt que d'afficher un résultat trompeur. Même chose pour un exercice en
    // temps/distance : la formule de Berger (1RM à partir de charge × reps) n'a aucun sens
    // sur une planche tenue 12 secondes ou un sprint de 400m.
    if (!ex.bodyweight && !next.warmup && ex.repKind === "reps") {
      const est = estimate1RM(poidsNum, repsNum);
      if (isNewRecord(est, bestRef.current[ex.nom] ?? null)) {
        setPrByNom(prev => ({ ...prev, [ex.nom]: true }));
        bestRef.current[ex.nom] = est;
      }
    }

    if (k !== lastKey) {
      const secs = parseRestSeconds(target.repos || ex.repos);
      setRest({ left: secs, total: secs });
    }
  };

  // Bascule le drapeau "échauffement" d'une série — locale à la séance en cours (non
  // persistée en base, la table seance_logs n'a pas cette colonne) : elle exclut juste la
  // série des calculs de volume/calories/records pendant que la séance est ouverte.
  const onToggleWarmup = (exIdx: number, setIdx: number) => {
    const k = `${exIdx}-${setIdx}`;
    setLogs(prev => {
      const base: SetLogState = prev[k] ?? { poids: "", reps: "", rir: "", done: false };
      return { ...prev, [k]: { ...base, warmup: !base.warmup } };
    });
  };

  // Paliers d'une série dégressive — mêmes garanties que le drapeau warmup ci-dessus (local
  // à la séance en cours). Chaque palier est une chute de charge enchaînée juste après la
  // série principale : sa propre saisie kg/reps, comptée en plus dans volume/calories.
  const addDrop = (exIdx: number, setIdx: number) => {
    const k = `${exIdx}-${setIdx}`;
    setLogs(prev => {
      const base: SetLogState = prev[k] ?? { poids: "", reps: "", rir: "", done: false };
      return { ...prev, [k]: { ...base, drops: [...(base.drops ?? []), { poids: "", reps: "" }] } };
    });
  };
  const changeDrop = (exIdx: number, setIdx: number, dropIdx: number, field: "poids" | "reps", val: string) => {
    const k = `${exIdx}-${setIdx}`;
    setLogs(prev => {
      const base = prev[k];
      if (!base) return prev;
      const drops = (base.drops ?? []).map((d, i) => (i === dropIdx ? { ...d, [field]: val } : d));
      return { ...prev, [k]: { ...base, drops } };
    });
  };
  const removeDrop = (exIdx: number, setIdx: number, dropIdx: number) => {
    const k = `${exIdx}-${setIdx}`;
    setLogs(prev => {
      const base = prev[k];
      if (!base) return prev;
      return { ...prev, [k]: { ...base, drops: (base.drops ?? []).filter((_, i) => i !== dropIdx) } };
    });
  };

  // Paliers d'une montée en charge d'échauffement (ex. 60/100/140 kg avant la série de
  // travail) — même mécanique que les paliers dégressifs ci-dessus, mais rattachés à une
  // série marquée `warmup` : ni la série ni ses paliers ne sont lus par les calculs de
  // volume/calories (cf. les gardes `l.warmup` plus haut), donc aucun palier ne compte comme
  // une série effective.
  const addWarmupStep = (exIdx: number, setIdx: number) => {
    const k = `${exIdx}-${setIdx}`;
    setLogs(prev => {
      const base: SetLogState = prev[k] ?? { poids: "", reps: "", rir: "", done: false };
      return { ...prev, [k]: { ...base, warmupSteps: [...(base.warmupSteps ?? []), { poids: "", reps: "" }] } };
    });
  };
  const changeWarmupStep = (exIdx: number, setIdx: number, stepIdx: number, field: "poids" | "reps", val: string) => {
    const k = `${exIdx}-${setIdx}`;
    setLogs(prev => {
      const base = prev[k];
      if (!base) return prev;
      const warmupSteps = (base.warmupSteps ?? []).map((w, i) => (i === stepIdx ? { ...w, [field]: val } : w));
      return { ...prev, [k]: { ...base, warmupSteps } };
    });
  };
  const removeWarmupStep = (exIdx: number, setIdx: number, stepIdx: number) => {
    const k = `${exIdx}-${setIdx}`;
    setLogs(prev => {
      const base = prev[k];
      if (!base) return prev;
      return { ...prev, [k]: { ...base, warmupSteps: (base.warmupSteps ?? []).filter((_, i) => i !== stepIdx) } };
    });
  };

  // Retire la dernière série "extra" ajoutée sur un exercice (swipe sur sa carte) — seules
  // les séries extra peuvent être retirées : les séries prévues par le coach restent fixes,
  // et ne retirer que la dernière évite d'avoir à décaler les index des séries suivantes.
  const onRemoveExtra = async (exIdx: number) => {
    const rows = displaySetsFor(exercices[exIdx], extraSets[exIdx] ?? 0);
    const lastIdx = rows.length - 1;
    if (lastIdx < 0 || !rows[lastIdx].isExtra) return;
    const k = `${exIdx}-${lastIdx}`;
    setLogs(prev => { const next = { ...prev }; delete next[k]; return next; });
    setExtraSets(prev => ({ ...prev, [exIdx]: Math.max(0, (prev[exIdx] ?? 0) - 1) }));
    await deleteSetLog(seance.id, exIdx, lastIdx);
  };

  // Retire un exercice entier de la séance en direct — contrairement à onRemoveExtra (une
  // seule série "extra"), ça peut effacer un exercice avec des séries déjà loguées : la
  // confirmation le dit explicitement. Les exercices après celui supprimé décalent d'un
  // cran (logs, séries extra ET exercice_index en base) pour ne jamais désynchroniser
  // seance_logs du nouveau tableau `exercices` — plus simple et plus sûr de tout ré-écrire
  // d'un coup (delete + insert) que de mettre à jour chaque ligne existante une par une.
  const removeExercice = async (exIdx: number) => {
    const ex = exercices[exIdx];
    const doneHere = Object.entries(logs).filter(([k, l]) => parseInt(k.split("-")[0], 10) === exIdx && l.done).length;
    const msg = doneHere > 0
      ? `Supprimer « ${ex.nom} » et ${doneHere === 1 ? "sa série déjà loguée" : `ses ${doneHere} séries déjà loguées`} ?`
      : `Supprimer « ${ex.nom} » de cette séance ?`;
    if (!window.confirm(msg)) return;

    const next = exercices.filter((_, i) => i !== exIdx);
    const reindexedLogs: Record<string, SetLogState> = {};
    for (const [k, l] of Object.entries(logs)) {
      const [i, s] = k.split("-").map(Number);
      if (i === exIdx) continue;
      reindexedLogs[`${i > exIdx ? i - 1 : i}-${s}`] = l;
    }
    const reindexedExtra: Record<number, number> = {};
    for (const [k, v] of Object.entries(extraSets)) {
      const i = Number(k);
      if (i === exIdx) continue;
      reindexedExtra[i > exIdx ? i - 1 : i] = v;
    }

    setExercices(next);
    setLogs(reindexedLogs);
    setExtraSets(reindexedExtra);

    await supabase.from("seance_logs").delete().eq("seance_id", seance.id);
    const rowsToInsert = Object.entries(reindexedLogs).filter(([, l]) => l.done).map(([k, l]) => {
      const [i, s] = k.split("-").map(Number);
      return {
        seance_id: seance.id, client_id: clientId, exercice_index: i, exercice_nom: next[i].nom,
        set_index: s, poids_reel: numOr(l.poids), reps_reel: numOr(l.reps), rir_reel: numOr(l.rir),
        logged_at: new Date().toISOString(),
      };
    });
    if (rowsToInsert.length) await supabase.from("seance_logs").insert(rowsToInsert);
    await supabase.from("programme_seances").update({ exercices: serializeExercices(next) }).eq("id", seance.id);

    const newRuns = groupExerciceRuns(next);
    setRunIdx(i => Math.max(0, Math.min(i, newRuns.length - 1)));
  };

  const [deleting, setDeleting] = useState(false);
  // Annule l'entraînement : contrairement à onClose (qui laisse la séance intacte pour la
  // reprendre plus tard), ça la supprime pour de bon — utile pour une séance libre lancée
  // par erreur, ou qu'on ne veut finalement pas garder dans l'historique.
  const cancelSeance = async () => {
    if (deleting) return;
    if (!window.confirm(doneSets > 0
      ? `Annuler et supprimer définitivement cet entraînement ? Les ${doneSets} série${doneSets > 1 ? "s" : ""} déjà loguée${doneSets > 1 ? "s" : ""} seront perdues.`
      : "Annuler et supprimer définitivement cet entraînement ?")) return;
    setDeleting(true);
    localStorage.removeItem(`seance_start_${seance.id}`);
    await onDelete();
    setDeleting(false);
  };

  const finish = async () => {
    setFinishing(true);
    await supabase.from("programme_seances").update({ completed_at: new Date().toISOString() }).eq("id", seance.id);
    localStorage.removeItem(`seance_start_${seance.id}`);
    setFinishing(false);
    setSummary({
      duration: fmtDuration(elapsed), volume: Math.round(volume), sets: doneSets,
      prs: Object.values(prByNom).filter(Boolean).length,
    });

    // Suggestions de charge pour la prochaine fois, sur les exercices réellement loggués
    // aujourd'hui — le client les accepte ou les ignore, une acceptation prévient juste
    // Samuel par message pour qu'il en tienne compte en écrivant la prochaine séance (les
    // séances restent rédigées par le coach, rien n'est appliqué automatiquement).
    const noms = [...new Set(doneEntries.map(([k]) => exercices[parseInt(k.split("-")[0], 10)].nom).filter(Boolean))];
    if (noms.length) {
      const results = await Promise.all(noms.map(async nom => {
        const history = await loadExerciceSessionOutcomes(clientId, nom);
        return { nom, suggestion: suggestProgression(history) };
      }));
      setSuggestions(results.filter(r => r.suggestion.action === "increase" || r.suggestion.action === "deload"));
    } else {
      setSuggestions([]);
    }
  };

  const acceptSuggestion = async (nom: string, suggestion: ProgressionSuggestion) => {
    setSendingNom(nom);
    const [{ data: { user } }, coachEmail] = await Promise.all([supabase.auth.getUser(), getMyCoachEmail(clientId)]);
    if (user?.email && coachEmail) {
      const payload = JSON.stringify({
        nom, action: suggestion.action, suggestedWeight: suggestion.suggestedWeight, basis: suggestion.basis,
      });
      await supabase.from("messages").insert({ from_email: user.email, to_email: coachEmail, content: `[PROGRESSION_ACCEPTED:${payload}]` });
    }
    setSendingNom(null);
    setSuggestionStatus(prev => ({ ...prev, [nom]: "accepted" }));
  };

  if (summary) {
    return (
      <div className="fixed inset-0 bg-[var(--t-bg)] z-50 flex flex-col overflow-y-auto">
        <div className="flex-1 px-6 py-10 max-w-md mx-auto w-full flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-full bg-[#7eb8a0]/10 border border-[#7eb8a0]/30 flex items-center justify-center">
            <Icon icon={Check} size={28} strokeWidth={2.5} className="text-[#7eb8a0]"/>
          </div>
          <div>
            <p className="text-[0.7rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-2">Séance terminée</p>
            <h2 style={{ fontFamily: "var(--font-bebas)" }} className="text-3xl text-[var(--t-text)] tracking-wide">{seance.titre}</h2>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full">
            <div className="border border-[var(--t-border-soft)] bg-[var(--t-surface)] rounded-xl py-4 px-2">
              <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-[var(--t-text)] tracking-wide leading-none">{summary.duration}</p>
              <p className="text-[0.58rem] tracking-[0.15em] uppercase text-[var(--t-text-30)] mt-1.5">Durée</p>
            </div>
            <div className="border border-[var(--t-border-soft)] bg-[var(--t-surface)] rounded-xl py-4 px-2">
              <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-[#c9a84c] tracking-wide leading-none">{summary.volume.toLocaleString("fr-FR")}</p>
              <p className="text-[0.58rem] tracking-[0.15em] uppercase text-[var(--t-text-30)] mt-1.5">Volume (kg)</p>
            </div>
            <div className="border border-[var(--t-border-soft)] bg-[var(--t-surface)] rounded-xl py-4 px-2">
              <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-[var(--t-text)] tracking-wide leading-none">{summary.sets}</p>
              <p className="text-[0.58rem] tracking-[0.15em] uppercase text-[var(--t-text-30)] mt-1.5">Séries</p>
            </div>
          </div>

          {summary.prs > 0 && (
            <div className="border border-[#c9a84c]/25 bg-[#c9a84c]/5 rounded-xl px-4 py-3 w-full">
              <p className="text-xs text-[#c9a84c] font-medium">🏆 {summary.prs} nouveau{summary.prs > 1 ? "x" : ""} record{summary.prs > 1 ? "s" : ""} personnel{summary.prs > 1 ? "s" : ""} !</p>
            </div>
          )}

          {suggestions && suggestions.length > 0 && (
            <div className="w-full flex flex-col gap-2 text-left">
              <p className="text-[0.62rem] tracking-[0.2em] uppercase text-[var(--t-text-30)] text-center">Pour la prochaine fois</p>
              {suggestions.map(({ nom, suggestion }) => {
                const status = suggestionStatus[nom];
                const isDeload = suggestion.action === "deload";
                return (
                  <div key={nom} className={`border rounded-xl px-3.5 py-3 ${isDeload ? "border-[#e09070]/25 bg-[#e09070]/5" : "border-[#7eb8a0]/25 bg-[#7eb8a0]/5"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-[var(--t-text-70)] truncate">{nom}</p>
                        <p className="text-[0.6rem] text-[var(--t-text-30)] mt-0.5 leading-relaxed">{suggestion.basis}</p>
                      </div>
                      {suggestion.suggestedWeight != null && (
                        <p style={{ fontFamily: "var(--font-bebas)" }} className={`text-lg tracking-wide leading-none shrink-0 ${isDeload ? "text-[#e09070]" : "text-[#7eb8a0]"}`}>
                          {suggestion.suggestedWeight} <span className="text-[0.55rem] text-[var(--t-text-25)]">kg</span>
                        </p>
                      )}
                    </div>
                    {status === "accepted" ? (
                      <p className="text-[0.6rem] text-[#7eb8a0] mt-2">✓ Envoyé à Samuel</p>
                    ) : status === "dismissed" ? (
                      <p className="text-[0.6rem] text-[var(--t-text-20)] mt-2">Ignoré</p>
                    ) : (
                      <div className="flex gap-2 mt-2.5">
                        <button onClick={() => setSuggestionStatus(prev => ({ ...prev, [nom]: "dismissed" }))}
                          className="flex-1 border border-[var(--t-border)] text-[var(--t-text-30)] text-[0.58rem] tracking-wider uppercase py-1.5 rounded-lg hover:border-[var(--t-text-20)] hover:text-[var(--t-text-60)] transition-colors">
                          Ignorer
                        </button>
                        <button onClick={() => acceptSuggestion(nom, suggestion)} disabled={sendingNom === nom}
                          className="flex-1 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.58rem] font-bold tracking-wider uppercase py-1.5 rounded-lg disabled:opacity-50 transition-all">
                          {sendingNom === nom ? "…" : "Accepter"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <button onClick={onFinish}
            className="w-full py-3 rounded-xl text-xs font-bold tracking-[0.15em] uppercase bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black shadow-[0_4px_16px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_20px_-4px_rgba(201,168,76,0.8)] transition-all mt-2">
            Fermer
          </button>
        </div>
      </div>
    );
  }

  const overallPct = totalSets ? Math.min((doneSets / totalSets) * 100, 100) : 0;

  return (
    <div className="fixed inset-0 bg-[var(--t-bg)] z-50 flex flex-col">
      <div className="flex items-center justify-between px-5 py-3.5 shrink-0 gap-3 max-w-lg mx-auto w-full">
        <div className="flex items-center -ml-2.5 shrink-0">
          <button onClick={onClose} title="Fermer — reprendre plus tard"
            className="text-[var(--t-text-30)] hover:text-[var(--t-text)] transition-colors w-11 h-11 flex items-center justify-center">
            <Icon icon={X} size={20} strokeWidth={2}/>
          </button>
          <button onClick={cancelSeance} disabled={deleting} title="Annuler et supprimer cet entraînement"
            className="text-[var(--t-text-20)] hover:text-[#e07070] transition-colors w-11 h-11 flex items-center justify-center disabled:opacity-40">
            <Icon icon={Trash2} size={18} strokeWidth={2}/>
          </button>
          <button onClick={() => setShowTimer(true)} title="Minuteur par rounds"
            className="text-[var(--t-text-20)] hover:text-[#c9a84c] transition-colors w-11 h-11 flex items-center justify-center">
            <Icon icon={Clock} size={19} strokeWidth={2}/>
          </button>
        </div>
        <p style={{ fontFamily: "var(--font-bebas)" }} className="text-xl tracking-wider text-[var(--t-text)] truncate flex-1 text-center">{seance.titre}</p>
        <button onClick={finish} disabled={finishing}
          className="shrink-0 rounded-full text-xs font-bold tracking-[0.12em] uppercase px-5 py-3 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black shadow-[0_3px_12px_-4px_rgba(201,168,76,0.6)] transition-all disabled:opacity-50">
          {finishing ? "…" : "Terminer"}
        </button>
      </div>

      <div className="h-1.5 bg-[var(--t-track)] shrink-0">
        <div className="h-full bg-gradient-to-r from-[#e2c97e] to-[#c9a84c] transition-all duration-500 max-w-lg mx-auto" style={{ width: `${overallPct}%` }}/>
      </div>

      <div className="border-b border-[var(--t-border-soft)] shrink-0">
        <div className="flex items-center justify-center gap-3 py-4 max-w-lg mx-auto">
          <RichIcon name="chrono" size={88} className="drop-shadow-[0_8px_14px_rgba(0,0,0,0.25)]"/>
          <p style={{ fontFamily: "var(--font-bebas)" }} className="text-5xl text-[var(--t-text)] tracking-wide leading-none">{fmtDuration(elapsed)}</p>
        </div>
        <div className="grid grid-cols-3 max-w-lg mx-auto border-t border-[var(--t-border-soft)]">
          <div className="text-center py-3.5 border-r border-[var(--t-border-soft)]">
            <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-[#c9a84c] tracking-wide leading-none">{Math.round(volume).toLocaleString("fr-FR")}</p>
            <p className="text-[0.58rem] tracking-[0.15em] uppercase text-[var(--t-text-25)] mt-1.5">Volume kg</p>
          </div>
          <div className="text-center py-3.5 border-r border-[var(--t-border-soft)]">
            <div className="flex items-center justify-center gap-1.5">
              <TdeeIcon size={20}/>
              <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-[#e0834a] tracking-wide leading-none">{estimatedCalories}</p>
            </div>
            <p className="text-[0.58rem] tracking-[0.15em] uppercase text-[var(--t-text-25)] mt-1.5">Kcal estimées</p>
          </div>
          <div className="text-center py-3.5">
            <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-[var(--t-text)] tracking-wide leading-none">{doneSets}/{totalSets}</p>
            <p className="text-[0.58rem] tracking-[0.15em] uppercase text-[var(--t-text-25)] mt-1.5">Séries</p>
          </div>
        </div>
      </div>

      {loaded && runs.length > 0 && (
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 shrink-0 max-w-lg mx-auto w-full">
          <button onClick={goPrev} disabled={runIdx === 0}
            className="w-11 h-11 rounded-full border border-[var(--t-border)] text-[var(--t-text-40)] hover:text-[var(--t-text-70)] active:scale-90 transition-all disabled:opacity-20 flex items-center justify-center shrink-0">
            <Icon icon={ChevronLeft} size={18} strokeWidth={2}/>
          </button>
          <div className="flex flex-col items-center gap-1.5 min-w-0">
            <p className="text-[0.6rem] tracking-[0.15em] uppercase text-[var(--t-text-30)]">Exercice {runIdx + 1}/{runs.length}</p>
            <div className="flex items-center gap-1.5">
              {runs.map((run, i) => (
                <button key={i} onClick={() => setRunIdx(i)} aria-label={`Exercice ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === runIdx ? "w-5 bg-[#c9a84c]" : runIsComplete(run) ? "w-1.5 bg-[#7eb8a0]" : "w-1.5 bg-[var(--t-track)]"}`}/>
              ))}
            </div>
          </div>
          <button onClick={goNext} disabled={runIdx === runs.length - 1}
            className="w-11 h-11 rounded-full border border-[var(--t-border)] text-[var(--t-text-40)] hover:text-[var(--t-text-70)] active:scale-90 transition-all disabled:opacity-20 flex items-center justify-center shrink-0">
            <Icon icon={ChevronRight} size={18} strokeWidth={2}/>
          </button>
        </div>
      )}

      {/* Fusionner deux exercices déjà ajoutés en superset/biset/triset — action explicite et
          visible plutôt qu'une case à cocher discrète, pour de vrai fusionner ce qui existe
          déjà (contrairement à la checkbox "lier" plus bas, qui ne concerne qu'un exercice
          qu'on est en train d'ajouter). */}
      {loaded && runs.length > 1 && (
        <div className="flex items-center gap-2 px-4 pb-2 shrink-0 max-w-lg mx-auto w-full">
          {runIdx > 0 && (
            <button onClick={() => mergeWithAdjacentRun(-1)}
              className="flex-1 flex items-center justify-center gap-2 border border-[#c9a84c]/40 bg-[#c9a84c]/[0.08] rounded-xl text-[0.68rem] tracking-wide uppercase text-[#c9a84c] hover:bg-[#c9a84c]/[0.16] hover:border-[#c9a84c]/60 active:scale-[0.98] transition-all py-2.5 font-bold">
              <Icon icon={Layers} size={15} strokeWidth={2.5}/> Fusionner avec précédent
            </button>
          )}
          {runIdx < runs.length - 1 && (
            <button onClick={() => mergeWithAdjacentRun(1)}
              className="flex-1 flex items-center justify-center gap-2 border border-[#c9a84c]/40 bg-[#c9a84c]/[0.08] rounded-xl text-[0.68rem] tracking-wide uppercase text-[#c9a84c] hover:bg-[#c9a84c]/[0.16] hover:border-[#c9a84c]/60 active:scale-[0.98] transition-all py-2.5 font-bold">
              <Icon icon={Layers} size={15} strokeWidth={2.5}/> Fusionner avec suivant
            </button>
          )}
        </div>
      )}

      {showLibrary && <ExercicePicker catalogue={catalogue} onPick={addFromCatalogue} onClose={() => setShowLibrary(false)}/>}

      {showTimer && <RoundTimer onClose={() => setShowTimer(false)}/>}

      <div className="flex-1 overflow-y-auto px-4 pb-28 max-w-lg mx-auto w-full" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {!loaded ? (
          <p className="text-xs text-[var(--t-text-30)] text-center py-8">Chargement…</p>
        ) : (() => {
          // Bloc Bibliothèque/Nom libre — extrait car nécessaire à deux endroits : après
          // l'exercice affiché quand la séance en a déjà, et seul quand elle est encore vide
          // (aucun exercice sur lequel greffer le bouton, sinon on n'a jamais de premier
          // exercice possible en partant d'une séance libre démarrée en direct).
          const addExerciceBlock = (
            addingExercice ? (
              <div className="flex items-center gap-2">
                <input autoFocus value={newExerciceNom} onChange={e => setNewExerciceNom(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addExercice(); if (e.key === "Escape") { setAddingExercice(false); setNewExerciceNom(""); } }}
                  placeholder="Nom de l'exercice"
                  className="flex-1 min-w-0 bg-[var(--t-surface)] border border-[#c9a84c]/40 rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-sm px-3 py-2 focus:outline-none"/>
                <button onClick={addExercice} disabled={!newExerciceNom.trim()}
                  className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black flex items-center justify-center disabled:opacity-40 transition-opacity">
                  <Icon icon={Check} size={17} strokeWidth={2.5}/>
                </button>
                <button onClick={() => { setAddingExercice(false); setNewExerciceNom(""); }}
                  className="shrink-0 w-11 h-11 rounded-xl border border-[var(--t-border)] text-[var(--t-text-30)] hover:text-[var(--t-text-60)] flex items-center justify-center transition-colors">
                  <Icon icon={X} size={16} strokeWidth={2}/>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setShowLibrary(true)}
                  className="flex-1 flex items-center justify-center gap-2 border border-[var(--t-border)] rounded-xl text-[0.7rem] tracking-wider uppercase text-[var(--t-text-30)] hover:text-[#c9a84c] hover:border-[#c9a84c]/40 transition-colors py-2.5 font-medium">
                  <RichIcon name="library" size={48} className="drop-shadow-[0_4px_8px_rgba(201,168,76,0.35)]"/> Bibliothèque
                </button>
                <button onClick={() => setAddingExercice(true)}
                  className="flex-1 flex items-center justify-center gap-2 border border-[var(--t-border)] rounded-xl text-[0.7rem] tracking-wider uppercase text-[var(--t-text-30)] hover:text-[#c9a84c] hover:border-[#c9a84c]/40 transition-colors py-2.5 font-medium">
                  <RichIcon name="notebookPen" size={48} className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.22)]"/> Nom libre
                </button>
              </div>
            )
          );

          const run = runs[runIdx];
          if (!run) return (
            <div className="flex flex-col gap-3 pt-6">
              <p className="text-center text-[0.7rem] text-[var(--t-text-30)] mb-1">Aucun exercice pour l&apos;instant — ajoute le premier :</p>
              {addExerciceBlock}
            </div>
          );
          const complete = runIsComplete(run);
          return (
            <div className="flex flex-col gap-3">
              {run.groupId ? (
                <div className="border border-[#c9a84c]/25 bg-[#c9a84c]/[0.03] rounded-2xl p-3 flex flex-col gap-3">
                  <p className="text-[0.62rem] tracking-[0.15em] uppercase text-[#c9a84c] font-medium px-1">{run.groupLabel || "Superset"}</p>
                  {run.indices.map(exIdx => (
                    <ExerciceLiveBlock key={exIdx} ex={exercices[exIdx]} exIdx={exIdx} logs={logs}
                      history={historyByNom[exercices[exIdx].nom] ?? {}} prBadge={!!prByNom[exercices[exIdx].nom]}
                      extra={extraSets[exIdx] ?? 0} onToggle={onToggle} onChange={onChange} onAddSet={onAddSet}
                      onToggleWarmup={onToggleWarmup} onRemoveExtra={onRemoveExtra}
                      onAddDrop={addDrop} onChangeDrop={changeDrop} onRemoveDrop={removeDrop}
                      onAddWarmupStep={addWarmupStep} onChangeWarmupStep={changeWarmupStep} onRemoveWarmupStep={removeWarmupStep}
                      onChangeRepKind={changeRepKind} onRemoveExercice={removeExercice}/>
                  ))}
                </div>
              ) : (
                <ExerciceLiveBlock ex={exercices[run.indices[0]]} exIdx={run.indices[0]} logs={logs}
                  history={historyByNom[exercices[run.indices[0]].nom] ?? {}} prBadge={!!prByNom[exercices[run.indices[0]].nom]}
                  extra={extraSets[run.indices[0]] ?? 0} onToggle={onToggle} onChange={onChange} onAddSet={onAddSet}
                  onToggleWarmup={onToggleWarmup} onRemoveExtra={onRemoveExtra}
                  onAddDrop={addDrop} onChangeDrop={changeDrop} onRemoveDrop={removeDrop}
                  onAddWarmupStep={addWarmupStep} onChangeWarmupStep={changeWarmupStep} onRemoveWarmupStep={removeWarmupStep}
                  onChangeRepKind={changeRepKind} onRemoveExercice={removeExercice}/>
              )}

              {runIdx < runs.length - 1 ? (
                <button onClick={goNext}
                  className={`w-full py-4 rounded-2xl text-sm font-bold tracking-[0.1em] uppercase transition-all duration-200 flex items-center justify-center gap-2 ${
                    complete ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black shadow-[0_4px_16px_-6px_rgba(201,168,76,0.6)] hover:-translate-y-0.5"
                             : "border border-[var(--t-border)] text-[var(--t-text-30)] hover:text-[var(--t-text-60)] hover:border-[var(--t-text-20)]"}`}>
                  Exercice suivant <span aria-hidden>→</span>
                </button>
              ) : complete ? (
                <p className="text-center text-[0.68rem] text-[#7eb8a0] tracking-wide py-1">Dernier exercice terminé — tu peux finir la séance ✓</p>
              ) : null}

              {/* Ajouter un exercice non prévu — après l'exercice en cours plutôt qu'au-dessus,
                  pour ne pas encombrer le haut de l'écran avant même d'avoir vu ce qu'on logue. */}
              <div className="flex flex-col gap-2 pt-3 mt-1 border-t border-[var(--t-border-soft)]">
                <button type="button" onClick={() => setLinkSuperset(v => !v)}
                  className="w-full flex items-center gap-2 text-left px-1 py-1">
                  <span className={`w-4 h-4 rounded shrink-0 border flex items-center justify-center transition-colors ${linkSuperset ? "bg-[#c9a84c] border-[#c9a84c]" : "border-[var(--t-border)]"}`}>
                    {linkSuperset && <Icon icon={Check} size={10} strokeWidth={3} className="text-black"/>}
                  </span>
                  <span className={`text-[0.62rem] tracking-wide transition-colors ${linkSuperset ? "text-[#c9a84c]" : "text-[var(--t-text-25)]"}`}>
                    Le prochain exercice ajouté rejoint « {exercices[run.indices[0]]?.nom || "cet exercice"} »{run.indices.length > 1 ? " (déjà groupé)" : ""}
                  </span>
                </button>
                {addExerciceBlock}
              </div>
            </div>
          );
        })()}
      </div>

      {rest && rest.left > 0 && (() => {
        const almostDone = rest.left <= 5;
        return (
        <div className="absolute left-0 right-0 bottom-0 px-4 pb-4 shrink-0 pointer-events-none">
          <div className={`pointer-events-auto max-w-sm mx-auto border rounded-2xl shadow-[0_16px_40px_-8px_rgba(0,0,0,0.55)] overflow-hidden transition-colors ${almostDone ? "border-[#e0834a]/50 bg-[var(--t-surface)] animate-pulse" : "border-[#c9a84c]/30 bg-[var(--t-surface)]"}`}>
            <div className="h-1.5 bg-[var(--t-track)]">
              <div className={`h-full transition-all duration-1000 linear ${almostDone ? "bg-gradient-to-r from-[#e0834a] to-[#e07070]" : "bg-gradient-to-r from-[#e2c97e] to-[#c9a84c]"}`} style={{ width: `${Math.min((rest.left / rest.total) * 100, 100)}%` }}/>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex flex-col items-start">
                <span className="text-[0.62rem] tracking-[0.2em] uppercase text-[var(--t-text-30)]">Repos</span>
                <span style={{ fontFamily: "var(--font-bebas)" }} className={`text-4xl tracking-wide leading-none mt-0.5 ${almostDone ? "text-[#e0834a]" : "text-[#c9a84c]"}`}>{fmtClock(rest.left)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setRest(r => r ? { ...r, paused: !r.paused } : r)} title={rest.paused ? "Reprendre" : "Mettre en pause"}
                  className={`w-11 h-11 rounded-full border flex items-center justify-center active:scale-90 transition-all ${
                    rest.paused ? "border-[#c9a84c]/50 bg-[#c9a84c]/10 text-[#c9a84c]" : "border-[var(--t-border)] text-[var(--t-text-40)] hover:text-[var(--t-text-70)]"}`}>
                  <Icon icon={rest.paused ? Play : Pause} size={16} strokeWidth={2}/>
                </button>
                <button onClick={() => setRest(r => r ? { ...r, left: Math.max(0, r.left - 15) } : r)}
                  className="w-11 h-11 rounded-full border border-[var(--t-border)] text-[var(--t-text-40)] hover:text-[var(--t-text-70)] active:scale-90 transition-all text-sm font-medium">−15</button>
                <button onClick={() => setRest(r => r ? { left: r.left + 15, total: Math.max(r.total, r.left + 15) } : r)}
                  className="w-11 h-11 rounded-full border border-[var(--t-border)] text-[var(--t-text-40)] hover:text-[var(--t-text-70)] active:scale-90 transition-all text-sm font-medium">+15</button>
                <button onClick={() => setRest(null)}
                  className="text-[0.65rem] uppercase tracking-wider font-medium text-[var(--t-text-30)] hover:text-[var(--t-text-60)] transition-colors ml-1 px-2 py-3">Passer</button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
