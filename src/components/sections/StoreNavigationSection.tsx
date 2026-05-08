import { motion } from "framer-motion";
import { CalendarDays, MapPin, MessageCircle, Navigation, Phone, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StoreNavigationSectionProps {
  onBookingClick: () => void;
}

const stores = [
  {
    id: "yuanhua",
    name: "中壢元化店（前站）",
    address: "中壢區元化路（前站）",
    note: "靠近中壢前站，適合美甲、美睫與日常保養預約。",
    tone: "bg-[#fff7f0]",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=Trinh+Nail+%E4%B8%AD%E5%A3%A2%E5%85%83%E5%8C%96%E5%BA%97+%E4%B8%AD%E5%A3%A2%E5%8D%80%E5%85%83%E5%8C%96%E8%B7%AF",
  },
  {
    id: "zhongfu",
    name: "中壢忠福店",
    address: "中壢區忠福路（黃昏市場對面）",
    note: "忠福商圈周邊，預約前可先用 LINE 確認服務與時間。",
    tone: "bg-[#eef4ef]",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=Trinh+Nail+%E4%B8%AD%E5%A3%A2%E5%BF%A0%E7%A6%8F%E5%BA%97+%E4%B8%AD%E5%A3%A2%E5%8D%80%E5%BF%A0%E7%A6%8F%E8%B7%AF",
  },
];

export const StoreNavigationSection = ({ onBookingClick }: StoreNavigationSectionProps) => {
  return (
    <section id="stores" className="relative overflow-hidden bg-[#f7f0ea] py-20 lg:py-24">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mb-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end"
        >
          <div>
            <p className="mb-3 text-sm font-semibold text-primary">Store guide</p>
            <h2 className="text-balance font-display text-4xl font-medium leading-tight text-foreground md:text-6xl">
              選好門市，直接導航
            </h2>
          </div>
          <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            兩間店都能接收官網與 LINE OA 預約。出發前可先用導航確認路線，特殊時段或多人同行建議先私訊官方帳號。
          </p>
        </motion.div>

        <div className="grid gap-5 lg:grid-cols-2">
          {stores.map((store, index) => (
            <motion.article
              key={store.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className={`rounded-lg border border-white/70 ${store.tone} p-5 shadow-card lg:p-6`}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-soft">
                  <Store className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-2xl font-medium text-foreground">{store.name}</h3>
                  <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-muted-foreground">
                    <MapPin className="mt-1 h-4 w-4 shrink-0 text-primary" />
                    {store.address}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-pretty text-sm leading-7 text-muted-foreground">{store.note}</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Button asChild className="w-full">
                  <a href={store.mapUrl} target="_blank" rel="noopener noreferrer">
                    <Navigation className="h-4 w-4" />
                    開啟導航
                  </a>
                </Button>
                <Button variant="outline" className="w-full" onClick={onBookingClick}>
                  <CalendarDays className="h-4 w-4" />
                  預約
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <a href="https://line.me/R/ti/p/@355uniyb" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    LINE
                  </a>
                </Button>
              </div>

              <div className="mt-5 flex items-center gap-2 text-sm font-medium text-[#3b2922]">
                <Phone className="h-4 w-4 text-primary" />
                0909-318-666
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
