import type { Language } from '../types';

type LocalizedPrimitive = string | number | boolean;

interface LocalizedValueMap {
  [language: string]: LocalizedPrimitive | null | undefined;
}

interface UnifiedPageFieldEntry {
  key?: string;
  value?: LocalizedValueMap;
  visible?: boolean;
}

interface RawUnifiedPageSection {
  type?: string;
  visible?: boolean;
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
  visible?: boolean;
  metadata?: RawUnifiedPageMetadata;
  hero?: Record<string, unknown>;
  sections?: RawUnifiedPageSection[];
  fields?: UnifiedPageFieldEntry[];
}

interface UnifiedPageIndex {
  pages?: RawUnifiedPageRecord[];
}

const LANGUAGE_FALLBACKS: Record<Language, Language[]> = {
  en: ['en', 'pt', 'es'],
  pt: ['pt', 'en', 'es'],
  es: ['es', 'en', 'pt'],
};

const STATIC_PAGES_INDEX_URL = (() => {
  try {
    return new URL('../content/pages_v2/index.json', import.meta.url).href;
  } catch {
    return undefined;
  }
})();

const buildUnifiedCandidateUrls = (): string[] => {
  const candidates = new Set<string>();
  candidates.add('/content/pages_v2/index.json');

  if (STATIC_PAGES_INDEX_URL) {
    candidates.add(STATIC_PAGES_INDEX_URL);
  }

  return Array.from(candidates);
};

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

  if (resolved.visible === false) {
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

  const content = isPlainObject(resolved.content) ? resolved.content : null;
  const alignment = isPlainObject(resolved.alignment) ? resolved.alignment : null;
  const layout = isPlainObject(resolved.layout) ? resolved.layout : null;
  const ctas = isPlainObject(resolved.ctas) ? resolved.ctas : null;

  const getString = (
    source: Record<string, unknown> | null,
    key: string,
  ): string | undefined => {
    if (!source) {
      return undefined;
    }
    const raw = source[key];
    return typeof raw === 'string' && raw.length > 0 ? raw : undefined;
  };

  const assignFromSources = (
    keys: string[],
    sources: (Record<string, unknown> | null)[],
    targetPath: string,
  ) => {
    for (const source of sources) {
      if (!source) {
        continue;
      }
      for (const key of keys) {
        const value = getString(source, key);
        if (value) {
          setNestedValue(data, targetPath, value);
          return;
        }
      }
    }
  };

  assignFromSources(['headline'], [content, resolved], 'heroHeadline');
  assignFromSources(['headline', 'title'], [content, resolved], 'heroTitle');
  assignFromSources(['subheadline'], [content, resolved], 'heroSubheadline');
  assignFromSources(['body', 'subtitle'], [content, resolved], 'heroSubtitle');
  assignFromSources(['eyebrow'], [content], 'heroEyebrow');

  const assignCta = (
    sources: (Record<string, unknown> | null)[],
    targetBase: string,
  ) => {
    for (const source of sources) {
      if (!isPlainObject(source)) {
        continue;
      }
      const { label, href } = source as Record<string, unknown>;
      if (typeof label === 'string' && label.length > 0) {
        setNestedValue(data, `${targetBase}.label`, label);
      }
      if (typeof href === 'string' && href.length > 0) {
        setNestedValue(data, `${targetBase}.href`, href);
      }
      if (
        (typeof label === 'string' && label.length > 0)
        || (typeof href === 'string' && href.length > 0)
      ) {
        return;
      }
    }
  };

  const extractCta = (value: unknown): Record<string, unknown> | null => (
    isPlainObject(value) ? value : null
  );

  assignCta([
    extractCta(ctas?.['primary']),
    extractCta(resolved.ctaPrimary),
  ], 'heroCtas.ctaPrimary');

  assignCta([
    extractCta(ctas?.['secondary']),
    extractCta(resolved.ctaSecondary),
  ], 'heroCtas.ctaSecondary');

  const assignPrimitive = (
    keys: string[],
    sources: (Record<string, unknown> | null)[],
    targetPath: string,
  ) => {
    for (const source of sources) {
      if (!source) {
        continue;
      }
      for (const key of keys) {
        const value = source[key];
        if (
          typeof value === 'string'
          || typeof value === 'number'
          || typeof value === 'boolean'
        ) {
          setNestedValue(data, targetPath, value);
          return;
        }
      }
    }
  };

  assignPrimitive(['alignX', 'heroAlignX'], [layout, alignment], 'heroAlignment.heroAlignX');
  assignPrimitive(['alignY', 'heroAlignY'], [layout, alignment], 'heroAlignment.heroAlignY');
  assignPrimitive(['textPosition', 'heroTextPosition'], [layout, alignment], 'heroAlignment.heroTextPosition');
  assignPrimitive(['textAnchor', 'heroTextAnchor'], [layout, alignment], 'heroAlignment.heroTextAnchor');
  assignPrimitive(['overlay', 'heroOverlay'], [layout, alignment], 'heroAlignment.heroOverlay');
  assignPrimitive(['layoutHint', 'heroLayoutHint'], [layout, alignment], 'heroAlignment.heroLayoutHint');

  assignPrimitive(['sub1'], [resolved], 'heroSub1');
  assignPrimitive(['sub2'], [resolved], 'heroSub2');
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
    if (entry.visible === false) {
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

interface UnifiedPageContent<TData> {
  data: TData;
  locale: Language;
}

export const loadUnifiedPage = async <TData = Record<string, unknown>>(
  pageId: string,
  language: Language,
): Promise<UnifiedPageContent<TData> | null> => {
  const candidateUrls = buildUnifiedCandidateUrls();

  for (const candidateUrl of candidateUrls) {
    try {
      const response = await fetch(candidateUrl);
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
      if (match.visible !== undefined) {
        data.visible = match.visible !== false;
      }

      const resolvedLocale = determineResolvedLocale(localesUsed, language);

      return {
        data: data as TData,
        locale: resolvedLocale,
      };
    } catch (error) {
      console.warn('[pages_v2] Failed to load unified page candidate', candidateUrl, error);
    }
  }

  return null;
};
