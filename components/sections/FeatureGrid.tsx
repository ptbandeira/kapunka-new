import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../../contexts/LanguageContext';
import { getVisualEditorAttributes } from '../../utils/stackbitBindings';
import { getCloudinaryUrl } from '../../utils/imageUrl';
import type { FeatureGridSectionContent, LocalizedNumber } from '../../types';

interface FeatureGridProps {
  section: FeatureGridSectionContent;
  fieldPath?: string;
}

const coerceNumber = (
  translate: ReturnType<typeof useLanguage>['translate'],
  value: LocalizedNumber | undefined,
): number | undefined => {
  if (value == null) {
    return undefined;
  }

  const translated = translate<number | string>(value);
  if (typeof translated === 'number') {
    return translated;
  }

  const parsed = Number(translated);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const FeatureGrid: React.FC<FeatureGridProps> = ({ section, fieldPath }) => {
  const { translate } = useLanguage();

  const resolvedTitle = section.title ? translate(section.title) : '';
  const resolvedColumns = coerceNumber(translate, section.columns);

  const items = (section.items ?? []).map((item, index) => {
    const label = item?.label ? translate(item.label) : '';
    const description = item?.description ? translate(item.description) : '';
    const iconSrc = item?.icon?.trim();
    const imageUrl = iconSrc ? getCloudinaryUrl(iconSrc) ?? iconSrc : undefined;
    const itemFieldPath = fieldPath ? `${fieldPath}.items.${index}` : undefined;

    return {
      label,
      description,
      imageUrl,
      hasContent: Boolean(label?.trim() || description?.trim() || imageUrl),
      fieldPath: itemFieldPath,
      labelFieldPath: itemFieldPath ? `${itemFieldPath}.label` : undefined,
      descriptionFieldPath: itemFieldPath ? `${itemFieldPath}.description` : undefined,
      iconFieldPath: itemFieldPath ? `${itemFieldPath}.icon` : undefined,
    };
  });

  const visibleItems = items.filter((item) => item.hasContent);

  if (!resolvedTitle?.trim() && visibleItems.length === 0) {
    return null;
  }

  const columnsClass = (() => {
    const columns = resolvedColumns && resolvedColumns >= 1 ? Math.min(Math.round(resolvedColumns), 4) : undefined;
    switch (columns) {
      case 4:
        return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4';
      case 3:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 2:
        return 'grid-cols-1 md:grid-cols-2';
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  })();

  return (
    <section className="py-16 sm:py-24 bg-white" {...getVisualEditorAttributes(fieldPath)} data-sb-field-path={fieldPath}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {resolvedTitle?.trim() ? (
          <div className="mb-10 max-w-3xl">
            <h2
              className="text-3xl sm:text-4xl font-semibold text-stone-900"
              {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.title` : undefined)}
            >
              {resolvedTitle}
            </h2>
          </div>
        ) : null}

        <div className={`grid gap-6 ${columnsClass}`}>
          {visibleItems.map((item, index) => (
            <article
              key={`${item.fieldPath ?? index}`}
              className="rounded-2xl border border-stone-200 bg-stone-50 p-6 shadow-sm"
              {...getVisualEditorAttributes(item.fieldPath)}
              data-sb-field-path={item.fieldPath}
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.label || 'Feature icon'}
                  className="mb-4 h-12 w-12 object-contain"
                  {...getVisualEditorAttributes(item.iconFieldPath)}
                />
              ) : null}
              {item.label?.trim() ? (
                <h3
                  className="text-xl font-semibold text-stone-900"
                  {...getVisualEditorAttributes(item.labelFieldPath)}
                >
                  {item.label}
                </h3>
              ) : null}
              {item.description?.trim() ? (
                <div
                  className="mt-3 text-sm leading-relaxed text-stone-600"
                  {...getVisualEditorAttributes(item.descriptionFieldPath)}
                >
                  <ReactMarkdown>{item.description}</ReactMarkdown>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;
