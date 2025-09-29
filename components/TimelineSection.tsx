import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import type { TimelineEntry } from '../types';

interface TimelineSectionProps {
  title?: string;
  entries: TimelineEntry[];
  fieldPath?: string;
}

const TimelineSection: React.FC<TimelineSectionProps> = ({ title, entries, fieldPath }) => {
  if (!entries || entries.length === 0) {
    return null;
  }

  const entriesFieldPath = fieldPath ? `${fieldPath}.entries` : undefined;

  const markdownComponents: Components = {
    p: ({ children, ...props }) => (
      <p className="text-stone-600 leading-relaxed mt-4" {...props}>
        {children}
      </p>
    ),
    ul: ({ children, ...props }) => (
      <ul
        className="list-disc list-inside text-stone-600 leading-relaxed mt-4 space-y-2"
        {...props}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol
        className="list-decimal list-inside text-stone-600 leading-relaxed mt-4 space-y-2"
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="text-stone-600 leading-relaxed" {...props}>
        {children}
      </li>
    ),
  };

  return (
    <div className="space-y-16" data-nlv-field-path={fieldPath}>
      {title && (
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-semibold text-center"
          data-nlv-field-path={fieldPath ? `${fieldPath}.title` : undefined}
        >
          {title}
        </motion.h2>
      )}
      <div className="space-y-16" data-nlv-field-path={entriesFieldPath}>
        {entries.map((entry, index) => {
          const hasImage = Boolean(entry.image && entry.image.trim().length > 0);
          const isEven = index % 2 === 0;
          const entryFieldPath = entriesFieldPath ? `${entriesFieldPath}.${index}` : undefined;

          const imageWrapperClassName = isEven ? 'order-1 md:order-1' : 'order-1 md:order-2';
          const contentWrapperClassName = hasImage
            ? `${isEven ? 'order-2 md:order-2' : 'order-2 md:order-1'} mt-8 md:mt-0`
            : 'order-2 md:col-span-2 mt-8 md:mt-0';

          return (
            <div
              key={`${entry.year}-${entry.title}`}
              className={`grid grid-cols-1 ${hasImage ? 'md:grid-cols-2' : ''} gap-12 items-center`}
              data-nlv-field-path={entryFieldPath}
            >
              {hasImage && (
                <motion.div
                  className={imageWrapperClassName}
                  initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <img
                    src={entry.image}
                    alt={entry.title}
                    className="rounded-lg shadow-lg w-full object-cover"
                    data-nlv-field-path={entryFieldPath ? `${entryFieldPath}.image` : undefined}
                  />
                </motion.div>
              )}
              <motion.div
                className={contentWrapperClassName}
                initial={{ opacity: 0, x: isEven ? 30 : -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <span
                  className="text-sm uppercase tracking-[0.3em] text-stone-500"
                  data-nlv-field-path={entryFieldPath ? `${entryFieldPath}.year` : undefined}
                >
                  {entry.year}
                </span>
                <h3
                  className="mt-2 text-2xl font-semibold"
                  data-nlv-field-path={entryFieldPath ? `${entryFieldPath}.title` : undefined}
                >
                  {entry.title}
                </h3>
                <div data-nlv-field-path={entryFieldPath ? `${entryFieldPath}.description` : undefined}>
                  <ReactMarkdown components={markdownComponents}>
                    {entry.description}
                  </ReactMarkdown>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineSection;
