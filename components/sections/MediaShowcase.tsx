import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { buildLocalizedPath } from '../../utils/localePaths';
import { getVisualEditorAttributes } from '../../utils/stackbitBindings';
import { getCloudinaryUrl, getObjectPositionFromFocal } from '../../utils/imageUrl';
import type { MediaShowcaseSectionContent } from '../../types';

interface MediaShowcaseProps {
  section: MediaShowcaseSectionContent;
  fieldPath?: string;
}

const isInternal = (href: string) => href.startsWith('/') || href.startsWith('#/');

const normalizeInternal = (href: string) => {
  if (href.startsWith('#/')) {
    const normalized = href.slice(1);
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
  }
  return href.startsWith('/') ? href : `/${href}`;
};

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

    if (isInternal(item.ctaHref)) {
      return (
        <Link
          to={buildLocalizedPath(normalizeInternal(item.ctaHref), language)}
          className="inline-flex items-center rounded-full border border-white/60 bg-white/10 px-5 py-2 text-sm font-medium tracking-wide text-white transition hover:bg-white hover:text-stone-900"
          {...getVisualEditorAttributes(item.ctaHrefFieldPath)}
        >
          <span {...getVisualEditorAttributes(item.ctaLabelFieldPath)}>{item.ctaLabel}</span>
        </Link>
      );
    }

    return (
      <a
        href={item.ctaHref}
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
    <section className="py-20 sm:py-28 bg-white" {...getVisualEditorAttributes(fieldPath)} data-sb-field-path={fieldPath}>
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-0">
        {title?.trim() ? (
          <div
            className="max-w-3xl mb-10"
            {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.title` : undefined)}
          >
            <h2 className="text-3xl sm:text-4xl font-semibold text-stone-900 tracking-tight">{title}</h2>
          </div>
        ) : null}
        <div className="grid auto-rows-[minmax(640px,1fr)] gap-y-0 md:grid-cols-4 md:gap-x-0">
          {items.map((item, index) => {
            const layoutClasses = (() => {
              if (index === 0) {
                return 'md:col-span-2 md:row-span-2 lg:row-span-1';
              }
              if (index === 1) {
                return 'md:col-span-2 md:row-span-2 lg:row-span-1';
              }
              if (index === 2) {
                return 'md:col-span-4 lg:col-span-3 lg:row-span-1';
              }
              if (index === 3) {
                return 'md:col-span-2 lg:col-span-1 lg:row-span-1';
              }
              return 'md:col-span-2';
            })();

            const contentAlignment = index === 3 ? 'items-end text-right' : 'items-start text-left';
            const justify = index === 3 ? 'lg:items-end' : 'lg:items-start';
            const objectPosition = getObjectPositionFromFocal(item.imageFocal ?? undefined);
            const imageStyle = objectPosition ? { objectPosition } : undefined;
            return (
              <article
                key={item.fieldPath ?? index}
                className={`relative overflow-hidden bg-stone-900 text-white flex ${layoutClasses}`}
                {...getVisualEditorAttributes(item.fieldPath)}
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
                    {...getVisualEditorAttributes(item.imageFieldPath)}
                  >
                    <span className="text-sm text-white/70">Add an image</span>
                  </div>
                )}
                <div className="relative z-10 flex h-full w-full">
                  <div className={`flex flex-col justify-end gap-4 p-6 sm:p-8 lg:p-10 w-full ${contentAlignment} ${justify}`}>
                    {item.eyebrow?.trim() ? (
                      <span
                        className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80"
                        {...getVisualEditorAttributes(item.eyebrowFieldPath)}
                      >
                        {item.eyebrow}
                      </span>
                    ) : null}
                    {item.title?.trim() ? (
                      <h3
                        className="text-2xl sm:text-3xl font-semibold leading-snug"
                        {...getVisualEditorAttributes(item.titleFieldPath)}
                      >
                        {item.title}
                      </h3>
                    ) : null}
                    {item.label?.trim() ? (
                      <span
                        className="text-sm font-medium uppercase tracking-[0.16em] text-white/70"
                        {...getVisualEditorAttributes(item.labelFieldPath)}
                      >
                        {item.label}
                      </span>
                    ) : null}
                    {item.description?.trim() ? (
                      <p
                        className="text-sm sm:text-base text-white/85 max-w-md"
                        {...getVisualEditorAttributes(item.descriptionFieldPath)}
                      >
                        {item.description}
                      </p>
                    ) : null}
                    {item.body?.trim() ? (
                      <p
                        className="text-sm sm:text-base text-white/80 max-w-md"
                        {...getVisualEditorAttributes(item.bodyFieldPath)}
                      >
                        {item.body}
                      </p>
                    ) : null}
                    {renderCta(item)}
                  </div>
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
