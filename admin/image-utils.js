import { toPlain } from './utils.js';

const ABSOLUTE_URL_PATTERN = /^([a-z]+:)?\/\//i;
const DEFAULT_CLOUDINARY_TRANSFORMATIONS = ['f_auto', 'q_auto', 'dpr_auto'];

const uploadPrefixPatterns = [
  /^\/?content\/[a-z]{2}\/uploads\//i,
  /^\/?content\/uploads\//i,
  /^\/?static\/images\/uploads\//i,
  /^\/?images\/uploads\//i,
];

const getCmsInstance = () => (typeof window !== 'undefined' ? window.CMS : null);

const getCmsConfig = () => {
  const CMS = getCmsInstance();
  if (!CMS || typeof CMS.getConfig !== 'function') {
    return null;
  }
  return CMS.getConfig();
};

export function stripUploadPrefixes(value) {
  return uploadPrefixPatterns.reduce((acc, pattern) => acc.replace(pattern, ''), value).replace(/^\/+/, '');
}

export function normalizeTransformations(groups) {
  const transformations = [];

  asArray(groups).forEach((group) => {
    asArray(group).forEach((item) => {
      const plain = toPlain(item);
      if (!plain) {
        return;
      }

      Object.entries(plain).forEach(([key, val]) => {
        if (typeof val === 'string' && val.trim().length > 0) {
          transformations.push(`${key}_${val.trim()}`);
        }
      });
    });
  });

  if (transformations.length > 0) {
    return transformations.join(',');
  }

  return DEFAULT_CLOUDINARY_TRANSFORMATIONS.join(',');
}

const cachedCloudinarySettings = {
  resolved: false,
  base: null,
  transformations: null,
};

const previewImageCache = new Map();

function resolveCloudinarySettings() {
  if (cachedCloudinarySettings.resolved) {
    return cachedCloudinarySettings;
  }

  const config = getCmsConfig();
  if (!config || typeof config.getIn !== 'function') {
    return cachedCloudinarySettings;
  }

  const cloudName = config.getIn(['media_library', 'config', 'cloud_name']);
  if (typeof cloudName === 'string' && cloudName.trim().length > 0) {
    cachedCloudinarySettings.base = `https://res.cloudinary.com/${cloudName.trim()}/image/upload`;
  }

  const defaultTransformations = config.getIn(['media_library', 'config', 'default_transformations']);
  cachedCloudinarySettings.transformations = normalizeTransformations(defaultTransformations);
  cachedCloudinarySettings.resolved = true;

  return cachedCloudinarySettings;
}

function extractImagePath(value) {
  if (!value) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value.get === 'function') {
    const fromMap = value.get('src') || value.get('path');
    if (typeof fromMap === 'string') {
      return fromMap;
    }
  }

  if (typeof value.src === 'string') {
    return value.src;
  }

  if (typeof value.toJS === 'function') {
    const plain = value.toJS();
    if (plain && typeof plain.src === 'string') {
      return plain.src;
    }
    if (plain && typeof plain.path === 'string') {
      return plain.path;
    }
  }

  if (typeof value === 'object') {
    if (typeof value.path === 'string') {
      return value.path;
    }
    if (typeof value.url === 'string') {
      return value.url;
    }
  }

  return undefined;
}

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

export function getPreviewImageSrc(input) {
  const raw = extractImagePath(input);
  if (!isNonEmptyString(raw)) {
    return undefined;
  }

  const trimmed = raw.trim();
  if (ABSOLUTE_URL_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const sanitized = stripUploadPrefixes(trimmed);
  const { base, transformations } = resolveCloudinarySettings();

  const cacheKey = `${base || ''}::${transformations || ''}::${sanitized}`;
  if (previewImageCache.has(cacheKey)) {
    return previewImageCache.get(cacheKey);
  }

  if (!base) {
    const fallback = sanitized || trimmed;
    previewImageCache.set(cacheKey, fallback);
    return fallback;
  }

  const segments = [base, transformations, sanitized]
    .filter((segment) => isNonEmptyString(segment));

  const resolved = segments
    .map((segment, index) => (index === 0 ? segment.replace(/\/+$/, '') : segment.replace(/^\/+/, '').replace(/\/+$/, '')))
    .join('/');
  previewImageCache.set(cacheKey, resolved);
  return resolved;
}
