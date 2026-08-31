"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ExerciceEditor from "@/components/ExerciceEditor";
import { useSelectedDate } from "@/lib/useSelectedDate";
import { serializeExercices, type ExerciceItem } from "@/lib/exercices";
import { loadCatalogue, type CatalogueEntry } from "@/lib/exercicesCatalogue";

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

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      userEmailRef.current = user.email ?? "";
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

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <Link href="/dashboard/programme"
        className="text-[var(--t-text-40)] hover:text-[var(--t-text-70)] transition-colors text-[0.7rem] tracking-[0.15em] uppercase flex items-center gap-1.5 mb-6">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
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
