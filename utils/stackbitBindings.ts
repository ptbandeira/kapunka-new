import metadata from '../metadata.json';
import type { Language } from '../types';

type MetadataModel = {
  name?: unknown;
  filePath?: unknown;
};

type MetadataContent = {
  models?: unknown;
};

const metadataModels: MetadataModel[] = Array.isArray((metadata as MetadataContent).models)
  ? ((metadata as MetadataContent).models as MetadataModel[])
  : [];

const modelFilePathByName = new Map<string, string>();
const modelNameByFilePath = new Map<string, string>();
const validObjectIds = new Set<string>();

for (const model of metadataModels) {
  if (typeof model.name !== 'string' || typeof model.filePath !== 'string') {
    continue;
  }

  modelFilePathByName.set(model.name, model.filePath);
  modelNameByFilePath.set(model.filePath, model.name);
  validObjectIds.add(`${model.name}:${model.filePath}`);
}

const SUPPORTED_LANGUAGES: Language[] = ['en', 'es', 'pt'];

type PageModelMap = Map<string, Partial<Record<Language, string>>>;

const buildPageModelMap = (): PageModelMap => {
  const pageModels: PageModelMap = new Map();

  for (const [filePath, modelName] of modelNameByFilePath.entries()) {
    const match = filePath.match(/^content\/pages\/([a-z]{2})\/([a-z0-9-]+)\.json$/);
    if (!match) {
      continue;
    }

    const [, locale, slug] = match;
    if (!SUPPORTED_LANGUAGES.includes(locale as Language)) {
      continue;
    }

    const existing = pageModels.get(slug) ?? {};
    existing[locale as Language] = modelName;
    pageModels.set(slug, existing);
  }

  return pageModels;
};

const PAGE_MODEL_BY_SLUG: PageModelMap = buildPageModelMap();

const LEGACY_PAGE_MODEL_BY_SLUG: Record<string, string> = {
  home: 'HomePage',
  about: 'AboutPage',
  story: 'StoryPage',
  clinics: 'ClinicsPage',
  contact: 'ContactPage',
  method: 'MethodPage',
  learn: 'LearnPage',
  videos: 'VideosPage',
  training: 'TrainingPage',
  test: 'TestPage',
};

const missingPageModelWarnings = new Set<string>();

const getPageModelName = (slug: string, locale: Language): string | undefined => {
  const pageModel = PAGE_MODEL_BY_SLUG.get(slug);
  if (pageModel) {
    const localizedModel = pageModel[locale] ?? pageModel.en ?? pageModel.pt ?? pageModel.es;
    if (localizedModel) {
      return localizedModel;
    }
  }

  const warningKey = `${slug}:${locale}`;
  if (!missingPageModelWarnings.has(warningKey)) {
    missingPageModelWarnings.add(warningKey);
    console.warn(
      `[visual-editor] Missing metadata model for slug "${slug}" and locale "${locale}". Falling back to legacy model name.`,
    );
  }

  return LEGACY_PAGE_MODEL_BY_SLUG[slug];
};

const getObjectIdForModel = (modelName: string | undefined): string | undefined => {
  if (!modelName) {
    return undefined;
  }

  const filePath = modelFilePathByName.get(modelName);
  return filePath ? `${modelName}:${filePath}` : undefined;
};

const fallbackCollectionObjectIds: Record<string, string> = {
  products: 'ProductCollection:content/products/index.json',
  articles: 'ArticleCollection:content/articles/index.json',
  reviews: 'ReviewCollection:content/reviews/index.json',
  videos: 'VideoCollection:content/videos.json',
  training: 'TrainingCollection:content/training.json',
  shop: 'ShopContent:content/shop.json',
  policies: 'PolicyCollection:content/policies.json',
  courses: 'CourseCollection:content/courses.json',
  partners: 'PartnerCollection:content/partners.json',
  doctors: 'DoctorCollection:content/doctors.json',
};

const missingCollectionWarnings = new Set<string>();

const buildCollectionObjectIds = (): Record<string, string> => {
  const entries: Array<[string, string]> = [];

  for (const [collection, fallback] of Object.entries(fallbackCollectionObjectIds)) {
    const objectId = getObjectIdForModel(collection);
    if (objectId) {
      entries.push([collection, objectId]);
      continue;
    }

    if (!missingCollectionWarnings.has(collection)) {
      missingCollectionWarnings.add(collection);
      console.warn(
        `[visual-editor] Missing metadata model for collection "${collection}". Using legacy object id "${fallback}".`,
      );
    }

    entries.push([collection, fallback]);
  }

  return Object.fromEntries(entries);
};

const COLLECTION_OBJECT_IDS = buildCollectionObjectIds();

const SITE_CONFIG_OBJECT_ID = getObjectIdForModel('site') ?? 'SiteConfig:content/site.json';

if (!validObjectIds.has(SITE_CONFIG_OBJECT_ID)) {
  validObjectIds.add(SITE_CONFIG_OBJECT_ID);
}

const missingObjectIdWarnings = new Set<string>();

const validateObjectId = (objectId?: string): void => {
  if (!objectId || validObjectIds.has(objectId) || missingObjectIdWarnings.has(objectId)) {
    return;
  }

  missingObjectIdWarnings.add(objectId);
  console.warn(
    `[visual-editor] Object id "${objectId}" was not found in metadata.json. Visual Editor bindings may be out of sync.`,
  );
};

export interface StackbitBinding {
  objectId?: string;
  fieldPath?: string;
}

const translationPattern = /^translations\.([a-z]{2})\.([^.]+)(?:\.(.+))?$/;

const bracketNotationPattern = /\[(\d+)\]/g;

const normalizeStackbitFieldPath = (value?: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const converted = trimmed.replace(bracketNotationPattern, '.$1');
  return converted.startsWith('.') ? converted.slice(1) : converted;
};

const normalizeFieldPath = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const resolveTranslationBinding = (value: string): StackbitBinding | null => {
  const match = translationPattern.exec(value);
  if (!match) {
    return null;
  }

  const [, lang, module, rest] = match;
  if (!SUPPORTED_LANGUAGES.includes(lang as Language)) {
    return null;
  }

  const objectId = `translations_${module}:content/translations/${module}.json`;
  const normalizedRest = normalizeStackbitFieldPath(rest);
  const fieldPath = normalizedRest ? `${lang}.${normalizedRest}` : lang;
  return { objectId, fieldPath };
};

const resolveSiteBinding = (value: string): StackbitBinding | null => {
  const sitePrefix = 'site.';
  if (!value.startsWith(sitePrefix)) {
    return null;
  }

  if (value.startsWith('site.content.')) {
    const remainder = value.slice('site.content.'.length);
    const parts = remainder.split('.');
    if (parts.length < 1) {
      return null;
    }

    const [maybeLocale, ...restParts] = parts;
    const locale = maybeLocale as Language;
    if (!SUPPORTED_LANGUAGES.includes(locale)) {
      const fallbackPath = normalizeStackbitFieldPath(remainder);
      return { objectId: SITE_CONFIG_OBJECT_ID, fieldPath: fallbackPath };
    }

    if (restParts[0] === 'pages' && restParts.length >= 2) {
      const slug = restParts[1];
      const model = getPageModelName(slug, locale);
      if (!model) {
        return null;
      }

      const filePath = `content/pages/${locale}/${slug}.json`;
      const joined = restParts.slice(2).join('.');
      const fieldPath = normalizeStackbitFieldPath(joined);
      return {
        objectId: getObjectIdForModel(model) ?? `${model}:${filePath}`,
        fieldPath,
      };
    }

    const joined = restParts.join('.');
    const fieldPath = normalizeStackbitFieldPath(joined);
    return { objectId: SITE_CONFIG_OBJECT_ID, fieldPath };
  }

  const sliced = value.slice(sitePrefix.length);
  const fieldPath = normalizeStackbitFieldPath(sliced);
  return { objectId: SITE_CONFIG_OBJECT_ID, fieldPath };
};

const resolveCollectionBinding = (value: string): StackbitBinding | null => {
  for (const [prefix, objectId] of Object.entries(COLLECTION_OBJECT_IDS)) {
    if (value === prefix || value.startsWith(`${prefix}.`)) {
      const remainder = value === prefix ? '' : value.slice(prefix.length + 1);
      const fieldPath = normalizeStackbitFieldPath(remainder);
      return { objectId, fieldPath };
    }
  }
  return null;
};

const resolvePageBinding = (value: string): StackbitBinding | null => {
  if (!value.startsWith('pages.')) {
    return null;
  }

  const remainder = value.slice('pages.'.length);
  const [slugLocale, ...restParts] = remainder.split('.');
  const slugLocaleMatch = slugLocale.match(/^([a-z0-9-]+)_([a-z]{2})$/);
  if (!slugLocaleMatch) {
    return null;
  }

  const [, slug, locale] = slugLocaleMatch;
  if (!SUPPORTED_LANGUAGES.includes(locale as Language)) {
    return null;
  }

  const model = getPageModelName(slug, locale as Language);
  if (!model) {
    return null;
  }

  const filePath = `content/pages/${locale}/${slug}.json`;
  const joined = restParts.join('.');
  const fieldPath = normalizeStackbitFieldPath(joined);
  return {
    objectId: getObjectIdForModel(model) ?? `${model}:${filePath}`,
    fieldPath,
  };
};

const resolveColonBinding = (value: string): StackbitBinding | null => {
  const colonIndex = value.indexOf(':');
  if (colonIndex <= 0) {
    return null;
  }

  const objectId = value.slice(0, colonIndex);
  const remainder = value.slice(colonIndex + 1);
  const fieldPath = normalizeStackbitFieldPath(remainder);
  if (!objectId || !fieldPath) {
    return null;
  }

  return { objectId, fieldPath };
};

const resolveBindingInternal = (value: string): StackbitBinding | null => {
  const normalized = normalizeFieldPath(value);
  if (!normalized) {
    return null;
  }

  const binding =
    resolveTranslationBinding(normalized) ??
    resolveSiteBinding(normalized) ??
    resolveCollectionBinding(normalized) ??
    resolvePageBinding(normalized) ??
    resolveColonBinding(normalized);

  if (binding?.objectId) {
    validateObjectId(binding.objectId);
  }

  return binding;
};

export const getStackbitBinding = (fieldPath?: string | null): StackbitBinding | undefined => {
  if (!fieldPath) {
    return undefined;
  }

  return resolveBindingInternal(fieldPath) ?? undefined;
};

export const getStackbitAttributes = (
  fieldPath?: string | null,
): { 'data-sb-field-path'?: string; 'data-sb-object-id'?: string } => {
  const binding = getStackbitBinding(fieldPath);
  if (!binding) {
    return {};
  }

  return {
    'data-sb-field-path': binding.fieldPath,
    'data-sb-object-id': binding.objectId,
  };
};

export const getStackbitObjectId = (fieldPath?: string | null): string | undefined => {
  return getStackbitBinding(fieldPath)?.objectId;
};

export const normalizeStackbitPathForTesting = normalizeStackbitFieldPath;

