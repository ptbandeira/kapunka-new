import React from 'react';
import { Link } from 'react-router-dom';
import { getVisualEditorAttributes } from '../../utils/stackbitBindings';
import { useLanguage } from '../../contexts/LanguageContext';
import { buildLocalizedPath } from '../../utils/localePaths';

export interface MediaShowcaseItem {
  eyebrow?: string;
  title?: string;
  body?: string;
  image?: string;
  alt?: string;
  fieldPath?: string;
  imageFieldPath?: string;
  eyebrowFieldPath?: string;
  titleFieldPath?: string;
  bodyFieldPath?: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaLabelFieldPath?: string;
  ctaHrefFieldPath?: string;
}

interface MediaShowcaseProps {
  title?: string;
  items: MediaShowcaseItem[];
  fieldPath?: string;
}

const isInternal = (href?: string) => Boolean(href && (href.startsWith('/') || href.startsWith('#/')));

const normalizeInternal = (href: string) => {
  if (href.startsWith('#/')) {
    const normalized = href.slice(1);
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
  }

  return href.startsWith('/') ? href : `/${href}`;
};

const MediaShowcase: React.FC<MediaShowcaseProps> = ({ title, items, fieldPath }) => {
  const { language } = useLanguage();

  return (
    <section
      className="py-20 sm:py-28 bg-white"
      {...getVisualEditorAttributes(fieldPath)}
      data-sb-field-path={fieldPath}
    >
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-0">
        {title && (
          <div
            className="max-w-3xl mb-10"
            {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.title` : undefined)}
            data-sb-field-path={fieldPath ? `${fieldPath}.title` : undefined}
          >
            <h2 className="text-3xl sm:text-4xl font-semibold text-stone-900 tracking-tight">{title}</h2>
          </div>
        )}
        <div className="grid auto-rows-[minmax(640px,1fr)] gap-y-0 md:grid-cols-4 md:gap-x-0">
          {items.map((item, index) => {
            const imageSrc = item.image;
            const eyebrow = item.eyebrow?.trim();
            const itemTitle = item.title?.trim();
            const body = item.body?.trim();
            const ctaLabel = item.ctaLabel?.trim();
            const ctaHref = item.ctaHref?.trim();

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

            return (
              <article
                key={`${item.fieldPath ?? index}`}
                className={`relative overflow-hidden bg-stone-900 text-white flex ${layoutClasses}`}
                {...getVisualEditorAttributes(item.fieldPath)}
                data-sb-field-path={item.fieldPath}
              >
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt={item.alt ?? itemTitle ?? 'Kapunka highlight'}
                    className="absolute inset-0 h-full w-full object-cover"
                    {...getVisualEditorAttributes(item.imageFieldPath)}
                    data-sb-field-path={item.imageFieldPath}
                  />
                ) : (
                  <div
                    className="absolute inset-0 flex items-center justify-center border border-dashed border-white/40"
                    {...getVisualEditorAttributes(item.imageFieldPath)}
                    data-sb-field-path={item.imageFieldPath}
                  >
                    <span className="text-sm text-white/70">Add an image</span>
                  </div>
                )}
                <div className="relative z-10 flex h-full w-full">
                  <div className={`flex flex-col justify-end gap-4 p-6 sm:p-8 lg:p-10 w-full ${contentAlignment} ${justify}`}>
                    {eyebrow && (
                      <span
                        className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80"
                        {...getVisualEditorAttributes(item.eyebrowFieldPath)}
                        data-sb-field-path={item.eyebrowFieldPath}
                      >
                        {eyebrow}
                      </span>
                    )}
                    {itemTitle && (
                      <h3
                        className="text-2xl sm:text-3xl font-semibold leading-snug"
                        {...getVisualEditorAttributes(item.titleFieldPath)}
                        data-sb-field-path={item.titleFieldPath}
                      >
                        {itemTitle}
                      </h3>
                    )}
                    {body && (
                      <p
                        className="text-sm sm:text-base text-white/85 max-w-md"
                        {...getVisualEditorAttributes(item.bodyFieldPath)}
                        data-sb-field-path={item.bodyFieldPath}
                      >
                        {body}
                      </p>
                    )}
                    {ctaLabel && ctaHref && (
                      <div className="pt-2">
                        {isInternal(ctaHref) ? (
                          <Link
                            to={buildLocalizedPath(normalizeInternal(ctaHref), language)}
                            className="inline-flex items-center rounded-full border border-white/60 bg-white/10 px-5 py-2 text-sm font-medium tracking-wide text-white transition hover:bg-white hover:text-stone-900"
                            {...getVisualEditorAttributes(item.ctaHrefFieldPath)}
                            data-sb-field-path={item.ctaHrefFieldPath}
                          >
                            <span
                              {...getVisualEditorAttributes(item.ctaLabelFieldPath)}
                              data-sb-field-path={item.ctaLabelFieldPath}
                            >
                              {ctaLabel}
                            </span>
                          </Link>
                        ) : (
                          <a
                            href={ctaHref}
                            className="inline-flex items-center rounded-full border border-white/60 bg-white/10 px-5 py-2 text-sm font-medium tracking-wide text-white transition hover:bg-white hover:text-stone-900"
                            {...getVisualEditorAttributes(item.ctaHrefFieldPath)}
                            data-sb-field-path={item.ctaHrefFieldPath}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <span
                              {...getVisualEditorAttributes(item.ctaLabelFieldPath)}
                              data-sb-field-path={item.ctaLabelFieldPath}
                            >
                              {ctaLabel}
                            </span>
                          </a>
                        )}
                      </div>
                    )}
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
