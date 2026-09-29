import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  // sharp embarque un binaire natif par plateforme — le bundler webpack des routes API le
  // corrompt s'il essaie de l'empaqueter comme un module JS classique. Le laisser en require()
  // externe au runtime (résolu depuis node_modules tel quel) évite l'échec silencieux en
  // production sur Vercel (500 sans message clair côté route, cf. /api/nutrition/prepare-photo).
  // pdfkit lit ses polices standard (.afm) depuis son dossier au runtime : même traitement
  // externe que sharp, et fichiers de polices forcés dans le bundle de la route PDF.
  serverExternalPackages: ["sharp", "pdfkit", "swissqrbill"],
  outputFileTracingIncludes: {
    "/api/business/invoice-pdf": ["./node_modules/pdfkit/js/data/**"],
  },
};

export default nextConfig;
