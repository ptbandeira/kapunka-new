import React, { useState, useEffect, useCallback } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
// Fix: AnimatePresence was used but not imported.
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Menu, X, Search as SearchIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useUI } from '../contexts/UIContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';
import LanguageSwitcher from './LanguageSwitcher';
import { buildLocalizedPath, removeLocaleFromPath } from '../utils/localePaths';

type NavDropdownChild = {
  key: string;
  path: string;
  fallback: string;
};

type NavLinkConfig = {
  type: 'link';
  key: string;
  path: string;
  fallback: string;
};

type NavDropdownConfig = {
  type: 'dropdown';
  key: string;
  path: string;
  fallback: string;
  items: NavDropdownChild[];
};

type NavLanguageConfig = {
  type: 'language-switcher';
};

type NavConfigItem = NavLinkConfig | NavDropdownConfig | NavLanguageConfig;

type ResolvedNavDropdownChild = NavDropdownChild & {
  to: string;
  label: string;
  fieldPath?: string;
  sbFieldPath?: string;
};

type ResolvedNavLinkConfig = NavLinkConfig & {
  to: string;
  label: string;
  fieldPath?: string;
  sbFieldPath?: string;
};

type ResolvedNavDropdownConfig = NavDropdownConfig & {
  to: string;
  label: string;
  fieldPath?: string;
  sbFieldPath?: string;
  items: ResolvedNavDropdownChild[];
};

type ResolvedNavItem = ResolvedNavLinkConfig | ResolvedNavDropdownConfig | NavLanguageConfig;

const NAVIGATION_CONFIG: NavConfigItem[] = [
  { type: 'link', key: 'shop', path: '/shop', fallback: 'Shop' },
  {
    type: 'dropdown',
    key: 'learn',
    path: '/learn',
    fallback: 'Learn',
    items: [
      { key: 'manifesto', path: '/story', fallback: 'Manifesto & Story' },
      { key: 'videos', path: '/videos', fallback: 'Videos' },
      { key: 'productEducation', path: '/product-education', fallback: 'Product Education' },
      { key: 'method', path: '/method', fallback: 'Method' },
    ],
  },
  {
    type: 'dropdown',
    key: 'forProfessionals',
    path: '/training',
    fallback: 'For Professionals',
    items: [
      { key: 'training', path: '/training', fallback: 'Training' },
      { key: 'clinics', path: '/for-clinics', fallback: 'Clinics' },
    ],
  },
  { type: 'link', key: 'about', path: '/about', fallback: 'About' },
  { type: 'link', key: 'contact', path: '/contact', fallback: 'Contact' },
  { type: 'language-switcher' },
];

const NavItem: React.FC<{
  to: string;
  label: string;
  fieldPath?: string;
  sbFieldPath?: string;
  sbObjectId?: string;
  onClick?: () => void;
  isActiveOverride?: boolean;
  ariaHaspopup?: React.AriaAttributes['aria-haspopup'];
  ariaExpanded?: boolean;
}> = ({
  to,
  label,
  fieldPath,
  sbFieldPath,
  sbObjectId,
  onClick,
  isActiveOverride,
  ariaHaspopup,
  ariaExpanded,
}) => {
  const navLinkClassName = useCallback(({ isActive }: { isActive: boolean }) => {
    const active = isActiveOverride ?? isActive;
    return `relative transition-colors duration-300 ${
      active ? 'text-stone-900' : 'text-stone-500 hover:text-stone-900'
    }`;
  }, [isActiveOverride]);

  const renderNavContent = useCallback(({ isActive }: { isActive: boolean }) => {
    const active = isActiveOverride ?? isActive;
    return (
      <motion.div className="relative" whileHover={{ y: -2 }}>
        <span
          {...getVisualEditorAttributes(fieldPath ?? undefined)}
          data-sb-field-path={sbFieldPath ?? undefined}
        >
          {label}
        </span>
        {active && (
          <motion.div
            className="absolute -bottom-1 left-0 right-0 h-0.5 bg-stone-900"
            layoutId="underline"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
      </motion.div>
    );
  }, [fieldPath, isActiveOverride, label, sbFieldPath]);

  const navLinkProps = isActiveOverride ? { 'aria-current': 'page' as const } : {};

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => navLinkClassName({ isActive })}
      data-sb-field-path={sbFieldPath}
      data-sb-object-id={sbObjectId}
      aria-haspopup={ariaHaspopup}
      aria-expanded={ariaExpanded}
      {...navLinkProps}
    >
      {({ isActive }) => renderNavContent({ isActive })}
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
  const searchPath = buildLocalizedPath('/search', language);
  const location = useLocation();
  const currentBasePath = removeLocaleFromPath(location.pathname);

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

  const isPathMatch = useCallback((basePath: string, targetPath: string) => {
    if (targetPath === '/') {
      return basePath === '/';
    }

    return basePath === targetPath || basePath.startsWith(`${targetPath}/`);
  }, []);

  const getNavTranslation = useCallback((key: string, fallback: string) => {
    const translated = t(`nav.${key}`);
    const isTranslated = translated !== `nav.${key}`;

    return {
      label: isTranslated ? translated : fallback,
      fieldPath: isTranslated ? `translations.${language}.nav.${key}` : undefined,
      sbFieldPath: isTranslated ? `${language}.${key}` : undefined,
    };
  }, [language, t]);

  const navItems: ResolvedNavItem[] = NAVIGATION_CONFIG.map((item) => {
    if (item.type === 'language-switcher') {
      return item;
    }

    const translation = getNavTranslation(item.key, item.fallback);
    const to = buildLocalizedPath(item.path, language);

    if (item.type === 'link') {
      const resolvedLink: ResolvedNavLinkConfig = {
        ...item,
        ...translation,
        to,
      };

      return resolvedLink;
    }

    const items: ResolvedNavDropdownChild[] = item.items.map((child) => {
      const childTranslation = getNavTranslation(child.key, child.fallback);
      const resolvedChild: ResolvedNavDropdownChild = {
        ...child,
        ...childTranslation,
        to: buildLocalizedPath(child.path, language),
      };

      return resolvedChild;
    });

    const resolvedDropdown: ResolvedNavDropdownConfig = {
      ...item,
      ...translation,
      to,
      items,
    };

    return resolvedDropdown;
  });

  const hasLanguageSwitcher = navItems.some((item) => item.type === 'language-switcher');

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
              {navItems.map((item) => {
                if (item.type === 'language-switcher') {
                  return (
                    <div key="language-switcher" className="hidden lg:block">
                      <LanguageSwitcher />
                    </div>
                  );
                }

                if (item.type === 'link') {
                  return (
                    <NavItem
                      key={item.to}
                      to={item.to}
                      label={item.label}
                      fieldPath={item.fieldPath}
                      sbFieldPath={item.sbFieldPath}
                      sbObjectId={navTranslationsObjectId}
                    />
                  );
                }

                const dropdownBasePath = removeLocaleFromPath(item.to);
                const isTopLevelActive = isPathMatch(currentBasePath, dropdownBasePath);
                const isChildActive = item.items.some((child) =>
                  isPathMatch(currentBasePath, removeLocaleFromPath(child.to)),
                );
                const isActive = isTopLevelActive || isChildActive;

                return (
                  <div key={item.to} className="relative group">
                    <NavItem
                      to={item.to}
                      label={item.label}
                      fieldPath={item.fieldPath}
                      sbFieldPath={item.sbFieldPath}
                      sbObjectId={navTranslationsObjectId}
                      isActiveOverride={isActive}
                      ariaHaspopup="menu"
                      ariaExpanded={isActive}
                    />
                    <div
                      className="pointer-events-none absolute left-1/2 top-full mt-4 flex min-w-[220px] -translate-x-1/2 flex-col rounded-lg bg-stone-50 p-4 text-left shadow-lg opacity-0 transition-opacity duration-150 ease-out group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100"
                    >
                      {item.items.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          className={({ isActive }) => `block whitespace-nowrap text-sm transition-colors duration-300 ${
                            isActive ? 'text-stone-900' : 'text-stone-500 hover:text-stone-900'
                          }`}
                          data-sb-field-path={child.sbFieldPath}
                          data-sb-object-id={navTranslationsObjectId}
                        >
                          <span
                            {...getVisualEditorAttributes(child.fieldPath ?? undefined)}
                            data-sb-field-path={child.sbFieldPath ?? undefined}
                          >
                            {child.label}
                          </span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* Right Side Items */}
            <div className="flex flex-1 items-center justify-end space-x-4 lg:flex-none">
              {!hasLanguageSwitcher && (
                <div className="hidden lg:block">
                  <LanguageSwitcher />
                </div>
              )}

              <button
                onClick={toggleCart}
                className="relative p-2 transition-transform duration-300 hover:scale-110"
                aria-label="Open cart"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-stone-800 text-white text-xs font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

              <Link
                to={searchPath}
                className="p-2 transition-transform duration-300 hover:scale-110"
                aria-label="Search"
              >
                <SearchIcon size={20} />
              </Link>

              {/* Mobile Menu Button */}
              <div className="lg:hidden">
                <button
                  onClick={handleMenuToggle}
                  className="p-2"
                  aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                >
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
                {navItems.map((item) => {
                  if (item.type === 'language-switcher') {
                    return null;
                  }

                  if (item.type === 'link') {
                    return (
                      <NavItem
                        key={item.to}
                        to={item.to}
                        label={item.label}
                        fieldPath={item.fieldPath}
                        sbFieldPath={item.sbFieldPath}
                        sbObjectId={navTranslationsObjectId}
                        onClick={handleMenuClose}
                      />
                    );
                  }

                  const dropdownBasePath = removeLocaleFromPath(item.to);
                  const isTopLevelActive = isPathMatch(currentBasePath, dropdownBasePath);
                  const isChildActive = item.items.some((child) =>
                    isPathMatch(currentBasePath, removeLocaleFromPath(child.to)),
                  );
                  const isActive = isTopLevelActive || isChildActive;

                  return (
                    <div key={item.to} className="flex w-full flex-col items-center space-y-6">
                      <NavItem
                        to={item.to}
                        label={item.label}
                        fieldPath={item.fieldPath}
                        sbFieldPath={item.sbFieldPath}
                        sbObjectId={navTranslationsObjectId}
                        onClick={handleMenuClose}
                        isActiveOverride={isActive}
                        ariaHaspopup="menu"
                        ariaExpanded={isActive}
                      />
                      <div className="flex w-full flex-col items-center space-y-4 text-lg">
                        {item.items.map((child) => (
                          <NavLink
                            key={child.to}
                            to={child.to}
                            onClick={handleMenuClose}
                            className={({ isActive }) => `text-center transition-colors duration-300 ${
                              isActive ? 'text-stone-900' : 'text-stone-500 hover:text-stone-900'
                            }`}
                            data-sb-field-path={child.sbFieldPath}
                            data-sb-object-id={navTranslationsObjectId}
                          >
                            <span
                              {...getVisualEditorAttributes(child.fieldPath ?? undefined)}
                              data-sb-field-path={child.sbFieldPath ?? undefined}
                            >
                              {child.label}
                            </span>
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  );
                })}
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
