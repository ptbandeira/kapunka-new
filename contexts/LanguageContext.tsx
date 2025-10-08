
import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import type { Language } from '../types';
import { fetchVisualEditorJson } from '../utils/fetchVisualEditorJson';
import { SUPPORTED_LANGUAGES, getLocaleFromPath } from '../utils/localePaths';
import { useVisualEditorSync } from './VisualEditorSyncContext';

type TranslationPrimitive = string | number | boolean | null;
type TranslationNode = TranslationPrimitive | TranslationPrimitive[] | { [key: string]: TranslationNode };
type TranslationTree = Record<string, TranslationNode>;
type TranslationModule = Record<Language, TranslationTree>;

const translationModules = import.meta.glob<TranslationModule>(
  '@/content/translations/*.json',
  {
    eager: true,
    import: 'default',
  },
) as Record<string, TranslationModule>;

const LANGUAGE_STORAGE_KEY = 'preferredLanguage';
const FALLBACK_LANGUAGE: Language = 'en';

const normalizeLanguageCode = (code: string): Language | undefined => {
  const normalized = code.toLowerCase().split('-')[0];
  return SUPPORTED_LANGUAGES.find((lang) => lang === normalized);
};

const resolveInitialLanguage = (): Language => {
  if (typeof window === 'undefined') {
    return FALLBACK_LANGUAGE;
  }

  const localeFromPath = getLocaleFromPath(window.location.pathname);
  if (localeFromPath) {
    return localeFromPath;
  }

  try {
    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLanguage && SUPPORTED_LANGUAGES.includes(storedLanguage as Language)) {
      return storedLanguage as Language;
    }
  } catch {
    // ignore storage access errors; we'll fall back to navigator hints
  }

  const navigatorLanguages = Array.isArray(navigator.languages) && navigator.languages.length > 0
    ? navigator.languages
    : navigator.language
      ? [navigator.language]
      : [];

  for (const langCode of navigatorLanguages) {
    const matched = normalizeLanguageCode(langCode);
    if (matched) {
      return matched;
    }
  }

  return FALLBACK_LANGUAGE;
};

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
type Translations = Record<Language, TranslationTree>;

const isLocalizedRecord = <T,>(value: unknown): value is Partial<Record<Language, T>> => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return SUPPORTED_LANGUAGES.some((lang) => lang in (value as Record<string, unknown>));
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: <T = string>(key: string) => T;
  translate: <T>(content: Partial<Record<Language, T>> | T) => T;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(FALLBACK_LANGUAGE);
  const [translations, setTranslations] = useState<Translations>(
    initialTranslations,
  );
  const { contentVersion } = useVisualEditorSync();

  useEffect(() => {
    const initialLanguage = resolveInitialLanguage();
    setLanguage((current) => (current === initialLanguage ? current : initialLanguage));
  }, []);

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const responses = await Promise.all(
          translationEntries.map(async ([key]) => {
            const data = await fetchVisualEditorJson<TranslationModule>(
              `/content/translations/${key}.json`,
            );
            return [key, data] as [string, TranslationModule];
          }),
        );

        setTranslations(buildTranslations(responses));
      } catch (error) {
        console.error('Failed to load translations', error);
      }
    };

    loadTranslations().catch((error) => {
      console.error('Unhandled error while loading translations', error);
    });
  }, [contentVersion]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // ignore storage quota/access issues; language will remain in memory
    }
  }, [language]);

  const t = useCallback(<T = string>(key: string): T => {
    const keys = key.split('.');

    const resolveValue = (lang: Language): unknown => {
      let result: unknown = translations[lang];

      for (const k of keys) {
        if (typeof result !== 'object' || result === null || !(k in result)) {
          return undefined;
        }

        result = (result as Record<string, unknown>)[k];
      }

      return result;
    };

    const localizedResult = resolveValue(language);
    if (localizedResult !== undefined) {
      return localizedResult as T;
    }

    if (language !== FALLBACK_LANGUAGE) {
      const fallbackResult = resolveValue(FALLBACK_LANGUAGE);
      if (fallbackResult !== undefined) {
        return fallbackResult as T;
      }
    }

    return key as unknown as T;
  }, [language, translations]);

  const translate = useCallback(<T,>(content: Partial<Record<Language, T>> | T): T => {
    if (isLocalizedRecord<T>(content)) {
      const localizedValue = content[language];
      if (localizedValue !== undefined) {
        return localizedValue;
      }

      if (language !== FALLBACK_LANGUAGE) {
        const fallbackValue = content[FALLBACK_LANGUAGE];
        if (fallbackValue !== undefined) {
          return fallbackValue;
        }
      }

      for (const candidate of SUPPORTED_LANGUAGES) {
        const candidateValue = content[candidate];
        if (candidateValue !== undefined) {
          return candidateValue;
        }
      }
    }

    return content as T;
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
