import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useState, useEffect } from "react";

const testimonials = [
  {
    id: 1,
    name: "小雅",
    content: "第一次來就愛上了！技師超細心，做出來的效果比我想像中還要美 💕",
    rating: 5,
    service: "美甲造型",
  },
  {
    id: 2,
    name: "Emily",
    content: "美睫做得很自然，朋友都說看不出來是接的，維持也超久！",
    rating: 5,
    service: "自然美睫",
  },
  {
    id: 3,
    name: "阿珮",
    content: "環境很舒適乾淨，重點是價格很合理，已經介紹好幾個朋友來了",
    rating: 5,
    service: "美甲 + 美睫",
  },
  {
    id: 4,
    name: "Mia",
    content: "每次來都有新的驚喜，設計師會根據我的穿搭給建議，超貼心",
    rating: 5,
    service: "手繪設計",
  },
];

export const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-medium text-foreground mb-6">
            客戶評價
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            聽聽我們的客人怎麼說
          </p>
        </motion.div>

        {/* Main Testimonial */}
        <div className="max-w-3xl mx-auto mb-12">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="gradient-card rounded-3xl p-8 md:p-12 shadow-elevated text-center relative"
          >
            <Quote className="w-12 h-12 text-primary/20 absolute top-8 left-8" />
            
            {/* Stars */}
            <div className="flex justify-center gap-1 mb-6">
              {Array.from({ length: testimonials[currentIndex].rating }).map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-primary text-primary" />
              ))}
            </div>

            <p className="font-display text-2xl md:text-3xl text-foreground mb-8 italic leading-relaxed">
              "{testimonials[currentIndex].content}"
            </p>

            <div>
              <p className="font-medium text-foreground text-lg">
                {testimonials[currentIndex].name}
              </p>
              <p className="text-muted-foreground text-sm">
                {testimonials[currentIndex].service}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "bg-primary w-8"
                  : "bg-primary/30 hover:bg-primary/50"
              }`}
            />
          ))}
        </div>

        {/* Small Cards Grid */}
        <div className="grid md:grid-cols-4 gap-4 mt-12">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={() => setCurrentIndex(index)}
              className={`cursor-pointer gradient-card rounded-xl p-5 transition-all duration-300 ${
                index === currentIndex
                  ? "shadow-card ring-2 ring-primary/30"
                  : "shadow-soft hover:shadow-card"
              }`}
            >
              <div className="flex gap-0.5 mb-2">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {testimonial.content}
              </p>
              <p className="text-xs font-medium text-foreground">
                {testimonial.name}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
