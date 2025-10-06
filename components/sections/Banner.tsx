import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { buildLocalizedPath } from '../../utils/localePaths';
import { getVisualEditorAttributes } from '../../utils/stackbitBindings';
import type { BannerSectionContent } from '../../types';

interface BannerProps {
  section: BannerSectionContent;
  fieldPath?: string;
}

const resolveVariant = (variant: string | undefined) => {
  const normalized = variant?.toLowerCase().trim();
  switch (normalized) {
    case 'light':
      return 'bg-stone-100 text-stone-900';
    case 'outline':
      return 'border border-stone-900 text-stone-900 bg-transparent';
    case 'accent':
      return 'bg-amber-500 text-stone-900';
    default:
      return 'bg-stone-900 text-white';
  }
};

const isInternalUrl = (url: string) => url.startsWith('/') || url.startsWith('#/');

const normalizeInternalUrl = (url: string) => {
  if (url.startsWith('#/')) {
    const normalized = url.slice(1);
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
  }
  return url.startsWith('/') ? url : `/${url}`;
};

const Banner: React.FC<BannerProps> = ({ section, fieldPath }) => {
  const { translate, language } = useLanguage();

  const text = section.text ? translate(section.text) : '';
  const cta = section.cta ? translate(section.cta) : '';
  const url = section.url ? translate(section.url) : '';
  const styleVariant = section.style ? translate(section.style) : undefined;

  if (!text?.trim() && !cta?.trim()) {
    return null;
  }

  const variantClasses = resolveVariant(styleVariant);
  const linkContent = cta?.trim() ? (
    <span {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.cta` : undefined)}>{cta}</span>
  ) : null;

  const urlFieldPath = fieldPath ? `${fieldPath}.url` : undefined;

  const renderCta = () => {
    if (!cta?.trim() || !url?.trim()) {
      return null;
    }

    if (isInternalUrl(url)) {
      return (
        <Link
          to={buildLocalizedPath(normalizeInternalUrl(url), language)}
          className="inline-flex items-center rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-white"
          {...getVisualEditorAttributes(urlFieldPath)}
        >
          {linkContent}
        </Link>
      );
    }

    return (
      <a
        href={url}
        className="inline-flex items-center rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/30"
        target="_blank"
        rel="noreferrer"
        {...getVisualEditorAttributes(urlFieldPath)}
      >
        {linkContent}
      </a>
    );
  };

  return (
    <section className="py-8" {...getVisualEditorAttributes(fieldPath)} data-sb-field-path={fieldPath}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex flex-col gap-3 rounded-3xl px-6 py-5 sm:flex-row sm:items-center sm:justify-between ${variantClasses}`}>
          <span
            className="text-sm font-semibold uppercase tracking-[0.18em]"
            {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.text` : undefined)}
          >
            {text}
          </span>
          {renderCta()}
        </div>
      </div>
    </section>
  );
};

export default Banner;
