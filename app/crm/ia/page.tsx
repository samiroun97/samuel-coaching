"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getMyCoachId } from "@/lib/coach";

type Profile = { id: string; email: string; prenom: string; nom: string };
type Msg = { id: string; from_email: string; to_email: string; content: string; created_at: string };
type Correction = {
  id: string; category: Category; message_id: string | null;
  original_data: Record<string, unknown> | null; corrected_data: Record<string, unknown> | null;
  client_comment: string | null; coach_comment: string; created_at: string;
};

// Catégories réellement stockées en base — chacune alimente un prompt IA distinct
// (cf. app/api/nutrition/analyze, app/api/programme/calories, app/api/programme/generate).
// Ne pas fusionner en base : seule la rubrique CRM ci-dessous regroupe programme+activite
// à l'affichage, pour ne pas mélanger les deux contextes de calibration.
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

// Détecte la vraie catégorie d'un message à partir de son contenu — indépendant de
// l'onglet CRM actif, puisque l'onglet "Entraînement" regroupe programme + activite.
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

export default function CrmIaPage() {
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
  const [myCoachId,       setMyCoachId]        = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) getMyCoachId(user.id).then(setMyCoachId);
      const [{ data: p }, { data: m }, { data: c }] = await Promise.all([
        supabase.from("profiles").select("id,email,prenom,nom"),
        supabase.from("messages").select("*").order("created_at", { ascending: false }),
        supabase.from("ai_corrections").select("*").order("created_at", { ascending: false }),
      ]);
      setProfiles((p ?? []) as Profile[]);
      setMsgs((m ?? []) as Msg[]);
      setCorrections((c ?? []) as Correction[]);
      setLoading(false);
    })();
  }, []);

  const clientName = (email: string) => {
    const p = profiles.find(p => p.email === email);
    return p ? `${p.prenom} ${p.nom}`.trim() : email;
  };

  const uiTab = UI_TABS.find(t => t.key === tab)!;
  // Signalements de la catégorie active, avec leur correction si elle existe.
  // Pas de filtre sur from_email : seuls les formulaires de signalement client génèrent
  // ce format de contenu, donc le regex suffit à identifier un signalement (même si le
  // client testé est le compte du coach lui-même).
  const items = msgs
    .filter(m => uiTab.test(m.content))
    .map(m => ({ msg: m, category: detectCategory(m.content)!, correction: corrections.find(c => c.message_id === m.id) ?? null }));
  const pending  = items.filter(i => !i.correction);
  const resolved = items.filter(i => i.correction);
  // Notes générales (pas liées à un signalement) de la catégorie active.
  const standaloneNotes = corrections.filter(c => uiTab.categories.includes(c.category) && !c.message_id);

  const submitCorrection = async (messageId: string, category: Category, originalData: Record<string, unknown> | null, clientComment: string) => {
    if (!correctionComment.trim() || !myCoachId) return;
    setCorrectionSaving(true);
    const correctedData = correctionValue.trim()
      ? { valeur: isNaN(Number(correctionValue)) ? correctionValue.trim() : Number(correctionValue) }
      : null;
    const { data, error } = await supabase.from("ai_corrections").insert({
      category, message_id: messageId, original_data: originalData,
      corrected_data: correctedData, client_comment: clientComment, coach_comment: correctionComment.trim(),
      coach_id: myCoachId,
    }).select().single();
    setCorrectionSaving(false);
    if (error || !data) { alert(`Erreur lors de l'enregistrement : ${error?.message ?? "inconnue"}`); return; }
    setCorrections(prev => [data as Correction, ...prev]);
    setCorrectingId(null); setCorrectionComment(""); setCorrectionValue("");
  };

  const submitNote = async () => {
    if (!noteText.trim() || !myCoachId) return;
    setNoteSaving(true);
    const category: Category = tab === "entrainement" ? noteSubCategory : "nutrition";
    const { data, error } = await supabase.from("ai_corrections").insert({
      category, message_id: null, original_data: null, corrected_data: null,
      client_comment: null, coach_comment: noteText.trim(), coach_id: myCoachId,
    }).select().single();
    setNoteSaving(false);
    if (error || !data) { alert(`Erreur lors de l'enregistrement : ${error?.message ?? "inconnue"}`); return; }
    setCorrections(prev => [data as Correction, ...prev]);
    setNoteText("");
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-5 h-5 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <div className="mb-6">
        <p className="text-[0.65rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-1">CRM</p>
        <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl sm:text-5xl text-white tracking-wide">IA</h1>
        <p className="text-white/30 text-xs mt-1">Signalements clients et calibration des estimations IA</p>
      </div>

      {/* Tabs */}
      <div className="flex border border-white/10 mb-6 rounded-lg overflow-hidden">
        {UI_TABS.map(t => {
          const count = msgs.filter(m => t.test(m.content) && !corrections.some(c => c.message_id === m.id)).length;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-[0.68rem] tracking-[0.15em] uppercase transition-colors flex items-center justify-center gap-1.5 ${
                tab === t.key ? "bg-[#c9a84c] text-black font-bold" : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"}`}>
              {t.label}
              {count > 0 && (
                <span className={`text-[0.55rem] font-bold px-1.5 py-0.5 rounded-full min-w-[1.1rem] text-center ${tab === t.key ? "bg-black/20 text-black" : "bg-[#e07070] text-white"}`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Nourrir l'IA — note libre, pas liée à un signalement */}
      <div className="border border-[#c9a84c]/20 bg-[#c9a84c]/5 rounded-lg p-4 mb-8 flex flex-col gap-3">
        <p className="text-[0.68rem] tracking-[0.15em] uppercase text-[#c9a84c]">Nourrir l&apos;IA — {uiTab.label}</p>
        <p className="text-[0.62rem] text-white/40 leading-relaxed">
          Ajoute une info générale que l&apos;IA doit prendre en compte pour cette catégorie, sans attendre un signalement client (ex : une règle spécifique, une erreur récurrente que tu observes...).
        </p>
        {tab === "entrainement" && (
          <div className="flex gap-2">
            {(["programme", "activite"] as Category[]).map(c => (
              <button key={c} onClick={() => setNoteSubCategory(c)}
                className={`px-3 py-1.5 rounded-lg text-[0.6rem] tracking-wider uppercase transition-colors ${
                  noteSubCategory === c ? "bg-[#c9a84c] text-black font-bold" : "border border-white/10 text-white/40 hover:text-white/60"}`}>
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        )}
        <textarea className="w-full bg-[#060606] border border-white/10 rounded-lg text-white placeholder-white/20 text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors resize-none" rows={2}
          placeholder="Ex : pour les plats de pâtes maison, compte toujours au moins 15g d'huile d'olive même si le client ne la mentionne pas..."
          value={noteText} onChange={e => setNoteText(e.target.value)}/>
        <button onClick={submitNote} disabled={noteSaving || !noteText.trim()}
          className="self-end bg-[#c9a84c] text-black text-[0.65rem] font-bold tracking-[0.15em] uppercase px-4 py-2 hover:bg-[#e2c97e] transition-colors disabled:opacity-40 rounded-lg">
          {noteSaving ? "Enregistrement…" : "Enregistrer →"}
        </button>
      </div>

      {/* Signalements en attente */}
      <p className="text-[0.68rem] tracking-[0.15em] uppercase text-white/30 mb-3">
        Signalements en attente {pending.length > 0 && <span className="text-[#e07070]">({pending.length})</span>}
      </p>
      {pending.length === 0 ? (
        <p className="text-white/20 text-xs mb-8">Aucun signalement en attente sur cette catégorie.</p>
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

      {/* Historique : signalements traités + notes générales — permet de vérifier tout
          ce qui a été effectivement transmis à l'IA (visible aussi juste après un envoi). */}
      {(resolved.length > 0 || standaloneNotes.length > 0) && (
        <>
          <p className="text-[0.68rem] tracking-[0.15em] uppercase text-white/30 mb-3">Historique</p>
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
              <div key={c.id} className="border-l-2 border-[#7eb8a0] bg-[#0d0d0d] px-4 py-3">
                <p className="text-[0.5rem] tracking-[0.15em] uppercase text-[#7eb8a0] mb-1">
                  ✓ Note générale envoyée à l&apos;IA{tab === "entrainement" ? ` · ${CATEGORY_LABELS[c.category]}` : ""}
                </p>
                <p className="text-[0.68rem] text-white/50 leading-relaxed">{c.coach_comment}</p>
                <p className="text-[0.55rem] text-white/15 mt-1">{new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
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
          <span className="text-xs text-white/70 truncate">{clientName}</span>
          <span className="text-[0.5rem] tracking-wider uppercase text-white/20 shrink-0">{CATEGORY_LABELS[category]}</span>
        </div>
        <span className="text-[0.55rem] text-white/25 shrink-0">{new Date(msg.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
      </div>
      <div className="px-4 py-3 bg-[#0d0d0d] flex flex-col gap-3">
        {nutrition && (
          <div className="flex items-start gap-3">
            {nutrition.photo && (
              <a href={nutrition.photo} target="_blank" rel="noopener noreferrer" className="block w-16 h-16 border border-white/10 rounded-lg overflow-hidden shrink-0 hover:border-[#e07070]/40 transition-colors">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={nutrition.photo} alt="Photo du repas" className="w-full h-full object-cover"/>
              </a>
            )}
            <div className="min-w-0">
              <p className="text-xs text-white/70 mb-1">{nutrition.name}</p>
              <p className="text-[0.62rem] text-white/30">{nutrition.calories} kcal · P{nutrition.proteines} G{nutrition.glucides} L{nutrition.lipides}</p>
            </div>
          </div>
        )}
        {activite && (
          <p className="text-[0.62rem] text-white/30">{activite.activity} · {activite.duration_minutes} min · estimé {activite.calories_brulees} kcal</p>
        )}
        {programme && (
          <p className="text-[0.62rem] text-white/30">{programme.titre}{programme.type_seance ? ` · ${programme.type_seance}` : ""}</p>
        )}
        <p className="text-[0.65rem] text-white/55 leading-relaxed">{comment}</p>

        {correction ? (
          <div className="border-t border-white/5 pt-3">
            <p className="text-[0.45rem] tracking-[0.15em] uppercase text-[#7eb8a0] mb-1">
              ✓ Correction envoyée à l&apos;IA{correction.corrected_data && typeof correction.corrected_data.valeur !== "undefined" ? ` · ${correction.corrected_data.valeur}` : ""}
            </p>
            <p className="text-[0.62rem] text-white/40 leading-relaxed">{correction.coach_comment}</p>
          </div>
        ) : correcting ? (
          <div className="border-t border-white/5 pt-3 flex flex-col gap-2">
            {category !== "programme" && (
              <input type="text" placeholder="Valeur corrigée (optionnel)" value={correctionValue}
                onChange={e => setCorrectionValue(e.target.value)}
                className="w-40 bg-[#060606] border border-white/10 rounded-lg text-white placeholder-white/20 text-xs px-2.5 py-2 focus:outline-none focus:border-[#c9a84c]/40"/>
            )}
            <textarea rows={2} placeholder="Ce que l'IA a mal évalué et comment corriger..."
              value={correctionComment} onChange={e => setCorrectionComment(e.target.value)}
              className="w-full bg-[#060606] border border-white/10 rounded-lg text-white placeholder-white/20 text-xs px-2.5 py-2 focus:outline-none focus:border-[#c9a84c]/40 resize-none"/>
            <div className="flex gap-2">
              <button onClick={onCancelCorrect}
                className="flex-1 border border-white/10 text-white/40 rounded-lg text-[0.55rem] tracking-wider uppercase py-2 hover:border-white/20 hover:text-white/60 transition-colors">
                Annuler
              </button>
              <button onClick={() => onSubmitCorrect(originalData, comment)} disabled={correctionSaving || !correctionComment.trim()}
                className="flex-1 bg-[#c9a84c] text-black text-[0.55rem] font-bold tracking-wider uppercase py-2 hover:bg-[#e2c97e] transition-colors disabled:opacity-40 rounded-lg">
                {correctionSaving ? "Envoi…" : "Envoyer à l'IA →"}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={onStartCorrect}
            className="text-[0.55rem] tracking-wider uppercase text-white/25 hover:text-[#c9a84c] transition-colors text-left border-t border-white/5 pt-3">
            Corriger cette estimation →
          </button>
        )}
      </div>
    </div>
  );
}
