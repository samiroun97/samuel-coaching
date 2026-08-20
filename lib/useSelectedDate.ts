"use client";
import { useEffect, useState } from "react";

export const todayStr = () => new Date().toISOString().split("T")[0];

// Persiste la date sélectionnée (partagée entre Accueil, Nutrition, Programme, Suivi),
// mais uniquement pour la journée en cours. Sans ça, rouvrir l'app un autre jour calendaire
// restaure la dernière date consultée (souvent "hier") au lieu de repartir sur aujourd'hui.
//
// "selected_date_day" note quel jour était "aujourd'hui" au moment de la dernière sauvegarde :
// s'il ne correspond plus au jour réel, la sélection est jugée périmée et on repart sur
// aujourd'hui. Sur un onglet resté ouvert à cheval sur minuit, on ne fait ce forçage que si
// l'utilisateur consultait déjà "aujourd'hui" (current === savedDay) — sinon on n'interrompt
// pas une consultation volontaire d'un jour passé.
export function useSelectedDate() {
  const [selectedDate, setSelectedDate] = useState(() => {
    try {
      const now = todayStr();
      const saved = localStorage.getItem("selected_date");
      const savedDay = localStorage.getItem("selected_date_day");
      return saved && savedDay === now ? saved : now;
    } catch { return todayStr(); }
  });

  useEffect(() => {
    try {
      localStorage.setItem("selected_date", selectedDate);
      localStorage.setItem("selected_date_day", todayStr());
    } catch { /* ignore */ }
  }, [selectedDate]);

  useEffect(() => {
    const check = () => {
      const now = todayStr();
      setSelectedDate(current => {
        try {
          const savedDay = localStorage.getItem("selected_date_day");
          if (savedDay !== now && current === savedDay) return now;
        } catch { /* ignore */ }
        return current;
      });
    };
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    const interval = setInterval(check, 60_000);
    return () => {
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
      clearInterval(interval);
    };
  }, []);

  return [selectedDate, setSelectedDate] as const;
}
