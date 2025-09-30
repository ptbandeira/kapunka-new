import React, { useState, useEffect, useCallback } from 'react';
import { Link, NavLink } from 'react-router-dom';
// Fix: AnimatePresence was used but not imported.
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Globe, Menu, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useUI } from '../contexts/UIContext';
import type { Language } from '../types';
import { useSiteSettings } from '../contexts/SiteSettingsContext';

const SUPPORTED_LANGUAGES: Array<{ code: Language; name: string }> = [
  { code: 'en', name: 'EN' },
  { code: 'pt', name: 'PT' },
  { code: 'es', name: 'ES' },
];

const NavItem: React.FC<{
  to: string;
  label: string;
  fieldPath?: string;
  sbFieldPath?: string;
  sbObjectId?: string;
  onClick?: () => void;
}> = ({ to, label, fieldPath, sbFieldPath, sbObjectId, onClick }) => {
  const navLinkClassName = useCallback(({ isActive }: { isActive: boolean }) => (
    `relative transition-colors duration-300 ${
      isActive ? 'text-stone-900' : 'text-stone-500 hover:text-stone-900'
    }`
  ), []);

  const renderNavContent = useCallback(({ isActive }: { isActive: boolean }) => (
    <motion.div className="relative" whileHover={{ y: -2 }}>
      <span
        data-nlv-field-path={fieldPath ?? undefined}
        data-sb-field-path={sbFieldPath ?? undefined}
      >
        {label}
      </span>
      {isActive && (
        <motion.div
          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-stone-900"
          layoutId="underline"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
    </motion.div>
  ), [fieldPath, label, sbFieldPath]);

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={navLinkClassName}
      data-sb-field-path={sbFieldPath}
      data-sb-object-id={sbObjectId}
    >
      {renderNavContent}
    </NavLink>
  );
};

const LanguageSelector: React.FC<{ onCloseMobileMenu?: () => void }> = ({ onCloseMobileMenu }) => {
  const { language, setLanguage } = useLanguage();

  const handleLanguageClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const { langCode } = event.currentTarget.dataset;
    if (langCode) {
      setLanguage(langCode as Language);
      if (onCloseMobileMenu) {
        onCloseMobileMenu();
      }
    }
  }, [onCloseMobileMenu, setLanguage]);

  return (
    <div className="flex items-center space-x-2">
      <Globe size={18} className="text-stone-500" />
      {SUPPORTED_LANGUAGES.map((lang, index) => (
        <React.Fragment key={lang.code}>
          <button
            onClick={handleLanguageClick}
            className={`text-sm transition-colors duration-300 ${
              language === lang.code ? 'text-stone-900 font-semibold' : 'text-stone-500 hover:text-stone-900'
            }`}
            data-lang-code={lang.code}
          >
            {lang.name}
          </button>
          {index < SUPPORTED_LANGUAGES.length - 1 && <span className="text-stone-300">|</span>}
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

  const handleMenuToggle = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const handleMenuClose = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const featureFlags = settings.featureFlags ?? {};

  const NAV_LINK_CONFIG: Array<{ to: string; key: string; requires?: keyof typeof featureFlags }> = [
    { to: '/shop', key: 'shop' },
    { to: '/learn', key: 'learn' },
    { to: '/videos', key: 'videos', requires: 'videos' },
    { to: '/training', key: 'training', requires: 'training' },
    { to: '/method', key: 'method' },
    { to: '/for-clinics', key: 'forClinics' },
    { to: '/about', key: 'about' },
    { to: '/contact', key: 'contact' },
  ];

  const navLinks = NAV_LINK_CONFIG
    .filter((link) => (link.requires ? !!featureFlags[link.requires] : true))
    .map((link) => ({
      to: link.to,
      label: t(`nav.${link.key}`),
      fieldPath: `translations.${language}.nav.${link.key}`,
      sbFieldPath: `${language}.${link.key}`,
    }));

  const navTranslationsObjectId = 'translations_nav:content/translations/nav.json';

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
            className="flex items-center justify-between lg:grid lg:grid-cols-[auto_1fr_auto]"
            animate={{ height: isScrolled ? '60px' : '90px' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {/* Brand */}
            <div className="flex flex-1 items-center justify-center lg:flex-none lg:justify-start">
              <Link
                to="/"
                className="text-2xl font-bold tracking-wider text-stone-900 transition-transform duration-300 hover:scale-105 text-center lg:text-left"
              >
                <span data-nlv-field-path="site.brand.name">{brandName}</span>
              </Link>
            </div>

            {/* Centered Navigation */}
            <nav
              className="hidden lg:flex items-center justify-center space-x-8 text-sm font-medium"
              data-sb-object-id={navTranslationsObjectId}
              data-sb-field-path={language}
            >
              {navLinks.map((link, index) => (
                <NavItem
                  key={link.to}
                  to={link.to}
                  label={link.label}
                  fieldPath={link.fieldPath}
                  sbFieldPath={link.sbFieldPath}
                  sbObjectId={navTranslationsObjectId}
                />
              ))}
            </nav>

            {/* Right Side Items */}
            <div className="flex flex-1 items-center justify-end space-x-4 lg:flex-none">
              <div className="hidden lg:block">
                <LanguageSelector />
              </div>

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
                <button onClick={handleMenuToggle} className="p-2">
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
                <Link to="/" onClick={handleMenuClose} className="text-2xl font-bold tracking-wider text-stone-900">
                  <span data-nlv-field-path="site.brand.name">{brandName}</span>
                </Link>
                <button onClick={handleMenuClose} className="p-2">
                  <X size={24} />
                </button>
              </div>
              <nav
                className="flex flex-col items-center space-y-8 text-xl font-medium"
                data-sb-object-id={navTranslationsObjectId}
                data-sb-field-path={language}
              >
                {navLinks.map((link, index) => (
                  <NavItem
                    key={link.to}
                    to={link.to}
                    label={link.label}
                    fieldPath={link.fieldPath}
                    sbFieldPath={link.sbFieldPath}
                    sbObjectId={navTranslationsObjectId}
                    onClick={handleMenuClose}
                  />
                ))}
              </nav>
              <div className="mt-auto mb-12 flex justify-center">
                <LanguageSelector onCloseMobileMenu={handleMenuClose} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
