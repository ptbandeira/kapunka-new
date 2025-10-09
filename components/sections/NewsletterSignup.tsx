import React, { useCallback, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getVisualEditorAttributes } from '../../utils/stackbitBindings';
import type { NewsletterSignupSectionContent, LocalizedValue } from '../../types';

interface NewsletterSignupProps {
  section: NewsletterSignupSectionContent;
  fieldPath?: string;
}

type BackgroundVariant = 'light' | 'beige' | 'dark';
type AlignmentVariant = 'left' | 'center';

const coerceEnum = <T extends string>(
  translate: ReturnType<typeof useLanguage>['translate'],
  value: LocalizedValue<T> | undefined,
  allowed: readonly T[],
  fallback: T,
): T => {
  if (value == null) {
    return fallback;
  }

  const translated = translate<T | string>(value);
  if (allowed.includes(translated as T)) {
    return translated as T;
  }

  return fallback;
};

const backgroundClasses: Record<BackgroundVariant, string> = {
  light: 'bg-stone-200 text-stone-900',
  beige: 'bg-amber-50 text-stone-900',
  dark: 'bg-stone-900 text-white',
};

const NewsletterSignup: React.FC<NewsletterSignupProps> = ({ section, fieldPath }) => {
  const { translate, t } = useLanguage();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const title = section.title ? translate(section.title) : '';
  const subtitle = section.subtitle ? translate(section.subtitle) : '';
  const placeholder = section.placeholder ? translate(section.placeholder) : t('home.newsletterPlaceholder');
  const ctaLabel = section.ctaLabel ? translate(section.ctaLabel) : t('home.newsletterSubmit');
  const confirmation = section.confirmation ? translate(section.confirmation) : t('home.newsletterThanks');

  const background = coerceEnum<BackgroundVariant>(translate, section.background, ['light', 'beige', 'dark'], 'light');
  const alignment = coerceEnum<AlignmentVariant>(translate, section.alignment, ['left', 'center'], 'center');

  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  }, []);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  }, []);

  const backgroundClass = backgroundClasses[background];
  const isDark = background === 'dark';
  const alignmentWrapper = alignment === 'left' ? 'items-start text-left' : 'items-center text-center';
  const formAlignment = alignment === 'left' ? 'sm:flex-row sm:justify-start' : 'sm:flex-row sm:justify-center';
  const containerWidth = alignment === 'left' ? 'max-w-3xl' : 'max-w-2xl';

  const sanitizedFieldPath = fieldPath?.replace(/[^a-zA-Z0-9-_]/g, '_');
  const inputId = sanitizedFieldPath ? `newsletter-email-${sanitizedFieldPath}` : 'newsletter-email';

  const inputClasses = isDark
    ? 'flex-grow px-4 py-3 rounded-md border border-white/40 bg-white/10 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/60 focus:border-white/60 transition'
    : 'flex-grow px-4 py-3 rounded-md border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-stone-500 transition';

  const buttonClasses = isDark
    ? 'px-6 py-3 bg-white text-stone-900 font-semibold rounded-md hover:bg-white/90 transition-colors'
    : 'px-6 py-3 bg-stone-900 text-white font-semibold rounded-md hover:bg-stone-700 transition-colors';

  if (!title?.trim() && !subtitle?.trim()) {
    return null;
  }

  return (
    <section className={`py-16 sm:py-24 ${backgroundClass}`} {...getVisualEditorAttributes(fieldPath)} data-sb-field-path={fieldPath}>
      <div className={`container mx-auto px-4 sm:px-6 lg:px-8 ${containerWidth}`}>
        <div className={`flex flex-col gap-4 ${alignmentWrapper}`}>
          {title?.trim() ? (
            <h2
              className="text-3xl sm:text-4xl font-semibold"
              {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.title` : undefined)}
            >
              {title}
            </h2>
          ) : null}
          {subtitle?.trim() ? (
            <p
              className={`text-base sm:text-lg ${isDark ? 'text-white/80' : 'text-stone-600'}`}
              {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.subtitle` : undefined)}
            >
              {subtitle}
            </p>
          ) : null}

          {submitted ? (
            <p
              className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-green-700'}`}
              {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.confirmation` : undefined)}
            >
              {confirmation}
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className={`flex w-full flex-col gap-2 sm:max-w-xl ${formAlignment}`}
            >
              <label htmlFor={inputId} className="sr-only">
                {placeholder}
              </label>
              <input
                type="email"
                id={inputId}
                name="email"
                value={email}
                onChange={handleChange}
                placeholder={placeholder}
                required
                autoComplete="email"
                className={inputClasses}
                {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.placeholder` : undefined)}
              />
              <button type="submit" className={buttonClasses}>
                <span {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.ctaLabel` : undefined)}>{ctaLabel}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default NewsletterSignup;
