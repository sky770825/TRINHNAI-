import { useState, useCallback, useEffect } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/sections/HeroSection";
import { BrandSection } from "@/components/sections/BrandSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { GallerySection } from "@/components/sections/GallerySection";
import { PromotionsSection } from "@/components/sections/PromotionsSection";
import { LeadCaptureSection } from "@/components/sections/LeadCaptureSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { Footer } from "@/components/sections/Footer";
import { BookingModal } from "@/components/BookingModal";
import { StickyCTA } from "@/components/StickyCTA";
import { StructuredData } from "@/components/StructuredData";
import { AnnouncementModal } from "@/components/AnnouncementModal";

const Index = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);

  const openBooking = useCallback(() => setIsBookingOpen(true), []);
  const closeBooking = useCallback(() => setIsBookingOpen(false), []);
  const openAnnouncement = useCallback(() => setIsAnnouncementOpen(true), []);
  const closeAnnouncement = useCallback(() => setIsAnnouncementOpen(false), []);

  // Show announcement modal on page load
  useEffect(() => {
    // Small delay to ensure page is loaded
    const timer = setTimeout(() => {
      openAnnouncement();
    }, 500);

    return () => clearTimeout(timer);
  }, [openAnnouncement]);

  return (
    <div className="min-h-screen bg-background">
      <StructuredData />
      <Header onBookingClick={openBooking} />
      
      <main>
        <HeroSection onBookingClick={openBooking} />
        
        <div id="services">
          <ServicesSection onBookingClick={openBooking} />
        </div>
        
        <div id="about">
          <BrandSection />
        </div>
        
        <div id="gallery">
          <GallerySection />
        </div>
        
        <PromotionsSection onBookingClick={openBooking} />

        <LeadCaptureSection />
        
        <div id="faq">
          <FAQSection />
        </div>
      </main>
      
      <Footer />
      
      <StickyCTA onBookingClick={openBooking} />
      <BookingModal isOpen={isBookingOpen} onClose={closeBooking} />
      <AnnouncementModal isOpen={isAnnouncementOpen} onClose={closeAnnouncement} />
    </div>
  );
};

export default Index;
