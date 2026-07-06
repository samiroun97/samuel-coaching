"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Profile = {
  prenom: string; nom: string; age: number; poids: number; taille: number; sexe: string;
  niveau_activite: string; experience: string; seances_par_semaine: number;
  duree_seance: string; lieu_entrainement: string;
  blessures: string; alimentation: string; sommeil_stress: string; objectifs: string;
};

export default function AccueilPage() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase
        .from("profiles").select("*").eq("id", data.user.id).single();
      setProfile(p);
    });
  }, []);

  if (!profile) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const bodyFatHistory = (() => {
    try { return JSON.parse(localStorage.getItem("bodyfat_history") ?? "[]"); } catch { return []; }
  })();
  const latestBodyFat = bodyFatHistory[0]?.body_fat ?? null;

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-10">
        <p className="text-[0.55rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-2">Espace client</p>
        <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-5xl text-white tracking-wide">
          {profile.prenom} {profile.nom}
        </h1>
        <p className="text-white/30 text-xs mt-1">{profile.sexe}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Âge", val: `${profile.age} ans` },
          { label: "Poids", val: `${profile.poids} kg` },
          { label: "Taille", val: `${profile.taille} cm` },
          { label: "Body fat", val: latestBodyFat !== null ? `${latestBodyFat}%` : "—" },
        ].map((s) => (
          <div key={s.label} className="border border-white/10 bg-[#111] p-4">
            <p className="text-[0.5rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-1.5">{s.label}</p>
            <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-white tracking-wide">{s.val}</p>
          </div>
        ))}
      </div>

      {/* Training + Health */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="border border-white/10 bg-[#111] p-6">
          <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-4">Entraînement</p>
          <div className="flex flex-col gap-3">
            {[
              { label: "Niveau", val: profile.niveau_activite },
              { label: "Expérience", val: profile.experience },
              { label: "Séances / sem.", val: `${profile.seances_par_semaine}x` },
              { label: "Durée", val: profile.duree_seance },
              { label: "Lieu", val: profile.lieu_entrainement },
            ].map((r) => (
              <div key={r.label} className="flex justify-between items-start border-b border-white/5 pb-2.5 last:border-0 last:pb-0">
                <span className="text-[0.55rem] tracking-wider uppercase text-white/25 shrink-0">{r.label}</span>
                <span className="text-xs text-white/60 text-right ml-4">{r.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-white/10 bg-[#111] p-6">
          <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-4">Santé</p>
          <div className="flex flex-col gap-4">
            {[
              { label: "Blessures", val: profile.blessures },
              { label: "Alimentation", val: profile.alimentation },
              { label: "Sommeil & stress", val: profile.sommeil_stress },
            ].map((r) => (
              <div key={r.label}>
                <p className="text-[0.5rem] tracking-[0.18em] uppercase text-white/25 mb-1">{r.label}</p>
                <p className="text-xs text-white/55 leading-relaxed">{r.val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Objectives */}
      <div className="border border-white/10 bg-[#111] p-6 mb-6">
        <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-3">Objectifs</p>
        <p className="text-sm text-white/55 leading-relaxed">{profile.objectifs}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Link href="/dashboard/onboarding"
          className="flex-1 border border-white/10 text-white/40 text-[0.6rem] tracking-[0.15em] uppercase py-4 text-center hover:border-white/20 hover:text-white/60 transition-colors">
          Modifier mon profil
        </Link>
        <a href="https://wa.me/41798617518" target="_blank" rel="noopener noreferrer"
          className="flex-1 bg-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.15em] uppercase py-4 text-center hover:bg-[#e2c97e] transition-colors">
          Contacter Samuel →
        </a>
      </div>
    </div>
  );
}
