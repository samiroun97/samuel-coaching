"use client";
import { useState, useEffect, useRef } from "react";
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

  const save = async () => {
    if (!userId || saving) return;
    const validItems = items.filter(it => it.nom.trim());
    if (validItems.length === 0) return;
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

      <div className="mb-6">
        <p className="text-[0.7rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-2">Séance libre</p>
        <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl sm:text-5xl text-[var(--t-text)] tracking-wide">CRÉER MA SÉANCE</h1>
      </div>

      <div className="border border-[var(--t-border)] bg-[var(--t-surface)] rounded-xl p-4 mb-6">
        <input className="w-full bg-[var(--t-surface-2)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-sm px-3 py-2.5 mb-3 focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
          placeholder="Titre (ex : Push du jour)" value={titre} onChange={e => setTitre(e.target.value)}/>
        <ExerciceEditor items={items} onChange={setItems} catalogue={catalogue}/>
      </div>

      <div className="flex gap-2">
        <Link href="/dashboard/programme"
          className="flex-1 flex items-center justify-center border border-[var(--t-border)] text-[var(--t-text-40)] rounded-xl text-[0.6rem] tracking-[0.1em] uppercase py-2.5 hover:border-[var(--t-text-20)] hover:text-[var(--t-text-60)] transition-colors">
          Annuler
        </Link>
        <button onClick={save} disabled={saving}
          className="flex-1 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.1em] uppercase py-2.5 rounded-xl disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0 transition-all">
          {saving ? "…" : "Enregistrer et démarrer →"}
        </button>
      </div>
    </div>
  );
}
