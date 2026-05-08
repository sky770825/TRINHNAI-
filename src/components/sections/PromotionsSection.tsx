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
    <section className="relative overflow-hidden bg-background py-24">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="container mx-auto px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end"
        >
          <div>
            <span className="inline-block rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
              {t("promo.title")}
            </span>
            <h2 className="mt-5 text-balance font-display text-4xl font-medium leading-tight text-foreground md:text-6xl">
              {t("promo.subtitle")}
            </h2>
          </div>
          <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            優惠不只寫在公告裡，預約時會一起帶入服務紀錄，門市現場更好確認。
          </p>
        </motion.div>

        <div className="mb-12 grid gap-5 md:grid-cols-3">
          {promotionsList.map((promo, index) => (
            <motion.div
              key={promo.titleKey}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative overflow-hidden rounded-[1.35rem] border border-primary/10 bg-[#fffaf6] p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated"
            >
              <div className="absolute right-5 top-5 font-display text-5xl text-primary/10">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="relative flex h-full flex-col">
                <span className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f3e7df] text-3xl">
                  {promo.emoji}
                </span>
                <h3 className="mb-3 font-display text-2xl font-medium text-foreground">
                  {t(promo.titleKey)}
                </h3>
                <p className="text-pretty leading-relaxed text-muted-foreground">
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
