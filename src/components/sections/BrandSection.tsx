import { motion } from "framer-motion";
import { Shield, Leaf, Award, Heart, LucideIcon, MapPin, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import serviceLash from "@/assets/service-lash.jpg";

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
    <section id="about" className="relative overflow-hidden bg-[#fffaf6] py-24">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,250,246,1)_0%,rgba(244,235,229,0.74)_100%)]" />
      <div className="container relative mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center"
        >
          <div>
            <p className="mb-3 text-sm font-semibold text-primary">About Trinhnai</p>
            <h2 className="text-balance font-display text-4xl font-medium leading-tight text-foreground md:text-6xl">
              {t("brand.title").split("Trinhnai")[0]}
              <span className="text-primary italic">Trinhnai</span>
            </h2>
            <p className="mt-5 text-primary">
              {t("brand.subtitle")}
            </p>
            <div className="mt-6 max-w-xl space-y-4 text-pretty text-lg leading-relaxed text-muted-foreground">
              <p>{t("brand.content1")}</p>
              <p>{t("brand.content2")}</p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-primary/15 bg-white p-5 shadow-soft">
                <MapPin className="h-5 w-5 text-primary" />
                <p className="mt-4 font-semibold text-foreground">中壢元化店（前站）</p>
                <p className="mt-1 text-sm text-muted-foreground">中壢區元化路（前站）</p>
              </div>
              <div className="rounded-2xl border border-[#506c5c]/20 bg-[#edf3ee] p-5 shadow-soft">
                <MapPin className="h-5 w-5 text-[#506c5c]" />
                <p className="mt-4 font-semibold text-foreground">中壢忠福店</p>
                <p className="mt-1 text-sm text-muted-foreground">中壢區忠福路（黃昏市場對面）</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] shadow-elevated">
              <img
                src={serviceLash}
                alt="Trinhnai 美睫與細節服務空間"
                className="h-[520px] w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="absolute -bottom-6 left-6 right-6 rounded-[1.5rem] border border-white/60 bg-white/88 p-5 shadow-card backdrop-blur-md sm:left-auto sm:w-80">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#263c32] text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-xl font-medium text-foreground">細節先行</p>
                  <p className="text-sm text-muted-foreground">工具消毒、材料控管、服務紀錄同步管理</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-20 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {featuresList.map((feature, index) => (
            <motion.div
              key={feature.titleKey}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="rounded-[1.25rem] border border-primary/10 bg-white/78 p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl gradient-gold shadow-soft">
                <feature.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="mb-2 font-display text-xl font-medium text-foreground">
                {t(feature.titleKey)}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t(feature.descKey)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
