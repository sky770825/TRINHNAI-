import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import serviceNail from "@/assets/service-nail.jpg";
import serviceLash from "@/assets/service-lash.jpg";
import serviceTattoo from "@/assets/service-tattoo.jpg";
import serviceWaxing from "@/assets/service-waxing.jpg";
import heroImage from "@/assets/hero-trinhnai.jpg";

const galleryImages = [
  { src: heroImage, alt: "精緻美甲設計", categoryKey: "services.nail.title" },
  { src: serviceNail, alt: "裸色光療美甲", categoryKey: "services.nail.title" },
  { src: serviceLash, alt: "自然美睫設計", categoryKey: "services.lash.title" },
  { src: serviceTattoo, alt: "霧眉紋繡作品", categoryKey: "services.tattoo.title" },
  { src: serviceWaxing, alt: "專業除毛服務", categoryKey: "services.waxing.title" },
];

export const GallerySection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { t } = useLanguage();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
  };

  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-4xl md:text-5xl font-medium text-foreground mb-4">
            {t("gallery.title")}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t("gallery.subtitle")}
          </p>
        </motion.div>

        {/* Main Carousel */}
        <div className="relative max-w-4xl mx-auto">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5 }}
            className="relative aspect-[16/10] rounded-3xl overflow-hidden shadow-elevated"
          >
            <img
              src={galleryImages[currentIndex].src}
              alt={galleryImages[currentIndex].alt}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6">
              <span className="bg-background/90 backdrop-blur-sm text-foreground px-4 py-2 rounded-full text-sm font-medium">
                {t(galleryImages[currentIndex].categoryKey)}
              </span>
            </div>
          </motion.div>

          {/* Navigation Arrows */}
          <button
            onClick={goToPrev}
            aria-label="上一張圖片"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm shadow-card flex items-center justify-center hover:bg-background transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
          <button
            onClick={goToNext}
            aria-label="下一張圖片"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm shadow-card flex items-center justify-center hover:bg-background transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-foreground" />
          </button>
        </div>

        {/* Thumbnail Navigation */}
        <div className="flex justify-center gap-3 mt-8">
          {galleryImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-16 h-16 rounded-xl overflow-hidden transition-all duration-300 ${
                index === currentIndex
                  ? "ring-2 ring-primary ring-offset-2 scale-110"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={image.src}
                alt={image.alt}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
