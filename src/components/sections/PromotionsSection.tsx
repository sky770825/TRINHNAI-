import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface PromotionsSectionProps {
  onBookingClick: () => void;
}

const promotionsList = [
  {
    emoji: "🎂",
    titleKey: "promo.birthday.title",
    descKey: "promo.birthday.desc",
  },
  {
    emoji: "🌟",
    titleKey: "promo.review.title",
    descKey: "promo.review.desc",
  },
  {
    emoji: "💅",
    titleKey: "promo.combo.title",
    descKey: "promo.combo.desc",
  },
];

export const PromotionsSection = ({ onBookingClick }: PromotionsSectionProps) => {
  const { t } = useLanguage();

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block bg-primary/10 text-primary px-4 py-1 rounded-full text-sm font-medium mb-4">
            {t("promo.title")}
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-medium text-foreground">
            {t("promo.subtitle")}
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {promotionsList.map((promo, index) => (
            <motion.div
              key={promo.titleKey}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="gradient-card rounded-2xl p-8 shadow-card hover:shadow-elevated transition-all duration-300 text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br opacity-50" style={{
                background: `linear-gradient(135deg, hsl(var(--primary) / 0.05) 0%, hsl(var(--accent) / 0.1) 100%)`
              }} />
              <div className="relative">
                <span className="text-5xl mb-4 block">{promo.emoji}</span>
                <h3 className="font-display text-2xl font-medium text-foreground mb-2">
                  {t(promo.titleKey)}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t(promo.descKey)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <Button variant="hero" size="xl" onClick={onBookingClick}>
            {t("promo.cta")}
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
