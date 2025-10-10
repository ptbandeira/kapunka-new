
import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import type { Language } from '../types';
import { fetchContentJson } from '../utils/fetchContentJson';
import { SUPPORTED_LANGUAGES, getLocaleFromLocation } from '../utils/localePaths';
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

  const bootstrapLanguage = window.__INITIAL_LANGUAGE__;
  if (bootstrapLanguage && SUPPORTED_LANGUAGES.includes(bootstrapLanguage)) {
    return bootstrapLanguage;
  }

  const localeFromLocation = getLocaleFromLocation(window.location);
  if (localeFromLocation) {
    return localeFromLocation;
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
  const [languageState, setLanguageState] = useState<Language>(FALLBACK_LANGUAGE);
  const [translations, setTranslations] = useState<Translations>(
    initialTranslations,
  );
  const initializationCompletedRef = useRef(false);
  const fallbackTimerRef = useRef<number | null>(null);
  const { contentVersion } = useVisualEditorSync();

  const clearFallbackTimer = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const markInitialized = useCallback(() => {
    initializationCompletedRef.current = true;
    clearFallbackTimer();
  }, [clearFallbackTimer]);

  const applyLanguage = useCallback((next: Language) => {
    setLanguageState((current) => (current === next ? current : next));
    if (typeof window !== 'undefined') {
      window.__INITIAL_LANGUAGE__ = next;
    }
  }, []);

  const setLanguage = useCallback((next: Language) => {
    if (!SUPPORTED_LANGUAGES.includes(next)) {
      console.warn(`Attempted to set unsupported language "${next}". Falling back to English.`);
      applyLanguage(FALLBACK_LANGUAGE);
      return;
    }

    try {
      applyLanguage(next);
    } catch (error) {
      console.warn('Failed to change language; defaulting to English.', error);
      applyLanguage(FALLBACK_LANGUAGE);
    }
  }, [applyLanguage]);

  useEffect(() => {
    let isMounted = true;

    const initializeLanguage = () => {
      try {
        const initialLanguage = resolveInitialLanguage();
        setLanguage(initialLanguage);
      } catch (error) {
        console.warn('Failed to resolve initial language; defaulting to English.', error);
        setLanguage(FALLBACK_LANGUAGE);
      }
    };

    initializeLanguage();

    if (typeof window !== 'undefined') {
      fallbackTimerRef.current = window.setTimeout(() => {
        if (!isMounted || initializationCompletedRef.current) {
          return;
        }

        console.warn('Language initialization timed out after 3 seconds. Rendering with English fallback.');
        setLanguage(FALLBACK_LANGUAGE);
        markInitialized();
      }, 3000);
    }

    return () => {
      isMounted = false;
      clearFallbackTimer();
    };
  }, [clearFallbackTimer, markInitialized, setLanguage]);

  useEffect(() => {
    const loadTranslations = async () => {
      const results = await Promise.allSettled(
        translationEntries.map(async ([key]) => {
          const data = await fetchContentJson<TranslationModule>(
            `/content/translations/${key}.json`,
          );
          return [key, data] as [string, TranslationModule];
        }),
      );

      const successfulEntries: Array<[string, TranslationModule]> = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulEntries.push(result.value);
          return;
        }

        const [key] = translationEntries[index];
        console.warn(
          `Failed to load translation file for "${key}". Using bundled fallback copy instead.`,
          result.reason,
        );
      });

      if (successfulEntries.length > 0) {
        const updatedTranslations = buildTranslations(successfulEntries);

        setTranslations((previous) => {
          const next = { ...previous };

          for (const lang of SUPPORTED_LANGUAGES) {
            next[lang] = {
              ...previous[lang],
              ...updatedTranslations[lang],
            };
          }

          return next;
        });
      }

      markInitialized();
    };

    loadTranslations().catch((error) => {
      console.warn('Unhandled error while loading translations. Falling back to bundled copies.', error);
      markInitialized();
    });
  }, [contentVersion, markInitialized]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, languageState);
    } catch {
      // ignore storage quota/access issues; language will remain in memory
    }
  }, [languageState]);

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

    const isEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length === 0;

    const localizedResult = resolveValue(languageState);
    if (localizedResult !== undefined && !isEmptyString(localizedResult)) {
      return localizedResult as T;
    }

    if (languageState !== FALLBACK_LANGUAGE) {
      const fallbackResult = resolveValue(FALLBACK_LANGUAGE);
      if (fallbackResult !== undefined && !isEmptyString(fallbackResult)) {
        return fallbackResult as T;
      }
    }

    return key as unknown as T;
  }, [languageState, translations]);

  const translate = useCallback(<T,>(content: Partial<Record<Language, T>> | T): T => {
    if (isLocalizedRecord<T>(content)) {
      const normalizeValue = (value: T | undefined): T | undefined => {
        if (typeof value === 'string' && value.trim().length === 0) {
          return undefined;
        }
        return value;
      };

      const localizedValue = normalizeValue(content[languageState]);
      if (localizedValue !== undefined) {
        return localizedValue;
      }

      if (languageState !== FALLBACK_LANGUAGE) {
        const fallbackValue = normalizeValue(content[FALLBACK_LANGUAGE]);
        if (fallbackValue !== undefined) {
          return fallbackValue;
        }
      }

      for (const candidate of SUPPORTED_LANGUAGES) {
        const candidateValue = normalizeValue(content[candidate]);
        if (candidateValue !== undefined) {
          return candidateValue;
        }
      }
    }

    return content as T;
  }, [languageState]);

  const value = useMemo(() => ({ language: languageState, setLanguage, t, translate }), [languageState, setLanguage, t, translate]);

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
