import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

interface HeaderProps {
  onBookingClick: () => void;
}

export const Header = ({ onBookingClick }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  const navLinks = [
    { label: t("nav.services"), href: "#services" },
    { label: t("nav.about"), href: "#about" },
    { label: t("nav.gallery"), href: "#gallery" },
    { label: t("nav.faq"), href: "#faq" },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="border-b border-white/40 bg-[#fffaf6]/82 shadow-[0_10px_40px_rgba(45,28,24,0.06)] backdrop-blur-xl">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="/" className="font-display text-2xl font-medium text-foreground italic">
              Trinhnai
            </a>

            {/* Desktop Nav */}
            <nav className="hidden items-center gap-1 rounded-full border border-primary/10 bg-white/58 p-1 shadow-soft md:flex">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollToSection(link.href)}
                  className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-all duration-300 hover:bg-[#f4e9e2] hover:text-foreground"
                >
                  {link.label}
                </button>
              ))}
            </nav>

            {/* Desktop CTA & Language */}
            <div className="hidden md:flex items-center gap-4">
              <LanguageSwitcher />
              <Button variant="default" onClick={onBookingClick}>
                {t("nav.booking")}
              </Button>
            </div>

            {/* Mobile Menu Toggle & Language */}
            <div className="md:hidden flex items-center gap-2">
              <LanguageSwitcher />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="w-10 h-10 flex items-center justify-center"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6 text-foreground" />
                ) : (
                  <Menu className="w-6 h-6 text-foreground" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-b border-primary/10 bg-[#fffaf6] shadow-card md:hidden"
        >
          <div className="container mx-auto px-6 py-4 space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="block w-full text-left py-3 text-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </button>
            ))}
            <Button
              variant="hero"
              className="w-full mt-4"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onBookingClick();
              }}
            >
              {t("nav.booking")}
            </Button>
          </div>
        </motion.div>
      )}
    </header>
  );
};
