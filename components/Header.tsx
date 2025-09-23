import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
// Fix: AnimatePresence was used but not imported.
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Globe, Menu, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useUI } from '../contexts/UIContext';
import type { Language } from '../types';
import { useSiteSettings } from '../contexts/SiteSettingsContext';

const NavItem: React.FC<{ to: string; label: string; fieldPath?: string; onClick?: () => void }> = ({ to, label, fieldPath, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `relative transition-colors duration-300 ${
        isActive ? 'text-stone-900' : 'text-stone-500 hover:text-stone-900'
      }`
    }
  >
    {({ isActive }) => (
      <motion.div className="relative" whileHover={{ y: -2 }}>
        <span data-nlv-field-path={fieldPath ?? undefined}>{label}</span>
        {isActive && (
          <motion.div
            className="absolute -bottom-1 left-0 right-0 h-0.5 bg-stone-900"
            layoutId="underline"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
      </motion.div>
    )}
  </NavLink>
);

const LanguageSelector: React.FC<{ onCloseMobileMenu?: () => void }> = ({ onCloseMobileMenu }) => {
    const { language, setLanguage } = useLanguage();
    const languages: { code: Language, name: string }[] = [{ code: 'en', name: 'EN' }, { code: 'pt', name: 'PT' }, { code: 'es', name: 'ES' }];

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        if (onCloseMobileMenu) onCloseMobileMenu();
    };

    return (
        <div className="flex items-center space-x-2">
            <Globe size={18} className="text-stone-500" />
            {languages.map((lang, index) => (
                <React.Fragment key={lang.code}>
                    <button
                        onClick={() => handleSetLanguage(lang.code)}
                        className={`text-sm transition-colors duration-300 ${
                            language === lang.code ? 'text-stone-900 font-semibold' : 'text-stone-500 hover:text-stone-900'
                        }`}
                    >
                        {lang.name}
                    </button>
                    {index < languages.length - 1 && <span className="text-stone-300">|</span>}
                </React.Fragment>
            ))}
        </div>
    );
};

const Header: React.FC = () => {
  const { t, language } = useLanguage();
  const { cartCount } = useCart();
  const { toggleCart } = useUI();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { settings } = useSiteSettings();
  const brandName = settings.brand?.name ?? 'KAPUNKA';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { to: '/shop', label: t('nav.shop'), fieldPath: `translations.${language}.nav.shop` },
    { to: '/learn', label: t('nav.learn'), fieldPath: `translations.${language}.nav.learn` },
    { to: '/method', label: t('nav.method'), fieldPath: `translations.${language}.nav.method` },
    { to: '/for-clinics', label: t('nav.forClinics'), fieldPath: `translations.${language}.nav.forClinics` },
    { to: '/about', label: t('nav.about'), fieldPath: `translations.${language}.nav.about` },
    { to: '/contact', label: t('nav.contact'), fieldPath: `translations.${language}.nav.contact` },
  ];

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50"
        initial={false}
        animate={{
          backgroundColor: isScrolled ? 'rgba(245, 245, 244, 0.8)' : 'rgba(245, 245, 244, 0)',
          backdropFilter: isScrolled ? 'blur(10px)' : 'blur(0px)',
          boxShadow: isScrolled ? '0 1px 3px 0 rgb(0 0 0 / 0.05)' : 'none'
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="flex items-center justify-between"
            animate={{ height: isScrolled ? '60px' : '90px' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {/* Left Nav for larger screens */}
            <nav className="hidden lg:flex items-center space-x-8 text-sm font-medium">
              {navLinks.slice(0, 2).map(link => (
                <NavItem key={link.to} to={link.to} label={link.label} fieldPath={link.fieldPath} />
              ))}
            </nav>

            {/* Logo */}
            <div className="absolute left-1/2 -translate-x-1/2">
                <Link to="/" className="text-2xl font-bold tracking-wider text-stone-900 transition-transform duration-300 hover:scale-105">
                <span data-nlv-field-path="site.brand.name">{brandName}</span>
                </Link>
            </div>

            {/* Right Side Items */}
            <div className="flex items-center space-x-4">
                <nav className="hidden lg:flex items-center space-x-8 text-sm font-medium">
                    {navLinks.slice(2).map(link => (
                        <NavItem key={link.to} to={link.to} label={link.label} fieldPath={link.fieldPath} />
                    ))}
                </nav>

                <div className="hidden lg:block"><LanguageSelector /></div>
                
                <button onClick={toggleCart} className="relative p-2 transition-transform duration-300 hover:scale-110">
                    <ShoppingBag size={20} />
                    {cartCount > 0 && (
                        <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-stone-800 text-white text-xs font-bold flex items-center justify-center">
                            {cartCount}
                        </span>
                    )}
                </button>

                {/* Mobile Menu Button */}
                <div className="lg:hidden">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
                        <Menu size={24} />
                    </button>
                </div>
            </div>
          </motion.div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-stone-50 lg:hidden"
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 h-full flex flex-col">
              <div className="flex justify-between items-center mb-12">
                <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-2xl font-bold tracking-wider text-stone-900">
                  <span data-nlv-field-path="site.brand.name">{brandName}</span>
                </Link>
                <button onClick={() => setIsMenuOpen(false)} className="p-2">
                  <X size={24} />
                </button>
              </div>
              <nav className="flex flex-col items-center space-y-8 text-xl font-medium">
                {navLinks.map(link => (
                  <NavItem key={link.to} to={link.to} label={link.label} fieldPath={link.fieldPath} onClick={() => setIsMenuOpen(false)} />
                ))}
              </nav>
              <div className="mt-auto mb-12 flex justify-center">
                <LanguageSelector onCloseMobileMenu={() => setIsMenuOpen(false)} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;