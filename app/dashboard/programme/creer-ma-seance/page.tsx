"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Cette page a été remplacée par le panneau de création inline sur /dashboard/programme
// (bandeau "Entraînement" → "Créer ma séance") — gardée en redirection pure pour ne pas
// casser un lien, favori ou raccourci d'écran d'accueil qui pointerait encore ici.
export default function CreerMaSeanceRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/dashboard/programme"); }, [router]);
  return null;
}
