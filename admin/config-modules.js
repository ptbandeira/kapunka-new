export const SUPPORTED_LOCALES = ['en', 'pt', 'es'];

export const LOCALE_FALLBACKS = {
  en: ['en', 'pt', 'es'],
  pt: ['pt', 'en', 'es'],
  es: ['es', 'en', 'pt'],
};

export const DEFAULT_LOCALE = 'en';

export const LOCALE_LABELS = {
  en: 'English',
  pt: 'Portuguese',
  es: 'Spanish',
};

export const LOCALE_SHORT_LABELS = {
  en: 'EN',
  pt: 'PT',
  es: 'ES',
};

export const CMS_STORAGE_KEYS = {
  LOCALE_MODE: 'kapunka.cms.localeMode',
  EDIT_MODE: 'kapunka.cms.editMode',
};

export const EDIT_MODES = {
  BEGINNER: 'beginner',
  ADVANCED: 'advanced',
};

export const ADVANCED_FIELD_PATTERNS = [
  /^heroAlignment\./,
  /^heroCtas\.ctaSecondary\./,
  /^sections\.[^.]+\.layout$/,
  /^sections\.[^.]+\.columns$/,
  /^sections\.[^.]+\.overlay/,
  /^sections\.[^.]+\.imageFocal/,
  /^sections\.[^.]+\.slideDuration$/,
  /^sections\.[^.]+\.quoteDuration$/,
  /^sections\.[^.]+\.background$/,
  /^sections\.[^.]+\.alignment$/,
  /^sections\.[^.]+\.column(Start|Span|Width)?$/,
];

export const ADVANCED_FIELD_EXACT = new Set([
  'heroAlignment.heroAlignX',
  'heroAlignment.heroAlignY',
  'heroAlignment.heroTextAnchor',
  'heroAlignment.heroOverlay',
  'heroAlignment.heroLayoutHint',
  'heroCtas.ctaSecondary.label',
  'heroCtas.ctaSecondary.href',
]);
