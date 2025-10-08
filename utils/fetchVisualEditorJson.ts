import { getVisualEditorMirrorPrefixes } from './visualEditorEnvironment';

const CONTENT_PREFIX = '/content/';
const INDEX_SUFFIX = '/index.json';

const buildMirrorCandidates = (contentUrl: string): string[] => {
  if (!contentUrl.startsWith(CONTENT_PREFIX)) {
    return [];
  }

  const rawPath = contentUrl.slice(CONTENT_PREFIX.length);
  const normalizedPath = rawPath.replace(/^\/+/, '');
  const candidates = new Set<string>();

  const prefixes = getVisualEditorMirrorPrefixes();

  for (const prefix of prefixes) {
    candidates.add(`${prefix}${normalizedPath}`);
  }

  if (normalizedPath.endsWith(INDEX_SUFFIX)) {
    const withoutIndex = normalizedPath.slice(0, -INDEX_SUFFIX.length);
    for (const prefix of prefixes) {
      candidates.add(`${prefix}${withoutIndex}.json`);
    }
  }

  const segments = normalizedPath.split('/');
  if (segments[0] === 'pages' && segments.length >= 3) {
    const [, locale, ...restSegments] = segments;
    if (locale) {
      const restPath = restSegments.join('/');
      if (restPath) {
        for (const prefix of prefixes) {
          candidates.add(`${prefix}${locale}/pages/${restPath}`);
        }
        if (restPath.endsWith(INDEX_SUFFIX)) {
          const withoutIndex = restPath.slice(0, -INDEX_SUFFIX.length);
          for (const prefix of prefixes) {
            candidates.add(`${prefix}${locale}/pages/${withoutIndex}.json`);
          }
        }
      }
    }
  }

  return Array.from(candidates);
};

export const fetchVisualEditorJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const candidateUrls = new Set<string>();

  buildMirrorCandidates(url).forEach((candidate) => candidateUrls.add(candidate));
  candidateUrls.add(url);

  if (url.startsWith(CONTENT_PREFIX)) {
    const rawPath = url.slice(CONTENT_PREFIX.length).replace(/^\/+/, '');
    try {
      const staticAssetUrl = new URL(`../content/${rawPath}`, import.meta.url).href;
      candidateUrls.add(staticAssetUrl);
    } catch (error) {
      console.warn('fetchVisualEditorJson: failed to resolve static asset URL', rawPath, error);
    }
  }

  let lastError: unknown;

  for (const candidate of candidateUrls) {
    try {
      const response = await fetch(candidate, init);
      if (!response.ok) {
        continue;
      }

      return (await response.json()) as T;
    } catch (error) {
      console.warn('fetchVisualEditorJson: failed to fetch', candidate, error);
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error(`Unable to fetch JSON from ${url}`);
};
