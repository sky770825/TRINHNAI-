import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, UserRound, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

interface HeaderProps {
  onBookingClick: () => void;
}

export const Header = ({ onBookingClick }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { label: t("nav.services"), href: "#services" },
    { label: t("nav.gallery"), href: "#gallery" },
    { label: t("nav.stores"), href: "#stores" },
    { label: t("nav.faq"), href: "#faq" },
  ];

  const scrollToSection = (href: string) => {
    const scroll = () => {
      const element = document.querySelector(href);
      if (element) element.scrollIntoView({ behavior: "smooth" });
    };

    if (location.pathname !== "/") {
      navigate("/");
      window.setTimeout(scroll, 80);
    } else {
      scroll();
    }
    setIsMobileMenuOpen(false);
  };

  const openMember = () => {
    navigate("/member");
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="border-b border-[#eadbd0] bg-[#fffaf6] shadow-[0_10px_40px_rgba(45,28,24,0.08)]">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              type="button"
              onClick={() => navigate("/")}
              className="font-display text-2xl font-medium italic text-[#241814]"
            >
              Trinhnai
            </button>

            {/* Desktop Nav */}
            <nav className="hidden items-center gap-1 rounded-lg border border-primary/15 bg-white p-1 shadow-soft md:flex">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollToSection(link.href)}
                  className="rounded-md px-4 py-2 text-sm font-semibold text-[#4a332b] transition-all duration-300 hover:bg-[#f4e9e2] hover:text-[#241814]"
                >
                  {link.label}
                </button>
              ))}
            </nav>

            {/* Desktop CTA & Language */}
            <div className="hidden md:flex items-center gap-4">
              <LanguageSwitcher />
              <Button
                variant={location.pathname === "/member" ? "secondary" : "outline"}
                size="sm"
                onClick={openMember}
              >
                <UserRound className="h-4 w-4" />
                {t("nav.member")}
              </Button>
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
            <button
              onClick={openMember}
              className="flex w-full items-center gap-2 py-3 text-left text-foreground transition-colors hover:text-primary"
            >
              <UserRound className="h-4 w-4" />
              {t("nav.member")}
            </button>
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
