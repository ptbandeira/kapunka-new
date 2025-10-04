import matter from 'gray-matter';

const CONTENT_PREFIX = '/content/';
const VISUAL_EDITOR_PREFIXES = [
  '/.netlify/visual-editor/content/',
  '/site/content/',
];

export type VisualEditorContentSource = 'visual-editor' | 'content';

export interface VisualEditorMarkdownDocument<T> {
  data: T;
  source: VisualEditorContentSource;
  raw: string;
}

const buildCandidateUrls = (url: string): string[] => {
  if (!url.startsWith(CONTENT_PREFIX)) {
    return [url];
  }

  const relativePath = url.slice(CONTENT_PREFIX.length);
  const normalized = relativePath.replace(/^\/+/, '');
  const candidates = new Set<string>();

  for (const prefix of VISUAL_EDITOR_PREFIXES) {
    candidates.add(`${prefix}${normalized}`);
  }

  candidates.add(url);
  return Array.from(candidates);
};

export const fetchVisualEditorMarkdown = async <T>(
  url: string,
  init?: RequestInit,
): Promise<VisualEditorMarkdownDocument<T>> => {
  const candidates = buildCandidateUrls(url);
  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, init);
      if (!response.ok) {
        continue;
      }

      const raw = await response.text();
      const parsed = matter(raw);
      const data = parsed.data as T;
      const source: VisualEditorContentSource = candidate === url ? 'content' : 'visual-editor';

      return {
        data,
        source,
        raw,
      };
    } catch (error) {
      lastError = error;
      if (import.meta.env.DEV) {
        console.warn('fetchVisualEditorMarkdown: failed to fetch', candidate, error);
      }
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error(`Unable to fetch Markdown from ${url}`);
};
