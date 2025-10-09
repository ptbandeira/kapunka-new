import type { Language } from '../types';
import { loadPage } from '../src/lib/content';
import { fetchContentMarkdown } from './fetchContentMarkdown';

export const resolveLocalizedPath = (basePath: string, locale: Language): string => {
  if (locale === 'en') {
    return basePath;
  }

  const lastDotIndex = basePath.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return `${basePath}.${locale}`;
  }

  const prefix = basePath.slice(0, lastDotIndex);
  const extension = basePath.slice(lastDotIndex);

  return `${prefix}.${locale}${extension}`;
};

export const toVisualEditorObjectId = (documentType: string, filePath: string): string => {
  const normalizedPath = filePath.replace(/^\/+/, '');
  return `${documentType}:${normalizedPath}`;
};

interface LoadLocalizedMarkdownParams<T> {
  slug: string;
  locale: Language;
  basePath: string;
  requestInit?: RequestInit;
  validate?: (value: unknown) => value is T;
}

export interface LocalizedMarkdownResult<T> {
  data: T;
  raw: string;
  locale: Language;
  filePath: string;
}

export const loadLocalizedMarkdown = async <T>({
  slug,
  locale,
  basePath,
  requestInit,
  validate,
}: LoadLocalizedMarkdownParams<T>): Promise<LocalizedMarkdownResult<T>> => {
  const init = requestInit ?? { cache: 'no-store' };

  const result = await loadPage({
    slug,
    locale,
    loader: async ({ locale: currentLocale }) => {
      const localizedPath = resolveLocalizedPath(basePath, currentLocale);
      const document = await fetchContentMarkdown<unknown>(localizedPath, init);

      if (validate && !validate(document.data)) {
        const error = new Error(`Invalid ${slug} content for locale ${currentLocale}`);
        (error as { code?: string }).code = 'INVALID_CONTENT';
        throw error;
      }

      return document;
    },
  });

  const filePath = resolveLocalizedPath(basePath, result.localeUsed);

  return {
    data: result.data as T,
    raw: result.raw,
    locale: result.localeUsed,
    filePath,
  };
};
