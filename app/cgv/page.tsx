import Link from "next/link";
import type { Metadata } from "next";
import { PLANS, TRIAL_DAYS } from "@/lib/plans";

export const metadata: Metadata = { title: "Conditions générales — Samuel Coaching" };

const h2 = "text-white font-semibold text-base mb-3 uppercase tracking-widest text-[0.75rem] text-[#c9a84c]";

export default function CgvPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-[#c9a84c] text-xs tracking-[0.2em] uppercase hover:text-white transition-colors mb-12 inline-block">
          ← Retour
        </Link>

        <h1 className="font-[family-name:var(--font-barlow)] font-black text-5xl uppercase text-white mb-4">Conditions générales</h1>
        <p className="text-white/30 text-xs mb-12">Version du 28 septembre 2026</p>

        <div className="flex flex-col gap-10 text-white/60 text-sm leading-relaxed">
          <section>
            <h2 className={h2}>1. Objet</h2>
            <p>
              Les présentes conditions régissent l&apos;utilisation de l&apos;application Samuel Coaching et ses abonnements,
              proposés par Samuel Waelti, Samuel Coaching, Lausanne (sam97waelti@gmail.com). Les prestations de coaching
              individuel (séances, suivi personnalisé) font l&apos;objet d&apos;un accord séparé avec le coach.
            </p>
          </section>

          <section>
            <h2 className={h2}>2. Formules</h2>
            <ul className="flex flex-col gap-1.5 list-disc pl-5">
              {Object.values(PLANS).map(p => (
                <li key={p.label}>
                  <span className="text-white/80">{p.label}</span> — {p.monthlyChf} CHF / mois ou {p.yearlyChf} CHF / an
                  {p.maxClients ? `, jusqu'à ${p.maxClients} clients` : ""}.
                </li>
              ))}
            </ul>
            <p className="mt-3">
              Les formules Coach permettent à un coach de gérer ses clients dans l&apos;application ; l&apos;accès de ses clients
              est inclus et dépend de l&apos;abonnement actif du coach. Les formules Premium incluent l&apos;usage « illimité » des
              fonctions d&apos;intelligence artificielle, entendu comme un usage personnel ou professionnel raisonnable ; des plafonds
              techniques protègent le service contre les abus automatisés.
            </p>
          </section>

          <section>
            <h2 className={h2}>3. Essai gratuit</h2>
            <p>
              Un nouvel utilisateur bénéficie d&apos;un essai gratuit de la formule Premium ({TRIAL_DAYS.solo} jours en Solo,
              {" "}{TRIAL_DAYS.coach} jours en Coach), sans engagement ni moyen de paiement. À la fin de l&apos;essai, les fonctions
              d&apos;intelligence artificielle sont suspendues jusqu&apos;à la souscription d&apos;une formule ; les données restent accessibles.
            </p>
          </section>

          <section>
            <h2 className={h2}>4. Prix et paiement</h2>
            <p>
              Les prix sont indiqués en francs suisses (CHF). Le paiement s&apos;effectue en ligne par carte ou TWINT via notre
              prestataire Stripe, à la souscription puis à chaque échéance. L&apos;abonnement se renouvelle automatiquement pour la
              même durée (mois ou année) jusqu&apos;à résiliation. En cas de modification de prix, tu en es informé au moins 30 jours
              à l&apos;avance ; le nouveau prix s&apos;applique à partir de l&apos;échéance suivante.
            </p>
          </section>

          <section>
            <h2 className={h2}>5. Résiliation</h2>
            <p>
              Tu peux résilier à tout moment depuis ton espace Abonnement ; la résiliation prend effet à la fin de la période déjà
              payée, sans remboursement au prorata. En cas de défaut de paiement, l&apos;accès aux fonctions payantes est suspendu
              après un délai de grâce de 3 jours. Nous pouvons suspendre un compte en cas d&apos;usage abusif ou contraire aux présentes conditions.
            </p>
          </section>

          <section>
            <h2 className={h2}>6. Santé et intelligence artificielle</h2>
            <p>
              L&apos;application fournit des outils de suivi et des estimations (calories, macronutriments, masse grasse, charges
              d&apos;entraînement) produites notamment par intelligence artificielle. Ces estimations sont indicatives et ne constituent
              ni un avis ni un diagnostic médical. Consulte un professionnel de santé avant de débuter un programme, en cas de
              pathologie, de grossesse ou de douleur.
            </p>
          </section>

          <section>
            <h2 className={h2}>7. Responsabilités</h2>
            <p>
              Le coach qui utilise une formule Coach est seul responsable des programmes et conseils qu&apos;il donne à ses clients
              ainsi que des données qu&apos;il saisit. Dans les limites de la loi, notre responsabilité est limitée au montant payé
              au cours des 12 derniers mois ; elle est exclue en cas de faute légère et pour les dommages indirects.
            </p>
          </section>

          <section>
            <h2 className={h2}>8. Données personnelles</h2>
            <p>
              Le traitement des données est décrit dans la{" "}
              <Link href="/mentions-legales#donnees-personnelles" className="text-[#c9a84c] hover:text-white transition-colors underline">politique de confidentialité</Link>.
            </p>
          </section>

          <section>
            <h2 className={h2}>9. Droit applicable et for</h2>
            <p>Les présentes conditions sont soumises au droit suisse. Le for est à Lausanne, sous réserve des fors impératifs prévus par la loi.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
