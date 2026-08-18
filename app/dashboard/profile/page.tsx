"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { isCoachUser } from "@/lib/coach";

type Profile = { prenom: string; nom: string; age: number | null; poids: number | null; taille: number | null; sexe: string | null };

function GearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  );
}

export default function ProfilePage() {
  const [isCoach, setIsCoach] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      isCoachUser(user.id).then(setIsCoach);
      const { data } = await supabase.from("profiles")
        .select("prenom,nom,age,poids,taille,sexe").eq("id", user.id).single();
      if (data) setProfile(data as Profile);
    })();
  }, []);

  const initials = `${profile?.prenom?.[0] ?? ""}${profile?.nom?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="p-4 sm:p-8 max-w-lg">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[0.7rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-2">Paramètres</p>
          <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-5xl text-white tracking-wide">COMPTE</h1>
        </div>
        <Link href="/dashboard/profile/preferences"
          aria-label="Préférences"
          className="w-11 h-11 border border-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-[#c9a84c] hover:border-[#c9a84c]/40 transition-colors shrink-0 mt-1">
          <GearIcon/>
        </Link>
      </div>

      {isCoach && (
        <div className="border border-[#c9a84c]/25 bg-[#c9a84c]/5 rounded-lg p-5 flex items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-1">Espace coach</p>
            <p className="text-[0.62rem] text-white/35 tracking-wider">Tu es actuellement dans ton espace perso (aperçu adhérent)</p>
          </div>
          <Link href="/crm"
            className="shrink-0 bg-[#c9a84c] text-black text-[0.65rem] font-bold tracking-[0.15em] uppercase px-4 py-2.5 hover:bg-[#e2c97e] transition-colors rounded-lg">
            Retour espace coach →
          </Link>
        </div>
      )}

      <div className="border border-white/10 bg-[#111] rounded-lg p-6 flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/30 flex items-center justify-center shrink-0">
          <span style={{ fontFamily: "var(--font-bebas)" }} className="text-lg text-[#c9a84c] tracking-wide">{initials || "?"}</span>
        </div>
        <div className="min-w-0">
          <p className="text-lg text-white truncate">{profile?.prenom} {profile?.nom}</p>
          <p className="text-[0.62rem] text-white/25 tracking-wider mt-0.5">
            {[profile?.age && `${profile.age} ans`, profile?.poids && `${profile.poids} kg`, profile?.taille && `${profile.taille} cm`].filter(Boolean).join(" · ") || "Complète ton profil dans Préférences"}
          </p>
        </div>
      </div>

      <Link href="/dashboard/profile/preferences"
        className="flex items-center justify-between border border-white/10 bg-[#111] rounded-lg px-5 py-4 hover:bg-white/[0.03] transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-white/40"><GearIcon/></span>
          <p className="text-sm text-white/70">Préférences</p>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/25 shrink-0">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </Link>
    </div>
  );
}
