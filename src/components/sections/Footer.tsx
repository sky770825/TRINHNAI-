import { Instagram, Facebook, MapPin, Clock, Phone, MessageCircle, Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-mocha text-cream py-16">
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
                className="w-10 h-10 rounded-full bg-cream/10 flex items-center justify-center hover:bg-cream/20 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-cream/10 flex items-center justify-center hover:bg-cream/20 transition-colors"
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
                    href="https://maps.app.goo.gl/iLW9MVSyEXH7u61G8"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-cream hover:text-cream/80 transition-colors inline-flex items-center gap-2 group"
                  >
                    中壢元化店（前站）
                    <ExternalLink className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                  </a>
                  <div className="mt-1 space-y-1">
                    <p className="text-sm whitespace-pre-line">桃園市中壢區元化路40號</p>
                    <a
                      href="https://maps.app.goo.gl/iLW9MVSyEXH7u61G8"
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
                  <p className="font-medium text-cream mb-1">{t("footer.location2")}</p>
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
        <div className="border-t border-cream/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-cream/50 text-sm">
            {t("footer.copyright")}
          </p>
          <div className="flex gap-6 text-sm text-cream/50">
            <a href="#" className="hover:text-cream transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-cream transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
