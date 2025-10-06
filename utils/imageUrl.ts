export const isAbsoluteUrl = (value: string): boolean => /^([a-z]+:)?\/\//i.test(value);

const uploadPrefixPatterns = [
  /^\/?content\/[a-z]{2}\/uploads\//i,
  /^\/?content\/uploads\//i,
  /^\/?static\/images\/uploads\//i,
  /^\/?images\/uploads\//i,
];

const normalizeCloudinaryId = (value: string): string => {
  return uploadPrefixPatterns.reduce((acc, pattern) => acc.replace(pattern, ''), value).replace(/^\/+/, '');
};

const resolveCloudinaryBaseUrl = (): string | undefined => {
  const processBase = typeof process !== 'undefined' ? process.env?.CLOUDINARY_BASE_URL : undefined;

  if (processBase && processBase.trim()) {
    return processBase.replace(/\/+$/, '');
  }

  // Support environments where the value is exposed via import.meta.env (e.g. Vite runtime)
  if (typeof import.meta !== 'undefined') {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
    const metaBase = metaEnv.CLOUDINARY_BASE_URL || metaEnv.VITE_CLOUDINARY_BASE_URL;
    if (metaBase && metaBase.trim()) {
      return metaBase.replace(/\/+$/, '');
    }
  }

  return undefined;
};

export const getCloudinaryUrl = (src?: string | null): string | undefined => {
  if (!src) {
    return undefined;
  }

  const trimmedSrc = src.trim();
  if (!trimmedSrc) {
    return undefined;
  }

  if (isAbsoluteUrl(trimmedSrc)) {
    return trimmedSrc;
  }

  const normalizedSrc = normalizeCloudinaryId(trimmedSrc);
  if (!normalizedSrc) {
    return undefined;
  }

  const baseUrl = resolveCloudinaryBaseUrl();
  if (!baseUrl) {
    return normalizedSrc;
  }

  return `${baseUrl}/${normalizedSrc}`;
};
