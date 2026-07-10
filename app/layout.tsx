import type { Metadata, Viewport } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  variable: "--font-bebas",
  weight: "400",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://samuel-coaching-five.vercel.app"),
  title: {
    default: "Samuel Coaching — Coach sportif à Lausanne · Fitness & Transformation",
    template: "%s · Samuel Coaching",
  },
  description:
    "Coach fitness d'élite à Lausanne. Transformation physique, mentale et lifestyle. Programmes sur mesure, suivi via l'app dédiée. Bilan gratuit de 45 minutes.",
  keywords: ["coach sportif Lausanne", "personal trainer Lausanne", "coaching fitness", "transformation physique", "programme entraînement sur mesure", "coach nutrition"],
  openGraph: {
    title: "Samuel Coaching — Coach sportif à Lausanne",
    description: "Transformation physique, mentale et lifestyle. Programmes 100% sur mesure. Bilan gratuit de 45 minutes.",
    url: "/",
    siteName: "Samuel Coaching",
    locale: "fr_CH",
    type: "website",
    images: [{ url: "/photos/samuel.jpg", alt: "Samuel — coach sportif à Lausanne" }],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${inter.variable} ${bebasNeue.variable}`}>
      <body className="bg-[#0a0a0a] text-white antialiased">{children}</body>
    </html>
  );
}
