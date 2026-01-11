import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface StickyCTAProps {
  onBookingClick: () => void;
}

export const StickyCTA = ({ onBookingClick }: StickyCTAProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 500px
      setIsVisible(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
        >
          <div className="bg-background/95 backdrop-blur-md border-t border-border shadow-elevated p-4">
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => window.open("https://line.me/R/ti/p/@355uniyb", "_blank")}
              >
                <MessageCircle className="w-4 h-4" />
                {t("sticky.line")}
              </Button>
              <Button
                variant="hero"
                size="lg"
                className="flex-1"
                onClick={onBookingClick}
              >
                <Calendar className="w-4 h-4" />
                {t("sticky.booking")}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
