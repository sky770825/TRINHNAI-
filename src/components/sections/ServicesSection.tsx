import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Paintbrush, Eye, Sparkles, Feather, LucideIcon, Loader2 } from "lucide-react";
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

// 根据服务数量获取布局类名
const getGridClassName = (count: number): string => {
  if (count === 1) return "grid grid-cols-1 gap-6 max-w-md mx-auto";
  if (count === 2) return "grid grid-cols-1 md:grid-cols-2 gap-6";
  if (count === 3) return "grid grid-cols-1 md:grid-cols-3 gap-6";
  return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6";
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

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">載入服務中...</span>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-muted-foreground">目前沒有可用的服務項目</p>
          </div>
        ) : (
          <div className={getGridClassName(services.length)}>
            {services.map((service, index) => {
              const Icon = getServiceIcon(service.service_id);
              return (
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
                      src={service.image_url || 'https://via.placeholder.com/400x300'}
                      alt={service.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                    <div className="absolute top-4 left-4">
                      <div className="w-10 h-10 rounded-xl bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-soft">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <span className="text-primary text-xs tracking-wider uppercase font-medium">
                      {service.service_id.toUpperCase()}
                    </span>
                    <h3 className="font-display text-xl font-medium text-foreground mt-1 mb-2">
                      {service.name}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                      {service.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-primary font-semibold">
                        {service.price_range}
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-4"
                      onClick={onBookingClick}
                    >
                      立即預約
                    </Button>
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
