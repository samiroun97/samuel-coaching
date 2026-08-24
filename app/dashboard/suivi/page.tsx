"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { apiPost } from "@/lib/apiClient";
import { DateNav } from "@/components/DateNav";
import { LineChart } from "@/components/LineChart";
import { FeedbackRow } from "@/components/FeedbackRow";
import { CalendarPicker } from "@/components/CalendarPicker";
import { isCoachUser, getMyCoachEmail } from "@/lib/coach";
import { useSelectedDate } from "@/lib/useSelectedDate";
import { syncSteps } from "@/lib/steps";
import { BALANCE_ICON } from "@/components/balanceIcon";

type Profile      = { prenom?: string; sexe?: string; poids?: number; taille?: number; age?: number; objectifs?: string; objectif_type?: string; seances_par_semaine?: number; experience?: string; niveau_activite?: string };
type WeightEntry  = { id: string; date: string; weight: number };
type BodyFatEntry = {
  id: string; date: string; body_fat: number; note: string;
  points_forts?: string; points_faibles?: string; conseils?: string; shared?: boolean;
};

async function loadBodyFatHistory(userId: string): Promise<BodyFatEntry[]> {
  // Supabase est la seule source de vérité : un résultat vide veut dire "aucune entrée",
  // jamais un signal pour réinjecter un ancien cache local (qui pourrait contenir des
  // entrées déjà supprimées côté serveur et les faire réapparaître).
  const { data } = await supabase.from("body_fat_entries")
    .select("*").eq("user_id", userId).order("date", { ascending: false });
  const bh: BodyFatEntry[] = (data ?? []).map(r => ({
    id: r.id, date: r.date, body_fat: r.body_fat, note: r.note ?? "",
    points_forts: r.points_forts ?? undefined, points_faibles: r.points_faibles ?? undefined,
    conseils: r.conseils ?? undefined, shared: r.shared ?? false,
  }));
  localStorage.setItem(`bodyfat_history_${userId}`, JSON.stringify(bh));
  return bh;
}

async function upsertBodyFatRemote(userId: string, entry: BodyFatEntry) {
  const { error } = await supabase.from("body_fat_entries").upsert({
    id: entry.id, user_id: userId, date: entry.date, body_fat: entry.body_fat,
    note: entry.note, points_forts: entry.points_forts, points_faibles: entry.points_faibles,
    conseils: entry.conseils, shared: entry.shared ?? false,
  });
  return error;
}

async function deleteBodyFatRemote(userId: string, id: string) {
  const { error } = await supabase.from("body_fat_entries").delete().eq("id", id).eq("user_id", userId);
  return error;
}

function dataUriToBlob(dataUri: string): Blob {
  const [meta, base64] = dataUri.split(",");
  const mime = meta.match(/data:(.*?);/)?.[1] ?? "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// Upload best-effort : une photo qui échoue à l'upload ne doit jamais empêcher
// l'enregistrement du résultat chiffré (déjà sauvegardé séparément).
async function uploadBFPhotos(userId: string, entryId: string, photos: Record<string, string>, shared: boolean) {
  const paths: string[] = [];
  for (const [slot, dataUri] of Object.entries(photos)) {
    const path = `${userId}/${entryId}/${slot}.jpg`;
    const { error } = await supabase.storage.from("body-photos")
      .upload(path, dataUriToBlob(dataUri), { contentType: "image/jpeg", upsert: true });
    if (!error) paths.push(path);
  }
  if (paths.length) {
    await supabase.from("body_photos").insert(
      paths.map(photo_path => ({ user_id: userId, photo_path, session_id: entryId, shared_with_coach: shared }))
    );
  }
  return paths;
}

async function loadBFPhotos(entryIds: string[]): Promise<Record<string, string[]>> {
  if (entryIds.length === 0) return {};
  const { data: rows } = await supabase.from("body_photos").select("session_id,photo_path").in("session_id", entryIds);
  if (!rows?.length) return {};
  const { data: signed } = await supabase.storage.from("body-photos")
    .createSignedUrls(rows.map(r => r.photo_path), 3600);
  const urlByPath = new Map((signed ?? []).map(s => [s.path, s.signedUrl]));
  const out: Record<string, string[]> = {};
  for (const r of rows) {
    const url = r.photo_path ? urlByPath.get(r.photo_path) : undefined;
    if (url) (out[r.session_id] ??= []).push(url);
  }
  return out;
}

function deleteBFPhotosRemote(userId: string, entryId: string) {
  void (async () => {
    const { data: rows } = await supabase.from("body_photos").select("photo_path").eq("session_id", entryId).eq("user_id", userId);
    if (rows?.length) await supabase.storage.from("body-photos").remove(rows.map(r => r.photo_path));
    await supabase.from("body_photos").delete().eq("session_id", entryId).eq("user_id", userId);
  })();
}

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

export default function SuiviPage() {
  const router = useRouter();
  const [profile,        setProfile]        = useState<Profile | null>(null);
  const [userId,         setUserId]         = useState<string | null>(null);
  const [userEmail,      setUserEmail]      = useState<string>("");
  const [isCoach,        setIsCoach]        = useState(false);
  const [coachEmail,     setCoachEmail]     = useState<string | null>(null);
  const [selectedDate,   setSelectedDate]   = useSelectedDate();
  const [weightHist,     setWeightHist]     = useState<WeightEntry[]>([]);
  const [bfHist,         setBfHist]         = useState<BodyFatEntry[]>([]);
  const [photos,         setPhotos]         = useState<Record<string, string>>({});
  const [estimating,     setEstimating]     = useState(false);
  const [result,         setResult]         = useState<{ body_fat_percentage: number; note: string; points_forts?: string; points_faibles?: string; conseils?: string } | null>(null);
  const [error,          setError]          = useState("");
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportComment,  setReportComment]  = useState("");
  const [reportSending,  setReportSending]  = useState(false);
  const [reportSent,     setReportSent]     = useState(false);
  const [showUpload,     setShowUpload]     = useState(false);
  const [showManual,     setShowManual]     = useState(false);
  const [showBFInfo,     setShowBFInfo]     = useState(false);
  const [weightHistOpen, setWeightHistOpen] = useState(false);
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
  const [showManualDatePicker, setShowManualDatePicker] = useState(false);
  const [showEstimateDatePicker, setShowEstimateDatePicker] = useState(false);
  const [bfPhotos,       setBfPhotos]       = useState<Record<string, string[]>>({});
  const [viewingPhoto,   setViewingPhoto]   = useState<string | null>(null);
  const [estimateDate,   setEstimateDate]   = useState(today());
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const uploadSectionRef = useRef<HTMLDivElement>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError,   setReportError]   = useState("");
  const [reportWeekMonday, setReportWeekMonday] = useState(() => {
    const d = new Date(); const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day); return d.toISOString().split("T")[0];
  });

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
      isCoachUser(user.id).then(setIsCoach);
      getMyCoachEmail(user.id).then(setCoachEmail);
      const { data: p } = await supabase.from("profiles").select("prenom,poids,taille,age,sexe,objectifs,objectif_type,seances_par_semaine,experience,niveau_activite").eq("id", user.id).single();
      if (p) setProfile(p as Profile);

      const wRaw = localStorage.getItem(`weight_history_${user.id}`);
      const wh: WeightEntry[]  = wRaw ? JSON.parse(wRaw) : [];
      setWeightHist(wh);
      const bh = await loadBodyFatHistory(user.id);
      setBfHist(bh);
      loadBFPhotos(bh.map(e => e.id)).then(setBfPhotos);
      const lastWeight = wh[0]?.weight ?? (p as Profile | null)?.poids;
      if (lastWeight) setWeightInput(String(lastWeight));
      if (lastWeight) setCkWeight(String(lastWeight));

      // Dernier check-in envoyé
      const { data: ck } = await supabase.from("weekly_checkins")
        .select("week_date").eq("client_id", user.id).order("week_date", { ascending: false }).limit(1);
      if (ck?.[0]) setLastCkDate(ck[0].week_date);
    })();
  }, []);

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

  const alreadySelected = weightHist.some(e => e.date === selectedDate);
  const lastBF       = bfHist[0] ?? null;
  const daysSinceBF  = lastBF ? Math.floor((Date.now() - new Date(lastBF.date).getTime()) / 86400000) : null;
  const needsBF      = daysSinceBF === null || daysSinceBF >= 14;
  const photoCount   = Object.keys(photos).length;

  const downloadWeeklyReport = async () => {
    if (!userId) return;
    setReportLoading(true); setReportError("");
    try {
      const dates: string[] = [];
      const d = new Date(reportWeekMonday + "T12:00:00");
      for (let i = 0; i < 7; i++) { dates.push(d.toISOString().split("T")[0]); d.setDate(d.getDate() + 1); }
      const weekEnd = dates[6];

      // Semaine en cours non terminée : les jours à venir ne doivent ni compter comme
      // repos, ni fausser les moyennes (steps, NEAT/EAT, sessions). Pour une semaine déjà
      // passée, todayStr est après weekEnd donc tous les jours restent comptés normalement.
      const todayStr = new Date().toISOString().split("T")[0];
      const effectiveDates = dates.filter(dt => dt <= todayStr);
      const dayCount = effectiveDates.length || 1;

      // Rattrape les pas reçus via le Raccourci iPhone pour toute la semaine (écriture
      // serveur, jamais dans le localStorage de cet appareil) avant de calculer le bilan.
      await syncSteps(userId, effectiveDates);

      // Lu depuis le stockage local (même source que "Aliments du jour"), pas depuis la
      // synchro Supabase : celle-ci est différée/best-effort et peut prendre du retard sur
      // l'appareil du client, alors que le local reflète toujours exactement ce qu'il a logué.
      const dayTotals = effectiveDates.map(dt => {
        try {
          const raw = localStorage.getItem(`nutrition_${dt}`);
          const items: { calories?: number; proteines?: number; glucides?: number; lipides?: number }[] = raw ? JSON.parse(raw) : [];
          type Totals = { calories: number; proteines: number; glucides: number; lipides: number };
          return items.reduce<Totals>((acc, f) => ({
            calories:  acc.calories  + (f.calories  ?? 0),
            proteines: acc.proteines + (f.proteines ?? 0),
            glucides:  acc.glucides  + (f.glucides  ?? 0),
            lipides:   acc.lipides   + (f.lipides   ?? 0),
          }), { calories: 0, proteines: 0, glucides: 0, lipides: 0 });
        } catch { return { calories: 0, proteines: 0, glucides: 0, lipides: 0 }; }
      });
      const daysLogged   = dayTotals.filter(t => t.calories > 0).length;
      const avgCalories  = daysLogged ? Math.round(dayTotals.reduce((s, t) => s + t.calories,  0) / daysLogged) : 0;
      const avgProteines = daysLogged ? Math.round(dayTotals.reduce((s, t) => s + t.proteines, 0) / daysLogged) : 0;
      const avgGlucides  = daysLogged ? Math.round(dayTotals.reduce((s, t) => s + t.glucides,  0) / daysLogged) : 0;
      const avgLipides   = daysLogged ? Math.round(dayTotals.reduce((s, t) => s + t.lipides,   0) / daysLogged) : 0;

      const logs: { date: string; duration_minutes?: number; calories_burned?: number }[] =
        JSON.parse(localStorage.getItem("programme_logs") ?? "[]");
      const weekLogs = logs.filter(l => effectiveDates.includes((l.date || "").split("T")[0]));
      const sessionsCount         = weekLogs.length;
      const totalTrainingMinutes  = weekLogs.reduce((s, l) => s + (l.duration_minutes ?? 0), 0);
      const totalEat              = weekLogs.reduce((s, l) => s + (l.calories_burned ?? 0), 0);
      const trainedDates          = new Set(weekLogs.map(l => (l.date || "").split("T")[0]));
      const restDays              = effectiveDates.filter(dt => !trainedDates.has(dt)).length;
      const targetSessions        = profile?.seances_par_semaine ?? null;

      const totalSteps = effectiveDates.reduce((s, dt) => s + (parseInt(localStorage.getItem(`steps_${dt}`) ?? "0") || 0), 0);
      const avgSteps = Math.round(totalSteps / dayCount);
      const stepsGoal = parseInt(localStorage.getItem("steps_goal") ?? "10000") || 10000;

      const poidsRef = profile?.poids ?? weightHist[0]?.weight ?? 70;
      const avgNeatPerDay = Math.round((totalSteps / dayCount) * 0.04 * (poidsRef / 70));
      const avgEatPerDay  = Math.round(totalEat / dayCount);

      const bmrVal = (() => {
        if (!profile?.poids || !profile?.taille || !profile?.age) return 1800;
        if (lastBF) {
          const lbm = profile.poids * (1 - lastBF.body_fat / 100);
          return Math.round(370 + 21.6 * lbm);
        }
        const base = 10 * profile.poids + 6.25 * profile.taille - 5 * profile.age;
        return Math.round(profile.sexe === "Femme" ? base - 161 : base + 5);
      })();
      const avgTdee = bmrVal + avgNeatPerDay + avgEatPerDay;
      const balancePerDay = avgCalories - avgTdee;
      const balanceStatus: "deficit" | "surplus" | "maintenance" =
        Math.abs(balancePerDay) <= 100 ? "maintenance" : balancePerDay > 0 ? "surplus" : "deficit";

      // Détail jour par jour (mini visu + contexte pour la synthèse du coach) : même BMR
      // que la moyenne (poids/profil stables sur la semaine), NEAT/EAT propres à chaque jour.
      const dailyBreakdown = effectiveDates.map((dt, i) => {
        const steps = parseInt(localStorage.getItem(`steps_${dt}`) ?? "0") || 0;
        const neat  = Math.round(steps * 0.04 * (poidsRef / 70));
        const eat   = logs.filter(l => (l.date || "").split("T")[0] === dt).reduce((s, l) => s + (l.calories_burned ?? 0), 0);
        const tdee  = bmrVal + neat + eat;
        const calories = Math.round(dayTotals[i].calories);
        return { date: dt, calories, tdee, balance: calories - tdee };
      });

      const sortedByDateDesc = [...weightHist].sort((a, b) => b.date.localeCompare(a.date));
      const weightStart = sortedByDateDesc.find(w => w.date <= weekMonday)?.weight
        ?? sortedByDateDesc[sortedByDateDesc.length - 1]?.weight ?? null;
      const weightEnd = sortedByDateDesc.find(w => w.date <= weekEnd)?.weight ?? weightStart;

      let goalCalories = 2200, goalProteines = 150, goalGlucides = 220, goalLipides = 70;
      try {
        const g = JSON.parse(localStorage.getItem("nutrition_goals") ?? "{}");
        if (g?.calories)  goalCalories  = g.calories;
        if (g?.proteines) goalProteines = g.proteines;
        if (g?.glucides)  goalGlucides  = g.glucides;
        if (g?.lipides)   goalLipides   = g.lipides;
      } catch { /* défaut */ }

      const stats = {
        weekStart: reportWeekMonday, weekEnd, daysLogged, avgCalories, avgTdee, balanceStatus, balancePerDay,
        avgProteines, goalProteines, avgGlucides, goalGlucides, avgLipides, goalLipides, goalCalories,
        sessionsCount, totalTrainingMinutes, targetSessions, restDays, daysElapsed: dayCount,
        avgSteps, stepsGoal, weightStart, weightEnd, dailyBreakdown,
      };

      const res = await apiPost("/api/suivi/weekly-report", {
        stats: { ...stats, objectifs: profile?.objectifs ?? null, objectifType: profile?.objectif_type ?? null, experience: profile?.experience ?? null, niveauActivite: profile?.niveau_activite ?? null },
      });
      if (!res.ok) throw new Error(await res.text() || `Erreur ${res.status}`);
      const feedback = await res.json();
      if (feedback.error) throw new Error(feedback.error);

      sessionStorage.setItem("pending_weekly_report", JSON.stringify({
        ...stats,
        clientName: profile?.prenom,
        objectifs: profile?.objectifs ?? null,
        objectifType: profile?.objectif_type ?? null,
        synthese: feedback.synthese,
        nutrition: feedback.nutrition,
        neat: feedback.neat,
        eat: feedback.eat,
      }));
      router.push("/dashboard/suivi/bilan");
    } catch (e: unknown) {
      setReportError(e instanceof Error ? e.message : "Erreur lors de la génération du bilan.");
    }
    setReportLoading(false);
  };

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
    setEstimating(true); setError(""); setResult(null); setEstimateDate(today());
    setReportSent(false); setShowReportForm(false); setReportComment("");
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
      date: new Date((estimateDate || today()) + "T12:00:00").toISOString(),
      body_fat: result.body_fat_percentage,
      note: result.note,
      points_forts: result.points_forts,
      points_faibles: result.points_faibles,
      conseils: result.conseils,
      shared: shareWithCoach,
    };
    // L'écriture Supabase est attendue avant de mettre à jour l'état local : sinon un
    // refresh juste après l'enregistrement peut annuler la requête en vol, et l'entrée
    // n'existe jamais côté serveur alors qu'elle est brièvement visible à l'écran.
    if (userId) {
      const error = await upsertBodyFatRemote(userId, entry);
      if (error) { setError("Enregistrement impossible, réessaie."); return; }
    }
    const next = [entry, ...bfHist].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setBfHist(next);
    localStorage.setItem(`bodyfat_history_${userId}`, JSON.stringify(next));
    if (userId) {
      if (Object.keys(photos).length > 0) {
        uploadBFPhotos(userId, entryId, photos, shareWithCoach)
          .then(() => loadBFPhotos([entryId]))
          .then(urls => setBfPhotos(prev => ({ ...prev, ...urls })))
          .catch(() => { /* best-effort : l'estimation chiffrée reste sauvegardée même si l'upload échoue */ });
      }
    }

    if (shareWithCoach && userEmail && coachEmail) {
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
        to_email: coachEmail,
        content: `[BODYFAT_CHECK:${payload}]`,
      });
      setSharing(false);
    }

    setResult(null); setPhotos({}); setShowUpload(false); setShareWithCoach(false); setEstimateDate(today());
  };

  // Signalement d'une estimation qui semble fausse — envoyé à Samuel via l'Inbox,
  // avec les photos utilisées pour l'estimation (indépendant du check-in body_photos).
  const submitReport = async () => {
    if (!result || !reportComment.trim() || !userEmail || !coachEmail) return;
    setReportSending(true);
    const payload = JSON.stringify({
      estimated_bf: result.body_fat_percentage,
      comment: reportComment.trim(),
      photos: Object.values(photos),
    });
    await supabase.from("messages").insert({
      from_email: userEmail,
      to_email: coachEmail,
      content: `[BODYFAT_FEEDBACK:${payload}]`,
    });
    setReportSending(false); setReportSent(true); setShowReportForm(false); setReportComment("");
  };

  const saveManualBF = async () => {
    const val = parseFloat(manualVal.replace(",", "."));
    if (isNaN(val) || val <= 0 || val > 60) return;
    const dateStr = manualDate || today();
    const entry: BodyFatEntry = { id: Date.now().toString(), date: new Date(dateStr + "T12:00:00").toISOString(), body_fat: +val.toFixed(1), note: "Saisie manuelle" };
    if (userId) {
      const error = await upsertBodyFatRemote(userId, entry);
      if (error) { setError("Enregistrement impossible, réessaie."); return; }
    }
    const next = [entry, ...bfHist].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setBfHist(next);
    localStorage.setItem(`bodyfat_history_${userId}`, JSON.stringify(next));
    setManualVal(""); setManualDate(""); setShowManual(false);
  };

  // La suppression Supabase est attendue avant de mettre à jour l'état local : sinon un
  // refresh juste après le clic peut annuler la requête réseau en vol, et l'entrée "revient"
  // au chargement suivant alors qu'elle n'a en réalité jamais été supprimée côté serveur.
  const deleteBF = async (id: string) => {
    if (userId) {
      const error = await deleteBodyFatRemote(userId, id);
      if (error) { setError("Suppression impossible, réessaie."); return; }
      deleteBFPhotosRemote(userId, id);
    }
    const next = bfHist.filter(e => e.id !== id);
    setBfHist(next);
    localStorage.setItem(`bodyfat_history_${userId}`, JSON.stringify(next));
    setBfPhotos(prev => Object.fromEntries(Object.entries(prev).filter(([key]) => key !== id)));
  };

  const deleteWeight = (id: string) => {
    const next = weightHist.filter(e => e.id !== id);
    setWeightHist(next);
    localStorage.setItem(`weight_history_${userId}`, JSON.stringify(next));
  };

  const saveBFEdit = async (id: string) => {
    const val = parseFloat(editingBFVal.replace(",", "."));
    if (isNaN(val)) { setEditingBFId(null); return; }
    const next = bfHist.map(e => e.id === id ? { ...e, body_fat: +val.toFixed(1) } : e);
    if (userId) {
      const updated = next.find(e => e.id === id);
      if (updated) {
        const error = await upsertBodyFatRemote(userId, updated);
        if (error) { setError("Enregistrement impossible, réessaie."); setEditingBFId(null); return; }
      }
    }
    setBfHist(next); localStorage.setItem(`bodyfat_history_${userId}`, JSON.stringify(next));
    setEditingBFId(null);
  };

  const togglePhotoSharing = async (entryId: string, shared: boolean) => {
    if (!userId) return;
    const next = bfHist.map(e => e.id === entryId ? { ...e, shared } : e);
    const updated = next.find(e => e.id === entryId);
    if (updated) {
      const error = await upsertBodyFatRemote(userId, updated);
      if (error) { setError("Enregistrement impossible, réessaie."); return; }
    }
    setBfHist(next);
    localStorage.setItem(`bodyfat_history_${userId}`, JSON.stringify(next));
    void supabase.from("body_photos").update({ shared_with_coach: shared }).eq("session_id", entryId).eq("user_id", userId);
  };

  const saveBFEditDate = async (id: string, dateVal: string) => {
    if (!dateVal) { setEditingBFDate(null); return; }
    const next = bfHist.map(e => e.id === id ? { ...e, date: new Date(dateVal + "T12:00:00").toISOString() } : e)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (userId) {
      const updated = next.find(e => e.id === id);
      if (updated) {
        const error = await upsertBodyFatRemote(userId, updated);
        if (error) { setError("Enregistrement impossible, réessaie."); setEditingBFDate(null); return; }
      }
    }
    setBfHist(next); localStorage.setItem(`bodyfat_history_${userId}`, JSON.stringify(next));
    setEditingBFDate(null);
  };

  const bfChartData = [...bfHist].reverse().slice(-10);

  return (
    <div className="p-4 sm:p-8 max-w-2xl">

      {/* Header */}
      <div className="mb-6">
        <p className="text-[0.7rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-2">Rubrique</p>
        <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl sm:text-5xl text-[var(--t-text)] tracking-wide">SUIVI</h1>
      </div>

      {/* ── Check-in hebdomadaire (client → coach) ── */}
      {!isCoach && (
        <div className={`border rounded-xl mb-6 ${ckDoneThisWeek && !ckOpen ? "border-[#7eb8a0]/25 bg-[#7eb8a0]/5" : "border-[#c9a84c]/25 bg-[#c9a84c]/5"}`}>
          <button onClick={() => setCkOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-4 text-left">
            <div>
              <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-0.5">Check-in de la semaine</p>
              <p className="text-[0.7rem] text-[var(--t-text-35)] tracking-wider">
                {ckDoneThisWeek ? "✓ Envoyé à Samuel cette semaine — modifier" : "Fais ton point du dimanche : poids, énergie, adhérence"}
              </p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              className={`text-[var(--t-text-30)] shrink-0 transition-transform ${ckOpen ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {ckOpen && (
            <div className="px-5 pb-5 flex flex-col gap-4 border-t border-[var(--t-border-soft)] pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[0.7rem] tracking-[0.15em] uppercase text-[var(--t-text-40)] block mb-1.5">Poids (kg)</label>
                  <input type="number" inputMode="decimal" step="0.1" value={ckWeight} onChange={e => setCkWeight(e.target.value)}
                    className="w-full bg-[var(--t-bg)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] text-base px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40" placeholder="78.0"/>
                </div>
              </div>
              <div>
                <label className="text-[0.7rem] tracking-[0.15em] uppercase text-[var(--t-text-40)] block mb-1.5">Énergie / forme — 1 faible · 5 top</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setCkEnergy(n)}
                      className={`flex-1 h-10 rounded-xl border text-sm font-bold transition-all ${ckEnergy >= n ? "bg-[#7eb8a0] border-[#7eb8a0] text-black" : "border-[var(--t-border-15)] text-[var(--t-text-25)]"}`}>{n}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[0.7rem] tracking-[0.15em] uppercase text-[var(--t-text-40)] block mb-1.5">Adhérence au plan — 1 difficile · 5 parfaite</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setCkComp(n)}
                      className={`flex-1 h-10 rounded-xl border text-sm font-bold transition-all ${ckComp >= n ? "bg-[#c9a84c] border-[#c9a84c] text-black" : "border-[var(--t-border-15)] text-[var(--t-text-25)]"}`}>{n}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[0.7rem] tracking-[0.15em] uppercase text-[var(--t-text-40)] block mb-1.5">Un mot pour Samuel</label>
                <textarea rows={3} value={ckNotes} onChange={e => setCkNotes(e.target.value)}
                  placeholder="Comment s'est passée ta semaine ? Difficultés, victoires, douleurs…"
                  className="w-full bg-[var(--t-bg)] border border-[var(--t-border)] rounded-xl text-[var(--t-text-80)] text-sm px-3 py-2.5 resize-none focus:outline-none focus:border-[#c9a84c]/40"/>
              </div>
              {ckDone ? (
                <div className="text-center py-2 text-[#7eb8a0] text-sm tracking-wider">Check-in envoyé ✓</div>
              ) : (
                <button onClick={sendCheckin} disabled={ckSaving}
                  className="bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.7rem] font-bold tracking-[0.2em] uppercase py-3 shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 rounded-xl disabled:opacity-40">
                  {ckSaving ? "Envoi…" : "Envoyer mon check-in à Samuel →"}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Bilan hebdomadaire PDF ── */}
      <div className="border border-[var(--t-border)] bg-[var(--t-surface)] rounded-xl overflow-hidden mb-4">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/25 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/><path d="M9 13h6"/><path d="M9 17h6"/>
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c]">Bilan de la semaine</p>
              <p className="text-[0.6rem] text-[var(--t-text-25)] mt-0.5 tracking-wider">
                Nutrition, entraînement, repos et déficit/surplus
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { const d = new Date(reportWeekMonday + "T12:00:00"); d.setDate(d.getDate() - 7); setReportWeekMonday(d.toISOString().split("T")[0]); }}
              className="w-9 h-9 rounded-full border border-[var(--t-border)] bg-[var(--t-surface-2)] text-[var(--t-text-50)] hover:text-[var(--t-text-80)] hover:border-[var(--t-text-25)] transition-colors flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <p className="flex-1 text-center text-[0.65rem] tracking-[0.12em] uppercase text-[var(--t-text-40)] border border-[var(--t-border)] bg-[var(--t-surface-2)] rounded-full py-2 px-3">
              {new Date(reportWeekMonday + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
              {" — "}
              {(() => { const d = new Date(reportWeekMonday + "T12:00:00"); d.setDate(d.getDate() + 6); return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }); })()}
            </p>
            <button
              onClick={() => { const d = new Date(reportWeekMonday + "T12:00:00"); d.setDate(d.getDate() + 7); const next = d.toISOString().split("T")[0]; if (next <= weekMonday) setReportWeekMonday(next); }}
              disabled={reportWeekMonday === weekMonday}
              className="w-9 h-9 rounded-full border border-[var(--t-border)] bg-[var(--t-surface-2)] text-[var(--t-text-50)] hover:text-[var(--t-text-80)] hover:border-[var(--t-text-25)] transition-colors flex items-center justify-center shrink-0 disabled:opacity-20 disabled:cursor-not-allowed">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            {reportWeekMonday !== weekMonday && (
              <button onClick={() => setReportWeekMonday(weekMonday)}
                className="text-[0.62rem] tracking-[0.12em] uppercase text-[#c9a84c] rounded-full border border-[#c9a84c]/30 px-3 py-2 hover:bg-[#c9a84c]/10 transition-colors shrink-0">
                Actuelle
              </button>
            )}
          </div>
        </div>

        <button onClick={downloadWeeklyReport} disabled={reportLoading}
          className="w-full bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.72rem] font-bold tracking-[0.2em] uppercase py-4 shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2">
          {reportLoading
            ? <><div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"/>Préparation…</>
            : "Voir le bilan PDF →"}
        </button>
      </div>
      {reportError && <p className="text-xs text-[#e07070] rounded-xl border border-[#e07070]/20 bg-[#e07070]/5 px-3 py-2 mb-4">{reportError}</p>}

      <DateNav date={selectedDate} onChange={setSelectedDate} />

      {/* ── Pesée ── */}
      <div className={`rounded-xl border p-4 mb-4 flex items-center gap-4 ${alreadySelected ? "border-[var(--t-border-soft)] bg-[var(--t-surface-2)]" : "border-[#c9a84c]/25 bg-[#c9a84c]/5"}`}>
        <img src={BALANCE_ICON} alt="" width={34} height={34} className="shrink-0"/>
        <div className="flex-1 min-w-0">
          <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-0.5">
            {selectedDate === today() ? "Pesée du jour" : `Pesée · ${new Date(selectedDate + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`}
          </p>
          {alreadySelected && (
            <p className="text-[0.65rem] text-[var(--t-text-30)] tracking-wider">Enregistrée — {weightHist.find(e => e.date === selectedDate)?.weight} kg</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-[var(--t-bg)] border border-[var(--t-border)] rounded-full pl-3 pr-2.5 py-1.5 focus-within:border-[#c9a84c]/40 transition-colors">
            <input type="number" min="20" max="300" step="0.1" value={weightInput}
              onChange={e => setWeightInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") saveWeight(); }}
              className="w-12 bg-transparent text-[var(--t-text)] text-sm text-center focus:outline-none"
              placeholder="70.0"/>
            <span className="text-[var(--t-text-25)] text-[0.62rem]">kg</span>
          </div>
          <button onClick={saveWeight} disabled={weightSaving || !weightInput}
            aria-label={alreadySelected ? "Mettre à jour la pesée" : "Enregistrer la pesée"}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0 disabled:opacity-30 ${
              weightSaved ? "bg-[#7eb8a0] text-black" : "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black hover:brightness-110"
            }`}>
            {weightSaved ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            ) : alreadySelected ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Body fat — rappel ── */}
      {needsBF && (
        <div className="border border-[#c9a84c]/30 bg-[#c9a84c]/5 rounded-xl px-5 py-3 mb-4 flex items-center justify-between">
          <div>
            <p className="text-[0.7rem] tracking-[0.15em] uppercase text-[#c9a84c] font-bold">
              {daysSinceBF === null ? "Premier check-in body fat" : `Check-in body fat · ${daysSinceBF}j depuis le dernier`}
            </p>
            <p className="text-[0.62rem] text-[var(--t-text-30)] mt-0.5 tracking-wider">Recommandé toutes les 2 semaines</p>
          </div>
          <button onClick={() => { setShowUpload(true); setShowManual(false); }}
            className="bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.68rem] font-bold tracking-[0.15em] uppercase px-4 py-2 shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 rounded-xl shrink-0 ml-4">
            Estimer →
          </button>
        </div>
      )}

      {/* ── Carte Body fat + explication ── */}
      <div className={`border rounded-xl mb-4 ${!needsBF ? "border-[var(--t-border)] bg-[var(--t-surface)]" : "border-[var(--t-border-soft)] bg-[var(--t-surface-2)]"}`}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c]">Body fat actuel</p>
            {!needsBF && daysSinceBF !== null && (
              <span className="text-[0.62rem] text-[var(--t-text-20)] tracking-wider">Prochain dans {14 - daysSinceBF}j</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            {lastBF ? (
              <div className="flex items-baseline gap-2">
                <span style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl text-[var(--t-text)] tracking-wide leading-none">{lastBF.body_fat}</span>
                <span className="text-[var(--t-text-40)] text-sm">%</span>
              </div>
            ) : (
              <p className="text-[var(--t-text-30)] text-xs">Aucune estimation</p>
            )}
            <div className="flex gap-1.5 shrink-0">
              <button onClick={() => { setShowManual(v => !v); setShowUpload(false); setManualVal(""); setManualDate(selectedDate); }}
                className="border border-[var(--t-border)] text-[var(--t-text-30)] text-[0.62rem] tracking-[0.1em] uppercase px-3 py-2 rounded-xl hover:border-[var(--t-text-20)] hover:text-[var(--t-text-50)] transition-colors whitespace-nowrap">
                {showManual ? "Annuler" : "Manuel"}
              </button>
              {!needsBF && (
                <button onClick={() => { setShowUpload(v => !v); setShowManual(false); setResult(null); setError(""); }}
                  className="border border-[var(--t-border)] text-[var(--t-text-30)] text-[0.62rem] tracking-[0.1em] uppercase px-3 py-2 rounded-xl hover:border-[var(--t-text-20)] hover:text-[var(--t-text-50)] transition-colors whitespace-nowrap">
                  {showUpload ? "Annuler" : "Estimer IA"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Encadré explicatif */}
        <button onClick={() => setShowBFInfo(v => !v)}
          className="w-full flex items-center justify-between gap-2 border-t border-[var(--t-border-soft)] px-5 py-3 hover:bg-[var(--t-bg)]/40 transition-colors">
          <span className="text-[0.62rem] tracking-[0.12em] uppercase text-[var(--t-text-30)]">Pourquoi suivre le body fat plutôt que le poids ?</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            className={`text-[var(--t-text-25)] shrink-0 transition-transform duration-300 ${showBFInfo ? "rotate-180" : ""}`}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${showBFInfo ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
          <div className="overflow-hidden">
            <div className="px-5 pb-5 pt-1 bg-[var(--t-bg)]/60 flex flex-col gap-2.5">
              <p className="text-[0.65rem] text-[var(--t-text-35)] leading-relaxed">
                Ta balance ne te dit qu&apos;un chiffre : ton poids total. Mais deux personnes qui pèsent 70 kg peuvent avoir un corps complètement différent — l&apos;une avec plus de muscle, l&apos;autre avec plus de gras. Résultat : leur corps ne brûle pas les mêmes calories au quotidien, même à poids égal.
              </p>
              <p className="text-[0.65rem] text-[var(--t-text-35)] leading-relaxed">
                En connaissant ton taux de masse grasse, on peut calculer précisément combien de calories ton corps brûle au repos (ton métabolisme de base) — de façon bien plus juste qu&apos;avec le poids seul.
              </p>
              <p className="text-[0.65rem] text-[var(--t-text-35)] leading-relaxed">
                C&apos;est aussi le meilleur moyen de savoir si tu progresses vraiment. Si tu perds du gras et prends du muscle en même temps, ton poids sur la balance peut rester identique... alors que ton corps change complètement. En suivant ton taux de masse grasse toutes les 2 semaines, tu vois ta vraie évolution même quand le chiffre sur la balance ne bouge pas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Saisie manuelle BF */}
      {showManual && (
        <div className="border border-[var(--t-border)] bg-[var(--t-surface)] rounded-xl p-5 mb-4 flex items-center gap-3">
          <div className="flex flex-col gap-1 shrink-0">
            <p className="text-[0.65rem] tracking-[0.15em] uppercase text-[var(--t-text-25)]">Body fat %</p>
            <input type="number" min="1" max="60" step="0.1" placeholder="18.5" autoFocus
              className="w-24 bg-[var(--t-bg)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] text-sm px-3 py-2 focus:outline-none focus:border-[#c9a84c]/40 placeholder-[var(--t-text-15)]"
              value={manualVal} onChange={e => setManualVal(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") saveManualBF(); if (e.key === "Escape") setShowManual(false); }}
            />
          </div>
          <div className="flex flex-col gap-1 flex-1 relative">
            <p className="text-[0.65rem] tracking-[0.15em] uppercase text-[var(--t-text-25)]">Date</p>
            <button type="button" onClick={() => setShowManualDatePicker(o => !o)}
              className="w-full text-left bg-[var(--t-bg)] border border-[var(--t-border)] rounded-xl text-[var(--t-text-60)] text-sm px-3 py-2 hover:border-[#c9a84c]/40 transition-colors">
              {new Date((manualDate || selectedDate) + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </button>
            {showManualDatePicker && (
              <CalendarPicker value={manualDate || selectedDate} max={today()}
                onChange={setManualDate} onClose={() => setShowManualDatePicker(false)}
                className="top-full left-0 mt-2"/>
            )}
          </div>
          <button onClick={saveManualBF}
            className="bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.7rem] font-bold tracking-[0.15em] uppercase px-5 py-2.5 shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 rounded-xl shrink-0 self-end">
            Enregistrer →
          </button>
        </div>
      )}

      {/* Upload & IA */}
      {showUpload && (
        <div ref={uploadSectionRef} className="border border-[var(--t-border)] bg-[var(--t-surface)] rounded-xl p-5 mb-4 scroll-mt-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c]">Photos corporelles</p>
            <span className="text-[0.62rem] text-[var(--t-text-20)] tracking-wider">Conservées dans ton historique privé</span>
          </div>
          <p className="text-[0.65rem] text-[var(--t-text-20)] mb-5 tracking-wider">Plus il y a de photos, plus l'estimation est précise</p>

          <div className="grid grid-cols-5 gap-2 mb-5">
            {SLOTS.map(slot => (
              <div key={slot.key} className="flex flex-col items-center gap-1.5">
                <button onClick={() => fileRefs.current[slot.key]?.click()}
                  className={`w-full aspect-[3/4] rounded-xl border flex items-center justify-center relative overflow-hidden transition-colors ${photos[slot.key] ? "border-[#7eb8a0]/40" : "border-[var(--t-border)] hover:border-[var(--t-text-25)]"}`}>
                  {photos[slot.key] ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photos[slot.key]} alt={slot.label} className="absolute inset-0 w-full h-full object-cover"/>
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                      </div>
                    </>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-[var(--t-text-15)]"><path d="M12 5v14M5 12h14"/></svg>
                  )}
                </button>
                <span className="text-[0.6rem] tracking-wider text-[var(--t-text-20)] text-center uppercase leading-tight">{slot.label}</span>
                <input type="file" accept="image/*" className="hidden"
                  ref={el => { fileRefs.current[slot.key] = el; }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleSelect(slot.key, f); }}
                />
              </div>
            ))}
          </div>

          {error && <p className="text-xs text-[#e07070] rounded-xl border border-[#e07070]/20 bg-[#e07070]/5 px-3 py-2 mb-4">{error}</p>}

          {result ? (
            <div className="flex flex-col gap-3">
              {/* Résultat IA */}
              <div className="border border-[#c9a84c]/20 bg-[#c9a84c]/5 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[0.65rem] tracking-[0.15em] uppercase text-[#c9a84c] mb-1">Estimation IA</p>
                  <p className="text-[0.65rem] text-[var(--t-text-40)] italic leading-relaxed">{result.note}</p>
                </div>
                <div className="text-right ml-4 shrink-0">
                  <p style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl text-[var(--t-text)] tracking-wide leading-none">{result.body_fat_percentage}</p>
                  <p className="text-[0.62rem] tracking-[0.15em] uppercase text-[var(--t-text-30)]">% body fat</p>
                </div>
              </div>

              {/* Feedback IA */}
              {(result.points_forts || result.points_faibles || result.conseils) && (
                <div className="border border-[var(--t-border)] bg-[var(--t-bg)] rounded-xl divide-y divide-[var(--t-border-soft)]">
                  {result.points_forts   && <FeedbackRow color="#7eb8a0" label="Points forts"  text={result.points_forts}/>}
                  {result.points_faibles && <FeedbackRow color="#e07070" label="À travailler"  text={result.points_faibles}/>}
                  {result.conseils       && <FeedbackRow color="#c9a84c" label="Conseils"       text={result.conseils}/>}
                </div>
              )}

              {/* Date du check-in : par défaut aujourd'hui, modifiable si les photos ont été
                  prises un autre jour (ex : upload différé). */}
              <div className="relative border border-[var(--t-text-8)] bg-[var(--t-surface-2)] rounded-xl px-4 py-3 flex items-center justify-between">
                <p className="text-[0.7rem] tracking-[0.1em] uppercase text-[var(--t-text-50)]">Date du check-in</p>
                <button type="button" onClick={() => setShowEstimateDatePicker(o => !o)}
                  className="bg-[var(--t-bg)] border border-[var(--t-border)] text-[var(--t-text-70)] text-[0.7rem] px-2.5 py-1.5 rounded hover:border-[#c9a84c]/40 transition-colors">
                  {new Date(estimateDate + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </button>
                {showEstimateDatePicker && (
                  <CalendarPicker value={estimateDate} max={today()}
                    onChange={setEstimateDate} onClose={() => setShowEstimateDatePicker(false)}
                    className="top-full right-0 mt-2"/>
                )}
              </div>

              {/* Toggle partage coach */}
              <div className="border border-[var(--t-text-8)] bg-[var(--t-surface-2)] rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[0.7rem] tracking-[0.1em] uppercase text-[var(--t-text-50)]">Partager avec Samuel</p>
                  <p className="text-[0.62rem] text-[var(--t-text-25)] mt-0.5">
                    {shareWithCoach
                      ? "L'estimation, le feedback IA et les photos seront visibles par ton coach"
                      : "Tes photos sont conservées dans ton historique privé ; coche pour les rendre aussi visibles par ton coach"}
                  </p>
                </div>
                <button onClick={() => setShareWithCoach(v => !v)}
                  className={`w-10 h-5.5 rounded-full transition-all relative shrink-0 ml-4 ${shareWithCoach ? "bg-[#c9a84c]" : "bg-[var(--t-border)]"}`}
                  style={{ minWidth: 40, height: 22 }}>
                  <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-white transition-transform ${shareWithCoach ? "translate-x-[20px]" : "translate-x-[3px]"}`}
                    style={{ display: "block" }}/>
                </button>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setResult(null)}
                  className="flex-1 border border-[var(--t-border)] text-[var(--t-text-40)] rounded-xl text-[0.65rem] tracking-[0.15em] uppercase py-2.5 hover:border-[var(--t-text-20)] hover:text-[var(--t-text-60)] transition-colors">
                  Ré-estimer
                </button>
                <button onClick={saveBFEntry} disabled={sharing}
                  className="flex-1 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.7rem] font-bold tracking-[0.2em] uppercase py-2.5 shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 rounded-xl disabled:opacity-50">
                  {sharing ? "Envoi…" : shareWithCoach ? "Enregistrer & partager →" : "Enregistrer →"}
                </button>
              </div>

              {/* Signalement d'une estimation qui semble fausse — envoie les photos à Samuel
                  via un message dédié, séparément du check-in enregistré ci-dessus. */}
              {!isCoach && !reportSent && (
                showReportForm ? (
                  <div className="border border-[var(--t-border)] bg-[var(--t-bg)] rounded-xl p-4 flex flex-col gap-3">
                    <p className="text-[0.62rem] text-[var(--t-text-40)] leading-relaxed">
                      Décris ce qui te semble incorrect. Tes photos seront envoyées à Samuel avec ton message pour l&apos;aider à améliorer l&apos;IA.
                    </p>
                    <textarea className="w-full bg-[var(--t-surface-2)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors resize-none" rows={3}
                      placeholder="Ex : le % me semble beaucoup trop élevé, je m'entraîne depuis 2 ans et je suis plutôt sec..."
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
          ) : (
            <button onClick={estimate} disabled={photoCount === 0 || estimating}
              className="w-full bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.7rem] font-bold tracking-[0.2em] uppercase py-3.5 shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {estimating
                ? <><div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"/>Analyse en cours…</>
                : `Estimer avec l'IA · ${photoCount}/5 photo${photoCount > 1 ? "s" : ""} →`}
            </button>
          )}
        </div>
      )}

      {/* ── Graphique évolution body fat ── */}
      {bfChartData.length > 1 && (
        <div className="border border-[var(--t-border)] bg-[var(--t-surface)] rounded-xl p-4 mb-4">
          <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-3">Évolution body fat</p>
          <LineChart data={bfChartData.map(e => ({ id: e.id, date: e.date, val: e.body_fat }))} unit="%" color="#c9a84c" glow/>
        </div>
      )}

      {/* ── Historique body fat avec feedback ── */}
      {bfHist.length > 0 && (
        <div className="mb-4">
          <p style={{ fontFamily: "var(--font-bebas)" }} className="text-sm tracking-wider text-[var(--t-text)] mb-3 px-0.5">Historique body fat</p>
          <div className="space-y-3">
            {bfHist.map((entry, i) => {
              const prev = bfHist[i + 1];
              const diff = prev ? +(entry.body_fat - prev.body_fat).toFixed(1) : null;
              const hasFeedback = entry.points_forts || entry.points_faibles || entry.conseils;
              const entryPhotos = bfPhotos[entry.id] ?? [];
              return (
                <div key={entry.id} className="border border-[var(--t-border)] bg-[var(--t-surface)] rounded-2xl overflow-hidden">
                  {/* Photos du check-in : évolution visuelle, en grand */}
                  {entryPhotos.length > 0 && (
                    <div className="flex gap-1.5 p-2 overflow-x-auto snap-x snap-mandatory">
                      {entryPhotos.map((url, pi) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={pi} src={url} alt="" onClick={() => setViewingPhoto(url)}
                          className="h-36 sm:h-44 aspect-[3/4] object-cover rounded-xl border border-[var(--t-border)] cursor-pointer hover:border-[#c9a84c]/40 hover:opacity-90 transition-all shrink-0 snap-start"/>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex-1 min-w-0 relative">
                      {editingBFDate === entry.id ? (
                        <>
                          <button type="button"
                            className="bg-[var(--t-bg)] border border-[#c9a84c]/40 rounded-xl text-[#c9a84c] text-[0.7rem] px-2 py-1 mb-0.5">
                            {new Date(entry.date.split("T")[0] + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                          </button>
                          <CalendarPicker value={entry.date.split("T")[0]} max={today()}
                            onChange={val => saveBFEditDate(entry.id, val)}
                            onClose={() => setEditingBFDate(null)}
                            className="top-full left-0 mt-1"/>
                        </>
                      ) : (
                        <p className="text-[0.65rem] tracking-wider text-[var(--t-text-40)] capitalize cursor-pointer hover:text-[var(--t-text-60)] transition-colors"
                          onClick={() => setEditingBFDate(entry.id)}>
                          {new Date(entry.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[0.6rem] text-[var(--t-text-20)] italic truncate">{entry.note}</p>
                        <button
                          onClick={() => togglePhotoSharing(entry.id, !entry.shared)}
                          className={`text-[0.6rem] tracking-wider uppercase border px-1.5 py-px transition-colors shrink-0 ${
                            entry.shared
                              ? "text-[#c9a84c]/60 border-[#c9a84c]/25 hover:text-[#e07070]/50 hover:border-[#e07070]/20"
                              : "text-[var(--t-text-15)] border-[var(--t-text-8)] hover:text-[#c9a84c]/40 hover:border-[#c9a84c]/20"
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
                            className="w-16 bg-[var(--t-bg)] border border-[#c9a84c]/40 rounded-xl text-[#c9a84c] text-center text-sm py-0.5 focus:outline-none"
                            value={editingBFVal} onChange={e => setEditingBFVal(e.target.value)}
                            onBlur={() => saveBFEdit(entry.id)}
                            onKeyDown={e => { if (e.key === "Enter") saveBFEdit(entry.id); if (e.key === "Escape") setEditingBFId(null); }}
                          />
                        ) : (
                          <div className="flex items-baseline gap-1 justify-end cursor-pointer"
                            onClick={() => { setEditingBFId(entry.id); setEditingBFVal(entry.body_fat.toString()); }}>
                            <span style={{ fontFamily: "var(--font-bebas)" }} className={`text-2xl tracking-wide leading-none ${i === 0 ? "text-[var(--t-text)]" : "text-[var(--t-text-40)]"}`}>{entry.body_fat}</span>
                            <span className="text-[0.62rem] text-[var(--t-text-25)]">%</span>
                          </div>
                        )}
                        {diff !== null && editingBFId !== entry.id && (
                          <span className={`text-[0.6rem] tracking-wider ${diff < 0 ? "text-[#7eb8a0]" : diff > 0 ? "text-[#e07070]" : "text-[var(--t-text-20)]"}`}>
                            {diff < 0 ? "▼" : diff > 0 ? "▲" : "—"}{Math.abs(diff)}%
                          </span>
                        )}
                      </div>
                      <button onClick={() => deleteBF(entry.id)} className="text-[var(--t-text-15)] hover:text-[#e07070] transition-colors">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </div>

                  {/* Feedback IA sauvegardé */}
                  {hasFeedback && (
                    <div className="mx-5 mb-4 rounded-xl overflow-hidden border border-[var(--t-border-soft)] bg-[var(--t-bg)] divide-y divide-[var(--t-border-soft)]">
                      {entry.points_forts   && <FeedbackRow color="#7eb8a0" label="Points forts" text={entry.points_forts}/>}
                      {entry.points_faibles && <FeedbackRow color="#e07070" label="À travailler" text={entry.points_faibles}/>}
                      {entry.conseils       && <FeedbackRow color="#c9a84c" label="Conseils"      text={entry.conseils}/>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Historique poids ── */}
      {weightHist.length > 1 && (
        <div className="border border-[var(--t-border)] bg-[var(--t-surface)] rounded-xl">
          <button onClick={() => setWeightHistOpen(v => !v)}
            className="w-full text-left flex items-center justify-between px-5 py-3 hover:bg-[var(--t-glass-bg)] transition-colors">
            <p style={{ fontFamily: "var(--font-bebas)" }} className="text-sm tracking-wider text-[var(--t-text)]">Historique pesées</p>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              className={`text-[var(--t-text-25)] shrink-0 transition-transform ${weightHistOpen ? "rotate-180" : ""}`}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {weightHistOpen && (
            <div className="border-t border-[var(--t-border-soft)]">
              {weightHist.slice(0, 10).map((entry, i) => {
                const prev = weightHist[i + 1];
                const diff = prev ? +(entry.weight - prev.weight).toFixed(1) : null;
                return (
                  <div key={entry.id} className="flex items-center justify-between px-5 py-3 border-b border-[var(--t-border-soft)] last:border-0">
                    <p className="text-[0.65rem] text-[var(--t-text-40)] capitalize">
                      {new Date(entry.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                    </p>
                    <div className="flex items-center gap-3">
                      {diff !== null && (
                        <span className={`text-[0.6rem] tracking-wider ${diff < 0 ? "text-[#7eb8a0]" : diff > 0 ? "text-[#e07070]" : "text-[var(--t-text-20)]"}`}>
                          {diff > 0 ? "+" : ""}{diff} kg
                        </span>
                      )}
                      <span className={`text-sm font-medium ${i === 0 ? "text-[var(--t-text)]" : "text-[var(--t-text-40)]"}`}>{entry.weight} kg</span>
                      <button onClick={() => deleteWeight(entry.id)} className="text-[var(--t-text-15)] hover:text-[#e07070] transition-colors">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Visionneuse plein écran pour les photos de check-in */}
      {viewingPhoto && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setViewingPhoto(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={viewingPhoto} alt="" className="max-w-full max-h-full object-contain"/>
          <button onClick={() => setViewingPhoto(null)} className="absolute top-4 right-4 text-[var(--t-text-60)] hover:text-[var(--t-text)] transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}

    </div>
  );
}
