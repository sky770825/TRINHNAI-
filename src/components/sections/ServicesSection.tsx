import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Paintbrush, Eye, Sparkles, Feather, LucideIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import serviceNail from "@/assets/service-nail.jpg";
import serviceLash from "@/assets/service-lash.jpg";
import serviceTattoo from "@/assets/service-tattoo.jpg";
import serviceWaxing from "@/assets/service-waxing.jpg";

interface ServicesSectionProps {
  onBookingClick: () => void;
}

interface ServiceItem {
  id: string;
  icon: LucideIcon;
  titleKey: string;
  subtitleKey: string;
  descKey: string;
  image: string;
  priceRange: string;
  ctaKey: string;
}

const servicesList: ServiceItem[] = [
  {
    id: "nail",
    icon: Paintbrush,
    titleKey: "services.nail.title",
    subtitleKey: "services.nail.subtitle",
    descKey: "services.nail.desc",
    image: serviceNail,
    priceRange: "NT$150–990",
    ctaKey: "services.nail.cta",
  },
  {
    id: "lash",
    icon: Eye,
    titleKey: "services.lash.title",
    subtitleKey: "services.lash.subtitle",
    descKey: "services.lash.desc",
    image: serviceLash,
    priceRange: "NT$790–1290",
    ctaKey: "services.lash.cta",
  },
  {
    id: "tattoo",
    icon: Sparkles,
    titleKey: "services.tattoo.title",
    subtitleKey: "services.tattoo.subtitle",
    descKey: "services.tattoo.desc",
    image: serviceTattoo,
    priceRange: "NT$3990–11990",
    ctaKey: "services.tattoo.cta",
  },
  {
    id: "waxing",
    icon: Feather,
    titleKey: "services.waxing.title",
    subtitleKey: "services.waxing.subtitle",
    descKey: "services.waxing.desc",
    image: serviceWaxing,
    priceRange: "NT$590–2559",
    ctaKey: "services.waxing.cta",
  },
];

export const ServicesSection = ({ onBookingClick }: ServicesSectionProps) => {
  const { t } = useLanguage();

  return (
    <section id="services" className="py-24 bg-marble">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-medium text-foreground mb-4">
            {t("services.title")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("services.subtitle")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {servicesList.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group gradient-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-500"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={service.image}
                  alt={t(service.titleKey)}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                <div className="absolute top-4 left-4">
                  <div className="w-10 h-10 rounded-xl bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-soft">
                    <service.icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <span className="text-primary text-xs tracking-wider uppercase font-medium">
                  {t(service.subtitleKey)}
                </span>
                <h3 className="font-display text-xl font-medium text-foreground mt-1 mb-2">
                  {t(service.titleKey)}
                </h3>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  {t(service.descKey)}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-primary font-semibold">
                    {service.priceRange}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  onClick={onBookingClick}
                >
                  {t(service.ctaKey)}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
