import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  // sharp embarque un binaire natif par plateforme — le bundler webpack des routes API le
  // corrompt s'il essaie de l'empaqueter comme un module JS classique. Le laisser en require()
  // externe au runtime (résolu depuis node_modules tel quel) évite l'échec silencieux en
  // production sur Vercel (500 sans message clair côté route, cf. /api/nutrition/prepare-photo).
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
