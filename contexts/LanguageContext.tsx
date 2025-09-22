
import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import type { Language } from '../types';
import translationsData from '@/content/translations.json';

type TranslationTree = Record<string, any>;
type Translations = Record<Language, TranslationTree>;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  translate: (content: Record<string, any>) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [translations, setTranslations] = useState<Translations>(
    translationsData as Translations,
  );

  useEffect(() => {
    fetch('/content/translations.json')
      .then((res) => res.json())
      .then((data) => {
        setTranslations(data as Translations);
      })
      .catch((error) => {
        console.error('Failed to load translations', error);
      });
  }, []);

  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let result: any = translations[language];
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        return key; // Return key if not found
      }
    }
    return result || key;
  }, [language, translations]);

  const translate = useCallback((content: Record<string, any>) => {
    if (typeof content === 'object' && content !== null && content[language]) {
      return content[language];
    }
    return content;
  }, [language]);


  const value = useMemo(() => ({ language, setLanguage, t, translate }), [language, t, translate]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
