import type { Language } from '../types';

export const SUPPORTED_LANGUAGES: Language[] = ['en', 'pt', 'es'];

export const getLocaleFromPath = (pathname: string): Language | undefined => {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    return undefined;
  }

  const potentialLocale = segments[0] as Language;
  return SUPPORTED_LANGUAGES.includes(potentialLocale) ? potentialLocale : undefined;
};

export const removeLocaleFromPath = (pathname: string): string => {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length > 0 && SUPPORTED_LANGUAGES.includes(segments[0] as Language)) {
    segments.shift();
  }

  if (segments.length === 0) {
    return '/';
  }

  return `/${segments.join('/')}`;
};

export const buildLocalizedPath = (targetPath: string, language: Language): string => {
  const sanitized = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
  const basePath = removeLocaleFromPath(sanitized);

  if (language === 'en') {
    return basePath;
  }

  if (basePath === '/') {
    return `/${language}`;
  }

  return `/${language}${basePath}`;
};

export const isSupportedLanguage = (value: string | null | undefined): value is Language => {
  if (!value) {
    return false;
  }

  return SUPPORTED_LANGUAGES.includes(value as Language);
};
