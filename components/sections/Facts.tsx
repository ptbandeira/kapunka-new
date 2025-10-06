import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../../contexts/LanguageContext';
import { getVisualEditorAttributes } from '../../utils/stackbitBindings';
import type { FactsSectionContent } from '../../types';

interface FactsProps {
  section: FactsSectionContent;
  fieldPath?: string;
}

const Facts: React.FC<FactsProps> = ({ section, fieldPath }) => {
  const { translate } = useLanguage();

  const title = section.title ? translate(section.title) : '';
  const text = section.text ? translate(section.text) : '';

  if (!title?.trim() && !text?.trim()) {
    return null;
  }

  return (
    <section className="py-16 sm:py-24 bg-white" {...getVisualEditorAttributes(fieldPath)} data-sb-field-path={fieldPath}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {title?.trim() ? (
            <h2
              className="text-3xl sm:text-4xl font-semibold text-stone-900"
              {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.title` : undefined)}
            >
              {title}
            </h2>
          ) : null}
          {text?.trim() ? (
            <div
              className="mt-6 text-lg leading-relaxed text-stone-600"
              {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.text` : undefined)}
            >
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default Facts;
