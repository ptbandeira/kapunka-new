import { SUPPORTED_LOCALES, LOCALE_FALLBACKS, DEFAULT_LOCALE } from './config-modules.js';

export function toPlain(value, fallback) {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value.toJS === 'function') {
    return value.toJS();
  }

  if (typeof value.toArray === 'function') {
    return value.toArray();
  }

  return value;
}

export function asArray(value) {
  const plain = toPlain(value, []);
  return Array.isArray(plain) ? plain : [];
}

export function isSupportedLocale(locale) {
  return typeof locale === 'string' && SUPPORTED_LOCALES.includes(locale);
}

export function getLocalePreference(locale) {
  const preference = LOCALE_FALLBACKS[locale];
  if (preference) {
    return preference;
  }

  const seen = new Set();
  const result = [];
  [locale, DEFAULT_LOCALE, ...SUPPORTED_LOCALES].forEach((candidate) => {
    if (isSupportedLocale(candidate) && !seen.has(candidate)) {
      seen.add(candidate);
      result.push(candidate);
    }
  });

  return result.length > 0 ? result : SUPPORTED_LOCALES.slice();
}

export function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizeLocalizedCandidate(value) {
  if (value == null) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value : null;
  }

  if (isPlainObject(value)) {
    return Object.keys(value).length > 0 ? value : null;
  }

  return null;
}

export function getLocalizedPrimitiveFromMap(map, language) {
  if (!isPlainObject(map) || Object.keys(map).every(key => !isSupportedLocale(key))) {
    return null;
  }

  const preference = getLocalePreference(language);
  for (const locale of preference) {
    const normalized = normalizeLocalizedCandidate(map[locale]);
    if (normalized !== null) {
      return { value: normalized, locale };
    }
  }

  for (const [locale, candidate] of Object.entries(map)) {
    if (!isSupportedLocale(locale)) {
      continue;
    }
    const normalized = normalizeLocalizedCandidate(candidate);
    if (normalized !== null) {
      return { value: normalized, locale };
    }
  }

  return null;
}

export function getLocalizedString(value, fallback = '') {
  if (!value) {
    return fallback;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value.toJS === 'function') {
    const plain = value.toJS();
    return plain.en || plain.pt || plain.es || fallback;
  }
  if (typeof value === 'object') {
    return value.en || value.pt || value.es || fallback;
  }
  return fallback;
}

export function getLocalizedList(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value.toJS === 'function') {
    const plain = value.toJS();
    if (Array.isArray(plain)) {
      return plain;
    }
    if (plain && typeof plain === 'object') {
      return plain.en || plain.pt || plain.es || [];
    }
    return [];
  }
  if (typeof value === 'object') {
    const list = value.en || value.pt || value.es;
    return Array.isArray(list) ? list : [];
  }
  return [];
}

export function getEntryValue(entry, path, fallback) {
  if (!entry || typeof entry.getIn !== 'function') {
    return fallback;
  }

  if (!Array.isArray(path) || path.length === 0) {
    return fallback;
  }

  let value = entry.getIn(path);
  return value === undefined ? fallback : toPlain(value, fallback);
}

export function getEntrySlug(entry) {
  if (!entry || typeof entry.get !== 'function') {
    return '';
  }

  const directSlug = entry.get('slug');
  if (typeof directSlug === 'string' && directSlug.trim()) {
    return directSlug.trim();
  }

  const dataSlug = entry.getIn && entry.getIn(['data', 'slug']);
  if (typeof dataSlug === 'string' && dataSlug.trim()) {
    return dataSlug.trim();
  }

  const path = entry.get('path');
  if (typeof path === 'string' && path) {
    const normalized = path.replace(/\.md$/, '');
    const segments = normalized.split('/').filter(Boolean);
    return segments[segments.length - 1] || '';
  }

  return '';
}

export function getLocaleFromPath(path) {
  if (typeof path !== 'string') {
    return null;
  }

  const match = path.match(/\/(en|pt|es)\//);
  return match ? match[1] : null;
}
