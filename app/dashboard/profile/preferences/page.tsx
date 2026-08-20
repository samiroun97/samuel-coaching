"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { isPushSupported, subscribeToPush, unsubscribeFromPush } from "@/lib/push";
import { isCoachUser } from "@/lib/coach";
import { apiPost } from "@/lib/apiClient";

type SectionKey = "profil" | "notifications" | "steps" | "password";

// Ligne cliquable style "liste de préférences" : label + chevron, qui déroule
// son contenu (children) juste en dessous quand ouverte.
function Row({ label, sublabel, open, onClick, children }: {
  label: string; sublabel?: string; open: boolean; onClick: () => void; children?: React.ReactNode;
}) {
  return (
    <div>
      <button onClick={onClick} className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[var(--t-glass-bg)]">
        <div>
          <p className="text-sm text-[var(--t-text-70)]">{label}</p>
          {sublabel && <p className="text-[0.62rem] text-[var(--t-text-25)] mt-0.5">{sublabel}</p>}
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          className={`text-[var(--t-text-25)] shrink-0 transition-transform ${open ? "rotate-90" : ""}`}>
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
      {open && <div className="px-5 pb-5 border-t border-[var(--t-border-soft)] pt-5">{children}</div>}
    </div>
  );
}

// Ligne d'action directe (navigation ou bouton), même style visuel que Row mais sans dépliant.
function LinkRow({ label, href, onClick, danger }: { label: string; href?: string; onClick?: () => void; danger?: boolean }) {
  const content = (
    <>
      <p className={`text-sm ${danger ? "text-[#e07070]" : "text-[var(--t-text-70)]"}`}>{label}</p>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        className={danger ? "text-[#e07070]/50 shrink-0" : "text-[var(--t-text-25)] shrink-0"}>
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </>
  );
  const cls = "w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[var(--t-glass-bg)]";
  return href
    ? <Link href={href} className={cls}>{content}</Link>
    : <button onClick={onClick} className={cls}>{content}</button>;
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-3 mt-8 first:mt-0">{children}</p>;
}

export default function PreferencesPage() {
  const router = useRouter();
  const [isCoach, setIsCoach] = useState(false);
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);
  const toggle = (s: SectionKey) => setOpenSection(prev => prev === s ? null : s);

  const [form, setForm] = useState({ prenom: "", nom: "", age: "", poids: "", taille: "", sexe: "" });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState("");

  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled,   setPushEnabled]   = useState(false);
  const [pushLoading,   setPushLoading]   = useState(false);
  const [pushError,     setPushError]     = useState("");

  const [stepsToken,   setStepsToken]   = useState<string | null>(null);
  const [stepsLoading, setStepsLoading] = useState(false);
  const [stepsError,   setStepsError]   = useState("");
  const [copiedField,  setCopiedField]  = useState<"url" | "token" | null>(null);

  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSaved,  setPwdSaved]  = useState(false);
  const [pwdError,  setPwdError]  = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      isCoachUser(user.id).then(setIsCoach);
      const { data } = await supabase.from("profiles")
        .select("prenom,nom,age,poids,taille,sexe").eq("id", user.id).single();
      if (data) setForm({
        prenom: data.prenom ?? "", nom: data.nom ?? "",
        age: data.age?.toString() ?? "", poids: data.poids?.toString() ?? "",
        taille: data.taille?.toString() ?? "", sexe: data.sexe ?? "",
      });

      setPushSupported(isPushSupported());
      const { count } = await supabase.from("push_subscriptions")
        .select("id", { count: "exact", head: true }).eq("user_id", user.id);
      setPushEnabled((count ?? 0) > 0);
    })();
  }, []);

  const togglePush = async () => {
    setPushError(""); setPushLoading(true);
    try {
      if (pushEnabled) { await unsubscribeFromPush(); setPushEnabled(false); }
      else { await subscribeToPush(); setPushEnabled(true); }
    } catch (e: unknown) {
      setPushError(e instanceof Error ? e.message : "Erreur");
    }
    setPushLoading(false);
  };

  const loadStepsToken = async (regenerate = false) => {
    setStepsError(""); setStepsLoading(true);
    try {
      const res = await apiPost("/api/programme/steps-token", { regenerate });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
      setStepsToken(json.token);
    } catch (e: unknown) {
      setStepsError(e instanceof Error ? e.message : "Erreur");
    }
    setStepsLoading(false);
  };

  const copyField = (field: "url" | "token", value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    });
  };

  const save = async () => {
    setSaving(true); setError(""); setSaved(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error: err } = await supabase.from("profiles").update({
      prenom: form.prenom || null, nom: form.nom || null,
      age: parseInt(form.age) || null, poids: parseFloat(form.poids) || null,
      taille: parseInt(form.taille) || null, sexe: form.sexe || null,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    if (err) setError(err.message); else setSaved(true);
    setSaving(false);
  };

  const savePassword = async () => {
    setPwdError(""); setPwdSaved(false);
    if (newPassword.length < 6) { setPwdError("Le mot de passe doit contenir au moins 6 caractères."); return; }
    if (newPassword !== confirmPassword) { setPwdError("Les deux mots de passe ne correspondent pas."); return; }
    setPwdSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    setPwdSaving(false);
    if (err) { setPwdError(err.message); return; }
    setPwdSaved(true);
    setNewPassword(""); setConfirmPassword("");
  };

  const inp = "w-full bg-[var(--t-bg)] border border-[var(--t-border)] rounded-lg text-[var(--t-text)] placeholder-[var(--t-text-20)] text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors";
  const lbl = "text-[0.7rem] tracking-[0.2em] uppercase text-[var(--t-text-40)] block mb-1.5";
  const groupCls = "border border-[var(--t-border)] bg-[var(--t-surface)] rounded-lg divide-y divide-[var(--t-border-soft)]";

  return (
    <div className="p-4 sm:p-8 max-w-lg">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.push("/dashboard/profile")}
          className="w-9 h-9 border border-[var(--t-border)] rounded-full flex items-center justify-center text-[var(--t-text-40)] hover:text-[var(--t-text-70)] hover:border-[var(--t-text-25)] transition-colors shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-3xl text-[var(--t-text)] tracking-wide">PRÉFÉRENCES</h1>
      </div>

      {isCoach && (
        <div className="border border-[#c9a84c]/25 bg-[#c9a84c]/5 rounded-lg p-5 flex items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-1">Espace coach</p>
            <p className="text-[0.62rem] text-[var(--t-text-35)] tracking-wider">Tu es actuellement dans ton espace perso (aperçu adhérent)</p>
          </div>
          <Link href="/crm"
            className="shrink-0 bg-[#c9a84c] text-black text-[0.65rem] font-bold tracking-[0.15em] uppercase px-4 py-2.5 hover:bg-[#e2c97e] transition-colors rounded-lg">
            Retour espace coach →
          </Link>
        </div>
      )}

      {/* ── Mon profil ── */}
      <GroupLabel>Mon profil</GroupLabel>
      <div className={groupCls}>
        <Row label="Informations personnelles" sublabel="Prénom, âge, poids, taille…" open={openSection === "profil"} onClick={() => toggle("profil")}>
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Prénom</label>
                <input className={inp} value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}/>
              </div>
              <div>
                <label className={lbl}>Nom</label>
                <input className={inp} value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}/>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={lbl}>Âge</label>
                <input type="number" className={inp} value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))}/>
              </div>
              <div>
                <label className={lbl}>Poids (kg)</label>
                <input type="number" step="0.1" className={inp} value={form.poids} onChange={e => setForm(f => ({ ...f, poids: e.target.value }))}/>
              </div>
              <div>
                <label className={lbl}>Taille (cm)</label>
                <input type="number" className={inp} value={form.taille} onChange={e => setForm(f => ({ ...f, taille: e.target.value }))}/>
              </div>
            </div>

            <div>
              <label className={lbl}>Sexe</label>
              <div className="flex gap-2">
                {["Homme", "Femme"].map(s => (
                  <button key={s} onClick={() => setForm(f => ({ ...f, sexe: s }))}
                    className={`flex-1 py-2.5 rounded-lg text-[0.7rem] tracking-[0.1em] uppercase border transition-all ${form.sexe === s ? "border-[#c9a84c] text-[#c9a84c] bg-[#c9a84c]/10" : "border-[var(--t-border)] text-[var(--t-text-40)] hover:border-[var(--t-text-30)]"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-xs text-[#e07070] rounded-lg border border-[#e07070]/20 bg-[#e07070]/5 px-3 py-2">{error}</p>}
            {saved && <p className="text-xs text-[#7eb8a0] rounded-lg border border-[#7eb8a0]/20 bg-[#7eb8a0]/5 px-3 py-2">Profil mis à jour ✓ — le BMR sera recalculé automatiquement</p>}

            <button onClick={save} disabled={saving}
              className="bg-[#c9a84c] text-black text-[0.7rem] font-bold tracking-[0.2em] uppercase py-3.5 hover:bg-[#e2c97e] hover:shadow-[0_4px_16px_-4px_rgba(201,168,76,0.5)] hover:-translate-y-px transition-all duration-200 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {saving
                ? <><div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"/>Enregistrement…</>
                : "Enregistrer"}
            </button>
          </div>
        </Row>
      </div>

      {/* ── Paramètres ── */}
      <GroupLabel>Paramètres</GroupLabel>
      <div className={groupCls}>
        <Row label="Notifications" sublabel="Rappels de repas" open={openSection === "notifications"} onClick={() => toggle("notifications")}>
          {!pushSupported ? (
            <p className="text-xs text-[var(--t-text-30)] leading-relaxed">
              Ton navigateur ne supporte pas les notifications. Sur iPhone, installe d&apos;abord l&apos;app sur l&apos;écran d&apos;accueil (Safari → Partager → Sur l&apos;écran d&apos;accueil), puis reviens ici depuis l&apos;icône.
            </p>
          ) : (
            <div className="flex items-center justify-between">
              <div className="pr-4">
                <p className="text-[0.7rem] tracking-[0.1em] uppercase text-[var(--t-text-50)]">Rappels repas</p>
                <p className="text-[0.62rem] text-[var(--t-text-25)] mt-0.5">
                  {pushEnabled
                    ? "Un rappel vers midi et vers 18-19h si tu n'as pas encore loggué le repas"
                    : "Reçois un rappel vers midi et vers 18-19h pour penser à logguer tes repas"}
                </p>
              </div>
              <button onClick={togglePush} disabled={pushLoading}
                className={`w-10 h-5.5 rounded-full transition-all relative shrink-0 disabled:opacity-50 ${pushEnabled ? "bg-[#c9a84c]" : "bg-[var(--t-border)]"}`}
                style={{ minWidth: 40, height: 22 }}>
                <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-white transition-transform ${pushEnabled ? "translate-x-[20px]" : "translate-x-[3px]"}`}
                  style={{ display: "block" }}/>
              </button>
            </div>
          )}
          {pushError && <p className="text-xs text-[#e07070] rounded-lg border border-[#e07070]/20 bg-[#e07070]/5 px-3 py-2 mt-3">{pushError}</p>}
        </Row>

        <Row label="Pas (iPhone)" sublabel="Synchro automatique via Raccourcis" open={openSection === "steps"}
          onClick={() => { toggle("steps"); if (openSection !== "steps" && !stepsToken) loadStepsToken(); }}>
          {stepsLoading && !stepsToken ? (
            <div className="flex items-center gap-2 text-xs text-[var(--t-text-30)]">
              <div className="w-3 h-3 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin"/>Génération du lien…
            </div>
          ) : stepsToken ? (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-[var(--t-text-35)] leading-relaxed">
                Configure un Raccourci Apple qui envoie automatiquement tes pas du jour, sans rien installer :
              </p>
              <div>
                <label className={lbl}>URL du webhook</label>
                <div className="flex gap-2">
                  <input readOnly className={`${inp} font-mono text-xs`} value={typeof window !== "undefined" ? `${window.location.origin}/api/programme/steps-webhook` : ""}/>
                  <button onClick={() => copyField("url", `${window.location.origin}/api/programme/steps-webhook`)}
                    className="shrink-0 px-3 rounded-lg border border-[var(--t-border)] text-[var(--t-text-40)] hover:text-[var(--t-text-70)] hover:border-[var(--t-text-25)] transition-colors text-xs">
                    {copiedField === "url" ? "Copié ✓" : "Copier"}
                  </button>
                </div>
              </div>
              <div>
                <label className={lbl}>Jeton personnel</label>
                <div className="flex gap-2">
                  <input readOnly className={`${inp} font-mono text-xs`} value={stepsToken}/>
                  <button onClick={() => copyField("token", stepsToken)}
                    className="shrink-0 px-3 rounded-lg border border-[var(--t-border)] text-[var(--t-text-40)] hover:text-[var(--t-text-70)] hover:border-[var(--t-text-25)] transition-colors text-xs">
                    {copiedField === "token" ? "Copié ✓" : "Copier"}
                  </button>
                </div>
              </div>

              <div className="border border-[var(--t-border-soft)] rounded-lg p-4 flex flex-col gap-2">
                <p className="text-[0.65rem] tracking-[0.15em] uppercase text-[var(--t-text-40)] mb-1">Configuration (une fois)</p>
                <ol className="text-[0.72rem] text-[var(--t-text-40)] leading-relaxed list-decimal list-inside flex flex-col gap-1.5">
                  <li>Ouvre l&apos;app <strong className="text-[var(--t-text-60)]">Raccourcis</strong> sur ton iPhone, crée un nouveau Raccourci.</li>
                  <li>Ajoute <strong className="text-[var(--t-text-60)]">Obtenir les échantillons de santé</strong> (Type : Pas, Le : Aujourd&apos;hui), puis <strong className="text-[var(--t-text-60)]">Additionner les nombres</strong> pour obtenir le total du jour.</li>
                  <li>Ajoute <strong className="text-[var(--t-text-60)]">Formater la date</strong> sur &laquo; Date actuelle &raquo;, format personnalisé <span className="font-mono">AAAA-MM-jj</span>.</li>
                  <li>Ajoute <strong className="text-[var(--t-text-60)]">Obtenir le contenu de l&apos;URL</strong> : colle l&apos;URL ci-dessus, méthode <span className="font-mono">POST</span>, en-tête <span className="font-mono">Authorization: Bearer &lt;ton jeton&gt;</span>, corps JSON <span className="font-mono">{"{ \"date\": …, \"steps\": … }"}</span> avec les variables des étapes précédentes.</li>
                  <li>Dans l&apos;onglet <strong className="text-[var(--t-text-60)]">Automatisation</strong>, crée une automatisation quotidienne (ex. 23h) qui lance ce Raccourci sans demander de confirmation.</li>
                </ol>
              </div>

              <button onClick={() => loadStepsToken(true)} disabled={stepsLoading}
                className="text-[0.65rem] tracking-[0.15em] uppercase text-[#e07070]/70 hover:text-[#e07070] transition-colors self-start disabled:opacity-50">
                Régénérer le jeton (invalide l&apos;ancien)
              </button>
            </div>
          ) : null}
          {stepsError && <p className="text-xs text-[#e07070] rounded-lg border border-[#e07070]/20 bg-[#e07070]/5 px-3 py-2 mt-3">{stepsError}</p>}
        </Row>

        <Row label="Mot de passe" sublabel="Changer ton mot de passe" open={openSection === "password"} onClick={() => toggle("password")}>
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Nouveau mot de passe</label>
                <input type="password" autoComplete="new-password" className={inp} value={newPassword} onChange={e => setNewPassword(e.target.value)}/>
              </div>
              <div>
                <label className={lbl}>Confirmer</label>
                <input type="password" autoComplete="new-password" className={inp} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}/>
              </div>
            </div>

            {pwdError && <p className="text-xs text-[#e07070] rounded-lg border border-[#e07070]/20 bg-[#e07070]/5 px-3 py-2">{pwdError}</p>}
            {pwdSaved && <p className="text-xs text-[#7eb8a0] rounded-lg border border-[#7eb8a0]/20 bg-[#7eb8a0]/5 px-3 py-2">Mot de passe mis à jour ✓</p>}

            <button onClick={savePassword} disabled={pwdSaving}
              className="border border-[#c9a84c]/30 text-[#c9a84c] rounded-lg text-[0.7rem] font-bold tracking-[0.2em] uppercase py-3.5 hover:bg-[#c9a84c]/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {pwdSaving
                ? <><div className="w-3 h-3 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin"/>Enregistrement…</>
                : "Changer le mot de passe"}
            </button>
          </div>
        </Row>
      </div>

      {/* ── Autre ── */}
      <GroupLabel>Autre</GroupLabel>
      <div className={groupCls}>
        <LinkRow label="Nous contacter" href="/dashboard/coach"/>
        <LinkRow label="Mentions légales" href="/mentions-legales"/>
        <LinkRow label="Se déconnecter" danger onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}/>
      </div>
    </div>
  );
}
