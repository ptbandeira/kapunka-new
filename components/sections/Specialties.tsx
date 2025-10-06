import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getVisualEditorAttributes } from '../../utils/stackbitBindings';
import type { SpecialtiesSectionContent } from '../../types';

interface SpecialtiesProps {
  section: SpecialtiesSectionContent;
  fieldPath?: string;
}

const Specialties: React.FC<SpecialtiesProps> = ({ section, fieldPath }) => {
  const { translate } = useLanguage();

  const title = section.title ? translate(section.title) : '';
  const items = (section.items ?? []).map((item, index) => {
    const titleText = item?.title ? translate(item.title) : '';
    const bullets = (item?.bullets ?? []).map((bullet, bulletIndex) => {
      const text = bullet ? translate(bullet) : '';
      const bulletFieldPath = fieldPath ? `${fieldPath}.items.${index}.bullets.${bulletIndex}` : undefined;
      return {
        text,
        fieldPath: bulletFieldPath,
        hasContent: Boolean(text?.trim()),
      };
    }).filter((bullet) => bullet.hasContent);
    const itemFieldPath = fieldPath ? `${fieldPath}.items.${index}` : undefined;

    return {
      title: titleText,
      bullets,
      fieldPath: itemFieldPath,
      titleFieldPath: itemFieldPath ? `${itemFieldPath}.title` : undefined,
      hasContent: Boolean(titleText?.trim() || bullets.length > 0),
    };
  }).filter((item) => item.hasContent);

  if (!title?.trim() && items.length === 0) {
    return null;
  }

  return (
    <section className="py-16 sm:py-24 bg-white" {...getVisualEditorAttributes(fieldPath)} data-sb-field-path={fieldPath}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {title?.trim() ? (
          <div className="mb-10 max-w-3xl">
            <h2
              className="text-3xl sm:text-4xl font-semibold text-stone-900"
              {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.title` : undefined)}
            >
              {title}
            </h2>
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <article
              key={item.fieldPath ?? index}
              className="rounded-3xl border border-stone-200 bg-stone-50 p-6 shadow-sm"
              {...getVisualEditorAttributes(item.fieldPath)}
              data-sb-field-path={item.fieldPath}
            >
              {item.title?.trim() ? (
                <h3
                  className="text-xl font-semibold text-stone-900"
                  {...getVisualEditorAttributes(item.titleFieldPath)}
                >
                  {item.title}
                </h3>
              ) : null}
              {item.bullets.length > 0 ? (
                <ul className="mt-4 space-y-2 text-sm text-stone-700">
                  {item.bullets.map((bullet, bulletIndex) => (
                    <li
                      key={bullet.fieldPath ?? bulletIndex}
                      className="flex items-start gap-2"
                      {...getVisualEditorAttributes(bullet.fieldPath)}
                      data-sb-field-path={bullet.fieldPath}
                    >
                      <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-stone-400" aria-hidden />
                      <span {...getVisualEditorAttributes(bullet.fieldPath)}>{bullet.text}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Specialties;
