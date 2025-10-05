import React, { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import type { Language } from '../types';
import {
  buildLocalizedPath,
  isSupportedLanguage,
  removeLocaleFromPath,
  SUPPORTED_LANGUAGES,
} from '../utils/localePaths';

const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'EN',
  pt: 'PT',
  es: 'ES',
};

interface LanguageSwitcherProps {
  onSelect?: () => void;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ onSelect }) => {
  const { language, setLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLanguageClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const { langCode } = event.currentTarget.dataset;
    if (!isSupportedLanguage(langCode)) {
      return;
    }

    const targetLanguage = langCode as Language;
    const basePath = removeLocaleFromPath(location.pathname);
    const nextPath = buildLocalizedPath(basePath, targetLanguage);
    const nextUrl = `${nextPath}${location.search}${location.hash}`;
    const currentUrl = `${location.pathname}${location.search}${location.hash}`;

    if (nextUrl !== currentUrl) {
      navigate(nextUrl);
    }

    if (language !== targetLanguage) {
      setLanguage(targetLanguage);
    }

    if (onSelect) {
      onSelect();
    }
  }, [language, location.hash, location.pathname, location.search, navigate, onSelect, setLanguage]);

  return (
    <div className="flex items-center space-x-2">
      <Globe size={18} className="text-stone-500" />
      {SUPPORTED_LANGUAGES.map((code, index) => (
        <React.Fragment key={code}>
          <button
            type="button"
            onClick={handleLanguageClick}
            data-lang-code={code}
            className={`text-sm transition-colors duration-300 ${
              language === code ? 'text-stone-900 font-semibold' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            {LANGUAGE_LABELS[code]}
          </button>
          {index < SUPPORTED_LANGUAGES.length - 1 && <span className="text-stone-300">|</span>}
        </React.Fragment>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
