import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { getVisualEditorAttributes } from '../../utils/stackbitBindings';
import { getCloudinaryUrl } from '../../utils/imageUrl';
import { usePrefersReducedMotion } from '../../src/hooks/useReducedMotion';

interface ImageTextHalfProps {
  image?: string;
  title?: string;
  text?: string;
  imageAlt?: string;
  fieldPath?: string;
}

const ImageTextHalf: React.FC<ImageTextHalfProps> = ({ image, title, text, imageAlt, fieldPath }) => {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (!title && !text && !image) {
    return null;
  }

  const markdownSource = text?.trim();
  const trimmedImage = image?.trim();
  const cloudinaryUrl = trimmedImage ? getCloudinaryUrl(trimmedImage) ?? trimmedImage : '';
  const altText = [imageAlt, title]
    .map((value) => value?.trim())
    .find((value): value is string => Boolean(value))
    ?? 'Featured illustration';

  const revealProps = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.6, delay: 0.1 },
  } as const;

  const textContent = (
    <>
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
    </>
  );

  const textWrapper = prefersReducedMotion ? (
    <div className="order-2 lg:order-1">
      {textContent}
    </div>
  ) : (
    <motion.div className="order-2 lg:order-1" {...revealProps}>
      {textContent}
    </motion.div>
  );

  const imageContent = trimmedImage ? (
    <img
      src={cloudinaryUrl}
      alt={altText}
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
  );

  const imageWrapper = prefersReducedMotion ? (
    <div className="order-1 lg:order-2">
      {imageContent}
    </div>
  ) : (
    <motion.div className="order-1 lg:order-2" {...revealProps}>
      {imageContent}
    </motion.div>
  );

  return (
    <section
      className="py-16 sm:py-24 bg-white"
      data-sb-field-path={fieldPath}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {textWrapper}
          {imageWrapper}
        </div>
      </div>
    </section>
  );
};

export default ImageTextHalf;
