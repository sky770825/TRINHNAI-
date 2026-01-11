import { motion } from "framer-motion";
import { Shield, Leaf, Award, Heart, LucideIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface FeatureItem {
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
}

const featuresList: FeatureItem[] = [
  {
    icon: Award,
    titleKey: "brand.feature1.title",
    descKey: "brand.feature1.desc",
  },
  {
    icon: Shield,
    titleKey: "brand.feature2.title",
    descKey: "brand.feature2.desc",
  },
  {
    icon: Leaf,
    titleKey: "brand.feature3.title",
    descKey: "brand.feature3.desc",
  },
  {
    icon: Heart,
    titleKey: "brand.feature4.title",
    descKey: "brand.feature4.desc",
  },
];

export const BrandSection = () => {
  const { t } = useLanguage();

  return (
    <section id="about" className="py-24 bg-secondary/50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-medium text-foreground mb-4">
            {t("brand.title").split("Trinhnai")[0]}
            <span className="text-primary italic">Trinhnai</span>
          </h2>
          <p className="text-primary text-sm tracking-widest uppercase mb-6">
            {t("brand.subtitle")}
          </p>
          <div className="text-muted-foreground text-lg max-w-2xl mx-auto space-y-4 leading-relaxed">
            <p>{t("brand.content1")}</p>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuresList.map((feature, index) => (
            <motion.div
              key={feature.titleKey}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="gradient-card rounded-2xl p-6 shadow-soft hover:shadow-card transition-shadow duration-300 text-center"
            >
              <div className="w-14 h-14 rounded-2xl gradient-gold flex items-center justify-center mb-5 mx-auto shadow-soft">
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-medium text-foreground mb-2">
                {t(feature.titleKey)}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t(feature.descKey)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
