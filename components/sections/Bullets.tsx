import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getVisualEditorAttributes } from '../../utils/stackbitBindings';
import type { BulletsSectionContent } from '../../types';

interface BulletsProps {
  section: BulletsSectionContent;
  fieldPath?: string;
}

const Bullets: React.FC<BulletsProps> = ({ section, fieldPath }) => {
  const { translate } = useLanguage();

  const title = section.title ? translate(section.title) : '';
  const items = (section.items ?? []).map((item, index) => {
    const text = item ? translate(item) : '';
    const itemFieldPath = fieldPath ? `${fieldPath}.items.${index}` : undefined;
    return {
      text,
      fieldPath: itemFieldPath,
      hasContent: Boolean(text?.trim()),
    };
  }).filter((item) => item.hasContent);

  if (!title?.trim() && items.length === 0) {
    return null;
  }

  return (
    <section className="py-16 sm:py-24 bg-white" {...getVisualEditorAttributes(fieldPath)} data-sb-field-path={fieldPath}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          {title?.trim() ? (
            <h2
              className="text-3xl sm:text-4xl font-semibold text-stone-900"
              {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.title` : undefined)}
            >
              {title}
            </h2>
          ) : null}
          {items.length > 0 ? (
            <ul className="mt-6 space-y-3 text-lg text-stone-700">
              {items.map((item, index) => (
                <li
                  key={item.fieldPath ?? index}
                  className="flex items-start gap-3"
                  {...getVisualEditorAttributes(item.fieldPath)}
                  data-sb-field-path={item.fieldPath}
                >
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-stone-900" aria-hidden />
                  <span {...getVisualEditorAttributes(item.fieldPath)}>{item.text}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default Bullets;
