import type { Language } from '../types';

interface UnifiedPageValueMap {
  [language: string]: string | undefined;
}

interface UnifiedPageEntry {
  key?: string;
  value?: UnifiedPageValueMap;
}

interface UnifiedPageSection {
  key?: string;
  copy?: UnifiedPageEntry[];
  options?: UnifiedPageEntry[];
}

interface UnifiedPageRecord {
  id?: string;
  sections?: UnifiedPageSection[];
}

interface UnifiedPageIndex {
  pages?: UnifiedPageRecord[];
}

interface UnifiedCandidate {
  url: string;
  source: 'site' | 'content';
}

interface SectionParseResult {
  data: Record<string, unknown>;
  localesUsed: Set<Language>;
}

const LANGUAGE_FALLBACKS: Record<Language, Language[]> = {
  en: ['en', 'pt', 'es'],
  pt: ['pt', 'en', 'es'],
  es: ['es', 'en', 'pt'],
};

const UNIFIED_CANDIDATES: UnifiedCandidate[] = [
  { url: '/site/content/pages_v2/index.json', source: 'site' },
  { url: '/content/pages_v2/index.json', source: 'content' },
];

const isLanguage = (value: string): value is Language => (
  value === 'en' || value === 'pt' || value === 'es'
);

const getLocalePreference = (language: Language): Language[] => {
  const fallback = LANGUAGE_FALLBACKS[language];
  if (fallback) {
    return fallback;
  }
  return ['en', 'pt', 'es'];
};

const getLocalizedValue = (
  valueMap: UnifiedPageValueMap | undefined,
  language: Language,
): { value: string; locale: Language } | null => {
  if (!valueMap) {
    return null;
  }

  const preference = getLocalePreference(language);
  for (const locale of preference) {
    const candidate = valueMap[locale];
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed.length > 0) {
        return { value: trimmed, locale };
      }
    }
  }

  for (const [locale, candidate] of Object.entries(valueMap)) {
    if (!isLanguage(locale) || typeof candidate !== 'string') {
      continue;
    }
    const trimmed = candidate.trim();
    if (trimmed.length > 0) {
      return { value: trimmed, locale };
    }
  }

  return null;
};

const parseOptionValue = (raw: string): string | number | boolean => {
  const trimmed = raw.trim();
  if (trimmed === 'true') {
    return true;
  }
  if (trimmed === 'false') {
    return false;
  }

  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }

  return trimmed;
};

const ensureContainer = (
  parent: Record<string, unknown> | unknown[],
  key: string,
  nextSegmentIsIndex: boolean,
): Record<string, unknown> | unknown[] => {
  if (Array.isArray(parent)) {
    const index = Number(key);
    if (!Number.isFinite(index)) {
      throw new Error(`Invalid array index: ${key}`);
    }
    if (!parent[index]) {
      parent[index] = nextSegmentIsIndex ? [] : {};
    }
    const child = parent[index];
    if (typeof child !== 'object' || child === null) {
      parent[index] = nextSegmentIsIndex ? [] : {};
      return parent[index] as Record<string, unknown> | unknown[];
    }
    return child as Record<string, unknown> | unknown[];
  }

  if (!(key in parent)) {
    parent[key] = nextSegmentIsIndex ? [] : {};
    return parent[key] as Record<string, unknown> | unknown[];
  }

  const existing = parent[key];
  if (typeof existing !== 'object' || existing === null) {
    parent[key] = nextSegmentIsIndex ? [] : {};
    return parent[key] as Record<string, unknown> | unknown[];
  }

  return existing as Record<string, unknown> | unknown[];
};

const setNestedValue = (
  target: Record<string, unknown>,
  keyPath: string,
  value: unknown,
): void => {
  const segments = keyPath.split('.');
  if (segments.length === 0) {
    return;
  }

  let current: Record<string, unknown> | unknown[] = target;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const nextSegment = segments[index + 1];
    const nextIsIndex = nextSegment != null && /^\d+$/.test(nextSegment);
    current = ensureContainer(current, segment, nextIsIndex);
  }

  const lastSegment = segments[segments.length - 1];
  if (Array.isArray(current)) {
    const arrayIndex = Number(lastSegment);
    if (!Number.isFinite(arrayIndex)) {
      throw new Error(`Invalid array index: ${lastSegment}`);
    }
    current[arrayIndex] = value;
    return;
  }

  current[lastSegment] = value;
};

const buildSectionData = (
  section: UnifiedPageSection,
  language: Language,
): SectionParseResult => {
  const data: Record<string, unknown> = {};
  const localesUsed = new Set<Language>();

  if (Array.isArray(section.copy)) {
    section.copy.forEach((entry) => {
      if (typeof entry?.key !== 'string') {
        return;
      }
      const localized = getLocalizedValue(entry.value, language);
      if (!localized) {
        return;
      }
      localesUsed.add(localized.locale);
      setNestedValue(data, entry.key, localized.value);
    });
  }

  if (Array.isArray(section.options)) {
    section.options.forEach((entry) => {
      if (typeof entry?.key !== 'string') {
        return;
      }
      const localized = getLocalizedValue(entry.value, language);
      if (!localized) {
        return;
      }
      localesUsed.add(localized.locale);
      setNestedValue(data, entry.key, parseOptionValue(localized.value));
    });
  }

  return { data, localesUsed };
};

const determineResolvedLocale = (
  localesUsed: Set<Language>,
  language: Language,
): Language => {
  if (localesUsed.size === 0) {
    return language;
  }

  const preference = getLocalePreference(language);
  for (const locale of preference) {
    if (localesUsed.has(locale)) {
      return locale;
    }
  }

  const [first] = Array.from(localesUsed);
  return first ?? language;
};

export interface UnifiedPageContent<TData> {
  data: TData;
  locale: Language;
  source: 'site' | 'content';
}

export const loadUnifiedPage = async <TData = Record<string, unknown>>(
  pageId: string,
  language: Language,
): Promise<UnifiedPageContent<TData> | null> => {
  for (const candidate of UNIFIED_CANDIDATES) {
    try {
      const response = await fetch(candidate.url);
      if (!response.ok) {
        continue;
      }

      const payload = (await response.json()) as UnifiedPageIndex;
      const pages = Array.isArray(payload?.pages) ? payload.pages : [];
      const match = pages.find((page) => page?.id === pageId);
      if (!match) {
        continue;
      }

      const section = Array.isArray(match.sections)
        ? match.sections.find((entry) => entry?.key === 'page') ?? match.sections[0]
        : undefined;

      if (!section) {
        continue;
      }

      const { data, localesUsed } = buildSectionData(section, language);
      const resolvedLocale = determineResolvedLocale(localesUsed, language);

      return {
        data: data as TData,
        locale: resolvedLocale,
        source: candidate.source,
      };
    } catch (error) {
      console.warn('[pages_v2] Failed to load unified page candidate', candidate.url, error);
    }
  }

  return null;
};
