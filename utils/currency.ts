import type { Language } from '../types';

const LANGUAGE_LOCALES: Record<Language, string> = {
  en: 'en-IE',
  es: 'es-ES',
  pt: 'pt-PT',
};

const DEFAULT_LOCALE = 'en-IE';

export const formatCurrency = (value: number, language: Language = 'en'): string => {
  const locale = LANGUAGE_LOCALES[language] ?? DEFAULT_LOCALE;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};
