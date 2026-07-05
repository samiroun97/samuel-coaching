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
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
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
        <ProcessSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
