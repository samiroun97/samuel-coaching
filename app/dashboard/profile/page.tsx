"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { isCoachUser, getMyCoachEmail } from "@/lib/coach";
import { apiPost } from "@/lib/apiClient";
import ThemeToggle from "@/components/ThemeToggle";
import { CalendarPicker } from "@/components/CalendarPicker";
import { OBJECTIF_TYPES, OBJECTIF_TYPE_LABEL, type ObjectifType } from "@/lib/objectifTypes";
import { Icon } from "@/components/Icon";
import { Settings, ChevronRight, Pencil, MessageSquare, AlertCircle, Check } from "@/lib/solarIcons";

type Profile = {
  prenom: string; nom: string; age: number | null; poids: number | null; taille: number | null; sexe: string | null;
  objectifs: string | null; objectif_type: string | null; objectif_echeance: string | null; objectif_pending: boolean;
  seances_par_semaine: number | null; lieu_entrainement: string | null;
  blessures: string | null; alimentation: string | null; sommeil_stress: string | null;
  niveau_activite: string | null; experience: string | null; duree_seance: string | null;
};

const FB_LABELS: Record<string, string> = { bug: "🐛 Bug", suggestion: "💡 Suggestion", idee: "✨ Idée" };
const ECHEANCES = ["1 mois", "3 mois", "6 mois", "1 an", "Pas d'échéance précise"];
const LIEUX = ["Salle de musculation", "Extérieur", "Maison"];
const STRESS_OPTIONS = ["Faible (je dors bien, peu de stress)", "Modéré", "Élevé (peu de sommeil, stress chronique)"];
const NIVEAU_OPTIONS = [
  { label: "Sédentaire", desc: "0 séance/semaine, travail assis, peu de marche au quotidien" },
  { label: "Légèrement actif", desc: "1 à 2 séances/semaine, ou un métier debout léger" },
  { label: "Modérément actif", desc: "3 à 4 séances/semaine, actif dans la journée" },
  { label: "Très actif", desc: "5 à 6 séances/semaine, ou entraînement + job physique" },
];
const EXPERIENCE_OPTIONS = ["Débutant", "Intermédiaire", "Avancé"];
const DUREE_OPTIONS = ["30 min", "45 min", "1h", "1h30+"];

function GearIcon() {
  return <Icon icon={Settings} size={20} strokeWidth={1.5}/>;
}

export default function ProfilePage() {
  const [isCoach, setIsCoach] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [currentEmail, setCurrentEmail] = useState("");
  const [coachEmail,   setCoachEmail]   = useState<string | null>(null);
  const [fbOpen,    setFbOpen]    = useState(false);
  const [fbType,    setFbType]    = useState<"bug"|"suggestion"|"idee">("suggestion");
  const [fbMsg,     setFbMsg]     = useState("");
  const [fbSending, setFbSending] = useState(false);
  const [fbDone,    setFbDone]    = useState(false);

  const [userId,      setUserId]      = useState<string | null>(null);
  const [showObjForm, setShowObjForm] = useState(false);
  const [objForm,     setObjForm]     = useState({
    objectifs: "", objectifType: "" as ObjectifType | "", echeance: "", echeanceDate: "", seances: "", lieux: [] as string[],
    blessures: "", alimentation: "", sommeilStress: "",
    niveauActivite: "", experience: "", dureeSeance: "",
  });
  const [objSaving,   setObjSaving]   = useState(false);

  const [joinOpen,    setJoinOpen]    = useState(false);
  const [joinCode,    setJoinCode]    = useState("");
  const [joining,     setJoining]     = useState(false);
  const [joinMsg,     setJoinMsg]     = useState<{ ok: boolean; text: string } | null>(null);

  const [showEcheancePicker, setShowEcheancePicker] = useState(false);
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      setCurrentEmail(user.email ?? "");
      const coach = await isCoachUser(user.id);
      setIsCoach(coach);
      if (!coach) getMyCoachEmail(user.id).then(setCoachEmail);
      if (!coach) {
        const lastSeen = localStorage.getItem(`msg_seen_${user.email}`) ?? "1970-01-01";
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("to_email", user.email)
          .gt("created_at", lastSeen);
        if ((count ?? 0) > 0) setUnread(true);
      }
      const { data } = await supabase.from("profiles")
        .select("prenom,nom,age,poids,taille,sexe,objectifs,objectif_type,objectif_echeance,objectif_pending,seances_par_semaine,lieu_entrainement,blessures,alimentation,sommeil_stress,niveau_activite,experience,duree_seance")
        .eq("id", user.id).single();
      if (data) setProfile(data as Profile);
    })();
  }, []);

  const sendFeedback = async () => {
    if (!fbMsg.trim() || fbSending) return;
    setFbSending(true);
    const content = `[FEEDBACK:${fbType}]\n${fbMsg.trim()}`;
    if (coachEmail) await supabase.from("messages").insert({ from_email: currentEmail, to_email: coachEmail, content });
    setFbSending(false); setFbDone(true); setFbMsg("");
    setTimeout(() => { setFbOpen(false); setFbDone(false); }, 1800);
  };

  const openObjForm = () => {
    if (!profile) return;
    const knownLieux = (profile.lieu_entrainement || "").split(",").map(s => s.trim()).filter(s => LIEUX.includes(s));
    setObjForm({
      objectifs: profile.objectifs || "", objectifType: (profile.objectif_type as ObjectifType) || "", echeance: profile.objectif_echeance || "", echeanceDate: "",
      seances: String(profile.seances_par_semaine || ""), lieux: knownLieux,
      blessures: profile.blessures || "", alimentation: profile.alimentation || "", sommeilStress: profile.sommeil_stress || "",
      niveauActivite: profile.niveau_activite || "", experience: profile.experience || "", dureeSeance: profile.duree_seance || "",
    });
    setShowObjForm(true);
  };

  const submitObjForm = async () => {
    if (!userId || !objForm.objectifs.trim()) return;
    setObjSaving(true);
    const fields = {
      objectifs: objForm.objectifs.trim(),
      objectif_type: objForm.objectifType || profile?.objectif_type || null,
      objectif_echeance: objForm.echeance || null,
      seances_par_semaine: objForm.seances ? parseInt(objForm.seances) : profile?.seances_par_semaine,
      lieu_entrainement: objForm.lieux.length ? objForm.lieux.join(", ") : profile?.lieu_entrainement,
      blessures: objForm.blessures.trim() || null,
      alimentation: objForm.alimentation.trim() || null,
      sommeil_stress: objForm.sommeilStress || null,
      niveau_activite: objForm.niveauActivite || profile?.niveau_activite,
      experience: objForm.experience || profile?.experience,
      duree_seance: objForm.dureeSeance || profile?.duree_seance,
      objectif_pending: false,
    };
    await supabase.from("profiles").update(fields).eq("id", userId);
    setProfile(p => p ? { ...p, ...fields, objectif_pending: false } as Profile : p);
    setObjSaving(false); setShowObjForm(false);
  };

  const joinCoach = async () => {
    if (!joinCode.trim() || joining) return;
    setJoining(true); setJoinMsg(null);
    try {
      const res = await apiPost("/api/coach/join", { code: joinCode.trim() });
      const data = await res.json();
      if (!res.ok) { setJoinMsg({ ok: false, text: data.error ?? "Code invalide" }); }
      else {
        setJoinMsg({ ok: true, text: "Coach rejoint ✓" });
        setJoinCode("");
        if (userId) getMyCoachEmail(userId).then(setCoachEmail);
      }
    } catch {
      setJoinMsg({ ok: false, text: "Erreur réseau" });
    }
    setJoining(false);
  };

  const initials = `${profile?.prenom?.[0] ?? ""}${profile?.nom?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="p-4 sm:p-8 max-w-lg">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[0.7rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-2">Paramètres</p>
          <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-5xl text-[var(--t-text)] tracking-wide">COMPTE</h1>
        </div>
        <Link href="/dashboard/profile/preferences"
          aria-label="Préférences"
          className="w-11 h-11 border border-[var(--t-border)] rounded-full flex items-center justify-center text-[var(--t-text-40)] hover:text-[#c9a84c] hover:border-[#c9a84c]/40 transition-colors shrink-0 mt-1">
          <GearIcon/>
        </Link>
      </div>

      {isCoach && (
        <div className="border border-[#c9a84c]/25 bg-[#c9a84c]/5 rounded-xl p-5 flex items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-1">Espace coach</p>
            <p className="text-[0.62rem] text-[var(--t-text-35)] tracking-wider">Tu es actuellement dans ton espace perso (aperçu adhérent)</p>
          </div>
          <Link href="/crm/clients"
            className="shrink-0 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.65rem] font-bold tracking-[0.15em] uppercase px-4 py-2.5 shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 rounded-xl">
            Retour espace coach →
          </Link>
        </div>
      )}

      <div className="border border-[var(--t-border)] bg-[var(--t-surface)] rounded-xl p-6 flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/30 flex items-center justify-center shrink-0">
          <span style={{ fontFamily: "var(--font-bebas)" }} className="text-lg text-[#c9a84c] tracking-wide">{initials || "?"}</span>
        </div>
        <div className="min-w-0">
          <p className="text-lg text-[var(--t-text)] truncate">{profile?.prenom} {profile?.nom}</p>
          <p className="text-[0.62rem] text-[var(--t-text-25)] tracking-wider mt-0.5">
            {[profile?.age && `${profile.age} ans`, profile?.poids && `${profile.poids} kg`, profile?.taille && `${profile.taille} cm`].filter(Boolean).join(" · ") || "Complète ton profil dans Préférences"}
          </p>
        </div>
      </div>

      {/* ── Demande de précision d'objectif (déclenchée par le coach) ── */}
      {profile?.objectif_pending && (
        <button onClick={openObjForm}
          className="w-full text-left border border-[#c9a84c]/30 bg-[#c9a84c]/5 hover:bg-[#c9a84c]/8 rounded-xl p-4 mb-4 flex items-center justify-between gap-3 transition-colors group">
          <div>
            <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-0.5">Ton coach veut en savoir plus</p>
            <p className="text-xs text-[var(--t-text-50)]">Précise ton objectif pour qu&apos;on te construise un plan adapté</p>
          </div>
          <Icon icon={ChevronRight} size={14} strokeWidth={2} className="shrink-0 transition-transform group-hover:translate-x-0.5 text-[#c9a84c]"/>
        </button>
      )}

      <button onClick={openObjForm}
        className="w-full text-left border border-[var(--t-border)] bg-[var(--t-surface)] hover:border-[#c9a84c]/30 hover:bg-[#c9a84c]/5 rounded-xl p-6 mb-4 transition-colors group">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c]">Objectif</p>
            {profile?.objectif_type && (
              <span className="text-[0.55rem] tracking-[0.1em] uppercase text-[#c9a84c] bg-[#c9a84c]/10 border border-[#c9a84c]/25 rounded-full px-2 py-0.5">
                {OBJECTIF_TYPE_LABEL[profile.objectif_type as ObjectifType] ?? profile.objectif_type}
              </span>
            )}
            <Icon icon={Pencil} size={10} strokeWidth={2} className="opacity-0 group-hover:opacity-60 transition-opacity text-[#c9a84c]"/>
          </div>
          {profile?.objectif_echeance && <p className="text-[0.62rem] text-[var(--t-text-25)] tracking-wider uppercase">Échéance : {profile.objectif_echeance}</p>}
        </div>
        <p className="text-sm text-[var(--t-text-55)] leading-relaxed">{profile?.objectifs || "Aucun objectif renseigné"}</p>
        <p className="text-[0.6rem] text-[var(--t-text-20)] tracking-wider mt-3">Entraînement · Blessures · Alimentation · Sommeil/stress</p>
      </button>

      {!isCoach && (
        <Link href="/dashboard/coach"
          className="flex items-center justify-between border border-[var(--t-border)] bg-[var(--t-surface)] rounded-xl px-5 py-4 hover:bg-[var(--t-glass-bg)] transition-colors mb-4">
          <div className="flex items-center gap-3 relative">
            <span className="text-[var(--t-text-40)]">
              <Icon icon={MessageSquare} size={18} strokeWidth={1.5}/>
              {unread && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#e07070] ring-2 ring-[var(--t-surface)]"/>}
            </span>
            <p className="text-sm text-[var(--t-text-70)]">Messages</p>
          </div>
          <Icon icon={ChevronRight} size={14} strokeWidth={1.5} className="text-[var(--t-text-25)] shrink-0"/>
        </Link>
      )}

      <Link href="/dashboard/profile/preferences"
        className="flex items-center justify-between border border-[var(--t-border)] bg-[var(--t-surface)] rounded-xl px-5 py-4 hover:bg-[var(--t-glass-bg)] transition-colors mb-4">
        <div className="flex items-center gap-3">
          <span className="text-[var(--t-text-40)]"><GearIcon/></span>
          <p className="text-sm text-[var(--t-text-70)]">Préférences</p>
        </div>
        <Icon icon={ChevronRight} size={14} strokeWidth={1.5} className="text-[var(--t-text-25)] shrink-0"/>
      </Link>

      {!isCoach && (
        <div className="border border-[var(--t-border)] bg-[var(--t-surface)] rounded-xl overflow-hidden mb-4">
          <button onClick={() => setJoinOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[var(--t-glass-bg)] transition-colors">
            <div className="flex items-center gap-3">
              <Icon icon={MessageSquare} size={18} strokeWidth={1.5} className="text-[var(--t-text-40)]"/>
              <p className="text-sm text-[var(--t-text-70)]">Coach</p>
            </div>
            <Icon icon={ChevronRight} size={14} strokeWidth={1.5}
              className={`text-[var(--t-text-25)] shrink-0 transition-transform ${joinOpen ? "rotate-90" : ""}`}/>
          </button>

          {joinOpen && (
            <div className="px-5 pb-5 border-t border-[var(--t-border-soft)] pt-5 flex flex-col gap-3">
              <p className="text-[0.62rem] text-[var(--t-text-25)] tracking-wider">
                {coachEmail ? `Actuellement lié à ${coachEmail}` : "Tu n'es lié à aucun coach pour l'instant."}
              </p>
              <div className="flex gap-2">
                <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={e => { if (e.key === "Enter") joinCoach(); }}
                  placeholder="Code du coach"
                  className="flex-1 min-w-0 bg-[var(--t-bg)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-sm tracking-[0.15em] uppercase px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors"/>
                <button onClick={joinCoach} disabled={!joinCode.trim() || joining}
                  className="shrink-0 px-4 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.65rem] font-bold tracking-[0.15em] uppercase rounded-xl shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed">
                  {joining ? "…" : "Rejoindre"}
                </button>
              </div>
              {joinMsg && (
                <p className={`text-xs ${joinMsg.ok ? "text-[#7eb8a0]" : "text-[#e07070]"}`}>{joinMsg.text}</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="border border-[var(--t-border)] bg-[var(--t-surface)] rounded-xl overflow-hidden mb-4">
        <button onClick={() => setFbOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[var(--t-glass-bg)] transition-colors">
          <div className="flex items-center gap-3">
            <Icon icon={AlertCircle} size={18} strokeWidth={1.5} className="text-[var(--t-text-40)]"/>
            <p className="text-sm text-[var(--t-text-70)]">Suggestion</p>
          </div>
          <Icon icon={ChevronRight} size={14} strokeWidth={1.5}
            className={`text-[var(--t-text-25)] shrink-0 transition-transform ${fbOpen ? "rotate-90" : ""}`}/>
        </button>

        {fbOpen && (
          <div className="px-5 pb-5 border-t border-[var(--t-border-soft)] pt-5 flex flex-col gap-4">
            <div className="flex gap-2">
              {(["bug", "suggestion", "idee"] as const).map(t => (
                <button key={t} onClick={() => setFbType(t)}
                  className={`flex-1 py-2 text-[0.45rem] tracking-[0.12em] uppercase border rounded-xl transition-all ${
                    fbType === t ? "border-[#c9a84c] text-[#c9a84c] bg-[#c9a84c]/5" : "border-[var(--t-border)] text-[var(--t-text-30)] hover:border-[var(--t-border-15)]"
                  }`}>
                  {FB_LABELS[t]}
                </button>
              ))}
            </div>

            <textarea value={fbMsg} onChange={e => setFbMsg(e.target.value)}
              placeholder="Décris le problème ou ton idée…"
              rows={4}
              className="w-full bg-[var(--t-bg)] border border-[var(--t-border)] rounded-xl text-[var(--t-text-70)] placeholder-[var(--t-text-20)] text-xs px-4 py-3 resize-none focus:outline-none focus:border-[#c9a84c]/40 transition-colors"/>

            {fbDone ? (
              <div className="text-center py-2 text-[#7eb8a0] text-xs tracking-wider">Merci, c&apos;est envoyé ✓</div>
            ) : (
              <button onClick={sendFeedback} disabled={!fbMsg.trim() || fbSending}
                className="bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.7rem] font-bold tracking-[0.2em] uppercase py-3.5 shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {fbSending ? "Envoi…" : "Envoyer"}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="border border-[var(--t-border)] bg-[var(--t-surface)] rounded-xl p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--t-text-70)]">Thème</p>
          <p className="text-[0.6rem] text-[var(--t-text-25)] tracking-wider mt-0.5">Sombre ou clair, selon ta préférence</p>
        </div>
        <ThemeToggle/>
      </div>

      {/* ── Questionnaire de précision d'objectif ── */}
      {showObjForm && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center px-4" onClick={() => setShowObjForm(false)}>
          <div className="bg-[var(--t-bg)] border border-[var(--t-border)] rounded-xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 flex flex-col gap-5">
              <div>
                <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-1">Précise ton objectif</p>
                <p className="text-xs text-[var(--t-text-30)]">Pour que ton coach te construise un plan vraiment adapté</p>
              </div>

              <div>
                <label className="text-[0.6rem] tracking-[0.15em] uppercase text-[var(--t-text-40)] block mb-1.5">Type d&apos;objectif</label>
                <div className="flex flex-wrap gap-2">
                  {OBJECTIF_TYPES.map(o => (
                    <button key={o.value} type="button" onClick={() => setObjForm(f => ({ ...f, objectifType: o.value }))}
                      className={`text-[0.65rem] tracking-wider px-3 py-2 rounded-xl border transition-colors ${objForm.objectifType === o.value ? "bg-[#c9a84c] border-[#c9a84c] text-black" : "border-[var(--t-border-15)] text-[var(--t-text-40)] hover:border-[var(--t-border)]"}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[0.6rem] tracking-[0.15em] uppercase text-[var(--t-text-40)] block mb-1.5">Ton objectif, en détail</label>
                <textarea className="w-full bg-[var(--t-surface-2)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors resize-none" rows={4}
                  placeholder="Ex : perdre 5 kg de graisse tout en gardant ma masse musculaire, pour être à l'aise cet été..."
                  value={objForm.objectifs} onChange={e => setObjForm(f => ({ ...f, objectifs: e.target.value }))}/>
              </div>

              <div>
                <label className="text-[0.6rem] tracking-[0.15em] uppercase text-[var(--t-text-40)] block mb-1.5">Dans combien de temps ?</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {ECHEANCES.map(e => (
                    <button key={e} type="button" onClick={() => setObjForm(f => ({ ...f, echeance: e, echeanceDate: "" }))}
                      className={`text-[0.65rem] tracking-wider px-3 py-2 rounded-xl border transition-colors ${objForm.echeance === e ? "bg-[#c9a84c] border-[#c9a84c] text-black" : "border-[var(--t-border-15)] text-[var(--t-text-40)] hover:border-[var(--t-border)]"}`}>
                      {e}
                    </button>
                  ))}
                </div>
                <div className="relative flex items-center gap-2">
                  <span className="text-[0.58rem] text-[var(--t-text-25)] uppercase tracking-wider shrink-0">ou une date précise</span>
                  <button type="button" onClick={() => setShowEcheancePicker(o => !o)}
                    className="bg-[var(--t-surface-2)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] text-xs px-3 py-2 hover:border-[#c9a84c]/40 transition-colors">
                    {objForm.echeanceDate
                      ? new Date(objForm.echeanceDate + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                      : "Choisir une date"}
                  </button>
                  {showEcheancePicker && (
                    <CalendarPicker value={objForm.echeanceDate || null}
                      onChange={val => {
                        const label = new Date(val + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
                        setObjForm(f => ({ ...f, echeanceDate: val, echeance: label }));
                      }}
                      onClose={() => setShowEcheancePicker(false)}
                      className="top-full left-0 mt-2"/>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[0.6rem] tracking-[0.15em] uppercase text-[var(--t-text-40)] block mb-1.5">Niveau d&apos;activité</label>
                <div className="flex flex-col gap-2">
                  {NIVEAU_OPTIONS.map(o => (
                    <button key={o.label} type="button" onClick={() => setObjForm(f => ({ ...f, niveauActivite: o.label }))}
                      className={`px-4 py-3 text-left border rounded-xl transition-all ${objForm.niveauActivite === o.label ? "border-[#c9a84c] bg-[#c9a84c]/10" : "border-[var(--t-border)] hover:border-[var(--t-border-15)]"}`}>
                      <p className={`text-xs tracking-[0.1em] uppercase font-bold ${objForm.niveauActivite === o.label ? "text-[#c9a84c]" : "text-[var(--t-text-60)]"}`}>{o.label}</p>
                      <p className="text-[0.62rem] text-[var(--t-text-25)] mt-0.5">{o.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[0.6rem] tracking-[0.15em] uppercase text-[var(--t-text-40)] block mb-1.5">Expérience</label>
                <div className="flex flex-wrap gap-2">
                  {EXPERIENCE_OPTIONS.map(o => (
                    <button key={o} type="button" onClick={() => setObjForm(f => ({ ...f, experience: o }))}
                      className={`text-[0.65rem] tracking-wider px-3 py-2 rounded-xl border transition-colors ${objForm.experience === o ? "bg-[#c9a84c] border-[#c9a84c] text-black" : "border-[var(--t-border-15)] text-[var(--t-text-40)] hover:border-[var(--t-border)]"}`}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[0.6rem] tracking-[0.15em] uppercase text-[var(--t-text-40)] block mb-1.5">Durée de séance</label>
                <div className="flex flex-wrap gap-2">
                  {DUREE_OPTIONS.map(o => (
                    <button key={o} type="button" onClick={() => setObjForm(f => ({ ...f, dureeSeance: o }))}
                      className={`text-[0.65rem] tracking-wider px-3 py-2 rounded-xl border transition-colors ${objForm.dureeSeance === o ? "bg-[#c9a84c] border-[#c9a84c] text-black" : "border-[var(--t-border-15)] text-[var(--t-text-40)] hover:border-[var(--t-border)]"}`}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[0.6rem] tracking-[0.15em] uppercase text-[var(--t-text-40)] block mb-1.5">Où veux-tu t&apos;entraîner ? (plusieurs choix possibles)</label>
                <div className="flex flex-wrap gap-2">
                  {LIEUX.map(l => {
                    const checked = objForm.lieux.includes(l);
                    return (
                      <button key={l} type="button"
                        onClick={() => setObjForm(f => ({ ...f, lieux: checked ? f.lieux.filter(x => x !== l) : [...f.lieux, l] }))}
                        className={`flex items-center gap-1.5 text-[0.65rem] tracking-wider px-3 py-2 rounded-xl border transition-colors ${checked ? "bg-[#c9a84c] border-[#c9a84c] text-black" : "border-[var(--t-border-15)] text-[var(--t-text-40)] hover:border-[var(--t-border)]"}`}>
                        <span className={`w-3 h-3 rounded-sm border flex items-center justify-center shrink-0 ${checked ? "border-black" : "border-[var(--t-text-25)]"}`}>
                          {checked && <Icon icon={Check} size={8} strokeWidth={3}/>}
                        </span>
                        {l}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[0.6rem] tracking-[0.15em] uppercase text-[var(--t-text-40)] block mb-1.5">Séances / semaine que tu peux y consacrer</label>
                <div className="flex flex-wrap gap-2">
                  {["2", "3", "4", "5", "6"].map(n => (
                    <button key={n} type="button" onClick={() => setObjForm(f => ({ ...f, seances: n }))}
                      className={`w-10 h-10 border rounded-xl text-sm font-bold transition-all ${objForm.seances === n ? "bg-[#c9a84c] border-[#c9a84c] text-black" : "border-[var(--t-border-15)] text-[var(--t-text-40)] hover:border-[var(--t-border)]"}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[0.6rem] tracking-[0.15em] uppercase text-[var(--t-text-40)] block mb-1.5">Blessures</label>
                <textarea className="w-full bg-[var(--t-surface-2)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors resize-none" rows={2}
                  placeholder="Ex : douleur genou gauche... (ou 'aucune')"
                  value={objForm.blessures} onChange={e => setObjForm(f => ({ ...f, blessures: e.target.value }))}/>
              </div>

              <div>
                <label className="text-[0.6rem] tracking-[0.15em] uppercase text-[var(--t-text-40)] block mb-1.5">Alimentation</label>
                <textarea className="w-full bg-[var(--t-surface-2)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors resize-none" rows={2}
                  placeholder="Ex : végétarien, allergie... (ou 'standard')"
                  value={objForm.alimentation} onChange={e => setObjForm(f => ({ ...f, alimentation: e.target.value }))}/>
              </div>

              <div>
                <label className="text-[0.6rem] tracking-[0.15em] uppercase text-[var(--t-text-40)] block mb-1.5">Sommeil / stress</label>
                <div className="flex flex-wrap gap-2">
                  {STRESS_OPTIONS.map(o => (
                    <button key={o} type="button" onClick={() => setObjForm(f => ({ ...f, sommeilStress: o }))}
                      className={`text-[0.65rem] tracking-wider px-3 py-2 rounded-xl border transition-colors ${objForm.sommeilStress === o ? "bg-[#c9a84c] border-[#c9a84c] text-black" : "border-[var(--t-border-15)] text-[var(--t-text-40)] hover:border-[var(--t-border)]"}`}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={submitObjForm} disabled={objSaving || !objForm.objectifs.trim()}
                className="bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.7rem] font-bold tracking-[0.18em] uppercase py-3 shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-40 rounded-xl">
                {objSaving ? "Envoi…" : "Envoyer →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
