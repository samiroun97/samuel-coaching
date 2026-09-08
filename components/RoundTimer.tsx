"use client";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { NumberStepper } from "@/components/NumberStepper";
import { X, Play, Pause, ChevronRight, Repeat, Flame } from "@/lib/solarIcons";

type Phase = "config" | "ready" | "work" | "rest" | "done";

const READY_SECONDS = 5;

const PHASE_LABEL: Record<Phase, string> = { config: "", ready: "Prêt", work: "Travail", rest: "Repos", done: "Terminé" };
const PHASE_COLOR: Record<Phase, string> = { config: "#c9a84c", ready: "#c9a84c", work: "#c9a84c", rest: "#7eb8a0", done: "#c9a84c" };

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// Petit bip synthétisé (Web Audio, aucun fichier audio à charger) : un ton par transition
// de phase, plus aigu pour le passage au travail, plus grave pour le repos — pas besoin de
// regarder l'écran pour sentir que ça change.
function beep(freq: number, durationMs = 150) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + durationMs / 1000);
    osc.onended = () => ctx.close();
  } catch { /* Web Audio indisponible — le minuteur reste utilisable sans le son */ }
}

// Minuteur par rounds façon HIIT/Tabata (inspiré d'apps open source comme OpenHIIT) : on
// configure un nombre de rounds, un temps de travail et un temps de repos, et le minuteur
// enchaîne tout seul plutôt que de compter sur un tap manuel après chaque série — utile pour
// un circuit, un EMOM, ou toute séance cadencée par le temps plutôt que par des séries fixes.
export function RoundTimer({ onClose }: { onClose: () => void }) {
  const [rounds,   setRounds]   = useState("3");
  const [work,     setWork]     = useState("40");
  const [rest,     setRest]     = useState("20");
  const [reps,     setReps]     = useState("");

  const [phase,    setPhase]    = useState<Phase>("config");
  const [round,    setRound]    = useState(1);
  const [left,     setLeft]     = useState(0);
  const [total,    setTotal]    = useState(0);
  const [paused,   setPaused]   = useState(false);
  const [muted,    setMuted]    = useState(false);

  const roundsN = Math.max(1, parseInt(rounds, 10) || 1);
  const workN   = Math.max(1, parseInt(work, 10) || 1);
  const restN   = Math.max(0, parseInt(rest, 10) || 0);

  const play = (freq: number) => { if (!muted) beep(freq); };

  const start = () => {
    setRound(1); setPhase("ready"); setLeft(READY_SECONDS); setTotal(READY_SECONDS); setPaused(false);
    play(660);
  };

  // Avance à la phase suivante de la séquence ready → (work → rest) × N → done — appelé au
  // décompte à zéro, ou manuellement via le bouton "passer".
  const advance = () => {
    if (phase === "ready") { setPhase("work"); setLeft(workN); setTotal(workN); play(880); return; }
    if (phase === "work") {
      if (restN > 0) { setPhase("rest"); setLeft(restN); setTotal(restN); play(440); return; }
      if (round >= roundsN) { setPhase("done"); play(880); return; }
      setRound(r => r + 1); setLeft(workN); setTotal(workN); play(880); return;
    }
    if (phase === "rest") {
      if (round >= roundsN) { setPhase("done"); play(880); return; }
      setRound(r => r + 1); setPhase("work"); setLeft(workN); setTotal(workN); play(880); return;
    }
  };

  useEffect(() => {
    if (phase === "config" || phase === "done" || paused) return;
    const t = setTimeout(() => {
      if (left <= 1) { advance(); return; }
      setLeft(l => l - 1);
      if (left <= 4) play(330); // petit tic dans les 3 dernières secondes
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, left, paused]);

  const reset = () => { setPhase("config"); setPaused(false); };
  const skip  = () => { if (phase === "work" || phase === "rest" || phase === "ready") advance(); };
  const restart = () => { setRound(1); setPhase("ready"); setLeft(READY_SECONDS); setTotal(READY_SECONDS); setPaused(false); };

  const color = PHASE_COLOR[phase];
  const pct = total > 0 ? Math.max(0, Math.min(100, (left / total) * 100)) : 0;

  return (
    <div className="fixed inset-0 bg-[var(--t-bg)] z-[70] flex flex-col">
      <div className="flex items-center justify-between px-5 py-3.5 shrink-0 max-w-md mx-auto w-full">
        <p style={{ fontFamily: "var(--font-bebas)" }} className="text-lg tracking-wider text-[var(--t-text)] flex items-center gap-2">
          <Icon icon={Repeat} size={18} strokeWidth={2} className="text-[#c9a84c]"/> Minuteur
        </p>
        <button onClick={onClose} className="text-[var(--t-text-30)] hover:text-[var(--t-text)] transition-colors w-11 h-11 flex items-center justify-center -mr-2.5">
          <Icon icon={X} size={20} strokeWidth={2}/>
        </button>
      </div>

      {phase === "config" && (
        <div className="flex-1 overflow-y-auto px-5 pb-8 max-w-md mx-auto w-full flex flex-col gap-6">
          <p className="text-[0.68rem] text-[var(--t-text-30)] leading-relaxed">
            Cadence un circuit, un EMOM ou une séance en intervalles : configure les rounds, le minuteur enchaîne travail et repos tout seul.
          </p>
          <div>
            <label className="text-[0.62rem] tracking-[0.15em] uppercase text-[var(--t-text-30)] block mb-2">Rounds</label>
            <NumberStepper size="lg" value={rounds} placeholder="3" step={1} onChange={setRounds}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[0.62rem] tracking-[0.15em] uppercase text-[var(--t-text-30)] block mb-2">Travail (s)</label>
              <NumberStepper size="lg" value={work} placeholder="40" step={5} onChange={setWork} accent/>
            </div>
            <div>
              <label className="text-[0.62rem] tracking-[0.15em] uppercase text-[var(--t-text-30)] block mb-2">Repos (s)</label>
              <NumberStepper size="lg" value={rest} placeholder="20" step={5} onChange={setRest}/>
            </div>
          </div>
          <div>
            <label className="text-[0.62rem] tracking-[0.15em] uppercase text-[var(--t-text-30)] block mb-2">Répétitions visées <span className="text-[var(--t-text-20)] normal-case">(optionnel, affiché pendant le travail)</span></label>
            <NumberStepper size="lg" value={reps} placeholder="—" step={1} onChange={setReps}/>
          </div>
          <button onClick={start}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-base font-bold tracking-[0.1em] uppercase py-4 rounded-xl shadow-[0_6px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_8px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all">
            <Icon icon={Play} size={18} strokeWidth={2}/> Démarrer
          </button>
        </div>
      )}

      {(phase === "ready" || phase === "work" || phase === "rest") && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full">
          <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[var(--t-text-30)] mb-1">Round {round} / {roundsN}</p>
          <p className="text-sm font-bold tracking-[0.15em] uppercase mb-4" style={{ color }}>{PHASE_LABEL[phase]}</p>

          <div className="relative w-56 h-56 flex items-center justify-center mb-6">
            <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
              <circle cx="50" cy="50" r="46" fill="none" stroke="var(--t-track)" strokeWidth="5"/>
              <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 46} strokeDashoffset={2 * Math.PI * 46 * (1 - pct / 100)}
                style={{ transition: "stroke-dashoffset 1s linear" }}/>
            </svg>
            <span style={{ fontFamily: "var(--font-bebas)", color }} className="text-7xl tracking-wide leading-none">{fmt(left)}</span>
          </div>

          {phase === "work" && reps.trim() && (
            <p className="text-sm text-[var(--t-text-50)] mb-6">Objectif : <span className="font-bold text-[var(--t-text)]">{reps} reps</span></p>
          )}

          <div className="flex items-center gap-4">
            <button onClick={restart} title="Recommencer"
              className="w-12 h-12 rounded-full border border-[var(--t-border)] text-[var(--t-text-40)] hover:text-[var(--t-text-70)] active:scale-90 transition-all flex items-center justify-center">
              <Icon icon={Repeat} size={18} strokeWidth={2}/>
            </button>
            <button onClick={() => setPaused(p => !p)}
              className="w-16 h-16 rounded-full flex items-center justify-center text-black transition-all active:scale-90 shadow-[0_6px_20px_-6px_rgba(201,168,76,0.6)]"
              style={{ background: `linear-gradient(to bottom, #e2c97e, ${color})` }}>
              <Icon icon={paused ? Play : Pause} size={24} strokeWidth={2}/>
            </button>
            <button onClick={skip} title="Passer"
              className="w-12 h-12 rounded-full border border-[var(--t-border)] text-[var(--t-text-40)] hover:text-[var(--t-text-70)] active:scale-90 transition-all flex items-center justify-center">
              <Icon icon={ChevronRight} size={20} strokeWidth={2}/>
            </button>
          </div>

          <button onClick={() => setMuted(m => !m)}
            className="mt-6 text-[0.6rem] tracking-wider uppercase text-[var(--t-text-20)] hover:text-[var(--t-text-50)] transition-colors">
            {muted ? "Son coupé" : "Son activé"} — {muted ? "réactiver" : "couper"}
          </button>
        </div>
      )}

      {phase === "done" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full text-center gap-5">
          <Icon icon={Flame} fill="currentColor" stroke="none" className="w-14 h-14 text-[#e8a13c]"/>
          <div>
            <p style={{ fontFamily: "var(--font-bebas)" }} className="text-3xl text-[var(--t-text)] tracking-wide">Minuteur terminé</p>
            <p className="text-xs text-[var(--t-text-30)] mt-1">{roundsN} round{roundsN > 1 ? "s" : ""} bouclé{roundsN > 1 ? "s" : ""}</p>
          </div>
          <div className="flex gap-2 w-full">
            <button onClick={restart}
              className="flex-1 border border-[var(--t-border)] text-[var(--t-text-40)] rounded-xl text-[0.7rem] tracking-[0.15em] uppercase py-3 hover:border-[var(--t-text-20)] hover:text-[var(--t-text-60)] transition-colors">
              Refaire
            </button>
            <button onClick={reset}
              className="flex-1 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.7rem] font-bold tracking-[0.15em] uppercase py-3 rounded-xl shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] transition-all">
              Nouveau minuteur
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
