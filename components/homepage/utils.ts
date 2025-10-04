import type { LocalizedText, Language } from '../../types';

const LANGUAGE_FALLBACK_ORDER: Language[] = ['en', 'pt', 'es'];

export const resolveLocalizedText = (
  value: LocalizedText | undefined,
  language: Language,
): string | undefined => {
  if (!value) {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  const candidates: Language[] = [language, ...LANGUAGE_FALLBACK_ORDER.filter((item) => item !== language)];
  for (const candidate of candidates) {
    const localized = value[candidate];
    if (!localized) {
      continue;
    }

    const trimmed = localized.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  return undefined;
};

export const resolveCtaClassName = (style: string | undefined): string => {
  switch (style) {
    case 'secondary':
      return 'inline-flex items-center justify-center rounded-full border border-stone-900 bg-transparent px-6 py-3 text-sm font-semibold text-stone-900 transition hover:bg-stone-900 hover:text-white';
    case 'link':
      return 'inline-flex items-center justify-center text-sm font-semibold text-stone-900 underline-offset-4 transition hover:underline';
    case 'primary':
    default:
      return 'inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-700';
  }
};
