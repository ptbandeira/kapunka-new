import type { Language } from '../types';
import { SUPPORTED_LANGUAGES } from './localePaths';

interface CmsHrefResolution {
  internalPath?: string;
  externalUrl?: string;
}

const EXTERNAL_PROTOCOL_PATTERN = /^[a-z][a-z0-9+\-.]*:/i;

const CANONICAL_PATH_ALIASES: Record<string, string> = {
  '/clinics': '/for-clinics',
  'clinics': '/for-clinics',
};

const stripLocalePrefix = (path: string): string => {
  for (const locale of SUPPORTED_LANGUAGES) {
    const prefix = `/${locale}`;
    if (path === prefix) {
      return '/';
    }
    if (path.startsWith(`${prefix}/`)) {
      const remainder = path.slice(prefix.length + 1);
      return remainder ? `/${remainder}` : '/';
    }
  }
  return path;
};

const canonicalizePath = (path: string): string => {
  const normalized = path.trim();
  if (normalized.length === 0) {
    return normalized;
  }

  const withoutLocale = stripLocalePrefix(normalized);
  const lowered = withoutLocale.toLowerCase();
  const alias = CANONICAL_PATH_ALIASES[lowered];
  if (alias) {
    return alias;
  }

  return withoutLocale;
};

export const resolveCmsHref = (href: string | null | undefined): CmsHrefResolution => {
  if (href == null) {
    return {};
  }

  const trimmed = href.trim();
  if (!trimmed) {
    return {};
  }

  if (trimmed.startsWith('#') && !trimmed.startsWith('#/')) {
    return { externalUrl: trimmed };
  }

  if (trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) {
    return { externalUrl: trimmed };
  }

  if (trimmed.startsWith('//') || EXTERNAL_PROTOCOL_PATTERN.test(trimmed)) {
    return { externalUrl: trimmed };
  }

  let working = trimmed;
  if (working.startsWith('#/')) {
    working = working.slice(1);
  }

  if (!working.startsWith('/')) {
    working = `/${working}`;
  }

  while (working.includes('//')) {
    working = working.replace('//', '/');
  }
  while (working.length > 1 && working.endsWith('/')) {
    working = working.slice(0, -1);
  }

  const canonical = canonicalizePath(working);
  return { internalPath: canonical.startsWith('/') ? canonical : `/${canonical}` };
};

export const isCmsInternalHref = (href: string | null | undefined): boolean => {
  const { internalPath } = resolveCmsHref(href);
  return typeof internalPath === 'string' && internalPath.length > 0;
};

export const getLocalizedInternalHref = (
  href: string | null | undefined,
  language: Language,
  buildPath: (path: string, language: Language) => string,
): string | undefined => {
  const { internalPath } = resolveCmsHref(href);
  if (!internalPath) {
    return undefined;
  }
  return buildPath(internalPath, language);
};
