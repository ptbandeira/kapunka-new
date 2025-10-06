import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../../contexts/LanguageContext';
import { getVisualEditorAttributes } from '../../utils/stackbitBindings';
import type { TestimonialsSectionContent } from '../../types';

interface TestimonialsProps {
  section: TestimonialsSectionContent;
  fieldPath?: string;
}

const Testimonials: React.FC<TestimonialsProps> = ({ section, fieldPath }) => {
  const { translate } = useLanguage();

  const title = section.title ? translate(section.title) : '';

  const quotes = (section.quotes ?? []).map((quote, index) => {
    const text = quote?.text ? translate(quote.text) : '';
    const author = quote?.author ? translate(quote.author) : '';
    const role = quote?.role ? translate(quote.role) : '';
    const quoteFieldPath = fieldPath ? `${fieldPath}.quotes.${index}` : undefined;

    return {
      text,
      author,
      role,
      fieldPath: quoteFieldPath,
      textFieldPath: quoteFieldPath ? `${quoteFieldPath}.text` : undefined,
      authorFieldPath: quoteFieldPath ? `${quoteFieldPath}.author` : undefined,
      roleFieldPath: quoteFieldPath ? `${quoteFieldPath}.role` : undefined,
      hasContent: Boolean(text?.trim() || author?.trim() || role?.trim()),
    };
  }).filter((quote) => quote.hasContent);

  if (!title?.trim() && quotes.length === 0) {
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

        <div className="grid gap-6 md:grid-cols-2">
          {quotes.map((quote, index) => (
            <blockquote
              key={quote.fieldPath ?? index}
              className="rounded-3xl border border-stone-200 bg-stone-50 p-6 shadow-sm"
              {...getVisualEditorAttributes(quote.fieldPath)}
              data-sb-field-path={quote.fieldPath}
            >
              {quote.text?.trim() ? (
                <div
                  className="text-base italic leading-relaxed text-stone-700"
                  {...getVisualEditorAttributes(quote.textFieldPath)}
                >
                  <ReactMarkdown>{`“${quote.text}”`}</ReactMarkdown>
                </div>
              ) : null}
              <footer className="mt-4 text-xs uppercase tracking-[0.2em] text-stone-500">
                {quote.author?.trim() ? (
                  <div {...getVisualEditorAttributes(quote.authorFieldPath)}>{quote.author}</div>
                ) : null}
                {quote.role?.trim() ? (
                  <div
                    className="mt-1 text-[11px] font-normal normal-case tracking-normal text-stone-400"
                    {...getVisualEditorAttributes(quote.roleFieldPath)}
                  >
                    {quote.role}
                  </div>
                ) : null}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
