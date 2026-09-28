import Link from "next/link";

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-[#c9a84c] text-xs tracking-[0.2em] uppercase hover:text-white transition-colors mb-12 inline-block">
          ← Retour
        </Link>

        <h1 className="font-[family-name:var(--font-barlow)] font-black text-5xl uppercase text-white mb-12">
          Mentions Légales
        </h1>

        <div className="flex flex-col gap-10 text-white/60 text-sm leading-relaxed">
          <section>
            <h2 className="text-white font-semibold text-base mb-3 uppercase tracking-widest text-[0.75rem] text-[#c9a84c]">Éditeur</h2>
            <p>Samuel Coaching — Coaching Fitness & Transformation Personnelle</p>
            <p>Lausanne, Suisse</p>
            <p>Email : sam97waelti@gmail.com</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3 uppercase tracking-widest text-[0.75rem] text-[#c9a84c]">Hébergement</h2>
            <p>Ce site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA.</p>
          </section>

          <section id="donnees-personnelles">
            <h2 className="text-white font-semibold text-base mb-3 uppercase tracking-widest text-[0.75rem] text-[#c9a84c]">
              Politique de confidentialité
            </h2>
            <div className="flex flex-col gap-3">
              <p>
                Cette politique s&apos;applique au site et à l&apos;application Samuel Coaching, conformément à la loi fédérale
                sur la protection des données (nLPD) et, pour les utilisateurs situés dans l&apos;Union européenne, au RGPD.
                Responsable du traitement : Samuel Waelti, Samuel Coaching, Lausanne — sam97waelti@gmail.com.
              </p>
              <p>
                <strong className="text-white/80">Données traitées.</strong> Formulaire de contact : prénom, objectif, message.
                Application : identité et e-mail, profil (âge, taille, sexe, objectifs, niveau, blessures, alimentation, sommeil
                et stress), poids, mensurations, estimations de masse grasse, photos corporelles, repas et nutrition, séances
                d&apos;entraînement, pas, check-ins et messages. Une partie de ces données sont des <em>données sensibles relatives à la santé</em> :
                elles ne sont traitées qu&apos;avec ton consentement explicite, donné à l&apos;inscription.
              </p>
              <p>
                <strong className="text-white/80">Finalités.</strong> Fournir l&apos;application et ton suivi, permettre à ton coach
                (si tu en as un) de t&apos;accompagner, t&apos;envoyer les rappels que tu actives, gérer ton abonnement et sa facturation.
                Aucune donnée n&apos;est vendue ni utilisée à des fins publicitaires.
              </p>
              <p>
                <strong className="text-white/80">Ton coach.</strong> Si tu rejoins un coach avec son code, il accède à ton profil et à
                ton suivi (hors photos que tu ne partages pas). Pour te détacher de ton coach, écris-nous à l&apos;adresse ci-dessus.
              </p>
              <p>
                <strong className="text-white/80">Prestataires.</strong> Supabase (base de données et fichiers, hébergés dans l&apos;UE — Irlande),
                Vercel Inc. (hébergement de l&apos;application, États-Unis), Anthropic PBC (analyse par intelligence artificielle des photos
                de repas et corporelles et des données nécessaires aux conseils, États-Unis), Stripe (paiements) et Open Food Facts
                (recherche d&apos;aliments, sans donnée personnelle). Les transferts vers les États-Unis sont encadrés par des garanties
                contractuelles appropriées. Les données transmises à l&apos;IA servent uniquement à produire la réponse demandée.
              </p>
              <p>
                <strong className="text-white/80">Conservation.</strong> Tant que ton compte existe. La suppression du compte (Compte ›
                Préférences) efface tes données et tes photos ; les données de facturation sont conservées le temps imposé par la loi (10 ans).
              </p>
              <p>
                <strong className="text-white/80">Tes droits.</strong> Accès, rectification, effacement, remise de tes données et retrait
                de ton consentement à tout moment, en écrivant à sam97waelti@gmail.com. Tu peux aussi t&apos;adresser au Préposé fédéral à la
                protection des données et à la transparence (PFPDT).
              </p>
            </div>
          </section>

          <section id="cgv">
            <h2 className="text-white font-semibold text-base mb-3 uppercase tracking-widest text-[0.75rem] text-[#c9a84c]">Conditions générales</h2>
            <p>
              Les conditions d&apos;utilisation et d&apos;abonnement de l&apos;application sont disponibles sur la page{" "}
              <Link href="/cgv" className="text-[#c9a84c] hover:text-white transition-colors underline">Conditions générales</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3 uppercase tracking-widest text-[0.75rem] text-[#c9a84c]">Propriété Intellectuelle</h2>
            <p>
              Tous les contenus présents sur ce site (textes, images, logo) sont la propriété exclusive de Samuel Coaching et sont protégés par les lois en vigueur sur la propriété intellectuelle.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3 uppercase tracking-widest text-[0.75rem] text-[#c9a84c]">Données Alimentaires Tierces</h2>
            <p>
              La recherche et le scan de code-barres dans la rubrique Nutrition utilisent les données du projet{" "}
              <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer" className="text-[#c9a84c] hover:text-white transition-colors underline">Open Food Facts</a>,
              mises à disposition sous licence Open Database License (ODbL).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
