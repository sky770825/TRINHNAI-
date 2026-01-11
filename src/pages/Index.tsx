import { useState } from "react";
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

const Index = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const openBooking = () => setIsBookingOpen(true);
  const closeBooking = () => setIsBookingOpen(false);

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
    </div>
  );
};

export default Index;
