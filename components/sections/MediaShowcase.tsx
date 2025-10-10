import React from 'react';
import { Link } from 'react-router-dom';
imp          <Link
          to={buildLocalizedPath(internalPath, language)}
          className="inline-flex items-center rounded-full border border-white/60 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-wide text-white transition hover:bg-white hover:text-stone-900"
          {...getVisualEditorAttributes()}
        >
          <span {...getVisualEditorAttributes()}>{item.ctaLabel}</span>
        </Link>seLanguage } from '../../contexts/LanguageContext';
import { buildLocalizedPath } from '../../utils/localePaths';
import { getVisualEditorAttributes } from '../../utils/stackbitBindings';
import { resolveCmsHref } from '../../utils/cmsLinks';
import { getCloudinaryUrl, getObjectPositionFromFocal } from '../../utils/imageUrl';
import type { MediaShowcaseSectionContent } from '../../types';

interface MediaShowcaseProps {
  section: MediaShowcaseSectionContent;
  fieldPath?: string;
}

const MediaShowcase: React.FC<MediaShowcaseProps> = ({ section, fieldPath }) => {
  const { translate, language } = useLanguage();

  const title = section.title ? translate(section.title) : '';

  const items = (section.items ?? []).map((item, index) => {
    const eyebrow = item?.eyebrow ? translate(item.eyebrow) : '';
    const itemTitle = item?.title ? translate(item.title) : '';
    const body = item?.body ? translate(item.body) : '';
    const description = item?.description ? translate(item.description) : '';
    const label = item?.label ? translate(item.label) : '';
    const ctaLabel = item?.ctaLabel ? translate(item.ctaLabel) : '';
    const ctaHref = item?.ctaHref ? translate(item.ctaHref) : '';
    const imageSrc = item?.image?.trim();
    const imageUrl = imageSrc ? getCloudinaryUrl(imageSrc) ?? imageSrc : undefined;
    const imageFocal = item?.imageFocal ?? null;
    const imageAlt = item?.imageAlt ? translate(item.imageAlt) : itemTitle || label || eyebrow || 'Showcase image';
    const itemFieldPath = fieldPath ? `${fieldPath}.items.${index}` : undefined;

    return {
      eyebrow,
      title: itemTitle,
      body,
      description,
      label,
      ctaLabel,
      ctaHref,
      imageUrl,
      imageFocal,
      imageAlt,
      fieldPath: itemFieldPath,
      eyebrowFieldPath: itemFieldPath ? `${itemFieldPath}.eyebrow` : undefined,
      titleFieldPath: itemFieldPath ? `${itemFieldPath}.title` : undefined,
      bodyFieldPath: itemFieldPath ? `${itemFieldPath}.body` : undefined,
      descriptionFieldPath: itemFieldPath ? `${itemFieldPath}.description` : undefined,
      labelFieldPath: itemFieldPath ? `${itemFieldPath}.label` : undefined,
      ctaLabelFieldPath: itemFieldPath ? `${itemFieldPath}.ctaLabel` : undefined,
      ctaHrefFieldPath: itemFieldPath ? `${itemFieldPath}.ctaHref` : undefined,
      imageFieldPath: itemFieldPath ? `${itemFieldPath}.image` : undefined,
      imageAltFieldPath: itemFieldPath ? `${itemFieldPath}.imageAlt` : undefined,
      hasContent: Boolean(itemTitle?.trim() || body?.trim() || description?.trim() || label?.trim() || imageUrl),
    };
  }).filter((item) => item.hasContent);

  if (!title?.trim() && items.length === 0) {
    return null;
  }

  const renderCta = (item: (typeof items)[number]) => {
    if (!item.ctaLabel?.trim() || !item.ctaHref?.trim()) {
      return null;
    }

    const { internalPath, externalUrl } = resolveCmsHref(item.ctaHref);

    if (internalPath) {
      return (
        <Link
          to={buildLocalizedPath(internalPath, language)}
          className="inline-flex items-center rounded-full border border-white/60 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-wide text-white transition hover:bg-white hover:text-stone-900"
          {...getVisualEditorAttributes(item.ctaHrefFieldPath)}
        >
          <span {...getVisualEditorAttributes(item.ctaLabelFieldPath)}>{item.ctaLabel}</span>
        </Link>
      );
    }

    return (
      <a
        href={externalUrl ?? item.ctaHref}
        className="inline-flex items-center rounded-full border border-white/60 bg-white/10 px-5 py-2 text-sm font-medium tracking-wide text-white transition hover:bg-white hover:text-stone-900"
        target="_blank"
        rel="noreferrer"
        {...getVisualEditorAttributes(item.ctaHrefFieldPath)}
      >
        <span {...getVisualEditorAttributes(item.ctaLabelFieldPath)}>{item.ctaLabel}</span>
      </a>
    );
  };

  return (
    <section className="bg-white w-full" {...getVisualEditorAttributes(fieldPath)} data-sb-field-path={fieldPath}>
      <div className="w-full">
        {title?.trim() ? (
          <div
            className="container mx-auto px-6 sm:px-10 lg:px-16 mb-10"
            {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.title` : undefined)}
          >
            <h2 className="text-3xl sm:text-4xl font-semibold text-stone-900 tracking-tight">{title}</h2>
          </div>
        ) : null}
        <div className="flex flex-col md:flex-row flex-wrap">
          {items.map((item, index) => {
            const objectPosition = getObjectPositionFromFocal(item.imageFocal ?? undefined);
            const imageStyle = objectPosition ? { objectPosition } : undefined;
            const baseClasses = [
              'relative overflow-hidden text-white flex items-end justify-start',
              'aspect-[4/3] md:aspect-auto md:h-[360px] lg:h-[420px] w-full',
            ];
            const cellClasses = (() => {
              const row1Height = 'md:h-[420px] lg:h-[480px]';
              const row2Height = 'md:h-[360px] lg:h-[420px]';
              switch (index) {
                case 0:
                  return [...baseClasses, row1Height, 'md:w-1/2', 'border-white/10'];
                case 1:
                  return [...baseClasses, row1Height, 'md:w-1/2', 'border-white/10'];
                case 2:
                  return [...baseClasses, row2Height, 'md:w-3/4', 'border-white/10'];
                case 3:
                  return [...baseClasses, row2Height, 'md:w-1/4', 'border-white/10'];
                default:
                  return baseClasses;
              }
            })();

            return (
              <article
                key={item.fieldPath ?? index}
                className={cellClasses.join(' ')}
                {...getVisualEditorAttributes()}
                data-sb-field-path={item.fieldPath}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.imageAlt}
                    className="absolute inset-0 h-full w-full object-cover"
                    style={imageStyle}
                    {...getVisualEditorAttributes(item.imageFieldPath)}
                  />
                ) : (
                  <div
                    className="absolute inset-0 flex items-center justify-center border border-dashed border-white/40"
                    {...getVisualEditorAttributes()}
                  >
                    <span className="text-sm text-white/70">Add an image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" aria-hidden />
                <div className="relative z-10 flex w-full flex-col gap-3 px-6 py-8 sm:px-8 sm:py-10">
                  {item.eyebrow?.trim() ? (
                    <span
                      className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70"
                      {...getVisualEditorAttributes()}
                    >
                      {item.eyebrow}
                    </span>
                  ) : null}
                  {item.title?.trim() ? (
                    <h3
                      className="text-2xl font-semibold leading-snug"
                      {...getVisualEditorAttributes()}
                    >
                      {item.title}
                    </h3>
                  ) : null}
                  {item.body?.trim() ? (
                    <p
                      className="text-sm text-white/85 max-w-md"
                      {...getVisualEditorAttributes()}
                    >
                      {item.body}
                    </p>
                  ) : null}
                  {renderCta(item)}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MediaShowcase;
