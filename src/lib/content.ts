import type { Language } from '../../types';

export type PageLoader<TResult extends Record<string, unknown>> = (
  params: { slug: string; locale: Language },
) => Promise<TResult>;

export interface LoadPageParams<TResult extends Record<string, unknown>> {
  slug: string;
  locale?: Language | null;
  loader: PageLoader<TResult>;
}

export type LoadPageResult<TResult extends Record<string, unknown>> = TResult & {
  localeUsed: Language;
};

const isLanguage = (value: unknown): value is Language => (
  value === 'en' || value === 'pt' || value === 'es'
);

export const loadPage = async <TResult extends Record<string, unknown>>({
  slug,
  locale,
  loader,
}: LoadPageParams<TResult>): Promise<LoadPageResult<TResult>> => {
  const tryLocales = [locale, 'en'].filter(
    (candidate, index, array): candidate is Language => (
      isLanguage(candidate) && array.indexOf(candidate) === index
    ),
  );

  let lastError: unknown;

  for (const currentLocale of tryLocales) {
    try {
      const result = await loader({ slug, locale: currentLocale });
      return { ...result, localeUsed: currentLocale };
    } catch (error) {
      lastError = error;
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(`[content] Failed to load slug "${slug}" for locale "${currentLocale}"`, error);
      }
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error(`Page not found: ${slug}`);
};
