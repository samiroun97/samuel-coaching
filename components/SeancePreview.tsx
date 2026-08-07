"use client";
// Rendu visuel en lecture seule d'une séance (exercices + notes libres), tel que le
// client le voit sur son dashboard. Partagé entre app/dashboard/programme (vue client)
// et app/crm/programmes (aperçu coach de ce qui a été envoyé) pour ne jamais diverger.
import { type ReactNode } from "react";
import { type ExerciceItem, parseExercices, groupExerciceRuns } from "@/lib/exercices";
import { parseNotesLibres } from "@/lib/notesLibres";

export type PreviewSeance = {
  titre: string;
  type_seance: string | null;
  date_prevue?: string | null;
  semaine?: number | null;
  description: string | null;
  exercices: string | null;
  notes_libres?: string | null;
};

export function ExerciceCard({ ex }: { ex: ExerciceItem }) {
  return (
    <div className="border border-white/8 bg-white/[0.02] rounded-lg px-3 py-2.5">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-xs text-white/70 font-medium leading-snug">{ex.nom}</p>
        {ex.type && <span className="text-[0.55rem] tracking-wider uppercase text-white/30 border border-white/10 px-1.5 py-0.5 shrink-0">{ex.type}</span>}
        {ex.videoUrl && (
          <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer" className="text-[0.55rem] tracking-wider uppercase text-[#c9a84c]/70 hover:text-[#c9a84c] transition-colors shrink-0">▶ Vidéo</a>
        )}
      </div>

      {ex.mode === "libre" ? (
        ex.texteLibre && <p className="text-[0.68rem] text-white/50 leading-relaxed mt-1.5 whitespace-pre-wrap">{ex.texteLibre}</p>
      ) : ex.mode === "avance" && ex.sets.length > 0 ? (
        <div className="flex flex-col gap-1 mt-1.5">
          {ex.sets.map((s, si) => {
            const parts = [s.reps, s.poids, s.repos ? `repos ${s.repos}` : "", s.rpe ? `RPE ${s.rpe}` : "", s.tempo ? `tempo ${s.tempo}` : ""].filter(Boolean);
            return parts.length > 0 ? (
              <p key={si} className="text-[0.68rem] text-white/45"><span className="text-[#c9a84c] font-bold">Série {si + 1}</span> — {parts.join(" · ")}</p>
            ) : null;
          })}
        </div>
      ) : (
        (ex.series || ex.repetitions || ex.poids || ex.repos) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
            {ex.series && <span className="text-[0.7rem] font-bold text-[#c9a84c]">{ex.series}{ex.repetitions ? ` × ${ex.repetitions}` : " séries"}</span>}
            {ex.poids && <span className="text-[0.65rem] text-white/40">{ex.poids}</span>}
            {ex.repos && <span className="text-[0.65rem] text-white/35">repos {ex.repos}</span>}
          </div>
        )
      )}
      {ex.note && <p className="text-[0.65rem] text-white/35 italic mt-1.5 leading-relaxed whitespace-pre-line">{ex.note}</p>}
    </div>
  );
}

export function ExercicesList({ items }: { items: ExerciceItem[] }) {
  const nodes: ReactNode[] = groupExerciceRuns(items).map(run =>
    run.groupId ? (
      <div key={`g-${run.indices[0]}`} className="border border-[#c9a84c]/25 bg-[#c9a84c]/[0.03] rounded-lg p-2 flex flex-col gap-2">
        <p className="text-[0.55rem] tracking-[0.15em] uppercase text-[#c9a84c] px-1">{run.groupLabel || "Superset"}</p>
        {run.indices.map(k => <ExerciceCard key={k} ex={items[k]} />)}
      </div>
    ) : (
      <ExerciceCard key={run.indices[0]} ex={items[run.indices[0]]} />
    )
  );
  return <>{nodes}</>;
}

// Corps d'une séance (description + exercices + notes libres), sans le header
// (titre/date/actions) qui diffère entre la vue client et l'aperçu coach.
export function SeanceBody({ s }: { s: PreviewSeance }) {
  const notes = parseNotesLibres(s.notes_libres);
  return (
    <>
      {s.description && <p className="text-xs text-white/40 leading-relaxed mb-2">{s.description}</p>}
      {s.exercices && (
        <div className="flex flex-col gap-2 mb-4">
          <ExercicesList items={parseExercices(s.exercices)} />
        </div>
      )}
      {notes.length > 0 && (
        <div className="border border-white/8 bg-white/[0.02] rounded-lg px-3 py-2.5 mb-4 flex flex-col gap-1.5">
          {notes.map((n, ni) => (
            <p key={ni} className="text-[0.68rem] text-white/50 leading-relaxed flex items-start gap-1.5">
              <span className="text-[#c9a84c] shrink-0">•</span><span className="whitespace-pre-line">{n}</span>
            </p>
          ))}
        </div>
      )}
    </>
  );
}
