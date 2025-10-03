import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const LANGUAGES = ['en', 'pt', 'es'];

const contentFile = path.join(rootDir, 'content', 'pages_v2', 'index.json');
const siteFile = path.join(rootDir, 'site', 'content', 'pages_v2', 'index.json');

const parseOptionValue = (raw) => {
  if (typeof raw === 'boolean' || typeof raw === 'number') {
    return raw;
  }
  if (raw == null) {
    return undefined;
  }
  const trimmed = String(raw).trim();
  if (trimmed.length === 0) {
    return undefined;
  }
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

const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

const toLocalizedMap = (value, { parseOptions = false } = {}) => {
  if (value == null) {
    return null;
  }
  if (isPlainObject(value)) {
    const result = {};
    for (const locale of LANGUAGES) {
      if (!(locale in value)) {
        continue;
      }
      const localized = value[locale];
      if (localized == null) {
        continue;
      }
      const parsed = parseOptions ? parseOptionValue(localized) : localized;
      if (parsed !== undefined) {
        result[locale] = parsed;
      }
    }
    return Object.keys(result).length > 0 ? result : null;
  }
  const parsed = parseOptions ? parseOptionValue(value) : value;
  return parsed !== undefined ? { en: parsed } : null;
};

const ensureSection = (sectionsMap, index) => {
  if (!sectionsMap.has(index)) {
    sectionsMap.set(index, {});
  }
  return sectionsMap.get(index);
};

const ensureContainer = (parent, segment, nextIsIndex) => {
  if (Array.isArray(parent)) {
    const numericIndex = Number(segment);
    if (!Number.isFinite(numericIndex)) {
      throw new Error(`Invalid array index: ${segment}`);
    }
    if (!parent[numericIndex]) {
      parent[numericIndex] = nextIsIndex ? [] : {};
    }
    const child = parent[numericIndex];
    if (!isPlainObject(child) && !Array.isArray(child)) {
      parent[numericIndex] = nextIsIndex ? [] : {};
      return parent[numericIndex];
    }
    return child;
  }

  if (!(segment in parent)) {
    parent[segment] = nextIsIndex ? [] : {};
    return parent[segment];
  }

  const child = parent[segment];
  if (!isPlainObject(child) && !Array.isArray(child)) {
    parent[segment] = nextIsIndex ? [] : {};
    return parent[segment];
  }

  return child;
};

const setNestedValue = (target, keyPath, value) => {
  const segments = keyPath.split('.');
  if (segments.length === 0) {
    return;
  }

  let current = target;
  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const nextSegment = segments[index + 1];
    const nextIsIndex = nextSegment != null && /^\d+$/.test(nextSegment);
    current = ensureContainer(current, segment, nextIsIndex);
  }

  const lastSegment = segments[segments.length - 1];
  if (Array.isArray(current)) {
    const numericIndex = Number(lastSegment);
    if (!Number.isFinite(numericIndex)) {
      throw new Error(`Invalid array index: ${lastSegment}`);
    }
    current[numericIndex] = value;
    return;
  }
  current[lastSegment] = value;
};

const convertNumericKeyObjectToArray = (value) => {
  if (!isPlainObject(value)) {
    return value;
  }
  const keys = Object.keys(value);
  if (keys.length === 0) {
    return value;
  }
  if (!keys.every((key) => /^\d+$/.test(key))) {
    const result = {};
    for (const [key, nested] of Object.entries(value)) {
      result[key] = convertValue(nested);
    }
    return result;
  }
  const array = [];
  keys
    .map((key) => Number(key))
    .sort((a, b) => a - b)
    .forEach((index) => {
      array[index] = convertValue(value[index]);
    });
  return array;
};

const isLocalizedMap = (value) => {
  if (!isPlainObject(value)) {
    return false;
  }
  const keys = Object.keys(value);
  if (keys.length === 0) {
    return false;
  }
  return keys.every((key) => LANGUAGES.includes(key));
};

const convertValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(convertValue);
  }
  if (isLocalizedMap(value)) {
    return value;
  }
  if (isPlainObject(value)) {
    return convertNumericKeyObjectToArray(value);
  }
  return value;
};

const mergeLocalized = (target, value) => {
  if (!value) {
    return;
  }
  if (!target) {
    return value;
  }
  for (const locale of LANGUAGES) {
    if (value[locale] != null) {
      target[locale] = value[locale];
    }
  }
  return target;
};

const addFieldValue = (fieldsMap, key, value) => {
  if (!value) {
    return;
  }
  const existing = fieldsMap.get(key) ?? {};
  fieldsMap.set(key, mergeLocalized(existing, value));
};

const heroPathForKey = (key) => {
  if (key === 'heroHeadline' || key === 'heroTitle') {
    return 'headline';
  }
  if (key === 'heroSubheadline' || key === 'heroSubtitle') {
    return 'subheadline';
  }
  if (key.startsWith('heroCtas.')) {
    return key.replace('heroCtas.', '');
  }
  if (key.startsWith('heroAlignment.')) {
    return key.replace('heroAlignment.', 'alignment.');
  }
  if (key.startsWith('hero.') && !key.startsWith('hero.cta')) {
    return key.replace('hero.', '');
  }
  return null;
};

const buildPageEntry = (page) => {
  const sectionsMap = new Map();
  const fieldsMap = new Map();
  const metadata = {};
  const hero = {};

  const assignHeroValue = (path, value) => {
    if (!value) {
      return;
    }
    setNestedValue(hero, path, mergeLocalized(hero[path], value));
  };

  const processEntry = (entry, { parseOptions = false } = {}) => {
    if (!entry?.key) {
      return;
    }
    const localized = toLocalizedMap(entry.value, { parseOptions });
    if (!localized) {
      return;
    }

    if (entry.key.startsWith('sections.')) {
      const [_, indexSegment, ...rest] = entry.key.split('.');
      if (!/^\d+$/.test(indexSegment)) {
        return;
      }
      const section = ensureSection(sectionsMap, Number(indexSegment));
      const fieldPath = rest.join('.');
      if (!fieldPath) {
        return;
      }
      const existing = section[fieldPath];
      section[fieldPath] = mergeLocalized(existing, localized) ?? localized;
      return;
    }

    if (entry.key === 'metaTitle') {
      metadata.title = mergeLocalized(metadata.title, localized) ?? localized;
      return;
    }
    if (entry.key === 'metaDescription') {
      metadata.description = mergeLocalized(metadata.description, localized) ?? localized;
      return;
    }

    const heroPath = heroPathForKey(entry.key);
    if (heroPath) {
      setNestedValue(hero, heroPath, mergeLocalized(hero[heroPath], localized) ?? localized);
      return;
    }

    addFieldValue(fieldsMap, entry.key, localized);
  };

  for (const section of page.sections ?? []) {
    for (const entry of section.copy ?? []) {
      processEntry(entry);
    }
    for (const entry of section.assets ?? []) {
      processEntry(entry);
    }
    for (const entry of section.options ?? []) {
      processEntry(entry, { parseOptions: true });
    }
  }

  const sections = Array.from(sectionsMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([, sectionFields]) => {
      const section = {};
      for (const [key, value] of Object.entries(sectionFields)) {
        if (key === 'type') {
          const resolved = value.en ?? value.pt ?? value.es;
          section.type = resolved ?? '';
          continue;
        }
        setNestedValue(section, key, value);
      }
      return convertValue(section);
    })
    .filter((section) => typeof section.type === 'string' && section.type.length > 0);

  const fields = Array.from(fieldsMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ key, value }));

  const result = {
    id: page.id,
    label: page.label,
    slug: page.slug,
  };

  if (Object.keys(metadata).length > 0) {
    result.metadata = metadata;
  }
  if (Object.keys(hero).length > 0) {
    result.hero = convertValue(hero);
  }
  if (sections.length > 0) {
    result.sections = sections;
  }
  if (fields.length > 0) {
    result.fields = fields;
  }

  return result;
};

const upgradeIndex = async (filePath) => {
  const raw = await readFile(filePath, 'utf8');
  const json = JSON.parse(raw);
  const pages = Array.isArray(json?.pages) ? json.pages : [];
  const upgraded = pages.map(buildPageEntry);
  const payload = { pages: upgraded };
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
};

const run = async () => {
  await upgradeIndex(contentFile);
  await upgradeIndex(siteFile);
  console.log('[upgrade-unified-pages] Updated schema for pages_v2 index files');
};

run().catch((error) => {
  console.error('[upgrade-unified-pages] Failed:', error);
  process.exitCode = 1;
});
