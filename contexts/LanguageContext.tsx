
import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import type { Language } from '../types';
type TranslationModule = Record<Language, TranslationTree>;

const translationModules = import.meta.glob<TranslationModule>(
  '@/content/translations/*.json',
  {
    eager: true,
    import: 'default',
  },
) as Record<string, TranslationModule>;

const SUPPORTED_LANGUAGES: Language[] = ['en', 'pt', 'es'];

const extractKeyFromPath = (filePath: string): string => {
  const parts = filePath.split('/');
  const filename = parts[parts.length - 1];
  return filename.replace(/\.json$/, '');
};

const buildTranslations = (
  entries: Array<[string, TranslationModule]>,
): Translations => {
  const merged: Translations = SUPPORTED_LANGUAGES.reduce((acc, lang) => {
    acc[lang] = {};
    return acc;
  }, {} as Translations);

  for (const [key, module] of entries) {
    for (const lang of SUPPORTED_LANGUAGES) {
      merged[lang][key] = module?.[lang];
    }
  }

  return merged;
};

const translationEntries = Object.entries(translationModules).map(
  ([path, module]) => [extractKeyFromPath(path), module] as [string, TranslationModule],
);

const initialTranslations = buildTranslations(translationEntries);

type TranslationTree = Record<string, any>;
type Translations = Record<Language, TranslationTree>;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: <T = string>(key: string) => T;
  translate: (content: Record<string, any>) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [translations, setTranslations] = useState<Translations>(
    initialTranslations,
  );

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const responses = await Promise.all(
          translationEntries.map(async ([key]) => {
            const res = await fetch(`/content/translations/${key}.json`);
            if (!res.ok) {
              throw new Error(`Failed to load ${key} translations`);
            }
            const data = (await res.json()) as TranslationModule;
            return [key, data] as [string, TranslationModule];
          }),
        );

        setTranslations(buildTranslations(responses));
      } catch (error) {
        console.error('Failed to load translations', error);
      }
    };

    void loadTranslations();
  }, []);

  const t = useCallback(<T = string>(key: string): T => {
    const keys = key.split('.');
    let result: any = translations[language];
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        return key as unknown as T; // Return key if not found
      }
    }
    return (result ?? key) as T;
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
