
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'true');
    setIsVisible(false);
    // Here you would initialize analytics
    console.log("Analytics cookies accepted.");
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'false');
    setIsVisible(false);
    console.log("Analytics cookies declined.");
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: '0%' }}
          exit={{ y: '100%' }}
          transition={{ ease: "easeInOut", duration: 0.5 }}
          className="fixed bottom-0 left-0 right-0 bg-stone-800 text-white p-4 z-50 shadow-lg"
        >
          <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-stone-300">
              {t('cookies.message')} <a href="#/policy/privacy" className="underline hover:text-white">{t('cookies.learnMore')}</a>
            </p>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={handleDecline}
                className="text-sm px-4 py-2 rounded-md bg-stone-700 hover:bg-stone-600 transition-colors"
              >
                {t('cookies.decline')}
              </button>
              <button
                onClick={handleAccept}
                className="text-sm px-4 py-2 rounded-md bg-white text-stone-900 font-semibold hover:bg-stone-200 transition-colors"
              >
                {t('cookies.accept')}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
