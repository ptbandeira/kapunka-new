import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Helmet, HelmetProvider } from 'react-helmet-async';

import Header from './components/Header';
import Footer from './components/Footer';
import MiniCart from './components/MiniCart';
import CookieConsent from './components/CookieConsent';

import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Learn from './pages/Learn';
// Fix: The component name in `pages/Article.tsx` is `ArticlePage`.
// Updated the import statement to match the new component name.
import ArticlePage from './pages/Article';
import ForClinics from './pages/ForClinics';
import About from './pages/About';
import Contact from './pages/Contact';
import CartPage from './pages/CartPage';
import PolicyPage from './pages/PolicyPage';
import Academy from './pages/Academy';

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
        <Route path="/for-clinics" element={<PageWrapper pageKey="clinics"><ForClinics /></PageWrapper>} />
        <Route path="/academy" element={<PageWrapper pageKey="academy"><Academy /></PageWrapper>} />
        <Route path="/about" element={<PageWrapper pageKey="about"><About /></PageWrapper>} />
        <Route path="/contact" element={<PageWrapper pageKey="contact"><Contact /></PageWrapper>} />
        <Route path="/cart" element={<PageWrapper pageKey="cart"><CartPage /></PageWrapper>} />
        <Route path="/policy/:type" element={<PageWrapper pageKey="policy"><PolicyPage /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <HashRouter>
        <div className="bg-stone-50 text-stone-800 min-h-screen flex flex-col">
          <Helmet>
            <title>Kapunka Skincare</title>
            <meta name="description" content="Premium skincare for a healthy skin barrier. Clean, minimal, and elegant products." />
          </Helmet>
          <Header />
          <main className="flex-grow pt-[72px]">
            <AnimatedRoutes />
          </main>
          <Footer />
          <MiniCart />
          <CookieConsent />
        </div>
      </HashRouter>
    </HelmetProvider>
  );
};

export default App;