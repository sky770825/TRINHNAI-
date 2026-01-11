import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar, MessageCircle } from "lucide-react";

interface CTASectionProps {
  onBookingClick: () => void;
}

export const CTASection = ({ onBookingClick }: CTASectionProps) => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/30 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <span className="inline-block bg-primary/10 text-primary px-4 py-1 rounded-full text-sm font-medium mb-6">
            限時優惠
          </span>
          <h2 className="font-display text-4xl md:text-6xl font-medium text-foreground mb-6 leading-tight">
            準備好讓自己更閃耀了嗎？
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            現在預約首次服務，享有 9 折優惠
            <br />
            每週名額有限，把握機會
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="hero"
              size="xl"
              onClick={onBookingClick}
              className="group"
            >
              <Calendar className="w-5 h-5" />
              立即預約
            </Button>
            <Button
              variant="outline"
              size="xl"
              onClick={() => window.open("https://line.me", "_blank")}
            >
              <MessageCircle className="w-5 h-5" />
              LINE 諮詢
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-8">
            取消不收費（提前 24 小時通知）・24 小時內回覆保證
          </p>
        </motion.div>
      </div>
    </section>
  );
};
