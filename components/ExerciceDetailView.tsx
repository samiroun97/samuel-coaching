"use client";
import Model from "react-body-highlighter";
import { type CatalogueEntry } from "@/lib/exercicesCatalogue";
import { CIBLE_TO_LIB, CIBLE_VIEW } from "@/lib/muscleCategories";
import { Icon } from "@/components/Icon";
import { X } from "@/lib/solarIcons";

// Fiche détail d'un exercice — héro média + tags + mini-silhouette + exécution/utilité/à
// noter. Extrait de ExerciceLibraryBrowser (CRM coach) pour être réutilisé tel quel par
// ExercicePicker (client) : composant 100% présentationnel, aucun état propre, le footer
// (bouton d'action) est fourni par l'appelant puisqu'il diffère d'un contexte à l'autre.
export function ExerciceDetailView({ entry, onClose, footer }: {
  entry: CatalogueEntry; onClose: () => void; footer?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex flex-col gap-4 pb-16">
          {/* Hero : média plein cadre avec titre incrusté façon fiche produit, ou
              simple en-tête texte quand l'exercice n'a pas encore de photo/vidéo. */}
          <div className="relative shrink-0">
            <button onClick={onClose}
              className={`absolute z-10 flex items-center justify-center transition-colors ${
                entry.video_url || entry.image_url
                  ? "top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70"
                  : "top-4 right-5 text-[var(--t-text-25)] hover:text-[var(--t-text)]"
              }`}>
              <Icon icon={X} size={14} strokeWidth={2.5}/>
            </button>
            {entry.video_url || entry.image_url ? (
              <div className="relative bg-[radial-gradient(circle_at_center,var(--t-surface),var(--t-bg2))]">
                {entry.video_url ? (
                  <video key={entry.id} src={entry.video_url} poster={entry.image_url ?? undefined}
                    controls loop playsInline className="w-full max-h-[34vh] object-contain mx-auto block"/>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={entry.image_url!} alt="" className="w-full max-h-[34vh] object-contain mx-auto block"/>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pt-12 pb-3 px-5 pointer-events-none">
                  {entry.muscle_cible && (
                    <p className="text-[0.6rem] tracking-[0.2em] uppercase text-[#e2c97e] mb-0.5">{entry.muscle_cible}</p>
                  )}
                  <p style={{ fontFamily: "var(--font-bebas)" }} className="text-xl font-bold tracking-wide text-white cap-first">{entry.nom}</p>
                </div>
              </div>
            ) : (
              <div className="px-5 pt-1">
                {entry.muscle_cible && (
                  <p className="text-[0.6rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-0.5">{entry.muscle_cible}</p>
                )}
                <p style={{ fontFamily: "var(--font-bebas)" }} className="text-xl font-bold tracking-wide text-[var(--t-text)] cap-first pr-10">{entry.nom}</p>
              </div>
            )}
          </div>

          <div className="px-5 flex flex-col gap-4">
            {(entry.equipement || (entry.tags && entry.tags.length > 0)) && (
              <div className="flex flex-wrap gap-1.5">
                {entry.equipement && (
                  <span className="text-[0.58rem] tracking-wider uppercase text-[#c9a84c] capitalize bg-[#c9a84c]/10 rounded-full px-2.5 py-1">{entry.equipement}</span>
                )}
                {entry.tags?.map(tag => (
                  <span key={tag} className="text-[0.58rem] tracking-wider uppercase text-[var(--t-text-35)] capitalize border border-[var(--t-border)] rounded-full px-2.5 py-1">{tag}</span>
                ))}
              </div>
            )}

            {/* Mini-silhouette : réutilise l'écorché de la bibliothèque pour repérer le
                muscle principal en un coup d'œil, plutôt qu'un simple mot dans une puce. */}
            {entry.muscle_cible && CIBLE_TO_LIB[entry.muscle_cible] && (
              <div className="flex items-center gap-4 bg-[var(--t-surface)] border border-[var(--t-border-soft)] rounded-xl p-3">
                <div className="shrink-0 pointer-events-none">
                  <Model
                    type={CIBLE_VIEW[entry.muscle_cible] ?? "anterior"}
                    data={[{ name: "cible", muscles: CIBLE_TO_LIB[entry.muscle_cible] }]}
                    bodyColor="var(--t-glass-bg)"
                    highlightedColors={["#c9a84c"]}
                    style={{ width: "56px" }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[var(--t-text-25)] mb-0.5">Muscle principal</p>
                  <p className="text-sm font-bold text-[var(--t-text)] capitalize">{entry.muscle_cible}</p>
                </div>
              </div>
            )}

            {(entry.execution && entry.execution.length > 0) || entry.utilite || (entry.a_noter && entry.a_noter.length > 0) ? (
              <div className="flex flex-col gap-4">
                {entry.execution && entry.execution.length > 0 && (
                  <div className="flex flex-col gap-2.5 bg-[var(--t-surface)] border border-[var(--t-border-soft)] rounded-xl p-4">
                    <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c]">Exécution</p>
                    <ol className="flex flex-col gap-2.5">
                      {entry.execution.map((step, i) => (
                        <li key={i} className="flex gap-2.5 text-sm text-[var(--t-text-50)] leading-relaxed">
                          <span className="shrink-0 w-5 h-5 rounded-full bg-[#c9a84c]/15 text-[#c9a84c] text-[0.65rem] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                          <span className="pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {entry.utilite && (
                  <div className="flex flex-col gap-1 px-4">
                    <p className="text-[0.6rem] tracking-[0.2em] uppercase text-[var(--t-text-25)]">Utilité</p>
                    <p className="text-sm text-[var(--t-text-50)] leading-relaxed">{entry.utilite}</p>
                  </div>
                )}
                {entry.a_noter && entry.a_noter.length > 0 && (
                  <div className="flex flex-col gap-1.5 px-4">
                    <p className="text-[0.6rem] tracking-[0.2em] uppercase text-[var(--t-text-25)]">À noter</p>
                    <div className="flex flex-col gap-1.5">
                      {entry.a_noter.map((mistake, i) => (
                        <p key={i} className="text-sm text-[var(--t-text-50)] leading-relaxed">{mistake}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              entry.description && (
                <p className="text-sm text-[var(--t-text-50)] leading-relaxed">{entry.description}</p>
              )
            )}

            {entry.image_license && (
              <p className="text-[0.5rem] text-[var(--t-text-15)]">Photo : {entry.image_license_author || "?"} · {entry.image_license}</p>
            )}
          </div>
        </div>
      </div>

      {footer && (
        <div className="shrink-0 border-t border-[var(--t-border-soft)] p-4">
          {footer}
        </div>
      )}
    </div>
  );
}
