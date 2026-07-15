import SplashScreen from "@/components/SplashScreen";
import CursorSpotlight from "@/components/CursorSpotlight";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import GallerySection from "@/components/GallerySection";
import MethodSection from "@/components/MethodSection";
import AboutSection from "@/components/AboutSection";
import ProgramsSection from "@/components/ProgramsSection";
import EbookSection from "@/components/EbookSection";
import ProcessSection from "@/components/ProcessSection";
import FaqSection from "@/components/FaqSection";
import ContactSection from "@/components/ContactSection";
import AppSection from "@/components/AppSection";
import Footer from "@/components/Footer";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HealthAndBeautyBusiness",
  name: "Samuel Coaching",
  description: "Coach sportif à Lausanne — fitness, transformation physique, nutrition et suivi personnalisé.",
  url: "https://samuel-coaching.ch",
  areaServed: { "@type": "City", name: "Lausanne" },
  address: { "@type": "PostalAddress", addressLocality: "Lausanne", addressRegion: "Vaud", addressCountry: "CH" },
  priceRange: "80–390 CHF",
  sameAs: ["https://www.instagram.com/samw.coaching/"],
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SplashScreen />
      <CursorSpotlight />
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
        <MethodSection />
        <GallerySection />
        <AboutSection />
        <ProgramsSection />
        <EbookSection />
        <AppSection />
        <ProcessSection />
        <FaqSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
