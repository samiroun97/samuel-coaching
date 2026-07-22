"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const [form, setForm] = useState({ prenom: "", nom: "", age: "", poids: "", taille: "", sexe: "" });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState("");

  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSaved,  setPwdSaved]  = useState(false);
  const [pwdError,  setPwdError]  = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles")
        .select("prenom,nom,age,poids,taille,sexe").eq("id", user.id).single();
      if (data) setForm({
        prenom: data.prenom ?? "", nom: data.nom ?? "",
        age: data.age?.toString() ?? "", poids: data.poids?.toString() ?? "",
        taille: data.taille?.toString() ?? "", sexe: data.sexe ?? "",
      });
    })();
  }, []);

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

  const inp = "w-full bg-[#0a0a0a] border border-white/10 text-white placeholder-white/20 text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors";
  const lbl = "text-[0.7rem] tracking-[0.2em] uppercase text-white/40 block mb-1.5";

  return (
    <div className="p-4 sm:p-8 max-w-lg">
      <p className="text-[0.7rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-2">Paramètres</p>
      <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-5xl text-white tracking-wide mb-10">MON PROFIL</h1>

      <div className="border border-white/10 bg-[#111] p-6 flex flex-col gap-5">
        <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c]">Informations personnelles</p>

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
                className={`flex-1 py-2.5 text-[0.7rem] tracking-[0.1em] uppercase border transition-all ${form.sexe === s ? "border-[#c9a84c] text-[#c9a84c] bg-[#c9a84c]/10" : "border-white/10 text-white/40 hover:border-white/30"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-[#e07070] border border-[#e07070]/20 bg-[#e07070]/5 px-3 py-2">{error}</p>}
        {saved && <p className="text-xs text-[#7eb8a0] border border-[#7eb8a0]/20 bg-[#7eb8a0]/5 px-3 py-2">Profil mis à jour ✓ — le BMR sera recalculé automatiquement</p>}

        <button onClick={save} disabled={saving}
          className="bg-[#c9a84c] text-black text-[0.7rem] font-bold tracking-[0.2em] uppercase py-3.5 hover:bg-[#e2c97e] hover:shadow-[0_4px_16px_-4px_rgba(201,168,76,0.5)] hover:-translate-y-px transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2">
          {saving
            ? <><div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"/>Enregistrement…</>
            : "Enregistrer"}
        </button>
      </div>

      <div className="border border-white/10 bg-[#111] p-6 flex flex-col gap-5 mt-6">
        <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c]">Mot de passe</p>

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

        {pwdError && <p className="text-xs text-[#e07070] border border-[#e07070]/20 bg-[#e07070]/5 px-3 py-2">{pwdError}</p>}
        {pwdSaved && <p className="text-xs text-[#7eb8a0] border border-[#7eb8a0]/20 bg-[#7eb8a0]/5 px-3 py-2">Mot de passe mis à jour ✓</p>}

        <button onClick={savePassword} disabled={pwdSaving}
          className="border border-[#c9a84c]/30 text-[#c9a84c] text-[0.7rem] font-bold tracking-[0.2em] uppercase py-3.5 hover:bg-[#c9a84c]/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {pwdSaving
            ? <><div className="w-3 h-3 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin"/>Enregistrement…</>
            : "Changer le mot de passe"}
        </button>
      </div>
    </div>
  );
}
