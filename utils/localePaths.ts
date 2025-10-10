import type { Language } from '../types';

export const SUPPORTED_LANGUAGES: Language[] = ['en', 'pt', 'es'];

const normalizeSegments = (raw: string | null | undefined): string[] => {
  if (!raw) {
    return [];
  }

  return raw
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);
};

const getLocaleFromSegments = (segments: string[]): Language | undefined => {
  if (segments.length === 0) {
    return undefined;
  }

  const potentialLocale = segments[0]?.toLowerCase();
  if (!potentialLocale) {
    return undefined;
  }

  return SUPPORTED_LANGUAGES.find((locale) => locale === potentialLocale) as Language | undefined;
};

export const getLocaleFromPath = (pathname: string): Language | undefined => {
  const segments = normalizeSegments(pathname);
  return getLocaleFromSegments(segments);
};

export const getLocaleFromHash = (hash: string): Language | undefined => {
  const normalizedHash = hash.startsWith('#') ? hash.slice(1) : hash;
  const segments = normalizeSegments(normalizedHash);
  return getLocaleFromSegments(segments);
};

interface LocationLike {
  pathname?: string | null;
  hash?: string | null;
}

export const getLocaleFromLocation = (value: LocationLike): Language | undefined => {
  const fromPath = value.pathname ? getLocaleFromPath(value.pathname) : undefined;
  if (fromPath) {
    return fromPath;
  }

  if (value.hash) {
    return getLocaleFromHash(value.hash);
  }

  return undefined;
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
