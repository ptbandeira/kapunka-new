import type { Language } from '../../types';

type PageLoader<TResult extends Record<string, unknown>> = (
  params: { slug: string; locale: Language },
) => Promise<TResult>;

interface LoadPageParams<TResult extends Record<string, unknown>> {
  slug: string;
  locale?: Language | null;
  loader: PageLoader<TResult>;
}

type LoadPageResult<TResult extends Record<string, unknown>> = TResult & {
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
  const localesToTry: Language[] = [];

  if (isLanguage(locale) && locale !== 'en') {
    localesToTry.push(locale);
  }

  localesToTry.push('en');

  const errors: unknown[] = [];

  for (const currentLocale of localesToTry) {
    try {
      const result = await loader({ slug, locale: currentLocale });
      if (result == null) {
        throw new Error(`Page content missing for ${slug} (${currentLocale})`);
      }
      return { ...result, localeUsed: currentLocale };
    } catch (error) {
      errors.push(error);
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(`[content] Failed to load slug "${slug}" for locale "${currentLocale}"`, error);
      }
    }
  }

  for (const error of errors) {
    if (error instanceof Error) {
      throw error;
    }
  }

  throw new Error(`Page ${slug} not found`);
};
