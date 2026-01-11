import { motion } from "framer-motion";
import { Calendar, MessageCircle, Sparkles, Heart } from "lucide-react";

const steps = [
  {
    icon: Calendar,
    step: "01",
    title: "線上預約",
    description: "選擇您方便的時間，輕鬆完成預約",
  },
  {
    icon: MessageCircle,
    step: "02",
    title: "專業諮詢",
    description: "與技師討論您的需求與喜好風格",
  },
  {
    icon: Sparkles,
    step: "03",
    title: "精緻服務",
    description: "享受舒適放鬆的專業美甲美睫體驗",
  },
  {
    icon: Heart,
    step: "04",
    title: "完美呈現",
    description: "帶著美麗與自信，展現最好的自己",
  },
];

export const ProcessSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-medium text-foreground mb-6">
            服務流程
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            簡單四步驟，輕鬆擁有精緻美麗
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection Line - Desktop */}
          <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative text-center"
              >
                {/* Icon Container */}
                <div className="relative mx-auto mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto shadow-soft">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center shadow-card">
                    {step.step}
                  </span>
                </div>

                <h3 className="font-display text-xl font-medium text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
