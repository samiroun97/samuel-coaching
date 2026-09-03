"use client";
import { useState, useEffect } from "react";
import { apiPost } from "@/lib/apiClient";

type Profile = { id: string; email: string; prenom: string; nom: string };
type Msg = { id: string; from_email: string; to_email: string; content: string; created_at: string };
type Correction = {
  id: string; category: Category; message_id: string | null;
  original_data: Record<string, unknown> | null; corrected_data: Record<string, unknown> | null;
  client_comment: string | null; coach_comment: string; created_at: string;
};

// Catégories réellement stockées en base — chacune alimente un prompt IA distinct
// (cf. app/api/nutrition/analyze, app/api/programme/calories, app/api/programme/generate).
type Category = "nutrition" | "programme" | "activite";
const CATEGORY_LABELS: Record<Category, string> = { nutrition: "Nutrition", programme: "Programme", activite: "Calcul calories" };

type NutritionFeedback = { calories: number; proteines: number; glucides: number; lipides: number; name: string; description: string; photo: string | null; comment: string };
type ActiviteFeedback  = { activity: string; duration_minutes: number; calories_brulees: number; comment: string };
type ProgrammeFeedback = { titre: string; type_seance: string | null; description: string | null; comment: string };

const NUTRITION_RE = /^\[NUTRITION_FEEDBACK:(\{[\s\S]*\})\]$/;
const ACTIVITE_RE  = /^\[ACTIVITE_FEEDBACK:(\{[\s\S]*\})\]$/;
const PROGRAMME_RE = /^\[PROGRAMME_FEEDBACK:(\{[\s\S]*\})\]$/;

function parseJson<T>(re: RegExp, content: string): T | null {
  const m = content.match(re);
  if (!m) return null;
  try { return JSON.parse(m[1]) as T; } catch { return null; }
}

function detectCategory(content: string): Category | null {
  if (NUTRITION_RE.test(content)) return "nutrition";
  if (ACTIVITE_RE.test(content))  return "activite";
  if (PROGRAMME_RE.test(content)) return "programme";
  return null;
}

type UiTab = "nutrition" | "entrainement";
const UI_TABS: { key: UiTab; label: string; categories: Category[]; test: (c: string) => boolean }[] = [
  { key: "nutrition",    label: "Nutrition",    categories: ["nutrition"],          test: c => NUTRITION_RE.test(c) },
  { key: "entrainement", label: "Entraînement", categories: ["programme", "activite"], test: c => ACTIVITE_RE.test(c) || PROGRAMME_RE.test(c) },
];

// Version plateforme (tous coachs confondus) de app/crm/ia/page.tsx — même UI, mais les
// lectures/écritures passent par /api/operateur/ia-* (service_role) au lieu de RLS par coach.
export function OperateurIaCorrections() {
  const [profiles,    setProfiles]    = useState<Profile[]>([]);
  const [msgs,        setMsgs]        = useState<Msg[]>([]);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState<UiTab>("nutrition");

  const [correctingId,      setCorrectingId]      = useState<string | null>(null);
  const [correctionValue,   setCorrectionValue]   = useState("");
  const [correctionComment, setCorrectionComment] = useState("");
  const [correctionSaving,  setCorrectionSaving]  = useState(false);

  const [noteText,        setNoteText]        = useState("");
  const [noteSubCategory, setNoteSubCategory]  = useState<Category>("programme");
  const [noteSaving,      setNoteSaving]       = useState(false);

  useEffect(() => {
    (async () => {
      const res = await apiPost("/api/operateur/ia-data", {});
      if (res.ok) {
        const d = await res.json();
        setProfiles(d.profiles ?? []); setMsgs(d.msgs ?? []); setCorrections(d.corrections ?? []);
      }
      setLoading(false);
    })();
  }, []);

  const clientName = (email: string) => {
    const p = profiles.find(p => p.email === email);
    return p ? `${p.prenom} ${p.nom}`.trim() : email;
  };

  const uiTab = UI_TABS.find(t => t.key === tab)!;
  const items = msgs
    .filter(m => uiTab.test(m.content))
    .map(m => ({ msg: m, category: detectCategory(m.content)!, correction: corrections.find(c => c.message_id === m.id) ?? null }));
  const pending  = items.filter(i => !i.correction);
  const resolved = items.filter(i => i.correction);
  const standaloneNotes = corrections.filter(c => uiTab.categories.includes(c.category) && !c.message_id);

  const submitCorrection = async (messageId: string, category: Category, originalData: Record<string, unknown> | null, clientComment: string) => {
    if (!correctionComment.trim()) return;
    setCorrectionSaving(true);
    const correctedData = correctionValue.trim()
      ? { valeur: isNaN(Number(correctionValue)) ? correctionValue.trim() : Number(correctionValue) }
      : null;
    const res = await apiPost("/api/operateur/ia-correct", {
      category, messageId, originalData, correctedData, clientComment, coachComment: correctionComment.trim(),
    });
    setCorrectionSaving(false);
    if (!res.ok) { alert("Erreur lors de l'enregistrement."); return; }
    const data = await res.json();
    setCorrections(prev => [data as Correction, ...prev]);
    setCorrectingId(null); setCorrectionComment(""); setCorrectionValue("");
  };

  const submitNote = async () => {
    if (!noteText.trim()) return;
    setNoteSaving(true);
    const category: Category = tab === "entrainement" ? noteSubCategory : "nutrition";
    const res = await apiPost("/api/operateur/ia-correct", {
      category, messageId: null, originalData: null, correctedData: null, clientComment: null, coachComment: noteText.trim(),
    });
    setNoteSaving(false);
    if (!res.ok) { alert("Erreur lors de l'enregistrement."); return; }
    const data = await res.json();
    setCorrections(prev => [data as Correction, ...prev]);
    setNoteText("");
  };

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-5 h-5 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <div>
      <p className="text-[var(--t-text-30)] text-xs mb-4">Signalements clients (tous coachs) et calibration des estimations IA</p>

      {/* Tabs */}
      <div className="flex border border-[var(--t-border)] mb-6 rounded-xl overflow-hidden">
        {UI_TABS.map(t => {
          const count = msgs.filter(m => t.test(m.content) && !corrections.some(c => c.message_id === m.id)).length;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-[0.68rem] tracking-[0.15em] uppercase transition-colors flex items-center justify-center gap-1.5 ${
                tab === t.key ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black font-bold" : "text-[var(--t-text-40)] hover:text-[var(--t-text-70)] hover:bg-[var(--t-glass-bg)]"}`}>
              {t.label}
              {count > 0 && (
                <span className={`text-[0.55rem] font-bold px-1.5 py-0.5 rounded-full min-w-[1.1rem] text-center ${tab === t.key ? "bg-black/20 text-white" : "bg-[#e07070] text-[var(--t-text)]"}`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Nourrir l'IA — note libre, pas liée à un signalement */}
      <div className="border border-[#c9a84c]/20 bg-[#c9a84c]/5 rounded-xl p-4 mb-8 flex flex-col gap-3">
        <p className="text-[0.68rem] tracking-[0.15em] uppercase text-[#c9a84c]">Nourrir l&apos;IA — {uiTab.label}</p>
        <p className="text-[0.62rem] text-[var(--t-text-40)] leading-relaxed">
          Ajoute une info générale que l&apos;IA doit prendre en compte pour cette catégorie, sans attendre un signalement client.
        </p>
        {tab === "entrainement" && (
          <div className="flex gap-2">
            {(["programme", "activite"] as Category[]).map(c => (
              <button key={c} onClick={() => setNoteSubCategory(c)}
                className={`px-3 py-1.5 rounded-xl text-[0.6rem] tracking-wider uppercase transition-colors ${
                  noteSubCategory === c ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black font-bold" : "border border-[var(--t-border)] text-[var(--t-text-40)] hover:text-[var(--t-text-60)]"}`}>
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        )}
        <textarea className="w-full bg-[var(--t-surface-2)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors resize-none" rows={2}
          placeholder="Ex : pour les plats de pâtes maison, compte toujours au moins 15g d'huile d'olive même si le client ne la mentionne pas..."
          value={noteText} onChange={e => setNoteText(e.target.value)}/>
        <button onClick={submitNote} disabled={noteSaving || !noteText.trim()}
          className="self-end bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.65rem] font-bold tracking-[0.15em] uppercase px-4 py-2 shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-40 rounded-xl">
          {noteSaving ? "Enregistrement…" : "Enregistrer →"}
        </button>
      </div>

      {/* Signalements en attente */}
      <p className="text-[0.68rem] tracking-[0.15em] uppercase text-[var(--t-text-30)] mb-3">
        Signalements en attente {pending.length > 0 && <span className="text-[#e07070]">({pending.length})</span>}
      </p>
      {pending.length === 0 ? (
        <p className="text-[var(--t-text-20)] text-xs mb-8">Aucun signalement en attente sur cette catégorie.</p>
      ) : (
        <div className="flex flex-col gap-3 mb-8">
          {pending.map(({ msg, category }) => (
            <SignalementCard key={msg.id} category={category} msg={msg} clientName={clientName(msg.from_email)}
              correction={null}
              correcting={correctingId === msg.id}
              onStartCorrect={() => setCorrectingId(msg.id)}
              onCancelCorrect={() => { setCorrectingId(null); setCorrectionComment(""); setCorrectionValue(""); }}
              correctionValue={correctionValue} setCorrectionValue={setCorrectionValue}
              correctionComment={correctionComment} setCorrectionComment={setCorrectionComment}
              correctionSaving={correctionSaving}
              onSubmitCorrect={(originalData, clientComment) => submitCorrection(msg.id, category, originalData, clientComment)}
            />
          ))}
        </div>
      )}

      {(resolved.length > 0 || standaloneNotes.length > 0) && (
        <>
          <p className="text-[0.68rem] tracking-[0.15em] uppercase text-[var(--t-text-30)] mb-3">Historique</p>
          <div className="flex flex-col gap-3">
            {resolved.map(({ msg, category, correction }) => (
              <SignalementCard key={msg.id} category={category} msg={msg} clientName={clientName(msg.from_email)}
                correction={correction} correcting={false}
                onStartCorrect={() => {}} onCancelCorrect={() => {}}
                correctionValue="" setCorrectionValue={() => {}}
                correctionComment="" setCorrectionComment={() => {}}
                correctionSaving={false} onSubmitCorrect={() => {}}
              />
            ))}
            {standaloneNotes.map(c => (
              <div key={c.id} className="border-l-2 border-[#7eb8a0] bg-[var(--t-surface-2)] px-4 py-3">
                <p className="text-[0.5rem] tracking-[0.15em] uppercase text-[#7eb8a0] mb-1">
                  ✓ Note générale envoyée à l&apos;IA{tab === "entrainement" ? ` · ${CATEGORY_LABELS[c.category]}` : ""}
                </p>
                <p className="text-[0.68rem] text-[var(--t-text-50)] leading-relaxed">{c.coach_comment}</p>
                <p className="text-[0.55rem] text-[var(--t-text-15)] mt-1">{new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SignalementCard({
  category, msg, clientName, correction, correcting,
  onStartCorrect, onCancelCorrect, correctionValue, setCorrectionValue,
  correctionComment, setCorrectionComment, correctionSaving, onSubmitCorrect,
}: {
  category: Category; msg: Msg; clientName: string; correction: Correction | null; correcting: boolean;
  onStartCorrect: () => void; onCancelCorrect: () => void;
  correctionValue: string; setCorrectionValue: (v: string) => void;
  correctionComment: string; setCorrectionComment: (v: string) => void;
  correctionSaving: boolean; onSubmitCorrect: (originalData: Record<string, unknown> | null, clientComment: string) => void;
}) {
  const nutrition = category === "nutrition" ? parseJson<NutritionFeedback>(NUTRITION_RE, msg.content) : null;
  const activite  = category === "activite"  ? parseJson<ActiviteFeedback>(ACTIVITE_RE, msg.content)   : null;
  const programme = category === "programme" ? parseJson<ProgrammeFeedback>(PROGRAMME_RE, msg.content) : null;
  const comment = nutrition?.comment ?? activite?.comment ?? programme?.comment ?? "";
  const originalData: Record<string, unknown> | null =
    nutrition ? { calories: nutrition.calories, proteines: nutrition.proteines, glucides: nutrition.glucides, lipides: nutrition.lipides } :
    activite  ? { calories_brulees: activite.calories_brulees } :
    null;

  if (!nutrition && !activite && !programme) return null;

  return (
    <div className="overflow-hidden border-l-2 border-[#e07070]" style={{ borderTop: "1px solid #e0707025", borderRight: "1px solid #e0707025", borderBottom: "1px solid #e0707025", boxShadow: "0 0 16px #e0707015" }}>
      <div className="px-4 py-2.5 flex items-center justify-between gap-3" style={{ backgroundColor: "#e0707015" }}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm shrink-0">🚩</span>
          <span className="text-xs text-[var(--t-text-70)] truncate">{clientName}</span>
          <span className="text-[0.5rem] tracking-wider uppercase text-[var(--t-text-20)] shrink-0">{CATEGORY_LABELS[category]}</span>
        </div>
        <span className="text-[0.55rem] text-[var(--t-text-25)] shrink-0">{new Date(msg.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
      </div>
      <div className="px-4 py-3 bg-[var(--t-surface-2)] flex flex-col gap-3">
        {nutrition && (
          <div className="flex items-start gap-3">
            {nutrition.photo && (
              <a href={nutrition.photo} target="_blank" rel="noopener noreferrer" className="block w-16 h-16 border border-[var(--t-border)] rounded-xl overflow-hidden shrink-0 hover:border-[#e07070]/40 transition-colors">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={nutrition.photo} alt="Photo du repas" className="w-full h-full object-cover"/>
              </a>
            )}
            <div className="min-w-0">
              <p className="text-xs text-[var(--t-text-70)] mb-1">{nutrition.name}</p>
              <p className="text-[0.62rem] text-[var(--t-text-30)]">{nutrition.calories} kcal · P{nutrition.proteines} G{nutrition.glucides} L{nutrition.lipides}</p>
            </div>
          </div>
        )}
        {activite && (
          <p className="text-[0.62rem] text-[var(--t-text-30)]">{activite.activity} · {activite.duration_minutes} min · estimé {activite.calories_brulees} kcal</p>
        )}
        {programme && (
          <p className="text-[0.62rem] text-[var(--t-text-30)]">{programme.titre}{programme.type_seance ? ` · ${programme.type_seance}` : ""}</p>
        )}
        <p className="text-[0.65rem] text-[var(--t-text-55)] leading-relaxed">{comment}</p>

        {correction ? (
          <div className="border-t border-[var(--t-border-soft)] pt-3">
            <p className="text-[0.45rem] tracking-[0.15em] uppercase text-[#7eb8a0] mb-1">
              ✓ Correction envoyée à l&apos;IA{correction.corrected_data && typeof correction.corrected_data.valeur !== "undefined" ? ` · ${correction.corrected_data.valeur}` : ""}
            </p>
            <p className="text-[0.62rem] text-[var(--t-text-40)] leading-relaxed">{correction.coach_comment}</p>
          </div>
        ) : correcting ? (
          <div className="border-t border-[var(--t-border-soft)] pt-3 flex flex-col gap-2">
            {category !== "programme" && (
              <input type="text" placeholder="Valeur corrigée (optionnel)" value={correctionValue}
                onChange={e => setCorrectionValue(e.target.value)}
                className="w-40 bg-[var(--t-surface-2)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-xs px-2.5 py-2 focus:outline-none focus:border-[#c9a84c]/40"/>
            )}
            <textarea rows={2} placeholder="Ce que l'IA a mal évalué et comment corriger..."
              value={correctionComment} onChange={e => setCorrectionComment(e.target.value)}
              className="w-full bg-[var(--t-surface-2)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-xs px-2.5 py-2 focus:outline-none focus:border-[#c9a84c]/40 resize-none"/>
            <div className="flex gap-2">
              <button onClick={onCancelCorrect}
                className="flex-1 border border-[var(--t-border)] text-[var(--t-text-40)] rounded-xl text-[0.55rem] tracking-wider uppercase py-2 hover:border-[var(--t-text-20)] hover:text-[var(--t-text-60)] transition-colors">
                Annuler
              </button>
              <button onClick={() => onSubmitCorrect(originalData, comment)} disabled={correctionSaving || !correctionComment.trim()}
                className="flex-1 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.55rem] font-bold tracking-wider uppercase py-2 shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-40 rounded-xl">
                {correctionSaving ? "Envoi…" : "Envoyer à l'IA →"}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={onStartCorrect}
            className="text-[0.55rem] tracking-wider uppercase text-[var(--t-text-25)] hover:text-[#c9a84c] transition-colors text-left border-t border-[var(--t-border-soft)] pt-3">
            Corriger cette estimation →
          </button>
        )}
      </div>
    </div>
  );
}
