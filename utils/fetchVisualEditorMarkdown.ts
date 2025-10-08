import { load as loadYaml } from 'js-yaml';

const FRONT_MATTER_PATTERN = /^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]*/;

const parseFrontMatter = <T>(raw: string): T => {
  const match = raw.match(FRONT_MATTER_PATTERN);
  if (!match) {
    return {} as T;
  }

  try {
    const parsed = loadYaml(match[1]);
    if (parsed && typeof parsed === 'object') {
      return parsed as T;
    }
  } catch (error) {
    console.error('Failed to parse front matter', error);
  }

  return {} as T;
};

const markdownCache = new Map<string, VisualEditorMarkdownDocument<unknown>>();

export const clearVisualEditorMarkdownCache = () => {
  markdownCache.clear();
};

export type VisualEditorContentSource = 'visual-editor' | 'content';

export interface VisualEditorMarkdownDocument<T> {
  data: T;
  source: VisualEditorContentSource;
  raw: string;
}

export const fetchVisualEditorMarkdown = async <T>(
  url: string,
  init?: RequestInit,
): Promise<VisualEditorMarkdownDocument<T>> => {
  const allowCache = init?.cache !== 'no-store';
  if (allowCache && markdownCache.has(url)) {
    return markdownCache.get(url) as VisualEditorMarkdownDocument<T>;
  }

  const candidates: string[] = [url];

  if (url.startsWith('/content/')) {
    const relativePath = url.slice('/content/'.length).replace(/^\/+/, '');
    try {
      const staticAssetUrl = new URL(`../content/${relativePath}`, import.meta.url).href;
      candidates.push(staticAssetUrl);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('fetchVisualEditorMarkdown: failed to resolve static asset URL', relativePath, error);
      }
    }
  }

  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, init);
      if (!response.ok) {
        continue;
      }

      const raw = await response.text();
      const data = parseFrontMatter<T>(raw);

      const result: VisualEditorMarkdownDocument<T> = {
        data,
        source: 'content',
        raw,
      };
      if (allowCache) {
        markdownCache.set(url, result as VisualEditorMarkdownDocument<unknown>);
      }
      return result;
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
