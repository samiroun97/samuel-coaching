import type { Metadata } from "next";
import { Inter, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  variable: "--font-barlow",
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Samuel Coaching — Fitness & Transformation Personnelle",
  description:
    "Coach fitness d'élite à Lausanne. Transformation physique, mentale et lifestyle. Programmes sur mesure. Résultats réels.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${inter.variable} ${barlowCondensed.variable}`}>
      <body className="bg-[#0a0a0a] text-white antialiased">{children}</body>
    </html>
  );
}
