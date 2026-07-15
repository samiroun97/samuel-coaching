import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = "https://samuel-coaching.ch";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/dashboard", "/crm", "/login", "/reset-password", "/api"] },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
