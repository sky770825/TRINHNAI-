import { ExternalLink, Instagram, Facebook, MapPin, Clock, Phone, MessageCircle, Mail, Navigation } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#2d211d] py-16 text-[#fff7ef]">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="font-display text-3xl font-medium mb-4 italic">Trinhnai</h3>
            <p className="text-cream/70 leading-relaxed mb-6">
              {t("hero.badge")}
              <br />
              {t("hero.headline1")}{t("hero.headline2")}
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-white/18"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-white/18"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-display text-xl font-medium mb-4">{t("footer.contact")}</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-cream/50" />
                <p className="text-cream/70">0909-318-666</p>
              </div>
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-cream/50" />
                <a 
                  href="https://line.me/R/ti/p/@355uniyb" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-cream/70 hover:text-cream transition-colors"
                >
                  LINE: @355uniyb
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-cream/50" />
                <a href="mailto:Trinhnguyen910327@gmail.com" className="text-cream/70 hover:text-cream transition-colors">
                  Trinhnguyen910327@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Locations */}
          <div>
            <h4 className="font-display text-xl font-medium mb-4">{t("footer.locations")}</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-cream/50 flex-shrink-0 mt-0.5" />
                <div className="text-cream/70">
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Trinh+Nail+%E4%B8%AD%E5%A3%A2%E5%85%83%E5%8C%96%E5%BA%97+%E4%B8%AD%E5%A3%A2%E5%8D%80%E5%85%83%E5%8C%96%E8%B7%AF"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-cream hover:text-cream/80 transition-colors inline-flex items-center gap-2 group"
                  >
                    中壢元化店（前站）
                    <ExternalLink className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                  </a>
                  <div className="mt-1 space-y-1">
                    <p className="text-sm whitespace-pre-line">中壢區元化路（前站）</p>
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Trinh+Nail+%E4%B8%AD%E5%A3%A2%E5%85%83%E5%8C%96%E5%BA%97+%E4%B8%AD%E5%A3%A2%E5%8D%80%E5%85%83%E5%8C%96%E8%B7%AF"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cream/60 hover:text-cream/80 transition-colors inline-flex items-center gap-1 underline underline-offset-2"
                    >
                      <Navigation className="w-3 h-3" />
                      點擊導航
                    </a>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-cream/50 flex-shrink-0 mt-0.5" />
                <div className="text-cream/70">
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Trinh+Nail+%E4%B8%AD%E5%A3%A2%E5%BF%A0%E7%A6%8F%E5%BA%97+%E4%B8%AD%E5%A3%A2%E5%8D%80%E5%BF%A0%E7%A6%8F%E8%B7%AF"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-cream hover:text-cream/80 transition-colors inline-flex items-center gap-2 group"
                  >
                    {t("footer.location2")}
                    <ExternalLink className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                  </a>
                  <div className="mt-1 space-y-1">
                    <p className="text-sm whitespace-pre-line">中壢區忠福路（黃昏市場對面）</p>
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Trinh+Nail+%E4%B8%AD%E5%A3%A2%E5%BF%A0%E7%A6%8F%E5%BA%97+%E4%B8%AD%E5%A3%A2%E5%8D%80%E5%BF%A0%E7%A6%8F%E8%B7%AF"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cream/60 hover:text-cream/80 transition-colors inline-flex items-center gap-1 underline underline-offset-2"
                    >
                      <Navigation className="w-3 h-3" />
                      點擊導航
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-display text-xl font-medium mb-4">{t("footer.hours")}</h4>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-cream/50 flex-shrink-0 mt-0.5" />
              <div className="text-cream/70">
                <p className="font-medium text-cream">{t("footer.hours.value")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-sm text-white/52">
            {t("footer.copyright")}
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <a href="#/member" className="rounded-md bg-white/10 px-4 py-2 text-white/78 transition-colors hover:bg-white/16 hover:text-white">
              會員查詢
            </a>
            <a href="https://line.me/R/ti/p/@355uniyb" target="_blank" rel="noopener noreferrer" className="rounded-md bg-white/10 px-4 py-2 text-white/78 transition-colors hover:bg-white/16 hover:text-white">
              LINE 諮詢
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
