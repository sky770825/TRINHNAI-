import { motion } from "framer-motion";
import { Calendar, MessageCircle, Sparkles, Heart, ArrowRight } from "lucide-react";

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
    <section className="relative overflow-hidden bg-[#1f1715] py-24 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(31,23,21,1)_0%,rgba(71,48,41,0.96)_58%,rgba(38,60,50,0.86)_100%)]" />
      <div className="absolute inset-0 hero-grain opacity-45" />
      <div className="container relative mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-14 grid gap-6 lg:grid-cols-[0.8fr_1fr] lg:items-end"
        >
          <div>
            <p className="mb-3 text-sm font-semibold text-[#f0c9ad]">Booking flow</p>
            <h2 className="text-balance font-display text-4xl font-medium leading-tight md:text-6xl">
              從諮詢到完成，流程更安心
            </h2>
          </div>
          <p className="max-w-2xl text-pretty text-lg leading-relaxed text-white/72">
            官方帳號和官網預約會回到同一套紀錄，兩間店都能看見需求、時間與服務項目，減少來回確認。
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection Line - Desktop */}
          <div className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-white/25 to-transparent md:block" />

          <div className="grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative rounded-[1.35rem] border border-white/12 bg-white/[0.07] p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.11]"
              >
                {/* Icon Container */}
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12 shadow-soft">
                    <step.icon className="h-6 w-6 text-[#f0c9ad]" />
                  </div>
                  <span className="text-sm font-semibold text-white/45">
                    {step.step}
                  </span>
                </div>

                <h3 className="mb-3 font-display text-xl font-medium">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-white/68">
                  {step.description}
                </p>
                {index < steps.length - 1 && (
                  <ArrowRight className="mt-5 h-4 w-4 text-white/35 transition-transform group-hover:translate-x-1" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
