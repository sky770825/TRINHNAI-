import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Calendar,
  MessageCircle,
  ArrowDown,
  MapPin,
  Clock,
  Star,
  ArrowRight,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import heroImage from "@/assets/hero-trinhnai.jpg";

interface HeroSectionProps {
  onBookingClick: () => void;
}

export const HeroSection = ({ onBookingClick }: HeroSectionProps) => {
  const { t } = useLanguage();
  const heroDetails = [
    { label: "中壢雙店", value: "元化店 / 忠福店" },
    { label: "營業時間", value: "09:00 - 22:00" },
    { label: "預約方式", value: "LINE 與官網同步" },
  ];

  return (
    <section className="relative min-h-[100dvh] overflow-hidden bg-[#171110]">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Trinhnai 精緻美甲作品"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(23,17,16,0.78)_0%,rgba(72,40,34,0.42)_46%,rgba(245,238,232,0.08)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/55 to-transparent" />
        <div className="absolute inset-0 hero-grain opacity-70" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto flex min-h-[100dvh] flex-col justify-center px-6 pb-24 pt-32">
        <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_390px]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-3xl"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/88 px-4 py-2 text-primary shadow-soft backdrop-blur-md"
            >
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">{t("hero.badge")}</span>
            </motion.div>

            {/* Main Headline */}
            <h1 className="text-balance font-display text-5xl font-medium leading-[1.04] text-primary-foreground drop-shadow-lg md:text-7xl">
              {t("hero.headline1")}
              <br />
              <span className="italic">{t("hero.headline2")}</span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-primary-foreground/90 drop-shadow md:text-xl">
              <span className="font-display text-2xl font-medium">{t("hero.brand")}</span>
              <br />
              {t("hero.services")}，為日常保養、重要聚會與新娘造型保留細緻狀態。
            </p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 flex flex-col gap-4 sm:flex-row"
            >
              <Button
                variant="hero"
                size="lg"
                onClick={onBookingClick}
                className="group shadow-[0_18px_42px_rgba(106,61,45,0.28)]"
              >
                <Calendar className="h-5 w-5" />
                {t("hero.cta.booking")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                variant="hero-outline"
                size="lg"
                onClick={() => window.open("https://line.me/R/ti/p/@355uniyb", "_blank")}
                className="border-white/55 bg-white/14 text-primary-foreground backdrop-blur-md hover:bg-white/24"
              >
                <MessageCircle className="h-5 w-5" />
                {t("hero.cta.line")}
              </Button>
            </motion.div>

            <div className="mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
              {heroDetails.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.55 + index * 0.08 }}
                  className="rounded-2xl border border-white/18 bg-white/12 px-4 py-3 text-primary-foreground backdrop-blur-md"
                >
                  <p className="text-xs text-primary-foreground/65">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold">{item.value}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="hidden rounded-[2rem] border border-white/22 bg-white/84 p-5 shadow-[0_30px_80px_rgba(45,28,24,0.24)] backdrop-blur-xl lg:block"
          >
            <div className="rounded-[1.45rem] bg-[#fffaf6] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-primary">TODAY</p>
                  <h2 className="mt-1 font-display text-2xl font-medium text-foreground">
                    今日可預約
                  </h2>
                </div>
                <div className="rounded-full bg-[#263c32] px-3 py-1 text-xs font-semibold text-white">
                  2 間店
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-soft">
                  <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">元化店</p>
                    <p className="text-sm text-muted-foreground">中壢區元化路 40 號</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-soft">
                  <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">忠福店</p>
                    <p className="text-sm text-muted-foreground">福州一街 262 號</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#f2e6df] p-4">
                  <Clock className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-xs text-muted-foreground">營業到</p>
                  <p className="font-semibold text-foreground">22:00</p>
                </div>
                <div className="rounded-2xl bg-[#e7eee8] p-4">
                  <Star className="h-5 w-5 text-[#506c5c]" />
                  <p className="mt-3 text-xs text-muted-foreground">適合</p>
                  <p className="font-semibold text-foreground">美甲 / 美睫</p>
                </div>
              </div>

              <Button className="mt-5 w-full" size="lg" onClick={onBookingClick}>
                查看可約時段
              </Button>
            </div>
          </motion.div>
        </div>

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
