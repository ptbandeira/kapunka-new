import React, { Suspense, lazy, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useParams,
  useNavigate,
  Outlet,
  Navigate,
} from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { HelmetProvider } from 'react-helmet-async';

import Header from './components/Header';
import Footer from './components/Footer';
import MiniCart from './components/MiniCart';
import CookieConsent from './components/CookieConsent';
import { useSiteSettings } from './contexts/SiteSettingsContext';
import { useLanguage } from './contexts/LanguageContext';
import type { Language, LocalizedText } from './types';
import {
  buildLocalizedPath,
  getLocaleFromPath,
  isSupportedLanguage,
  removeLocaleFromPath,
} from './utils/localePaths';
import Seo from './src/components/Seo';

const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Learn = lazy(() => import('./pages/Learn'));
const ArticlePage = lazy(() => import('./pages/Article'));
const ForClinics = lazy(() => import('./pages/for-clinics'));
const About = lazy(() => import('./pages/About'));
const StoryManifestoPage = lazy(() => import('./pages/story'));
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

const DEFAULT_LANGUAGE: Language = 'en';
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

  const normalize = (candidate: string | undefined): string | undefined => {
    if (typeof candidate !== 'string') {
      return undefined;
    }
    const trimmed = candidate.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };

  const directMatch = normalize(value[language]);
  if (directMatch) {
    return directMatch;
  }

  if (language !== 'en') {
    const englishFallback = normalize(value.en);
    if (englishFallback) {
      return englishFallback;
    }
  }

  const additionalFallbacks = languageFallbackOrder.filter((lang) => lang !== language && lang !== 'en');
  for (const fallbackLanguage of additionalFallbacks) {
    const fallbackValue = normalize(value[fallbackLanguage]);
    if (fallbackValue) {
      return fallbackValue;
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

type RouteDefinition = {
  key: string;
  element: React.ReactNode;
  path?: string;
  index?: boolean;
};

const routeDefinitions: RouteDefinition[] = [
  { key: 'home', element: <Home />, index: true },
  { key: 'shop', path: 'shop', element: <Shop /> },
  { key: 'product', path: 'product/:id', element: <ProductDetail /> },
  { key: 'learn', path: 'learn', element: <Learn /> },
  { key: 'article', path: 'learn/:slug', element: <ArticlePage /> },
  { key: 'videos', path: 'videos', element: <Videos /> },
  { key: 'training', path: 'training', element: <Training /> },
  { key: 'training-program', path: 'training-program', element: <TrainingProgramPage /> },
  { key: 'method', path: 'method', element: <Method /> },
  { key: 'method-kapunka', path: 'method-kapunka', element: <MethodKapunkaPage /> },
  { key: 'clinics', path: 'for-clinics', element: <ForClinics /> },
  { key: 'academy', path: 'academy', element: <Academy /> },
  { key: 'story', path: 'story', element: <StoryManifestoPage /> },
  { key: 'founder-story', path: 'founder-story', element: <FounderStoryPage /> },
  { key: 'product-education', path: 'product-education', element: <ProductEducationPage /> },
  { key: 'about', path: 'about', element: <About /> },
  { key: 'contact', path: 'contact', element: <Contact /> },
  { key: 'cart', path: 'cart', element: <CartPage /> },
  { key: 'policy', path: 'policy/:type', element: <PolicyPage /> },
];

const renderRoutes = (definitions: RouteDefinition[]) => definitions.map((route) => {
  const element = (
    <PageWrapper pageKey={route.key}>
      {route.element}
    </PageWrapper>
  );

  if (route.index) {
    return <Route index element={element} key={route.key} />;
  }

  return <Route path={route.path} element={element} key={route.key} />;
});

const LocalizedLayout: React.FC = () => {
  const params = useParams<{ locale?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const pathLocale = getLocaleFromPath(location.pathname);
  const routeLocale = params.locale;

  useEffect(() => {
    if (routeLocale && !isSupportedLanguage(routeLocale)) {
      const fallbackPath = removeLocaleFromPath(location.pathname);
      navigate(`${fallbackPath}${location.search}${location.hash}`, { replace: true });
      return;
    }

    const currentLocale = routeLocale && isSupportedLanguage(routeLocale)
      ? routeLocale
      : pathLocale;

    if (!currentLocale) {
      if (language !== DEFAULT_LANGUAGE) {
        const targetPath = buildLocalizedPath(location.pathname, language);
        if (targetPath !== location.pathname) {
          navigate(`${targetPath}${location.search}${location.hash}`, { replace: true });
          return;
        }

        setLanguage(DEFAULT_LANGUAGE);
      }
      return;
    }

    if (currentLocale === DEFAULT_LANGUAGE) {
      const normalizedPath = removeLocaleFromPath(location.pathname);
      if (normalizedPath !== location.pathname) {
        navigate(`${normalizedPath}${location.search}${location.hash}`, { replace: true });
        return;
      }

      if (language !== DEFAULT_LANGUAGE) {
        setLanguage(DEFAULT_LANGUAGE);
      }
      return;
    }

    if (language !== currentLocale) {
      setLanguage(currentLocale as Language);
    }
  }, [
    language,
    location.hash,
    location.pathname,
    location.search,
    navigate,
    pathLocale,
    routeLocale,
    setLanguage,
  ]);

  return <Outlet />;
};

const AppRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/:locale(en|pt|es)" element={<LocalizedLayout />}>
          {renderRoutes(routeDefinitions)}
        </Route>
        <Route path="/" element={<LocalizedLayout />}>
          {renderRoutes(routeDefinitions)}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
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

  return (
    <HelmetProvider>
      <BrowserRouter>
        <div className="bg-stone-50 text-stone-800 min-h-screen flex flex-col">
          <Seo title={defaultTitle} description={defaultDescription} locale={language} />
          <Header />
          <main className="flex-grow pt-[72px]">
            <Suspense fallback={<RouteFallback />}>
              <AppRoutes />
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
