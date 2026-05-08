import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Paintbrush,
  Eye,
  Sparkles,
  Feather,
  LucideIcon,
  Loader2,
  ArrowRight,
  Clock,
  MapPin,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface ServicesSectionProps {
  onBookingClick: () => void;
}

interface ServiceSetting {
  id: string;
  service_id: string;
  name: string;
  description: string;
  price_range: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
}

// 图标映射函数
const getServiceIcon = (serviceId: string): LucideIcon => {
  const iconMap: Record<string, LucideIcon> = {
    nail: Paintbrush,
    lash: Eye,
    tattoo: Sparkles,
    waxing: Feather,
  };
  return iconMap[serviceId.toLowerCase()] || Sparkles;
};

export const ServicesSection = ({ onBookingClick }: ServicesSectionProps) => {
  const { t } = useLanguage();
  const [services, setServices] = useState<ServiceSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('service_settings')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error("Error fetching services:", error);
        setServices([]);
      } else {
        setServices(data || []);
      }
    } catch (err) {
      console.error("Error fetching services:", err);
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="services" className="relative overflow-hidden bg-marble py-24">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-14 grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end"
        >
          <div>
            <p className="mb-3 text-sm font-semibold text-primary">Beauty menu</p>
            <h2 className="text-balance font-display text-4xl font-medium leading-tight text-foreground md:text-6xl">
              {t("services.title")}
            </h2>
            <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
              {t("services.subtitle")}，每個項目都能依膚況、睫毛條件與日常習慣做客製調整。
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-primary/15 bg-white/70 p-5 shadow-soft backdrop-blur-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#f6ede7] p-4">
                <Clock className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm font-semibold text-foreground">彈性預約</p>
                <p className="mt-1 text-xs text-muted-foreground">09:00 - 22:00</p>
              </div>
              <div className="rounded-2xl bg-[#e8eee9] p-4">
                <MapPin className="h-5 w-5 text-[#506c5c]" />
                <p className="mt-3 text-sm font-semibold text-foreground">中壢雙店</p>
                <p className="mt-1 text-xs text-muted-foreground">元化 / 忠福</p>
              </div>
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center rounded-[1.5rem] border border-primary/10 bg-white/70 py-24 shadow-soft">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">載入服務中...</span>
          </div>
        ) : services.length === 0 ? (
          <div className="rounded-[1.5rem] border border-primary/10 bg-white/70 py-24 text-center shadow-soft">
            <p className="text-muted-foreground">目前沒有可用的服務項目</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-12">
            {services.map((service, index) => {
              const Icon = getServiceIcon(service.service_id);
              const isFeature = index === 0 && services.length > 2;
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`group overflow-hidden rounded-[1.35rem] border border-primary/10 bg-[#fffaf6] shadow-card transition-all duration-500 hover:-translate-y-1 hover:shadow-elevated ${
                    isFeature ? "lg:col-span-5 lg:row-span-2" : "lg:col-span-7"
                  }`}
                >
                  <div className={`grid h-full ${isFeature ? "grid-rows-[260px_1fr]" : "md:grid-cols-[260px_1fr]"}`}>
                    {/* Image */}
                    <div className="relative min-h-[220px] overflow-hidden">
                      <img
                        src={service.image_url || 'https://via.placeholder.com/640x520'}
                        alt={service.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/640x520';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#2b1a18]/45 via-transparent to-transparent" />
                      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/88 px-3 py-2 shadow-soft backdrop-blur-sm">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold text-foreground">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex min-h-[250px] flex-col p-6">
                      <span className="text-sm font-semibold text-primary">
                        {service.service_id.toUpperCase()}
                      </span>
                      <h3 className="mt-2 font-display text-2xl font-medium text-foreground">
                        {service.name}
                      </h3>
                      <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
                        {service.description}
                      </p>

                      <div className="mt-6 rounded-2xl bg-[#f7eee8] px-4 py-3">
                        <p className="text-xs text-muted-foreground">參考價格</p>
                        <p className="mt-1 font-semibold text-primary">
                          {service.price_range}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-auto w-full justify-between border-primary/25 bg-white/60"
                        onClick={onBookingClick}
                      >
                        立即預約
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
