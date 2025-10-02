import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const CONTENT_DIR = path.join(rootDir, 'content');
const PAGES_DIR = path.join(CONTENT_DIR, 'pages');
const TRANSLATIONS_DIR = path.join(CONTENT_DIR, 'translations');
const OUTPUT_FILE = path.join(CONTENT_DIR, 'pages_v2', 'index.json');
const SITE_OUTPUT_FILE = path.join(rootDir, 'site', 'content', 'pages_v2', 'index.json');

const DEFAULT_SLUG_BY_PAGE = {
  home: '/',
  about: '/about',
  story: '/story',
  clinics: '/for-clinics',
  contact: '/contact',
  method: '/method',
  learn: '/learn',
  videos: '/videos',
  training: '/training',
};

const LANGUAGE_ORDER = ['en', 'pt', 'es'];

const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

const startCase = (value) => value
  .replace(/[-_]+/g, ' ')
  .replace(/\b\w/g, (match) => match.toUpperCase())
  .trim();

const normalizeValue = (raw) => {
  if (raw == null) {
    return null;
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof raw === 'number' || typeof raw === 'boolean') {
    return raw;
  }

  return null;
};

const addValue = (collector, keyPath, language, rawValue) => {
  const normalized = normalizeValue(rawValue);
  if (normalized == null) {
    return;
  }

  const existing = collector.get(keyPath) ?? {
    type: typeof normalized,
    values: {},
  };

  if (existing.type !== typeof normalized) {
    // Promote to string to avoid inconsistent typing across locales.
    existing.type = 'string';
    existing.values = Object.fromEntries(
      Object.entries(existing.values).map(([locale, value]) => [locale, value?.toString() ?? ''])
    );
  }

  existing.values[language] = normalized.toString();
  collector.set(keyPath, existing);
};

const flattenObject = (collector, value, language, prefix = []) => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      flattenObject(collector, item, language, [...prefix, String(index)]);
    });
    return;
  }

  if (isPlainObject(value)) {
    for (const [key, nested] of Object.entries(value)) {
      if (prefix.length === 0 && key === 'type') {
        continue;
      }
      flattenObject(collector, nested, language, [...prefix, key]);
    }
    return;
  }

  const keyPath = prefix.join('.');
  if (!keyPath) {
    return;
  }

  addValue(collector, keyPath, language, value);
};

const readJson = async (filePath) => {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw);
};

const collectPageData = async (pageId, locales) => {
  const collector = new Map();

  for (const locale of locales) {
    const filePath = path.join(PAGES_DIR, locale, `${pageId}.json`);
    if (!existsSync(filePath)) {
      continue;
    }

    const json = await readJson(filePath);
    flattenObject(collector, json, locale);
  }

  return collector;
};

const collectTranslationData = async (pageId) => {
  const collector = new Map();
  const filePath = path.join(TRANSLATIONS_DIR, `${pageId}.json`);
  if (!existsSync(filePath)) {
    return collector;
  }

  const json = await readJson(filePath);
  if (!isPlainObject(json)) {
    return collector;
  }

  for (const locale of LANGUAGE_ORDER) {
    const localeValue = json[locale];
    if (!isPlainObject(localeValue)) {
      continue;
    }
    flattenObject(collector, localeValue, locale);
  }

  return collector;
};

const buildCopyEntries = (collector, filterType) => {
  const entries = [];

  for (const [key, payload] of collector) {
    if (payload.type !== filterType) {
      continue;
    }

    const value = {};
    for (const locale of LANGUAGE_ORDER) {
      const localized = payload.values[locale];
      if (localized != null) {
        value[locale] = localized;
      }
    }

    if (Object.keys(value).length === 0) {
      continue;
    }

    entries.push({ key, value });
  }

  entries.sort((a, b) => a.key.localeCompare(b.key));
  return entries;
};

const buildOptionsEntries = (collector) => {
  const entries = [];

  for (const [key, payload] of collector) {
    if (payload.type === 'string') {
      continue;
    }

    const value = {};
    for (const locale of LANGUAGE_ORDER) {
      const localized = payload.values[locale];
      if (localized != null) {
        value[locale] = localized;
      }
    }

    if (Object.keys(value).length === 0) {
      continue;
    }

    entries.push({ key, value });
  }

  entries.sort((a, b) => a.key.localeCompare(b.key));
  return entries;
};

const mergeCollectors = (pageCollector, translationCollector) => {
  const merged = new Map(pageCollector);

  for (const [key, value] of translationCollector.entries()) {
    if (!merged.has(key)) {
      merged.set(key, value);
      continue;
    }

    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, value);
      continue;
    }

    for (const [locale, localized] of Object.entries(value.values)) {
      if (existing.values[locale] == null) {
        existing.values[locale] = localized;
      }
    }
  }

  return merged;
};

const determineLabel = (pageId, translationCollector) => {
  const title = translationCollector.get('title');
  if (title) {
    for (const locale of LANGUAGE_ORDER) {
      const value = title.values[locale];
      if (value) {
        return value;
      }
    }
  }
  return startCase(pageId);
};

const determineSlug = (pageId) => DEFAULT_SLUG_BY_PAGE[pageId] ?? `/${pageId}`;

const buildPageEntry = (pageId, pageCollector, translationCollector) => {
  const combined = mergeCollectors(pageCollector, translationCollector);
  const copyEntries = buildCopyEntries(combined, 'string');
  const optionsEntries = buildOptionsEntries(combined);

  const sections = [];

  if (copyEntries.length > 0 || optionsEntries.length > 0) {
    const section = {
      key: 'page',
      name: 'Page Content',
      copy: copyEntries.length > 0 ? copyEntries : undefined,
      options: optionsEntries.length > 0 ? optionsEntries : undefined,
    };
    sections.push(section);
  }

  return {
    id: pageId,
    label: determineLabel(pageId, translationCollector),
    slug: determineSlug(pageId),
    sections,
  };
};

const writeOutput = async (data) => {
  const formatted = `${JSON.stringify(data, null, 2)}\n`;
  await writeFile(OUTPUT_FILE, formatted, 'utf8');
  await writeFile(SITE_OUTPUT_FILE, formatted, 'utf8');
};

const run = async () => {
  const locales = (await readdir(PAGES_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => LANGUAGE_ORDER.includes(name));

  const pageIds = new Set();
  for (const locale of locales) {
    const files = await readdir(path.join(PAGES_DIR, locale));
    for (const file of files) {
      if (!file.endsWith('.json')) {
        continue;
      }
      pageIds.add(file.replace(/\.json$/, ''));
    }
  }

  const pages = [];

  for (const pageId of Array.from(pageIds).sort()) {
    const pageCollector = await collectPageData(pageId, locales);
    const translationCollector = await collectTranslationData(pageId);
    const entry = buildPageEntry(pageId, pageCollector, translationCollector);
    pages.push(entry);
  }

  await writeOutput({ pages });
  console.log(`[pages_v2] Wrote ${pages.length} unified page entries`);
};

run().catch((error) => {
  console.error('[pages_v2] Migration failed:', error);
  process.exitCode = 1;
});
