import type { Language } from '../types';

type LocalizedPrimitive = string | number | boolean;

interface LocalizedValueMap {
  [language: string]: LocalizedPrimitive | null | undefined;
}

interface UnifiedPageFieldEntry {
  key?: string;
  value?: LocalizedValueMap;
}

interface RawUnifiedPageSection {
  type?: string;
  [key: string]: unknown;
}

interface RawUnifiedPageMetadata {
  title?: LocalizedValueMap;
  description?: LocalizedValueMap;
}

interface RawUnifiedPageRecord {
  id?: string;
  label?: string;
  slug?: string;
  metadata?: RawUnifiedPageMetadata;
  hero?: Record<string, unknown>;
  sections?: RawUnifiedPageSection[];
  fields?: UnifiedPageFieldEntry[];
}

interface UnifiedPageIndex {
  pages?: RawUnifiedPageRecord[];
}

interface UnifiedCandidate {
  url: string;
  source: 'site' | 'content';
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

const isPlainObject = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const isLocalizedMapValue = (value: unknown): value is LocalizedValueMap => {
  if (!isPlainObject(value)) {
    return false;
  }
  const entries = Object.entries(value);
  if (entries.length === 0) {
    return false;
  }
  return entries.every(([locale, candidate]) => (
    isLanguage(locale)
    && (
      candidate == null
      || typeof candidate === 'string'
      || typeof candidate === 'number'
      || typeof candidate === 'boolean'
    )
  ));
};

const getLocalizedPrimitive = (
  valueMap: LocalizedValueMap | undefined,
  language: Language,
): { value: LocalizedPrimitive; locale: Language } | null => {
  if (!valueMap) {
    return null;
  }

  const normalizeCandidate = (candidate: LocalizedPrimitive | null | undefined): LocalizedPrimitive | null => {
    if (candidate == null) {
      return null;
    }
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    return candidate;
  };

  const preference = getLocalePreference(language);
  for (const locale of preference) {
    const normalized = normalizeCandidate(valueMap[locale] ?? null);
    if (normalized != null) {
      return { value: normalized, locale };
    }
  }

  for (const [locale, candidate] of Object.entries(valueMap)) {
    if (!isLanguage(locale)) {
      continue;
    }
    const normalized = normalizeCandidate(candidate);
    if (normalized != null) {
      return { value: normalized, locale };
    }
  }

  return null;
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

const resolveValue = (
  value: unknown,
  language: Language,
  localesUsed: Set<Language>,
): unknown => {
  if (Array.isArray(value)) {
    const resolvedArray: unknown[] = [];
    value.forEach((item) => {
      const resolved = resolveValue(item, language, localesUsed);
      if (resolved !== undefined) {
        resolvedArray.push(resolved);
      }
    });
    return resolvedArray;
  }

  if (isLocalizedMapValue(value)) {
    const localized = getLocalizedPrimitive(value, language);
    if (!localized) {
      return undefined;
    }
    localesUsed.add(localized.locale);
    return localized.value;
  }

  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};
    let hasValue = false;
    for (const [key, nested] of Object.entries(value)) {
      const resolved = resolveValue(nested, language, localesUsed);
      if (resolved !== undefined) {
        result[key] = resolved;
        hasValue = true;
      }
    }
    return hasValue ? result : undefined;
  }

  if (value === null || value === undefined) {
    return undefined;
  }

  return value;
};

const resolveSection = (
  section: RawUnifiedPageSection,
  language: Language,
  localesUsed: Set<Language>,
): Record<string, unknown> | null => {
  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(section)) {
    if (key === 'type') {
      if (typeof value === 'string' && value.length > 0) {
        resolved.type = value;
      }
      continue;
    }

    const converted = resolveValue(value, language, localesUsed);
    if (converted !== undefined) {
      resolved[key] = converted;
    }
  }

  if (typeof resolved.type !== 'string' || resolved.type.length === 0) {
    return null;
  }

  return resolved;
};

const applyMetadata = (
  metadata: RawUnifiedPageMetadata | undefined,
  data: Record<string, unknown>,
  language: Language,
  localesUsed: Set<Language>,
): void => {
  if (!metadata) {
    return;
  }

  const title = getLocalizedPrimitive(metadata.title, language);
  if (title) {
    data.metaTitle = title.value;
    localesUsed.add(title.locale);
  }

  const description = getLocalizedPrimitive(metadata.description, language);
  if (description) {
    data.metaDescription = description.value;
    localesUsed.add(description.locale);
  }
};

const applyHero = (
  hero: Record<string, unknown> | undefined,
  data: Record<string, unknown>,
  language: Language,
  localesUsed: Set<Language>,
): void => {
  if (!hero) {
    return;
  }

  const resolved = resolveValue(hero, language, localesUsed);
  if (!isPlainObject(resolved)) {
    if (resolved !== undefined) {
      data.hero = resolved;
    }
    return;
  }

  data.hero = resolved;

  const assignString = (sourceKey: string, targetPath: string) => {
    const raw = resolved[sourceKey];
    if (typeof raw === 'string' && raw.length > 0) {
      setNestedValue(data, targetPath, raw);
    }
  };

  assignString('headline', 'heroHeadline');
  assignString('subheadline', 'heroSubheadline');
  assignString('title', 'heroTitle');
  assignString('subtitle', 'heroSubtitle');
  assignString('sub1', 'heroSub1');
  assignString('sub2', 'heroSub2');

  const ctaPrimary = resolved.ctaPrimary;
  if (isPlainObject(ctaPrimary)) {
    const { label, href } = ctaPrimary;
    if (typeof label === 'string' && label.length > 0) {
      setNestedValue(data, 'heroCtas.ctaPrimary.label', label);
    }
    if (typeof href === 'string' && href.length > 0) {
      setNestedValue(data, 'heroCtas.ctaPrimary.href', href);
    }
  }

  const ctaSecondary = resolved.ctaSecondary;
  if (isPlainObject(ctaSecondary)) {
    const { label, href } = ctaSecondary;
    if (typeof label === 'string' && label.length > 0) {
      setNestedValue(data, 'heroCtas.ctaSecondary.label', label);
    }
    if (typeof href === 'string' && href.length > 0) {
      setNestedValue(data, 'heroCtas.ctaSecondary.href', href);
    }
  }

  const alignment = resolved.alignment;
  if (isPlainObject(alignment)) {
    Object.entries(alignment).forEach(([key, value]) => {
      if (
        typeof value === 'string'
        || typeof value === 'number'
        || typeof value === 'boolean'
      ) {
        setNestedValue(data, `heroAlignment.${key}`, value);
      }
    });
  }
};

const applyFields = (
  fields: UnifiedPageFieldEntry[] | undefined,
  data: Record<string, unknown>,
  language: Language,
  localesUsed: Set<Language>,
): void => {
  if (!Array.isArray(fields)) {
    return;
  }

  fields.forEach((entry) => {
    if (typeof entry?.key !== 'string') {
      return;
    }
    const localized = getLocalizedPrimitive(entry.value, language);
    if (!localized) {
      return;
    }
    localesUsed.add(localized.locale);
    setNestedValue(data, entry.key, localized.value);
  });
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

      const localesUsed = new Set<Language>();
      const data: Record<string, unknown> = {};

      applyMetadata(match.metadata, data, language, localesUsed);
      applyHero(match.hero, data, language, localesUsed);
      applyFields(match.fields, data, language, localesUsed);

      const sections = Array.isArray(match.sections)
        ? match.sections
          .map((section) => resolveSection(section, language, localesUsed))
          .filter((section): section is Record<string, unknown> => section !== null)
        : [];
      if (sections.length > 0) {
        data.sections = sections;
      }

      if (typeof match.label === 'string' && match.label.length > 0) {
        data.label = match.label;
      }
      if (typeof match.slug === 'string' && match.slug.length > 0) {
        data.slug = match.slug;
      }

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
