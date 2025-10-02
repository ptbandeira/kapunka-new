import React from 'react';
import ReactMarkdown from 'react-markdown';
import { getVisualEditorAttributes } from '../../utils/stackbitBindings';

interface ImageTextHalfProps {
  image?: string;
  title?: string;
  text?: string;
  fieldPath?: string;
}

const ImageTextHalf: React.FC<ImageTextHalfProps> = ({ image, title, text, fieldPath }) => {
  if (!title && !text && !image) {
    return null;
  }

  const markdownSource = text?.trim();

  return (
    <section
      className="py-16 sm:py-24 bg-white"
      data-sb-field-path={fieldPath}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            {title && (
              <h2
                className="text-3xl font-semibold text-stone-900 mb-6"
                {...(fieldPath ? getVisualEditorAttributes(`${fieldPath}.title`) : {})}
              >
                {title}
              </h2>
            )}
            {markdownSource && (
              <div
                className="prose prose-stone max-w-none text-stone-700"
                {...(fieldPath ? getVisualEditorAttributes(`${fieldPath}.text`) : {})}
              >
                <ReactMarkdown>{markdownSource}</ReactMarkdown>
              </div>
            )}
          </div>
          <div className="order-1 lg:order-2">
            {image ? (
              <img
                src={image}
                alt={title ?? ''}
                className="w-full h-full object-cover rounded-lg shadow-sm"
                {...(fieldPath ? getVisualEditorAttributes(`${fieldPath}.image`) : {})}
              />
            ) : (
              <div
                className="w-full aspect-[4/3] rounded-lg border border-dashed border-stone-300 bg-stone-100 flex items-center justify-center text-sm text-stone-400"
                {...(fieldPath ? getVisualEditorAttributes(`${fieldPath}.image`) : {})}
              >
                Image coming soon
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ImageTextHalf;
