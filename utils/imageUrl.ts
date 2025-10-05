export const isAbsoluteUrl = (value: string): boolean => /^([a-z]+:)?\/\//i.test(value);

export const getCloudinaryUrl = (src?: string | null): string | undefined => {
  if (!src) {
    return undefined;
  }

  const trimmedSrc = src.trim();
  if (!trimmedSrc) {
    return undefined;
  }

  if (!process.env.CLOUDINARY_BASE_URL) {
    return trimmedSrc;
  }

  if (isAbsoluteUrl(trimmedSrc)) {
    return trimmedSrc;
  }

  const normalizedSrc = trimmedSrc.replace(/^\/?content\/[^/]+\/uploads\/?/, '');
  const sanitizedNormalizedSrc = normalizedSrc.replace(/^\/+/, '');

  return `${process.env.CLOUDINARY_BASE_URL}/${sanitizedNormalizedSrc}`;
};
