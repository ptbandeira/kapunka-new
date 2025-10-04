import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Helmet, HelmetProvider } from 'react-helmet-async';

import Header from './components/Header';
import Footer from './components/Footer';
import MiniCart from './components/MiniCart';
import CookieConsent from './components/CookieConsent';
import { useSiteSettings } from './contexts/SiteSettingsContext';
import { useLanguage } from './contexts/LanguageContext';
import type { Language, LocalizedText } from './types';
import { ensureVisualEditorAnnotations } from './utils/visualEditorAnnotations';
import { isVisualEditorRuntime } from './utils/visualEditorRuntime';

const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Learn = lazy(() => import('./pages/Learn'));
const ArticlePage = lazy(() => import('./pages/Article'));
const ForClinics = lazy(() => import('./pages/ForClinics'));
const About = lazy(() => import('./pages/About'));
const Story = lazy(() => import('./pages/Story'));
const Contact = lazy(() => import('./pages/Contact'));
const CartPage = lazy(() => import('./pages/CartPage'));
const PolicyPage = lazy(() => import('./pages/PolicyPage'));
const Academy = lazy(() => import('./pages/Academy'));
const Method = lazy(() => import('./pages/Method'));
const Videos = lazy(() => import('./pages/Videos'));
const Training = lazy(() => import('./pages/Training'));
const FounderStoryPage = lazy(() => import('./pages/FounderStory'));
const MethodKapunkaPage = lazy(() => import('./pages/MethodKapunka'));
const TrainingProgramPage = lazy(() => import('./pages/TrainingProgram'));
const ProductEducationPage = lazy(() => import('./pages/ProductEducation'));

const pageVariants = {
  initial: {
    opacity: 0,
    y: 30,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -30,
  },
};

// Fix: Add `as const` to correctly type the transition for framer-motion.
const pageTransition = {
  type: 'tween',
  ease: [0.43, 0.13, 0.23, 0.96], // Custom bezier curve for a premium feel
  duration: 0.7,
} as const;

const FALLBACK_TITLE = 'Kapunka Skincare';
const FALLBACK_DESCRIPTION =
  'Premium skincare for a healthy skin barrier. Clean, minimal, and elegant products.';

const languageFallbackOrder: Language[] = ['en', 'pt', 'es'];

const getLocalizedValue = (
  value: LocalizedText | undefined,
  language: Language,
): string | undefined => {
  if (!value) {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  const candidates: Language[] = [language, ...languageFallbackOrder.filter((lang) => lang !== language)];
  for (const lang of candidates) {
    const localized = value[lang];
    if (localized) {
      const trimmed = localized.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }

  return undefined;
};

const PageWrapper: React.FC<{ children: React.ReactNode; pageKey: string; }> = ({ children, pageKey }) => (
  <motion.div
    key={pageKey}
    initial="initial"
    animate="in"
    exit="out"
    variants={pageVariants}
    transition={pageTransition}
    className="flex-grow"
  >
    {children}
  </motion.div>
);

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper pageKey="home"><Home /></PageWrapper>} />
        <Route path="/shop" element={<PageWrapper pageKey="shop"><Shop /></PageWrapper>} />
        <Route path="/product/:id" element={<PageWrapper pageKey="product"><ProductDetail /></PageWrapper>} />
        <Route path="/learn" element={<PageWrapper pageKey="learn"><Learn /></PageWrapper>} />
        <Route path="/learn/:slug" element={<PageWrapper pageKey="article"><ArticlePage /></PageWrapper>} />
        <Route path="/videos" element={<PageWrapper pageKey="videos"><Videos /></PageWrapper>} />
        <Route path="/training" element={<PageWrapper pageKey="training"><Training /></PageWrapper>} />
        <Route path="/training-program" element={<PageWrapper pageKey="training-program"><TrainingProgramPage /></PageWrapper>} />
        <Route path="/method" element={<PageWrapper pageKey="method"><Method /></PageWrapper>} />
        <Route path="/method-kapunka" element={<PageWrapper pageKey="method-kapunka"><MethodKapunkaPage /></PageWrapper>} />
        <Route path="/for-clinics" element={<PageWrapper pageKey="clinics"><ForClinics /></PageWrapper>} />
        <Route path="/academy" element={<PageWrapper pageKey="academy"><Academy /></PageWrapper>} />
        <Route path="/story" element={<PageWrapper pageKey="story"><Story /></PageWrapper>} />
        <Route path="/founder-story" element={<PageWrapper pageKey="founder-story"><FounderStoryPage /></PageWrapper>} />
        <Route path="/product-education" element={<PageWrapper pageKey="product-education"><ProductEducationPage /></PageWrapper>} />
        <Route path="/about" element={<PageWrapper pageKey="about"><About /></PageWrapper>} />
        <Route path="/contact" element={<PageWrapper pageKey="contact"><Contact /></PageWrapper>} />
        <Route path="/cart" element={<PageWrapper pageKey="cart"><CartPage /></PageWrapper>} />
        <Route path="/policy/:type" element={<PageWrapper pageKey="policy"><PolicyPage /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
};

const RouteFallback: React.FC = () => (
  <div className="flex h-[50vh] items-center justify-center" role="status" aria-live="polite">
    <span className="text-sm font-medium text-stone-500">Loading…</span>
  </div>
);

const App: React.FC = () => {
  const { settings } = useSiteSettings();
  const { language } = useLanguage();
  const defaultTitle = getLocalizedValue(settings.seo?.defaultTitle, language) ?? FALLBACK_TITLE;
  const defaultDescription =
    getLocalizedValue(settings.seo?.defaultDescription, language) ?? FALLBACK_DESCRIPTION;

  useEffect(() => {
    if (!isVisualEditorRuntime()) {
      return;
    }

    ensureVisualEditorAnnotations();
  }, []);

  return (
    <HelmetProvider>
      <BrowserRouter>
        <div className="bg-stone-50 text-stone-800 min-h-screen flex flex-col">
          <Helmet>
            <title>{defaultTitle}</title>
            <meta name="description" content={defaultDescription} />
          </Helmet>
          <Header />
          <main className="flex-grow pt-[72px]">
            <Suspense fallback={<RouteFallback />}>
              <AnimatedRoutes />
            </Suspense>
          </main>
          <Footer />
          <MiniCart />
          <CookieConsent />
        </div>
      </BrowserRouter>
    </HelmetProvider>
  );
};

export default App;
