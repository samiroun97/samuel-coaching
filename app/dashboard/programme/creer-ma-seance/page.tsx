"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ExerciceEditor from "@/components/ExerciceEditor";
import { useSelectedDate } from "@/lib/useSelectedDate";
import { serializeExercices, type ExerciceItem } from "@/lib/exercices";
import { loadCatalogue, type CatalogueEntry } from "@/lib/exercicesCatalogue";
import { loadPersonalRecords, type PRCard } from "@/lib/personalRecords";
import { Icon } from "@/components/Icon";
import { ChevronLeft, ChevronRight, Trash2 } from "@/lib/solarIcons";
import { Sparkline } from "@/components/Sparkline";

type MySeance = { id: string; titre: string; type_seance: string | null; date_prevue: string | null; completed_at: string | null; created_by_client?: boolean };

// Séance libre composée par le client lui-même (freestyle) — mêmes tables/policies que
// les séances assignées par Samuel (RLS déjà ouverte à auth.uid() = client_id), juste
// marquée created_by_client pour la distinguer dans les deux vues. Page dédiée (plutôt
// qu'un panneau dépliant sur /programme) pour laisser la place à la bibliothèque d'exercices.
//
// Ordre volontaire : on commence par l'action principale (ajouter des exercices), le
// titre — secondaire, avec un repli automatique — arrive juste avant d'enregistrer,
// comme on nomme une playlist une fois son contenu choisi.
export default function CreerMaSeancePage() {
  const router = useRouter();
  const [selectedDate] = useSelectedDate();
  const [userId, setUserId] = useState<string | null>(null);
  const userEmailRef = useRef("");
  const [catalogue, setCatalogue] = useState<CatalogueEntry[]>([]);
  const [titre, setTitre] = useState("");
  const [items, setItems] = useState<ExerciceItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [mesSeances, setMesSeances] = useState<MySeance[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [records, setRecords] = useState<PRCard[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      userEmailRef.current = user.email ?? "";
      if (user.email) {
        const { data } = await supabase.from("programme_seances")
          .select("id,titre,type_seance,date_prevue,completed_at,created_by_client")
          .eq("assigned_to_email", user.email).order("created_at", { ascending: false });
        setMesSeances((data ?? []) as MySeance[]);
      }
      loadPersonalRecords(user.id).then(setRecords).catch(() => {});
    })();
    loadCatalogue().then(setCatalogue).catch(() => {});
  }, []);

  const validCount = useMemo(() => items.filter(it => it.nom.trim()).length, [items]);
  const canSave = validCount > 0 && !saving;

  const save = async () => {
    if (!userId || !canSave) return;
    const validItems = items.filter(it => it.nom.trim());
    setSaving(true);
    const { data, error } = await supabase.from("programme_seances").insert({
      client_id: userId,
      assigned_to_email: userEmailRef.current,
      titre: titre.trim() || "Séance libre",
      date_prevue: selectedDate,
      exercices: serializeExercices(validItems),
      created_by_client: true,
    }).select("*").single();
    setSaving(false);
    if (error || !data) return;
    router.push(`/dashboard/programme?live=${data.id}`);
  };

  const deleteSeance = async (id: string) => {
    if (!window.confirm("Supprimer définitivement cette séance ?")) return;
    setDeletingId(id);
    const { error } = await supabase.from("programme_seances").delete().eq("id", id);
    setDeletingId(null);
    if (error) return;
    setMesSeances(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <Link href="/dashboard/programme"
        className="text-[var(--t-text-40)] hover:text-[var(--t-text-70)] transition-colors text-[0.7rem] tracking-[0.15em] uppercase flex items-center gap-1.5 mb-6">
        <Icon icon={ChevronLeft} size={12} strokeWidth={2}/>
        Retour
      </Link>

      <div className="mb-8">
        <p className="text-[0.7rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-2">Séance libre</p>
        <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl sm:text-5xl text-[var(--t-text)] tracking-wide mb-2">CRÉER MA SÉANCE</h1>
        <p className="text-[0.7rem] text-[var(--t-text-30)] tracking-wide">
          {validCount === 0
            ? "Pioche dans la bibliothèque ou ajoute tes propres exercices pour commencer."
            : `${validCount} exercice${validCount > 1 ? "s" : ""} ajouté${validCount > 1 ? "s" : ""} — ajuste séries, reps et poids si besoin.`}
        </p>
      </div>

      {/* Séances existantes — reprendre ou consulter avant d'en créer une nouvelle */}
      {mesSeances.length > 0 && (
        <div className="border border-[var(--t-border-soft)] bg-[var(--t-surface)] rounded-2xl mb-8 overflow-hidden">
          <p className="px-4 pt-3 pb-2 text-[0.62rem] tracking-[0.2em] uppercase text-[var(--t-text-40)]">
            Mes séances ({mesSeances.length})
          </p>
          {mesSeances.map(s => {
            const label = (
              <div className="min-w-0 flex items-center gap-2">
                {s.completed_at && <span className="text-[0.7rem] text-[#7eb8a0] shrink-0">✓</span>}
                {s.created_by_client
                  ? <span className="text-[0.6rem] tracking-wider uppercase text-[var(--t-text-30)] rounded-full border border-[var(--t-border)] px-1.5 py-0.5 shrink-0">Toi</span>
                  : <span className="text-[0.6rem] tracking-wider uppercase text-[#c9a84c] rounded-full border border-[#c9a84c]/20 px-1.5 py-0.5 shrink-0">Samuel</span>}
                {s.type_seance && <span className="text-[0.6rem] tracking-wider uppercase text-[#c9a84c] rounded-full border border-[#c9a84c]/20 px-1.5 py-0.5 shrink-0">{s.type_seance}</span>}
                <p className={`text-xs truncate ${s.completed_at ? "text-[var(--t-text-35)] line-through" : "text-[var(--t-text-70)]"}`}>{s.titre}</p>
              </div>
            );
            return (
              <div key={s.id} className="flex items-center gap-1 border-t border-[var(--t-border-soft)]">
                {s.completed_at ? (
                  <div className="flex-1 min-w-0 px-4 py-2.5">{label}</div>
                ) : (
                  <Link href={`/dashboard/programme?live=${s.id}`}
                    className="flex-1 min-w-0 flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-[var(--t-glass-bg)] transition-colors">
                    {label}
                    <Icon icon={ChevronRight} size={10} strokeWidth={1.5} className="text-[var(--t-text-25)] shrink-0"/>
                  </Link>
                )}
                <button onClick={() => deleteSeance(s.id)} disabled={deletingId === s.id} title="Supprimer cette séance"
                  className="shrink-0 mr-3 text-[var(--t-text-15)] hover:text-[#e07070] transition-colors disabled:opacity-30">
                  <Icon icon={Trash2} size={13} strokeWidth={1.8}/>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Records personnels — 1RM estimé le plus récent par exercice, avec son évolution */}
      {records.length > 0 && (
        <div className="mb-8">
          <p className="text-[0.62rem] tracking-[0.2em] uppercase text-[var(--t-text-40)] mb-3">
            Mes records ({records.length})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {records.map(r => (
              <div key={r.nom} className="border border-[var(--t-border-soft)] bg-[var(--t-surface)] rounded-2xl p-3.5 flex flex-col gap-2">
                <p className="text-[0.68rem] text-[var(--t-text-60)] font-medium capitalize truncate">{r.nom}</p>
                <div className="flex items-baseline gap-1">
                  <span style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-[var(--t-text)] tracking-wide leading-none">{r.currentKg}</span>
                  <span className="text-[0.62rem] text-[var(--t-text-30)]">kg</span>
                </div>
                <Sparkline points={r.points} color="#c9a84c"/>
                <p className="text-[0.58rem] text-[var(--t-text-20)] tracking-wide">
                  {new Date(r.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Étape 1 — construire la séance */}
      <div className="flex items-center gap-2.5 mb-4">
        <span style={{ fontFamily: "var(--font-bebas)" }}
          className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-sm flex items-center justify-center">1</span>
        <p className="text-[0.68rem] tracking-[0.15em] uppercase text-[var(--t-text-40)]">Ajoute tes exercices</p>
      </div>
      <div className="mb-8">
        <ExerciceEditor items={items} onChange={setItems} catalogue={catalogue} simplified/>
      </div>

      {/* Étape 2 — nommer et enregistrer */}
      <div className={`flex items-center gap-2.5 mb-4 transition-opacity duration-200 ${validCount === 0 ? "opacity-30" : ""}`}>
        <span style={{ fontFamily: "var(--font-bebas)" }}
          className={`shrink-0 w-7 h-7 rounded-full text-sm flex items-center justify-center ${validCount > 0 ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black" : "border border-[var(--t-border)] text-[var(--t-text-30)]"}`}>2</span>
        <p className="text-[0.68rem] tracking-[0.15em] uppercase text-[var(--t-text-40)]">Nomme et enregistre</p>
      </div>
      <div className={`border border-[var(--t-border-soft)] bg-[var(--t-surface)] rounded-2xl p-5 mb-6 transition-opacity duration-200 ${validCount === 0 ? "opacity-30 pointer-events-none" : ""}`}>
        <label className="text-[0.62rem] tracking-[0.15em] uppercase text-[var(--t-text-30)] block mb-1.5">Nom de la séance (optionnel)</label>
        <input className="w-full bg-[var(--t-bg)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors mb-5"
          placeholder="Séance libre" value={titre} onChange={e => setTitre(e.target.value)}/>

        <button onClick={save} disabled={!canSave}
          title={validCount === 0 ? "Ajoute au moins un exercice pour enregistrer" : undefined}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-sm font-bold tracking-[0.1em] uppercase py-4 rounded-2xl shadow-[0_6px_24px_-8px_rgba(201,168,76,0.6)] disabled:opacity-40 disabled:shadow-none hover:shadow-[0_8px_30px_-6px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:hover:translate-y-0">
          {saving ? "Enregistrement…" : <>Enregistrer et démarrer <span aria-hidden>→</span></>}
        </button>
        {validCount === 0 && (
          <p className="text-[0.62rem] text-[var(--t-text-20)] tracking-wide mt-3 text-center">Ajoute au moins un exercice pour pouvoir enregistrer.</p>
        )}
      </div>

      <div className="flex justify-center">
        <Link href="/dashboard/programme"
          className="text-[0.62rem] tracking-[0.15em] uppercase text-[var(--t-text-25)] hover:text-[var(--t-text-60)] transition-colors py-2">
          Annuler
        </Link>
      </div>
    </div>
  );
}
