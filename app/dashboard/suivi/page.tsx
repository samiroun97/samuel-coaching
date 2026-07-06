"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

type Profile = { sexe?: string; poids?: number; taille?: number; age?: number };

type BodyFatEntry = {
  id: string;
  date: string;
  body_fat: number;
  note: string;
};

const SLOTS = [
  { key: "face",          label: "Face" },
  { key: "dos",           label: "Dos" },
  { key: "profil",        label: "Profil" },
  { key: "jambe_avant",   label: "Jambe avant" },
  { key: "jambe_arriere", label: "Jambe arrière" },
];

const HISTORY_KEY = "bodyfat_history";

const resizeImage = (dataUrl: string, maxW = 900, maxH = 1400): Promise<string> =>
  new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxW || height > maxH) {
        const scale = Math.min(maxW / width, maxH / height);
        width = Math.floor(width * scale);
        height = Math.floor(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.src = dataUrl;
  });

export default function SuiviPage() {
  const [profile,    setProfile]    = useState<Profile | null>(null);
  const [history,    setHistory]    = useState<BodyFatEntry[]>([]);
  const [photos,     setPhotos]     = useState<Record<string, string>>({});
  const [estimating, setEstimating] = useState(false);
  const [result,     setResult]     = useState<{ body_fat_percentage: number; note: string } | null>(null);
  const [error,      setError]      = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from("profiles").select("poids,taille,age,sexe").eq("id", user.id).single();
      if (p) setProfile(p as Profile);
    })();
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const lastEntry     = history[0] ?? null;
  const daysSinceLast = lastEntry
    ? Math.floor((Date.now() - new Date(lastEntry.date).getTime()) / 86400000)
    : null;
  const needsEstimation = daysSinceLast === null || daysSinceLast >= 14;
  const photoCount    = Object.keys(photos).length;

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
      const res = await fetch("/api/suivi/bodyfat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: Object.values(photos), profile }),
      });
      if (!res.ok) { const t = await res.text(); throw new Error(t || `Erreur ${res.status}`); }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
    setEstimating(false);
  };

  const saveEntry = () => {
    if (!result) return;
    const entry: BodyFatEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      body_fat: result.body_fat_percentage,
      note: result.note,
    };
    const next = [entry, ...history];
    setHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    setResult(null); setPhotos({}); setShowUpload(false);
  };

  const deleteEntry = (id: string) => {
    const next = history.filter(e => e.id !== id);
    setHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  };

  const chartData = [...history].reverse().slice(-10);

  return (
    <div className="p-8 max-w-2xl">

      {/* ── Header ── */}
      <div className="mb-10">
        <p className="text-[0.55rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-2">Rubrique</p>
        <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-5xl text-white tracking-wide">SUIVI</h1>
        <p className="text-white/30 text-xs mt-1 capitalize">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* ── Status card ── */}
      <div className={`border p-5 mb-6 flex items-center justify-between ${needsEstimation ? "border-[#c9a84c]/30 bg-[#c9a84c]/5" : "border-white/10 bg-[#111]"}`}>
        <div>
          <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-1.5">Body fat actuel</p>
          {lastEntry ? (
            <div className="flex items-baseline gap-2">
              <span style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl text-white tracking-wide leading-none">{lastEntry.body_fat}</span>
              <span className="text-white/40 text-sm">%</span>
            </div>
          ) : (
            <p className="text-white/30 text-xs">Aucune estimation</p>
          )}
          {daysSinceLast !== null && (
            <p className="text-[0.45rem] text-white/20 mt-1.5 tracking-wider">
              {needsEstimation
                ? `Dernière estimation il y a ${daysSinceLast} jours · nouvelle estimation disponible`
                : `Prochaine estimation dans ${14 - daysSinceLast} jours`}
            </p>
          )}
          {daysSinceLast === null && (
            <p className="text-[0.45rem] text-white/20 mt-1.5 tracking-wider">Fais ta première estimation ci-contre</p>
          )}
        </div>
        <button
          onClick={() => { setShowUpload(v => !v); setResult(null); setError(""); }}
          className={`text-[0.6rem] font-bold tracking-[0.15em] uppercase px-5 py-3 transition-colors flex-shrink-0 ml-4 ${
            needsEstimation
              ? "bg-[#c9a84c] text-black hover:bg-[#e2c97e]"
              : "border border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
          }`}>
          {showUpload ? "Annuler" : needsEstimation ? "Nouvelle estimation →" : "Estimer quand même"}
        </button>
      </div>

      {/* ── Upload & Estimation ── */}
      {showUpload && (
        <div className="border border-white/10 bg-[#111] p-5 mb-6">
          <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-1">Photos corporelles</p>
          <p className="text-[0.5rem] text-white/20 mb-5 tracking-wider">
            Aucun champ obligatoire · plus il y a de photos, plus l&apos;estimation est précise
          </p>

          <div className="grid grid-cols-5 gap-2 mb-5">
            {SLOTS.map(slot => (
              <div key={slot.key} className="flex flex-col items-center gap-1.5">
                <button
                  onClick={() => fileRefs.current[slot.key]?.click()}
                  className={`w-full aspect-[3/4] border flex items-center justify-center relative overflow-hidden transition-colors ${
                    photos[slot.key] ? "border-[#7eb8a0]/40" : "border-white/10 hover:border-white/25"
                  }`}>
                  {photos[slot.key] ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photos[slot.key]} alt={slot.label} className="absolute inset-0 w-full h-full object-cover"/>
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                      </div>
                    </>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-white/15">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                  )}
                </button>
                <span className="text-[0.38rem] tracking-wider text-white/20 text-center uppercase leading-tight">{slot.label}</span>
                <input
                  type="file" accept="image/*" className="hidden"
                  ref={el => { fileRefs.current[slot.key] = el; }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleSelect(slot.key, f); }}
                />
              </div>
            ))}
          </div>

          {error && (
            <p className="text-xs text-[#e07070] border border-[#e07070]/20 bg-[#e07070]/5 px-3 py-2 mb-4">{error}</p>
          )}

          {result ? (
            <div className="flex flex-col gap-3">
              <div className="border border-[#c9a84c]/20 bg-[#c9a84c]/5 p-4 flex items-center justify-between">
                <div>
                  <p className="text-[0.5rem] tracking-[0.15em] uppercase text-[#c9a84c] mb-1">Estimation IA</p>
                  <p className="text-[0.55rem] text-white/40 italic max-w-xs leading-relaxed">{result.note}</p>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <p style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl text-white tracking-wide leading-none">{result.body_fat_percentage}</p>
                  <p className="text-[0.45rem] tracking-[0.15em] uppercase text-white/30">% body fat</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setResult(null)}
                  className="flex-1 border border-white/10 text-white/40 text-[0.55rem] tracking-[0.15em] uppercase py-2.5 hover:border-white/20 hover:text-white/60 transition-colors">
                  Ré-estimer
                </button>
                <button onClick={saveEntry}
                  className="flex-1 bg-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.2em] uppercase py-2.5 hover:bg-[#e2c97e] transition-colors">
                  Enregistrer →
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={estimate}
              disabled={photoCount === 0 || estimating}
              className="w-full bg-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.2em] uppercase py-3.5 hover:bg-[#e2c97e] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {estimating
                ? <><div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"/>Analyse en cours…</>
                : `Estimer avec l'IA · ${photoCount}/5 photo${photoCount > 1 ? "s" : ""} →`}
            </button>
          )}
        </div>
      )}

      {/* ── Graphique ── */}
      {chartData.length > 1 && (
        <div className="border border-white/10 bg-[#111] p-5 mb-6">
          <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-4">Évolution body fat</p>
          <BodyFatChart data={chartData} />
        </div>
      )}

      {/* ── Historique ── */}
      {history.length > 0 && (
        <div className="border border-white/10 bg-[#111]">
          <div className="px-5 py-3 border-b border-white/5">
            <p style={{ fontFamily: "var(--font-bebas)" }} className="text-sm tracking-wider text-white">Historique des mesures</p>
          </div>
          {history.map((entry, i) => {
            const prev = history[i + 1];
            const diff = prev ? +(entry.body_fat - prev.body_fat).toFixed(1) : null;
            return (
              <div key={entry.id} className="flex items-start justify-between px-5 py-3.5 border-b border-white/5 last:border-0 group">
                <div className="flex-1 min-w-0">
                  <p className="text-[0.55rem] tracking-wider text-white/40 capitalize mb-0.5">
                    {new Date(entry.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <p className="text-[0.5rem] text-white/20 italic truncate">{entry.note}</p>
                </div>
                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  <div className="text-right">
                    <div className="flex items-baseline gap-1 justify-end">
                      <span style={{ fontFamily: "var(--font-bebas)" }} className={`text-2xl tracking-wide leading-none ${i === 0 ? "text-white" : "text-white/40"}`}>
                        {entry.body_fat}
                      </span>
                      <span className="text-[0.45rem] text-white/25">%</span>
                    </div>
                    {diff !== null && (
                      <span className={`text-[0.42rem] tracking-wider ${diff < 0 ? "text-[#7eb8a0]" : diff > 0 ? "text-[#e07070]" : "text-white/20"}`}>
                        {diff < 0 ? "▼" : diff > 0 ? "▲" : "—"}{Math.abs(diff)}%
                      </span>
                    )}
                  </div>
                  <button onClick={() => deleteEntry(entry.id)}
                    className="text-white/15 hover:text-[#e07070] transition-colors">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
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

function BodyFatChart({ data }: { data: BodyFatEntry[] }) {
  const W = 560, H = 130;
  const PAD = { top: 12, right: 12, bottom: 32, left: 36 };
  const vals = data.map(d => d.body_fat);
  const minV = Math.max(0, Math.min(...vals) - 3);
  const maxV = Math.max(...vals) + 3;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const toX = (i: number) => PAD.left + (data.length > 1 ? (i / (data.length - 1)) * innerW : innerW / 2);
  const toY = (v: number) => PAD.top + (1 - (v - minV) / (maxV - minV)) * innerH;

  const pts = data.map((d, i) => `${toX(i)},${toY(d.body_fat)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 130 }}>
      {[0, 0.5, 1].map(t => {
        const y = PAD.top + t * innerH;
        const v = maxV - t * (maxV - minV);
        return (
          <g key={t}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            <text x={PAD.left - 5} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.18)" fontSize="8">{v.toFixed(0)}%</text>
          </g>
        );
      })}

      <polygon
        points={`${toX(0)},${H - PAD.bottom} ${pts} ${toX(data.length - 1)},${H - PAD.bottom}`}
        fill="rgba(201,168,76,0.07)"
      />
      <polyline points={pts} fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>

      {data.map((d, i) => (
        <g key={d.id}>
          <circle cx={toX(i)} cy={toY(d.body_fat)} r="3.5" fill="#c9a84c"/>
          <text x={toX(i)} y={H - PAD.bottom + 13} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="7">
            {new Date(d.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
          </text>
        </g>
      ))}
    </svg>
  );
}
