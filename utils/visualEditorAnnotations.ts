import type { Language } from '../types';

const PAGE_MODEL_BY_SLUG: Record<string, string> = {
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

const COLLECTION_OBJECT_IDS: Record<string, string> = {
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

const SITE_CONFIG_OBJECT_ID = 'SiteConfig:content/site.json';

const SUPPORTED_LANGUAGES: Language[] = ['en', 'es', 'pt'];

interface Binding {
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

const resolveTranslationBinding = (value: string): Binding | null => {
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

const resolveSiteBinding = (value: string): Binding | null => {
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
      const model = PAGE_MODEL_BY_SLUG[slug];
      if (!model) {
        return null;
      }

      const filePath = `content/pages/${locale}/${slug}.json`;
      const joined = restParts.slice(2).join('.');
      const fieldPath = normalizeStackbitFieldPath(joined);
      return {
        objectId: `${model}:${filePath}`,
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

const resolveCollectionBinding = (value: string): Binding | null => {
  for (const [prefix, objectId] of Object.entries(COLLECTION_OBJECT_IDS)) {
    if (value === prefix || value.startsWith(`${prefix}.`)) {
      const remainder = value === prefix ? '' : value.slice(prefix.length + 1);
      const fieldPath = normalizeStackbitFieldPath(remainder);
      return { objectId, fieldPath };
    }
  }
  return null;
};

const resolvePageBinding = (value: string): Binding | null => {
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

  const model = PAGE_MODEL_BY_SLUG[slug];
  if (!model) {
    return null;
  }

  const filePath = `content/pages/${locale}/${slug}.json`;
  const joined = restParts.join('.');
  const fieldPath = normalizeStackbitFieldPath(joined);
  return {
    objectId: `${model}:${filePath}`,
    fieldPath,
  };
};

const resolveColonBinding = (value: string): Binding | null => {
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

const resolveBinding = (value: string): Binding | null => {
  const normalized = normalizeFieldPath(value);
  if (!normalized) {
    return null;
  }

  return (
    resolveTranslationBinding(normalized)
      ?? resolveSiteBinding(normalized)
      ?? resolveCollectionBinding(normalized)
      ?? resolvePageBinding(normalized)
      ?? resolveColonBinding(normalized)
  );
};

const annotateElement = (element: Element): void => {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  const fieldPath = element.getAttribute('data-nlv-field-path');
  if (!fieldPath) {
    return;
  }

  const binding = resolveBinding(fieldPath);
  if (!binding) {
    return;
  }

  const { objectId, fieldPath: sbFieldPath } = binding;

  if (sbFieldPath && element.getAttribute('data-sb-field-path') !== sbFieldPath) {
    element.setAttribute('data-sb-field-path', sbFieldPath);
  }

  if (objectId && element.getAttribute('data-sb-object-id') !== objectId) {
    element.setAttribute('data-sb-object-id', objectId);
  }
};

const processNode = (node: Node): void => {
  if (node instanceof HTMLElement) {
    if (node.hasAttribute('data-nlv-field-path')) {
      annotateElement(node);
    }

    const descendants = node.querySelectorAll('[data-nlv-field-path]');
    descendants.forEach((descendant) => {
      annotateElement(descendant);
    });
  }
};

let disconnectObserver: (() => void) | undefined;
let isInitialized = false;

const connectObserver = (): void => {
  if (isInitialized || typeof document === 'undefined') {
    return;
  }

  const { body } = document;
  if (!body) {
    return;
  }

  processNode(body);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => processNode(node));
      } else if (mutation.type === 'attributes' && mutation.target instanceof HTMLElement) {
        annotateElement(mutation.target);
      }
    }
  });

  observer.observe(body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-nlv-field-path'],
  });

  disconnectObserver = () => {
    observer.disconnect();
    isInitialized = false;
    disconnectObserver = undefined;
  };

  isInitialized = true;
};

export const ensureVisualEditorAnnotations = (): void => {
  if (typeof document === 'undefined' || isInitialized) {
    return;
  }

  const start = () => {
    connectObserver();
  };

  if (document.readyState === 'loading') {
    const handleReady = () => {
      document.removeEventListener('DOMContentLoaded', handleReady);
      start();
    };

    document.addEventListener('DOMContentLoaded', handleReady);
  } else {
    start();
  }
};

export const initializeVisualEditorAnnotations = (): (() => void) | undefined => {
  ensureVisualEditorAnnotations();
  return disconnectObserver;
};
