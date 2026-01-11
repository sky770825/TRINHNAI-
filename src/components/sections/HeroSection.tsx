import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Calendar, MessageCircle, ArrowDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import heroImage from "@/assets/hero-trinhnai.jpg";

interface HeroSectionProps {
  onBookingClick: () => void;
}

export const HeroSection = ({ onBookingClick }: HeroSectionProps) => {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Trinhnai 精緻美甲作品"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/40 via-foreground/20 to-background" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-6 pt-32 pb-20 min-h-screen flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-2xl"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-background/90 backdrop-blur-sm text-primary px-4 py-2 rounded-full mb-8 shadow-soft"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">{t("hero.badge")}</span>
          </motion.div>

          {/* Main Headline */}
          <h1 className="font-display text-5xl md:text-7xl font-medium text-primary-foreground mb-6 leading-tight drop-shadow-lg">
            {t("hero.headline1")}
            <br />
            <span className="italic">{t("hero.headline2")}</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-10 max-w-lg leading-relaxed drop-shadow">
            <span className="font-display text-2xl font-medium">{t("hero.brand")}</span>
            <br />
            {t("hero.services")}
          </p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button
              variant="hero"
              size="lg"
              onClick={onBookingClick}
              className="group"
            >
              <Calendar className="w-5 h-5" />
              {t("hero.cta.booking")}
            </Button>
            <Button
              variant="hero-outline"
              size="lg"
              onClick={() => window.open("https://line.me/R/ti/p/@355uniyb", "_blank")}
              className="bg-background/20 backdrop-blur-sm border-primary-foreground/50 text-primary-foreground hover:bg-background/40"
            >
              <MessageCircle className="w-5 h-5" />
              {t("hero.cta.line")}
            </Button>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-primary-foreground/80"
          >
            <span className="text-xs tracking-wider uppercase">{t("hero.scroll")}</span>
            <ArrowDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
