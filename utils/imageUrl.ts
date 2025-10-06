import type { FocalPoint } from '../types';

export const isAbsoluteUrl = (value: string): boolean => /^([a-z]+:)?\/\//i.test(value);

const uploadPrefixPatterns = [
  /^\/?content\/[a-z]{2}\/uploads\//i,
  /^\/?content\/uploads\//i,
  /^\/?static\/images\/uploads\//i,
  /^\/?images\/uploads\//i,
];

const DEFAULT_TRANSFORMATIONS = ['f_auto', 'q_auto', 'dpr_auto'] as const;

export type CloudinaryCropMode = 'fill' | 'fit' | 'limit' | 'scale' | 'thumb';

export interface CloudinaryOptions {
  width?: number;
  height?: number;
  crop?: CloudinaryCropMode;
  gravity?: string;
  transformations?: string[];
}

const normalizeCloudinaryId = (value: string): string => {
  return uploadPrefixPatterns.reduce((acc, pattern) => acc.replace(pattern, ''), value).replace(/^\/+/, '');
};

const resolveCloudinaryBaseUrl = (): string | undefined => {
  const processBase = typeof process !== 'undefined' ? process.env?.CLOUDINARY_BASE_URL : undefined;

  if (processBase && processBase.trim()) {
    return processBase.replace(/\/+$/, '');
  }

  if (typeof import.meta !== 'undefined') {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
    const metaBase = metaEnv.CLOUDINARY_BASE_URL || metaEnv.VITE_CLOUDINARY_BASE_URL;
    if (metaBase && metaBase.trim()) {
      return metaBase.replace(/\/+$/, '');
    }
  }

  return undefined;
};

interface CloudinaryBaseSegments {
  prefix: string;
  existingTransform?: string;
  suffix?: string;
}

const splitCloudinaryBase = (baseUrl: string): CloudinaryBaseSegments => {
  const uploadSegment = '/upload';
  const uploadIndex = baseUrl.indexOf(uploadSegment);

  if (uploadIndex === -1) {
    return { prefix: baseUrl.replace(/\/+$/, '') };
  }

  const prefix = baseUrl.slice(0, uploadIndex + uploadSegment.length).replace(/\/+$/, '');
  const remainder = baseUrl.slice(uploadIndex + uploadSegment.length).replace(/^\/+/, '');

  if (!remainder) {
    return { prefix };
  }

  const [firstSegment, ...rest] = remainder.split('/');
  const likelyTransform = firstSegment.includes(',') || firstSegment.includes('_') ? firstSegment : undefined;
  const suffixSegments = likelyTransform ? rest : [firstSegment, ...rest];
  const suffix = suffixSegments.join('/').replace(/\/+$/, '') || undefined;

  return {
    prefix,
    existingTransform: likelyTransform,
    suffix,
  };
};

const appendUnique = (target: string[], candidate: string | undefined) => {
  if (!candidate || candidate.trim().length === 0) {
    return;
  }

  if (!target.includes(candidate)) {
    target.push(candidate);
  }
};

export const getCloudinaryUrl = (src?: string | null, options?: CloudinaryOptions): string | undefined => {
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

  const { prefix, existingTransform, suffix } = splitCloudinaryBase(baseUrl);
  const transformationParts: string[] = [];

  appendUnique(transformationParts, existingTransform);
  DEFAULT_TRANSFORMATIONS.forEach((transform) => appendUnique(transformationParts, transform));
  options?.transformations?.forEach((transform) => appendUnique(transformationParts, transform));

  const roundedWidth = options?.width && Number.isFinite(options.width)
    ? Math.round(options.width)
    : undefined;
  const roundedHeight = options?.height && Number.isFinite(options.height)
    ? Math.round(options.height)
    : undefined;

  if (roundedWidth) {
    appendUnique(transformationParts, `w_${roundedWidth}`);
  }

  if (roundedHeight) {
    appendUnique(transformationParts, `h_${roundedHeight}`);
  }

  if (options?.crop) {
    appendUnique(transformationParts, `c_${options.crop}`);
  }

  if (options?.gravity) {
    appendUnique(transformationParts, `g_${options.gravity}`);
  }

  const sanitizedSegments = [
    prefix,
    transformationParts.length > 0 ? transformationParts.join(',') : undefined,
    suffix,
    normalizedSrc,
  ].filter((segment): segment is string => Boolean(segment && segment.length > 0));

  return sanitizedSegments
    .map((segment, index) => {
      if (index === 0) {
        return segment.replace(/\/+$/, '');
      }
      return segment.replace(/^\/+/, '').replace(/\/+$/, '');
    })
    .join('/');
};

const clampNormalized = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0.5;
  }
  return Math.min(1, Math.max(0, value));
};

const toPercentage = (value: number): string => {
  const normalized = clampNormalized(value);
  return `${(Math.round(normalized * 10000) / 100).toFixed(2)}%`;
};

export const getObjectPositionFromFocal = (focal?: FocalPoint | null): string | undefined => {
  if (!focal) {
    return undefined;
  }

  const hasX = typeof focal.x === 'number' && Number.isFinite(focal.x);
  const hasY = typeof focal.y === 'number' && Number.isFinite(focal.y);

  if (!hasX && !hasY) {
    return undefined;
  }

  const horizontal = hasX ? toPercentage(focal.x as number) : '50.00%';
  const vertical = hasY ? toPercentage(focal.y as number) : '50.00%';

  return `${horizontal} ${vertical}`;
};
