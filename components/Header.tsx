import React, { useState, useEffect, useCallback } from 'react';
import { Link, NavLink } from 'react-router-dom';
// Fix: AnimatePresence was used but not imported.
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useUI } from '../contexts/UIContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';
import LanguageSwitcher from './LanguageSwitcher';
import { buildLocalizedPath } from '../utils/localePaths';

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
        {...getVisualEditorAttributes(fieldPath ?? undefined)}
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

const Header: React.FC = () => {
  const { t, language, translate } = useLanguage();
  const { cartCount } = useCart();
  const { toggleCart } = useUI();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { settings } = useSiteSettings();
  const brandName = translate(settings.brand?.name ?? 'KAPUNKA');
  const homePath = buildLocalizedPath('/', language);

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

  const NAV_LINK_CONFIG: Array<{ path: string; key: string }> = [
    { path: '/shop', key: 'shop' },
    { path: '/learn', key: 'learn' },
    { path: '/story', key: 'manifesto' },
    { path: '/videos', key: 'videos' },
    { path: '/training-program', key: 'training' },
    { path: '/method-kapunka', key: 'method' },
    { path: '/for-clinics', key: 'forClinics' },
    { path: '/about', key: 'about' },
    { path: '/contact', key: 'contact' },
  ];

  const navLinks = NAV_LINK_CONFIG.map((link) => ({
      to: buildLocalizedPath(link.path, language),
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
                to={homePath}
                className="text-2xl font-bold tracking-wider text-stone-900 transition-transform duration-300 hover:scale-105 text-center lg:text-left"
              >
                <span {...getVisualEditorAttributes('site.brand.name')}>{brandName}</span>
              </Link>
            </div>

            {/* Centered Navigation */}
            <nav
              className="hidden lg:flex items-center justify-center space-x-8 text-sm font-medium"
              data-sb-object-id={navTranslationsObjectId}
              data-sb-field-path={language}
            >
              {navLinks.map((link) => (
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
                <LanguageSwitcher />
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
                <Link to={homePath} onClick={handleMenuClose} className="text-2xl font-bold tracking-wider text-stone-900">
                  <span {...getVisualEditorAttributes('site.brand.name')}>{brandName}</span>
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
                {navLinks.map((link) => (
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
                <LanguageSwitcher onSelect={handleMenuClose} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
