const CONTENT_PREFIX = '/content/';
const SITE_PREFIX = '/site/content/';
const INDEX_SUFFIX = '/index.json';

const buildSiteCandidates = (contentUrl: string): string[] => {
  if (!contentUrl.startsWith(CONTENT_PREFIX)) {
    return [];
  }

  const rawPath = contentUrl.slice(CONTENT_PREFIX.length);
  const normalizedPath = rawPath.replace(/^\/+/, '');
  const candidates = new Set<string>();

  const directSitePath = `${SITE_PREFIX}${normalizedPath}`;
  candidates.add(directSitePath);

  if (normalizedPath.endsWith(INDEX_SUFFIX)) {
    const withoutIndex = normalizedPath.slice(0, -INDEX_SUFFIX.length);
    candidates.add(`${SITE_PREFIX}${withoutIndex}.json`);
  }

  const segments = normalizedPath.split('/');
  if (segments[0] === 'pages' && segments.length >= 3) {
    const [, locale, ...restSegments] = segments;
    if (locale) {
      const restPath = restSegments.join('/');
      if (restPath) {
        candidates.add(`${SITE_PREFIX}${locale}/pages/${restPath}`);
        if (restPath.endsWith(INDEX_SUFFIX)) {
          const withoutIndex = restPath.slice(0, -INDEX_SUFFIX.length);
          candidates.add(`${SITE_PREFIX}${locale}/pages/${withoutIndex}.json`);
        }
      }
    }
  }

  return Array.from(candidates);
};

export const fetchVisualEditorJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const candidateUrls: string[] = [];
  candidateUrls.push(...buildSiteCandidates(url));
  candidateUrls.push(url);

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

