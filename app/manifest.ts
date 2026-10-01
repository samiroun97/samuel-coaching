import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BURN-B",
    short_name: "BURN-B",
    description: "BURN-B par Samuel Coaching — entraînement, nutrition, suivi.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#c9a84c",
    orientation: "portrait",
    icons: [
      { src: "/icons/burnb-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/burnb-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/burnb-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
