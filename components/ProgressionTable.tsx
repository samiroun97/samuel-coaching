"use client";
import { parseExercices } from "@/lib/exercices";
import { summarizeExercice, exerciceKey } from "@/lib/surchargeProgressive";
import { type Mesocycle } from "@/lib/mesocycles";
import { mesoWeekNum, mondayOf, toISO } from "@/lib/planning";

// Vue "Progression" (façon Everfit) : un exercice par ligne, une semaine par colonne, la
// prescription de chaque semaine dans la case — pour voir d'un coup d'œil si la charge ou
// les reps montent bien d'une semaine à l'autre. Une case = la première occurrence de
// l'exercice dans la semaine ; clic → ouvre la séance correspondante.

type Seance = { id: string; titre: string; date_prevue: string | null; exercices: string | null; completed_at: string | null; created_by_client?: boolean };

export function ProgressionTable({ seances, meso, onOpen }: { seances: Seance[]; meso: Mesocycle | null; onOpen: (id: string) => void }) {
  const dated = seances.filter(s => s.date_prevue && !s.created_by_client);
  const weeks = [...new Set(dated.map(s => toISO(mondayOf(new Date(s.date_prevue! + "T12:00:00")))))].sort();

  // exercice → semaine → { résumé, séance }
  const rows = new Map<string, { nom: string; firstWeek: number; cells: Map<string, { summary: string; seanceId: string; done: boolean }> }>();
  for (const s of [...dated].sort((a, b) => a.date_prevue!.localeCompare(b.date_prevue!))) {
    const week = toISO(mondayOf(new Date(s.date_prevue! + "T12:00:00")));
    for (const ex of parseExercices(s.exercices)) {
      if (!ex.nom.trim()) continue;
      const key = exerciceKey(ex.nom);
      const row = rows.get(key) ?? { nom: ex.nom.trim(), firstWeek: weeks.indexOf(week), cells: new Map() };
      if (!row.cells.has(week)) row.cells.set(week, { summary: summarizeExercice(ex), seanceId: s.id, done: !!s.completed_at });
      rows.set(key, row);
    }
  }
  const ordered = [...rows.values()].sort((a, b) => a.firstWeek - b.firstWeek || a.nom.localeCompare(b.nom));

  if (!weeks.length) return <p className="text-sm text-[var(--t-text-50)] py-2">Planifie des séances datées dans le calendrier pour voir la progression semaine par semaine.</p>;

  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <table className="w-full border-separate border-spacing-0 text-left min-w-[480px]">
        <thead>
          <tr>
            <th className="sticky left-0 bg-[var(--t-bg)] z-10 text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-[var(--t-text-50)] pb-2 pr-3">Exercice</th>
            {weeks.map(w => {
              const n = mesoWeekNum(meso, w);
              return (
                <th key={w} className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-[var(--t-text-50)] pb-2 px-2 whitespace-nowrap">
                  {n ? `S${n}` : new Date(w + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {ordered.map(row => {
            let prev: string | null = null;
            return (
              <tr key={row.nom} className="group">
                <td className="sticky left-0 bg-[var(--t-bg)] z-10 py-2 pr-3 border-t border-[var(--t-border-soft)] text-[0.8rem] text-[var(--t-text-80)] capitalize max-w-[200px] truncate">{row.nom}</td>
                {weeks.map(w => {
                  const cell = row.cells.get(w);
                  // Case surlignée quand la prescription change par rapport à la semaine précédente.
                  const changed = !!cell && prev !== null && cell.summary !== prev;
                  if (cell) prev = cell.summary;
                  return (
                    <td key={w} className="py-2 px-2 border-t border-[var(--t-border-soft)] whitespace-nowrap">
                      {cell ? (
                        <button onClick={() => onOpen(cell.seanceId)}
                          className={`text-[0.74rem] tabular-nums rounded-md px-2 py-1 transition-colors hover:bg-[var(--t-glass-bg)] ${changed ? "text-[#7eb8a0] bg-[#7eb8a0]/10 font-medium" : "text-[var(--t-text-55)]"}`}>
                          {cell.done && <span className="text-[#7eb8a0] mr-0.5">✓</span>}{cell.summary}
                        </button>
                      ) : <span className="text-[0.74rem] text-[var(--t-text-20)] px-2">—</span>}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-[0.72rem] text-[var(--t-text-50)] mt-3"><span className="text-[#7eb8a0] font-semibold">En vert</span> : la prescription a changé par rapport à la semaine précédente · clic sur une case pour ouvrir la séance.</p>
    </div>
  );
}
