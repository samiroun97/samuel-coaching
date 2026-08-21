"use client";
import { useEffect, useMemo, useState } from "react";
import { ACADEMY_UNITS, type AcademyLesson } from "@/lib/academyContent";

type LessonProgress = { completed: boolean; score: number; total: number };
type ProgressMap = Record<string, LessonProgress>;

const PROGRESS_KEY = "academy_progress";
// Décalage horizontal (px) de chaque noeud pour dessiner un chemin sinueux,
// façon Duolingo — le motif boucle si une unité compte plus de leçons.
const WAVE = [0, 70, 98, 42, -42, -98, -70];
const NODE_SIZE = 68;
const NODE_GAP_Y = 108;

function loadProgress(): ProgressMap {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(PROGRESS_KEY) || "{}"); } catch { return {}; }
}

function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#0a0a0a" stroke="none">
      <polygon points="6 3 21 12 6 21"/>
    </svg>
  );
}

function PathNode({ lesson, offset, top, state, onClick }: {
  lesson: AcademyLesson; offset: number; top: number;
  state: "locked" | "current" | "completed"; onClick: () => void;
}) {
  return (
    <div className="absolute" style={{ left: `calc(50% + ${offset}px)`, top, transform: "translateX(-50%)" }}>
      {state === "current" && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full bg-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.12em] uppercase shadow-[0_4px_16px_-4px_rgba(201,168,76,0.7)]">
          Continuer
        </div>
      )}
      <button
        onClick={onClick}
        disabled={state === "locked"}
        title={lesson.title}
        style={{ width: NODE_SIZE, height: NODE_SIZE }}
        className={`rounded-full flex items-center justify-center border transition-all duration-200 ${
          state === "locked"
            ? "bg-[var(--t-surface)] border-[var(--t-border)] text-[var(--t-text-20)] cursor-default"
            : state === "completed"
            ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] border-[#c9a84c] shadow-[0_4px_18px_-4px_rgba(201,168,76,0.6)]"
            : "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] border-[#c9a84c] shadow-[0_4px_22px_-2px_rgba(201,168,76,0.8)] scale-105"
        }`}
      >
        {state === "locked" ? <LockIcon/> : state === "completed" ? <CheckIcon/> : <PlayIcon/>}
      </button>
      <p className={`mt-2 text-center text-[0.55rem] tracking-[0.08em] uppercase ${state === "locked" ? "text-[var(--t-text-20)]" : "text-[var(--t-text-60)]"}`}>
        {lesson.title}
      </p>
    </div>
  );
}

function LessonViewer({ lesson, onClose, onComplete }: {
  lesson: AcademyLesson; onClose: () => void; onComplete: (score: number, total: number) => void;
}) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const totalSteps = lesson.cards.length + lesson.quiz.length;
  const inCards = step < lesson.cards.length;
  const quizIndex = step - lesson.cards.length;
  const finished = step >= totalSteps;

  useEffect(() => { setSelected(null); }, [step]);

  if (finished) {
    const total = lesson.quiz.length;
    const pct = total ? Math.round((correctCount / total) * 100) : 100;
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] flex items-center justify-center shadow-[0_8px_28px_-6px_rgba(201,168,76,0.7)] mb-5">
          <CheckIcon/>
        </div>
        <h2 style={{ fontFamily: "var(--font-bebas)" }} className="text-3xl text-[var(--t-text)] tracking-wide mb-2">Leçon terminée</h2>
        <p className="text-[0.75rem] text-[var(--t-text-50)] mb-6">{correctCount}/{total} bonnes réponses ({pct}%)</p>
        <button
          onClick={() => onComplete(correctCount, total)}
          className="px-8 py-3 rounded-xl bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.72rem] font-bold tracking-[0.2em] uppercase shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:-translate-y-0.5 transition-all duration-200">
          Continuer
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[70vh]">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onClose} aria-label="Fermer" className="text-[var(--t-text-40)] hover:text-[var(--t-text-70)] transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <div className="flex-1 h-2 rounded-full bg-[var(--t-track)] overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[#c9a84c] to-[#e2c97e] transition-all duration-300" style={{ width: `${(step / totalSteps) * 100}%` }}/>
        </div>
      </div>

      {inCards ? (
        <div className="flex-1 flex flex-col justify-center px-2">
          {lesson.cards[step].kind === "quote" ? (
            <blockquote className="text-center text-xl sm:text-2xl leading-snug text-[var(--t-text-80)]" style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.01em" }}>
              <span className="text-[#c9a84c]">“</span>{lesson.cards[step].body}<span className="text-[#c9a84c]">”</span>
            </blockquote>
          ) : (
            <p className="text-[0.95rem] leading-relaxed text-[var(--t-text-80)]">{lesson.cards[step].body}</p>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col px-2">
          <p className="text-[0.6rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-3">Question {quizIndex + 1}/{lesson.quiz.length}</p>
          <p className="text-[1rem] font-medium text-[var(--t-text)] mb-6">{lesson.quiz[quizIndex].question}</p>
          <div className="flex flex-col gap-2.5">
            {lesson.quiz[quizIndex].options.map((opt, i) => {
              const isCorrect = i === lesson.quiz[quizIndex].correctIndex;
              const isSelected = selected === i;
              let cls = "border-[var(--t-border)] text-[var(--t-text-70)] hover:border-[var(--t-text-30)]";
              if (selected !== null) {
                if (isCorrect) cls = "border-[#7eb8a0] bg-[#7eb8a0]/10 text-[#7eb8a0]";
                else if (isSelected) cls = "border-[#e07070] bg-[#e07070]/10 text-[#e07070]";
                else cls = "border-[var(--t-border)] text-[var(--t-text-30)]";
              }
              return (
                <button key={i} disabled={selected !== null}
                  onClick={() => { setSelected(i); if (isCorrect) setCorrectCount(c => c + 1); }}
                  className={`text-left px-4 py-3 rounded-xl border text-[0.85rem] transition-all duration-150 ${cls}`}>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={() => setStep(s => s + 1)}
        disabled={!inCards && selected === null}
        className="mt-6 w-full py-3.5 rounded-xl bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.72rem] font-bold tracking-[0.2em] uppercase shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] disabled:opacity-30 disabled:shadow-none disabled:pointer-events-none hover:-translate-y-0.5 transition-all duration-200">
        Continuer
      </button>
    </div>
  );
}

export default function AcademiePage() {
  const [progress, setProgress] = useState<ProgressMap>({});
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  useEffect(() => { setProgress(loadProgress()); }, []);

  const unit = ACADEMY_UNITS[0];
  const activeLesson = useMemo(() => unit.lessons.find(l => l.id === activeLessonId) ?? null, [unit, activeLessonId]);

  const nodeStates = useMemo(() => {
    let unlocked = true;
    return unit.lessons.map(l => {
      const done = progress[l.id]?.completed ?? false;
      const state: "locked" | "current" | "completed" = done ? "completed" : unlocked ? "current" : "locked";
      if (!done) unlocked = false;
      return state;
    });
  }, [unit, progress]);

  const completedCount = unit.lessons.filter(l => progress[l.id]?.completed).length;

  function saveLessonResult(lessonId: string, score: number, total: number) {
    const next: ProgressMap = { ...progress, [lessonId]: { completed: true, score, total } };
    setProgress(next);
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
    setActiveLessonId(null);
  }

  if (activeLesson) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl">
        <LessonViewer
          lesson={activeLesson}
          onClose={() => setActiveLessonId(null)}
          onComplete={(score, total) => saveLessonResult(activeLesson.id, score, total)}
        />
      </div>
    );
  }

  const containerHeight = NODE_GAP_Y * (unit.lessons.length - 1) + 90;
  const points = unit.lessons.map((_, i) => ({
    x: 160 + WAVE[i % WAVE.length],
    y: 44 + i * NODE_GAP_Y,
  }));
  const pathD = points.reduce((d, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${d} Q ${points[i - 1].x} ${p.y} ${p.x} ${p.y}`, "");

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <div className="mb-6">
        <p className="text-[0.7rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-2">Rubrique</p>
        <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl sm:text-5xl text-[var(--t-text)] tracking-wide">ACADÉMIE</h1>
      </div>

      <div className="mb-6 p-4 rounded-xl border border-[var(--t-border)] bg-[var(--t-surface)]">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[0.85rem] font-semibold text-[var(--t-text)]">{unit.title}</p>
          <p className="text-[0.65rem] text-[var(--t-text-40)]">{completedCount}/{unit.lessons.length}</p>
        </div>
        <p className="text-[0.75rem] text-[var(--t-text-50)] leading-snug mb-2.5">{unit.description}</p>
        <div className="h-1.5 rounded-full bg-[var(--t-track)] overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[#c9a84c] to-[#e2c97e] transition-all duration-500" style={{ width: `${(completedCount / unit.lessons.length) * 100}%` }}/>
        </div>
      </div>

      <div className="relative mx-auto" style={{ width: 320, height: containerHeight }}>
        <svg className="absolute inset-0" width="320" height={containerHeight} style={{ overflow: "visible" }}>
          <path d={pathD} fill="none" stroke="var(--t-border-15)" strokeWidth="4" strokeDasharray="2 10" strokeLinecap="round"/>
        </svg>
        {unit.lessons.map((lesson, i) => (
          <PathNode
            key={lesson.id}
            lesson={lesson}
            offset={WAVE[i % WAVE.length]}
            top={points[i].y - NODE_SIZE / 2}
            state={nodeStates[i]}
            onClick={() => { if (nodeStates[i] !== "locked") setActiveLessonId(lesson.id); }}
          />
        ))}
      </div>
    </div>
  );
}
