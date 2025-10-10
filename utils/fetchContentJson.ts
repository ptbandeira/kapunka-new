const CONTENT_PREFIX = '/content/';
const INDEX_SUFFIX = '/index.json';

const normalizeRelativePath = (path: string): string => path.replace(/^\/+/, '');

const addIndexFallback = (candidates: Set<string>, basePath: string): void => {
  if (!basePath.endsWith(INDEX_SUFFIX)) {
    return;
  }

  const withoutIndex = basePath.slice(0, -INDEX_SUFFIX.length);
  if (withoutIndex) {
    candidates.add(`${CONTENT_PREFIX}${withoutIndex}.json`);
  }
};

export const fetchContentJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const candidates = new Set<string>();
  candidates.add(url);

  if (url.startsWith(CONTENT_PREFIX)) {
    const relativePath = normalizeRelativePath(url.slice(CONTENT_PREFIX.length));
    if (relativePath) {
      addIndexFallback(candidates, relativePath);
    }
  }

  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, init);
      if (!response.ok) {
        continue;
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      if (import.meta.env.DEV) {
        console.warn('fetchContentJson: failed to fetch', candidate, error);
      }
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error(`Unable to fetch JSON from ${url}`);
};
