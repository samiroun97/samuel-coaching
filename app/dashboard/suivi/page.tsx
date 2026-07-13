"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { apiPost } from "@/lib/apiClient";

const SAMUEL_EMAIL = "sam97waelti@gmail.com";

type Profile      = { sexe?: string; poids?: number; taille?: number; age?: number };
type WeightEntry  = { id: string; date: string; weight: number };
type BodyFatEntry = {
  id: string; date: string; body_fat: number; note: string;
  points_forts?: string; points_faibles?: string; conseils?: string; shared?: boolean;
};

const SLOTS = [
  { key: "face",          label: "Face" },
  { key: "dos",           label: "Dos" },
  { key: "profil",        label: "Profil" },
  { key: "jambe_avant",   label: "Jambe avant" },
  { key: "jambe_arriere", label: "Jambe arrière" },
];

const resizeImage = (dataUrl: string, maxW = 512, maxH = 768): Promise<string> =>
  new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const scale = Math.min(maxW / width, maxH / height, 1);
      width = Math.floor(width * scale); height = Math.floor(height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.55));
    };
    img.src = dataUrl;
  });

const today = () => new Date().toISOString().split("T")[0];

function DateNav({ date, onChange }: { date: string; onChange: (d: string) => void }) {
  const todayD = new Date().toISOString().split("T")[0];
  const isToday = date === todayD;
  const move = (delta: number) => {
    const d = new Date(date + "T12:00:00"); d.setDate(d.getDate() + delta);
    onChange(d.toISOString().split("T")[0]);
  };
  const label = isToday ? "Aujourd'hui" : new Date(date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const dateInputRef = useRef<HTMLInputElement>(null);
  const openPicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      try { input.showPicker(); } catch { input.focus(); input.click(); }
    } else {
      input.focus();
      input.click();
    }
  };
  return (
    <div className="flex items-center gap-2 mb-6">
      <button onClick={() => move(-1)} className="w-7 h-7 border border-white/10 text-white/40 hover:text-white/60 hover:border-white/20 transition-colors flex items-center justify-center shrink-0">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div className="flex-1 relative flex items-center justify-center gap-1.5 cursor-pointer group" onClick={openPicker}>
        <input
          ref={dateInputRef}
          type="date" value={date} max={todayD}
          onChange={e => { if (e.target.value) onChange(e.target.value); }}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/30 group-hover:text-white/50 transition-colors shrink-0">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <p className="text-[0.7rem] tracking-[0.15em] uppercase text-white/50 group-hover:text-white/70 transition-colors capitalize select-none">{label}</p>
      </div>
      <button onClick={() => move(1)} disabled={isToday} className="w-7 h-7 border border-white/10 text-white/40 hover:text-white/60 hover:border-white/20 transition-colors flex items-center justify-center shrink-0 disabled:opacity-20 disabled:cursor-not-allowed">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
      {!isToday && (
        <button onClick={() => onChange(todayD)} className="text-[0.62rem] tracking-[0.12em] uppercase text-[#c9a84c] border border-[#c9a84c]/30 px-2 py-1 hover:bg-[#c9a84c]/10 transition-colors shrink-0">
          Auj.
        </button>
      )}
    </div>
  );
}

export default function SuiviPage() {
  const [profile,        setProfile]        = useState<Profile | null>(null);
  const [userId,         setUserId]         = useState<string | null>(null);
  const [userEmail,      setUserEmail]      = useState<string>("");
  const [selectedDate,   setSelectedDate]   = useState(() => {
    try { return localStorage.getItem("selected_date") || today(); } catch { return today(); }
  });
  const [weightHist,     setWeightHist]     = useState<WeightEntry[]>([]);
  const [bfHist,         setBfHist]         = useState<BodyFatEntry[]>([]);
  const [photos,         setPhotos]         = useState<Record<string, string>>({});
  const [estimating,     setEstimating]     = useState(false);
  const [result,         setResult]         = useState<{ body_fat_percentage: number; note: string; points_forts?: string; points_faibles?: string; conseils?: string } | null>(null);
  const [error,          setError]          = useState("");
  const [showUpload,     setShowUpload]     = useState(false);
  const [showManual,     setShowManual]     = useState(false);
  const [manualVal,      setManualVal]      = useState("");
  const [manualDate,     setManualDate]     = useState("");
  const [weightInput,    setWeightInput]    = useState("");
  const [weightSaving,   setWeightSaving]   = useState(false);
  const [weightSaved,    setWeightSaved]    = useState(false);
  const [shareWithCoach, setShareWithCoach] = useState(false);
  const [sharing,        setSharing]        = useState(false);
  const [editingBFId,    setEditingBFId]    = useState<string | null>(null);
  const [editingBFVal,   setEditingBFVal]   = useState("");
  const [editingBFDate,  setEditingBFDate]  = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const uploadSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showUpload) uploadSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showUpload]);

  // ── Check-in hebdomadaire (client → coach) ──
  const [ckOpen,    setCkOpen]    = useState(false);
  const [ckWeight,  setCkWeight]  = useState("");
  const [ckEnergy,  setCkEnergy]  = useState(0);
  const [ckComp,    setCkComp]    = useState(0);
  const [ckNotes,   setCkNotes]   = useState("");
  const [ckSaving,  setCkSaving]  = useState(false);
  const [ckDone,    setCkDone]    = useState(false);
  const [lastCkDate, setLastCkDate] = useState<string | null>(null);

  // Lundi de la semaine en cours (référence du check-in)
  const weekMonday = (() => {
    const d = new Date(); const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day); return d.toISOString().split("T")[0];
  })();
  const ckDoneThisWeek = lastCkDate === weekMonday;

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      setUserEmail(user.email ?? "");
      const { data: p } = await supabase.from("profiles").select("poids,taille,age,sexe").eq("id", user.id).single();
      if (p) setProfile(p as Profile);

      const wRaw = localStorage.getItem(`weight_history_${user.id}`);
      const bRaw = localStorage.getItem(`bodyfat_history_${user.id}`) ?? localStorage.getItem("bodyfat_history");
      const wh: WeightEntry[]  = wRaw ? JSON.parse(wRaw) : [];
      const bh: BodyFatEntry[] = bRaw ? JSON.parse(bRaw) : [];
      setWeightHist(wh);
      setBfHist(bh);
      const lastWeight = wh[0]?.weight ?? (p as Profile | null)?.poids;
      if (lastWeight) setWeightInput(String(lastWeight));
      if (lastWeight) setCkWeight(String(lastWeight));

      // Dernier check-in envoyé
      const { data: ck } = await supabase.from("weekly_checkins")
        .select("week_date").eq("client_id", user.id).order("week_date", { ascending: false }).limit(1);
      if (ck?.[0]) setLastCkDate(ck[0].week_date);
    })();
  }, []);

  useEffect(() => {
    try { localStorage.setItem("selected_date", selectedDate); } catch { /* ignore */ }
  }, [selectedDate]);

  const sendCheckin = async () => {
    if (!userId || ckSaving) return;
    setCkSaving(true);
    const { error } = await supabase.from("weekly_checkins").upsert({
      client_id: userId, week_date: weekMonday,
      weight: ckWeight ? parseFloat(ckWeight.replace(",", ".")) : null,
      compliance: ckComp || null, energy: ckEnergy || null,
      notes: ckNotes || null,
    }, { onConflict: "client_id,week_date" });
    setCkSaving(false);
    if (!error) {
      setLastCkDate(weekMonday); setCkDone(true);
      setTimeout(() => { setCkDone(false); setCkOpen(false); }, 1800);
    }
  };

  const lastWeight      = weightHist[0] ?? null;
  const alreadySelected = weightHist.some(e => e.date === selectedDate);
  const lastBF       = bfHist[0] ?? null;
  const daysSinceBF  = lastBF ? Math.floor((Date.now() - new Date(lastBF.date).getTime()) / 86400000) : null;
  const needsBF      = daysSinceBF === null || daysSinceBF >= 14;
  const photoCount   = Object.keys(photos).length;

  const saveWeight = async () => {
    const val = parseFloat(weightInput.replace(",", "."));
    if (isNaN(val) || val < 20 || val > 300 || !userId) return;
    setWeightSaving(true);
    const entry: WeightEntry = { id: Date.now().toString(), date: selectedDate, weight: +val.toFixed(1) };
    const next = [entry, ...weightHist.filter(e => e.date !== selectedDate)].sort((a, b) => b.date.localeCompare(a.date));
    setWeightHist(next);
    localStorage.setItem(`weight_history_${userId}`, JSON.stringify(next));
    await supabase.from("profiles").update({ poids: val }).eq("id", userId);
    setWeightSaving(false); setWeightSaved(true);
    setTimeout(() => setWeightSaved(false), 2000);
  };

  const handleSelect = async (key: string, file: File) => {
    const reader = new FileReader();
    reader.onload = async e => {
      const resized = await resizeImage(e.target?.result as string);
      setPhotos(prev => ({ ...prev, [key]: resized }));
    };
    reader.readAsDataURL(file);
  };

  const estimate = async () => {
    if (photoCount === 0) { setError("Ajoute au moins une photo."); return; }
    setEstimating(true); setError(""); setResult(null);
    try {
      const res = await apiPost("/api/suivi/bodyfat", { photos: Object.values(photos), profile });
      if (!res.ok) throw new Error(await res.text() || `Erreur ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Erreur"); }
    setEstimating(false);
  };

  const saveBFEntry = async () => {
    if (!result) return;
    const entryId = Date.now().toString();
    const entry: BodyFatEntry = {
      id: entryId,
      date: new Date().toISOString(),
      body_fat: result.body_fat_percentage,
      note: result.note,
      points_forts: result.points_forts,
      points_faibles: result.points_faibles,
      conseils: result.conseils,
      shared: shareWithCoach,
    };
    const next = [entry, ...bfHist];
    setBfHist(next);
    localStorage.setItem(`bodyfat_history_${userId}`, JSON.stringify(next));

    // Upload sécurisé dans Supabase Storage (fire & forget)
    void uploadSessionPhotos(entryId, photos, shareWithCoach);

    if (shareWithCoach && userEmail && userEmail !== SAMUEL_EMAIL) {
      setSharing(true);
      const payload = JSON.stringify({
        bf: entry.body_fat,
        date: entry.date,
        note: entry.note,
        points_forts: entry.points_forts ?? "",
        points_faibles: entry.points_faibles ?? "",
        conseils: entry.conseils ?? "",
      });
      await supabase.from("messages").insert({
        from_email: userEmail,
        to_email: SAMUEL_EMAIL,
        content: `[BODYFAT_CHECK:${payload}]`,
      });
      setSharing(false);
    }

    setResult(null); setPhotos({}); setShowUpload(false); setShareWithCoach(false);
  };

  const saveManualBF = () => {
    const val = parseFloat(manualVal.replace(",", "."));
    if (isNaN(val) || val <= 0 || val > 60) return;
    const dateStr = manualDate || today();
    const entry: BodyFatEntry = { id: Date.now().toString(), date: new Date(dateStr + "T12:00:00").toISOString(), body_fat: +val.toFixed(1), note: "Saisie manuelle" };
    const next = [entry, ...bfHist].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setBfHist(next);
    localStorage.setItem(`bodyfat_history_${userId}`, JSON.stringify(next));
    setManualVal(""); setManualDate(""); setShowManual(false);
  };

  const deleteBF = (id: string) => {
    const next = bfHist.filter(e => e.id !== id);
    setBfHist(next);
    localStorage.setItem(`bodyfat_history_${userId}`, JSON.stringify(next));
  };

  const deleteWeight = (id: string) => {
    const next = weightHist.filter(e => e.id !== id);
    setWeightHist(next);
    localStorage.setItem(`weight_history_${userId}`, JSON.stringify(next));
  };

  const saveBFEdit = (id: string) => {
    const val = parseFloat(editingBFVal.replace(",", "."));
    if (isNaN(val)) { setEditingBFId(null); return; }
    const next = bfHist.map(e => e.id === id ? { ...e, body_fat: +val.toFixed(1) } : e);
    setBfHist(next); localStorage.setItem(`bodyfat_history_${userId}`, JSON.stringify(next));
    setEditingBFId(null);
  };

  const uploadSessionPhotos = async (entryId: string, photoMap: Record<string, string>, shared: boolean) => {
    if (!userId || Object.keys(photoMap).length === 0) return;
    for (const [key, dataUrl] of Object.entries(photoMap)) {
      try {
        const base64 = dataUrl.split(",")[1];
        const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: "image/jpeg" });
        const path = `${userId}/${entryId}/${key}.jpg`;
        const { error: uploadErr } = await supabase.storage
          .from("body-photos")
          .upload(path, blob, { contentType: "image/jpeg" });
        if (!uploadErr) {
          await supabase.from("body_photos").insert({
            user_id: userId, photo_path: path, session_id: entryId, shared_with_coach: shared,
          });
        }
      } catch { /* fail silently si le bucket n'existe pas encore */ }
    }
  };

  const togglePhotoSharing = async (entryId: string, shared: boolean) => {
    if (!userId) return;
    await supabase.from("body_photos")
      .update({ shared_with_coach: shared })
      .eq("session_id", entryId)
      .eq("user_id", userId);
    const next = bfHist.map(e => e.id === entryId ? { ...e, shared } : e);
    setBfHist(next);
    localStorage.setItem(`bodyfat_history_${userId}`, JSON.stringify(next));
  };

  const saveBFEditDate = (id: string, dateVal: string) => {
    if (!dateVal) { setEditingBFDate(null); return; }
    const next = bfHist.map(e => e.id === id ? { ...e, date: new Date(dateVal + "T12:00:00").toISOString() } : e)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setBfHist(next); localStorage.setItem(`bodyfat_history_${userId}`, JSON.stringify(next));
    setEditingBFDate(null);
  };

  const bfChartData = [...bfHist].reverse().slice(-10);

  return (
    <div className="p-4 sm:p-8 max-w-2xl">

      {/* Header */}
      <div className="mb-6">
        <p className="text-[0.7rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-2">Rubrique</p>
        <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl sm:text-5xl text-white tracking-wide">SUIVI</h1>
      </div>

      {/* ── Check-in hebdomadaire (client → coach) ── */}
      {userEmail !== SAMUEL_EMAIL && (
        <div className={`border mb-6 ${ckDoneThisWeek && !ckOpen ? "border-[#7eb8a0]/25 bg-[#7eb8a0]/5" : "border-[#c9a84c]/25 bg-[#c9a84c]/5"}`}>
          <button onClick={() => setCkOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-4 text-left">
            <div>
              <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-0.5">Check-in de la semaine</p>
              <p className="text-[0.7rem] text-white/35 tracking-wider">
                {ckDoneThisWeek ? "✓ Envoyé à Samuel cette semaine — modifier" : "Fais ton point du dimanche : poids, énergie, adhérence"}
              </p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              className={`text-white/30 shrink-0 transition-transform ${ckOpen ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {ckOpen && (
            <div className="px-5 pb-5 flex flex-col gap-4 border-t border-white/5 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[0.7rem] tracking-[0.15em] uppercase text-white/40 block mb-1.5">Poids (kg)</label>
                  <input type="number" inputMode="decimal" step="0.1" value={ckWeight} onChange={e => setCkWeight(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 text-white text-base px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40" placeholder="78.0"/>
                </div>
              </div>
              <div>
                <label className="text-[0.7rem] tracking-[0.15em] uppercase text-white/40 block mb-1.5">Énergie / forme — 1 faible · 5 top</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setCkEnergy(n)}
                      className={`flex-1 h-10 border text-sm font-bold transition-all ${ckEnergy >= n ? "bg-[#7eb8a0] border-[#7eb8a0] text-black" : "border-white/15 text-white/25"}`}>{n}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[0.7rem] tracking-[0.15em] uppercase text-white/40 block mb-1.5">Adhérence au plan — 1 difficile · 5 parfaite</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setCkComp(n)}
                      className={`flex-1 h-10 border text-sm font-bold transition-all ${ckComp >= n ? "bg-[#c9a84c] border-[#c9a84c] text-black" : "border-white/15 text-white/25"}`}>{n}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[0.7rem] tracking-[0.15em] uppercase text-white/40 block mb-1.5">Un mot pour Samuel</label>
                <textarea rows={3} value={ckNotes} onChange={e => setCkNotes(e.target.value)}
                  placeholder="Comment s'est passée ta semaine ? Difficultés, victoires, douleurs…"
                  className="w-full bg-[#0a0a0a] border border-white/10 text-white/80 text-sm px-3 py-2.5 resize-none focus:outline-none focus:border-[#c9a84c]/40"/>
              </div>
              {ckDone ? (
                <div className="text-center py-2 text-[#7eb8a0] text-sm tracking-wider">Check-in envoyé ✓</div>
              ) : (
                <button onClick={sendCheckin} disabled={ckSaving}
                  className="bg-[#c9a84c] text-black text-[0.7rem] font-bold tracking-[0.2em] uppercase py-3 hover:bg-[#e2c97e] transition-colors disabled:opacity-40">
                  {ckSaving ? "Envoi…" : "Envoyer mon check-in à Samuel →"}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <DateNav date={selectedDate} onChange={setSelectedDate} />

      {/* ── Pesée ── */}
      <div className="border border-white/10 bg-[#111] p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c]">
            {selectedDate === today() ? "Pesée du jour" : `Pesée · ${new Date(selectedDate + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`}
          </p>
          {lastWeight && (
            <span className="text-[0.62rem] text-white/25 tracking-wider">
              Dernière · {new Date(lastWeight.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · {lastWeight.weight} kg
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <input type="number" min="20" max="300" step="0.1" value={weightInput}
            onChange={e => setWeightInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") saveWeight(); }}
            className="w-28 bg-[#0a0a0a] border border-white/10 text-white text-xl font-light px-4 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors text-center"
            placeholder="70.0"/>
          <span className="text-white/30 text-sm">kg</span>
          <button onClick={saveWeight} disabled={weightSaving || !weightInput}
            className="ml-auto bg-[#c9a84c] text-black text-[0.7rem] font-bold tracking-[0.15em] uppercase px-5 py-2.5 hover:bg-[#e2c97e] transition-colors disabled:opacity-30">
            {weightSaved ? "Enregistré ✓" : alreadySelected ? "Mettre à jour" : "Enregistrer →"}
          </button>
        </div>
        {alreadySelected && (
          <p className="text-[0.62rem] text-[#7eb8a0] mt-2 tracking-wider">
            ✓ {weightHist.find(e => e.date === selectedDate)?.weight} kg enregistré
          </p>
        )}
      </div>

      {/* ── Body fat — rappel ── */}
      {needsBF && (
        <div className="border border-[#c9a84c]/30 bg-[#c9a84c]/5 px-5 py-3 mb-4 flex items-center justify-between">
          <div>
            <p className="text-[0.7rem] tracking-[0.15em] uppercase text-[#c9a84c] font-bold">
              {daysSinceBF === null ? "Premier check-in body fat" : `Check-in body fat · ${daysSinceBF}j depuis le dernier`}
            </p>
            <p className="text-[0.62rem] text-white/30 mt-0.5 tracking-wider">Recommandé toutes les 2 semaines</p>
          </div>
          <button onClick={() => { setShowUpload(true); setShowManual(false); }}
            className="bg-[#c9a84c] text-black text-[0.68rem] font-bold tracking-[0.15em] uppercase px-4 py-2 hover:bg-[#e2c97e] transition-colors shrink-0 ml-4">
            Estimer →
          </button>
        </div>
      )}

      {/* ── Carte Body fat + explication ── */}
      <div className={`border mb-4 ${!needsBF ? "border-white/10 bg-[#111]" : "border-white/5 bg-[#0d0d0d]"}`}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c]">Body fat actuel</p>
            {!needsBF && daysSinceBF !== null && (
              <span className="text-[0.62rem] text-white/20 tracking-wider">Prochain dans {14 - daysSinceBF}j</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            {lastBF ? (
              <div className="flex items-baseline gap-2">
                <span style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl text-white tracking-wide leading-none">{lastBF.body_fat}</span>
                <span className="text-white/40 text-sm">%</span>
              </div>
            ) : (
              <p className="text-white/30 text-xs">Aucune estimation</p>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setShowManual(v => !v); setShowUpload(false); setManualVal(""); setManualDate(selectedDate); }}
                className="border border-white/10 text-white/30 text-[0.7rem] tracking-[0.12em] uppercase px-4 py-2 hover:border-white/20 hover:text-white/50 transition-colors">
                {showManual ? "Annuler" : "Manuel"}
              </button>
              {!needsBF && (
                <button onClick={() => { setShowUpload(v => !v); setShowManual(false); setResult(null); setError(""); }}
                  className="border border-white/10 text-white/30 text-[0.7rem] tracking-[0.12em] uppercase px-4 py-2 hover:border-white/20 hover:text-white/50 transition-colors">
                  {showUpload ? "Annuler" : "Estimer IA"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Encadré explicatif */}
        <div className="border-t border-white/5 px-5 py-4 bg-[#0a0a0a]/60">
          <p className="text-[0.68rem] tracking-[0.15em] uppercase text-white/30 mb-3">Pourquoi suivre ton taux de masse grasse plutôt que juste ton poids ?</p>
          <div className="flex flex-col gap-2.5">
            <p className="text-[0.65rem] text-white/35 leading-relaxed">
              Ta balance ne te dit qu&apos;un chiffre : ton poids total. Mais deux personnes qui pèsent 70 kg peuvent avoir un corps complètement différent — l&apos;une avec plus de muscle, l&apos;autre avec plus de gras. Résultat : leur corps ne brûle pas les mêmes calories au quotidien, même à poids égal.
            </p>
            <p className="text-[0.65rem] text-white/35 leading-relaxed">
              En connaissant ton taux de masse grasse, on peut calculer précisément combien de calories ton corps brûle au repos (ton métabolisme de base) — de façon bien plus juste qu&apos;avec le poids seul.
            </p>
            <p className="text-[0.65rem] text-white/35 leading-relaxed">
              C&apos;est aussi le meilleur moyen de savoir si tu progresses vraiment. Si tu perds du gras et prends du muscle en même temps, ton poids sur la balance peut rester identique... alors que ton corps change complètement. En suivant ton taux de masse grasse toutes les 2 semaines, tu vois ta vraie évolution même quand le chiffre sur la balance ne bouge pas.
            </p>
          </div>
        </div>
      </div>

      {/* Saisie manuelle BF */}
      {showManual && (
        <div className="border border-white/10 bg-[#111] p-5 mb-4 flex items-center gap-3">
          <div className="flex flex-col gap-1 shrink-0">
            <p className="text-[0.65rem] tracking-[0.15em] uppercase text-white/25">Body fat %</p>
            <input type="number" min="1" max="60" step="0.1" placeholder="18.5" autoFocus
              className="w-24 bg-[#0a0a0a] border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-[#c9a84c]/40 placeholder-white/15"
              value={manualVal} onChange={e => setManualVal(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") saveManualBF(); if (e.key === "Escape") setShowManual(false); }}
            />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <p className="text-[0.65rem] tracking-[0.15em] uppercase text-white/25">Date</p>
            <input type="date" max={today()}
              className="w-full bg-[#0a0a0a] border border-white/10 text-white/60 text-sm px-3 py-2 focus:outline-none focus:border-[#c9a84c]/40"
              value={manualDate || selectedDate} onChange={e => setManualDate(e.target.value)}
            />
          </div>
          <button onClick={saveManualBF}
            className="bg-[#c9a84c] text-black text-[0.7rem] font-bold tracking-[0.15em] uppercase px-5 py-2.5 hover:bg-[#e2c97e] transition-colors shrink-0 self-end">
            Enregistrer →
          </button>
        </div>
      )}

      {/* Upload & IA */}
      {showUpload && (
        <div ref={uploadSectionRef} className="border border-white/10 bg-[#111] p-5 mb-4 scroll-mt-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c]">Photos corporelles</p>
            <span className="text-[0.62rem] text-white/20 tracking-wider">Privées par défaut</span>
          </div>
          <p className="text-[0.65rem] text-white/20 mb-5 tracking-wider">Plus il y a de photos, plus l'estimation est précise</p>

          <div className="grid grid-cols-5 gap-2 mb-5">
            {SLOTS.map(slot => (
              <div key={slot.key} className="flex flex-col items-center gap-1.5">
                <button onClick={() => fileRefs.current[slot.key]?.click()}
                  className={`w-full aspect-[3/4] border flex items-center justify-center relative overflow-hidden transition-colors ${photos[slot.key] ? "border-[#7eb8a0]/40" : "border-white/10 hover:border-white/25"}`}>
                  {photos[slot.key] ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photos[slot.key]} alt={slot.label} className="absolute inset-0 w-full h-full object-cover"/>
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                      </div>
                    </>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-white/15"><path d="M12 5v14M5 12h14"/></svg>
                  )}
                </button>
                <span className="text-[0.6rem] tracking-wider text-white/20 text-center uppercase leading-tight">{slot.label}</span>
                <input type="file" accept="image/*" className="hidden"
                  ref={el => { fileRefs.current[slot.key] = el; }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleSelect(slot.key, f); }}
                />
              </div>
            ))}
          </div>

          {error && <p className="text-xs text-[#e07070] border border-[#e07070]/20 bg-[#e07070]/5 px-3 py-2 mb-4">{error}</p>}

          {result ? (
            <div className="flex flex-col gap-3">
              {/* Résultat IA */}
              <div className="border border-[#c9a84c]/20 bg-[#c9a84c]/5 p-4 flex items-center justify-between">
                <div>
                  <p className="text-[0.65rem] tracking-[0.15em] uppercase text-[#c9a84c] mb-1">Estimation IA</p>
                  <p className="text-[0.65rem] text-white/40 italic leading-relaxed">{result.note}</p>
                </div>
                <div className="text-right ml-4 shrink-0">
                  <p style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl text-white tracking-wide leading-none">{result.body_fat_percentage}</p>
                  <p className="text-[0.62rem] tracking-[0.15em] uppercase text-white/30">% body fat</p>
                </div>
              </div>

              {/* Feedback IA */}
              {(result.points_forts || result.points_faibles || result.conseils) && (
                <div className="border border-white/10 bg-[#0a0a0a] divide-y divide-white/5">
                  {result.points_forts   && <FeedbackRow color="#7eb8a0" label="Points forts"  text={result.points_forts}/>}
                  {result.points_faibles && <FeedbackRow color="#e07070" label="À travailler"  text={result.points_faibles}/>}
                  {result.conseils       && <FeedbackRow color="#c9a84c" label="Conseils"       text={result.conseils}/>}
                </div>
              )}

              {/* Toggle partage coach */}
              <div className="border border-white/8 bg-[#0f0f0f] px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[0.7rem] tracking-[0.1em] uppercase text-white/50">Partager avec Samuel</p>
                  <p className="text-[0.62rem] text-white/25 mt-0.5">
                    {shareWithCoach
                      ? "L'estimation et le feedback IA seront envoyés à ton coach"
                      : "Les photos restent privées — seule l'estimation sera partagée si tu coches"}
                  </p>
                </div>
                <button onClick={() => setShareWithCoach(v => !v)}
                  className={`w-10 h-5.5 rounded-full transition-all relative shrink-0 ml-4 ${shareWithCoach ? "bg-[#c9a84c]" : "bg-white/10"}`}
                  style={{ minWidth: 40, height: 22 }}>
                  <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-white transition-transform ${shareWithCoach ? "translate-x-[20px]" : "translate-x-[3px]"}`}
                    style={{ display: "block" }}/>
                </button>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setResult(null)}
                  className="flex-1 border border-white/10 text-white/40 text-[0.65rem] tracking-[0.15em] uppercase py-2.5 hover:border-white/20 hover:text-white/60 transition-colors">
                  Ré-estimer
                </button>
                <button onClick={saveBFEntry} disabled={sharing}
                  className="flex-1 bg-[#c9a84c] text-black text-[0.7rem] font-bold tracking-[0.2em] uppercase py-2.5 hover:bg-[#e2c97e] transition-colors disabled:opacity-50">
                  {sharing ? "Envoi…" : shareWithCoach ? "Enregistrer & partager →" : "Enregistrer →"}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={estimate} disabled={photoCount === 0 || estimating}
              className="w-full bg-[#c9a84c] text-black text-[0.7rem] font-bold tracking-[0.2em] uppercase py-3.5 hover:bg-[#e2c97e] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {estimating
                ? <><div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"/>Analyse en cours…</>
                : `Estimer avec l'IA · ${photoCount}/5 photo${photoCount > 1 ? "s" : ""} →`}
            </button>
          )}
        </div>
      )}

      {/* ── Graphique évolution body fat ── */}
      {bfChartData.length > 1 && (
        <div className="border border-white/10 bg-[#111] p-4 mb-4">
          <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-3">Évolution body fat</p>
          <LineChart data={bfChartData.map(e => ({ id: e.id, date: e.date, val: e.body_fat }))} unit="%" color="#c9a84c" glow/>
        </div>
      )}

      {/* ── Historique body fat avec feedback ── */}
      {bfHist.length > 0 && (
        <div className="border border-white/10 bg-[#111] mb-4">
          <div className="px-5 py-3 border-b border-white/5">
            <p style={{ fontFamily: "var(--font-bebas)" }} className="text-sm tracking-wider text-white">Historique body fat</p>
          </div>
          {bfHist.map((entry, i) => {
            const prev = bfHist[i + 1];
            const diff = prev ? +(entry.body_fat - prev.body_fat).toFixed(1) : null;
            const hasFeedback = entry.points_forts || entry.points_faibles || entry.conseils;
            return (
              <div key={entry.id} className="border-b border-white/5 last:border-0">
                <div className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    {editingBFDate === entry.id ? (
                      <input type="date" autoFocus max={today()}
                        className="bg-[#0a0a0a] border border-[#c9a84c]/40 text-[#c9a84c] text-[0.7rem] px-2 py-1 focus:outline-none mb-0.5"
                        defaultValue={entry.date.split("T")[0]}
                        onBlur={e => saveBFEditDate(entry.id, e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") saveBFEditDate(entry.id, (e.target as HTMLInputElement).value); if (e.key === "Escape") setEditingBFDate(null); }}
                      />
                    ) : (
                      <p className="text-[0.65rem] tracking-wider text-white/40 capitalize cursor-pointer hover:text-white/60 transition-colors"
                        onClick={() => setEditingBFDate(entry.id)}>
                        {new Date(entry.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[0.6rem] text-white/20 italic truncate">{entry.note}</p>
                      <button
                        onClick={() => togglePhotoSharing(entry.id, !entry.shared)}
                        className={`text-[0.6rem] tracking-wider uppercase border px-1.5 py-px transition-colors shrink-0 ${
                          entry.shared
                            ? "text-[#c9a84c]/60 border-[#c9a84c]/25 hover:text-[#e07070]/50 hover:border-[#e07070]/20"
                            : "text-white/15 border-white/8 hover:text-[#c9a84c]/40 hover:border-[#c9a84c]/20"
                        }`}
                      >
                        {entry.shared ? "Partagé ✓" : "Partager"}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <div className="text-right">
                      {editingBFId === entry.id ? (
                        <input type="number" min="1" max="60" step="0.1" autoFocus
                          className="w-16 bg-[#0a0a0a] border border-[#c9a84c]/40 text-[#c9a84c] text-center text-sm py-0.5 focus:outline-none"
                          value={editingBFVal} onChange={e => setEditingBFVal(e.target.value)}
                          onBlur={() => saveBFEdit(entry.id)}
                          onKeyDown={e => { if (e.key === "Enter") saveBFEdit(entry.id); if (e.key === "Escape") setEditingBFId(null); }}
                        />
                      ) : (
                        <div className="flex items-baseline gap-1 justify-end cursor-pointer"
                          onClick={() => { setEditingBFId(entry.id); setEditingBFVal(entry.body_fat.toString()); }}>
                          <span style={{ fontFamily: "var(--font-bebas)" }} className={`text-2xl tracking-wide leading-none ${i === 0 ? "text-white" : "text-white/40"}`}>{entry.body_fat}</span>
                          <span className="text-[0.62rem] text-white/25">%</span>
                        </div>
                      )}
                      {diff !== null && editingBFId !== entry.id && (
                        <span className={`text-[0.6rem] tracking-wider ${diff < 0 ? "text-[#7eb8a0]" : diff > 0 ? "text-[#e07070]" : "text-white/20"}`}>
                          {diff < 0 ? "▼" : diff > 0 ? "▲" : "—"}{Math.abs(diff)}%
                        </span>
                      )}
                    </div>
                    <button onClick={() => deleteBF(entry.id)} className="text-white/15 hover:text-[#e07070] transition-colors">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>

                {/* Feedback IA sauvegardé */}
                {hasFeedback && (
                  <div className="mx-5 mb-3 border border-white/5 bg-[#0a0a0a] divide-y divide-white/5">
                    {entry.points_forts   && <FeedbackRow color="#7eb8a0" label="Points forts" text={entry.points_forts}/>}
                    {entry.points_faibles && <FeedbackRow color="#e07070" label="À travailler" text={entry.points_faibles}/>}
                    {entry.conseils       && <FeedbackRow color="#c9a84c" label="Conseils"      text={entry.conseils}/>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Historique poids ── */}
      {weightHist.length > 1 && (
        <div className="border border-white/10 bg-[#111]">
          <div className="px-5 py-3 border-b border-white/5">
            <p style={{ fontFamily: "var(--font-bebas)" }} className="text-sm tracking-wider text-white">Historique pesées</p>
          </div>
          {weightHist.slice(0, 10).map((entry, i) => {
            const prev = weightHist[i + 1];
            const diff = prev ? +(entry.weight - prev.weight).toFixed(1) : null;
            return (
              <div key={entry.id} className="flex items-center justify-between px-5 py-3 border-b border-white/5 last:border-0">
                <p className="text-[0.65rem] text-white/40 capitalize">
                  {new Date(entry.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                </p>
                <div className="flex items-center gap-3">
                  {diff !== null && (
                    <span className={`text-[0.6rem] tracking-wider ${diff < 0 ? "text-[#7eb8a0]" : diff > 0 ? "text-[#e07070]" : "text-white/20"}`}>
                      {diff > 0 ? "+" : ""}{diff} kg
                    </span>
                  )}
                  <span className={`text-sm font-medium ${i === 0 ? "text-white" : "text-white/40"}`}>{entry.weight} kg</span>
                  <button onClick={() => deleteWeight(entry.id)} className="text-white/15 hover:text-[#e07070] transition-colors">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

function FeedbackRow({ color, label, text }: { color: string; label: string; text: string }) {
  return (
    <div className="flex gap-3 px-4 py-2.5">
      <span className="text-[0.62rem] tracking-[0.15em] uppercase shrink-0 w-20 pt-0.5" style={{ color }}>{label}</span>
      <p className="text-[0.65rem] text-white/45 leading-relaxed">{text}</p>
    </div>
  );
}

function LineChart({ data, unit, color, glow }: { data: { id: string; date: string; val: number }[]; unit: string; color: string; glow?: boolean }) {
  const W = 400, H = 120;
  const PAD = { top: 14, right: 14, bottom: 28, left: 32 };
  const vals = data.map(d => d.val);
  const minV = Math.max(0, Math.min(...vals) - (unit === "%" ? 2 : 1));
  const maxV = Math.max(...vals) + (unit === "%" ? 2 : 1);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const toX = (i: number) => PAD.left + (data.length > 1 ? (i / (data.length - 1)) * innerW : innerW / 2);
  const toY = (v: number) => PAD.top + (1 - (v - minV) / (maxV - minV)) * innerH;
  const pts = data.map((d, i) => `${toX(i)},${toY(d.val)}`).join(" ");
  const filterId = `glow-${color.replace("#", "")}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }}>
      {glow && (
        <defs>
          <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
      )}
      {[0, 0.5, 1].map(t => {
        const y = PAD.top + t * innerH;
        const v = maxV - t * (maxV - minV);
        return (
          <g key={t}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            <text x={PAD.left - 4} y={y + 3} textAnchor="end" fill="rgba(255,255,255,0.18)" fontSize="7">{v.toFixed(unit === "%" ? 1 : 0)}</text>
          </g>
        );
      })}
      <polygon points={`${toX(0)},${H - PAD.bottom} ${pts} ${toX(data.length - 1)},${H - PAD.bottom}`} fill={`${color}18`}/>
      {glow && <polyline points={pts} fill="none" stroke={color} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" opacity="0.25"/>}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" filter={glow ? `url(#${filterId})` : undefined}/>
      {data.map((d, i) => (
        <g key={d.id}>
          {glow && <circle cx={toX(i)} cy={toY(d.val)} r="7" fill={color} opacity="0.15"/>}
          <circle cx={toX(i)} cy={toY(d.val)} r="3" fill={color} filter={glow ? `url(#${filterId})` : undefined}/>
          <text x={toX(i)} y={H - PAD.bottom + 11} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="6">
            {new Date(d.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
          </text>
        </g>
      ))}
    </svg>
  );
}
