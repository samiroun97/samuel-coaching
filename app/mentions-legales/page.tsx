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
            <p>Email : contact@samuelcoaching.fr</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3 uppercase tracking-widest text-[0.75rem] text-[#c9a84c]">Hébergement</h2>
            <p>Ce site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA.</p>
          </section>

          <section id="donnees-personnelles">
            <h2 className="text-white font-semibold text-base mb-3 uppercase tracking-widest text-[0.75rem] text-[#c9a84c]">
              Données Personnelles
            </h2>
            <p>
              Les données collectées via le formulaire de contact (prénom, objectif, message) sont utilisées uniquement pour répondre à vos demandes et ne sont pas partagées avec des tiers.
            </p>
            <p className="mt-3">
              Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données. Pour exercer ce droit, contactez : contact@samuelcoaching.fr
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3 uppercase tracking-widest text-[0.75rem] text-[#c9a84c]">Propriété Intellectuelle</h2>
            <p>
              Tous les contenus présents sur ce site (textes, images, logo) sont la propriété exclusive de Samuel Coaching et sont protégés par les lois en vigueur sur la propriété intellectuelle.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
