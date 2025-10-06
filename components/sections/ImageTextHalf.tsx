import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import type { FocalPoint } from '../../types';
import { getVisualEditorAttributes } from '../../utils/stackbitBindings';
import { getCloudinaryUrl, getObjectPositionFromFocal } from '../../utils/imageUrl';
import { usePrefersReducedMotion } from '../../src/hooks/usePrefersReducedMotion';

interface ImageTextHalfProps {
  image?: string;
  imageFocal?: FocalPoint | null;
  title?: string;
  text?: string;
  imageAlt?: string;
  fieldPath?: string;
}

const ImageTextHalf: React.FC<ImageTextHalfProps> = ({
  image,
  imageFocal,
  title,
  text,
  imageAlt,
  fieldPath,
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();

  const trimmedTitle = title?.trim();
  const markdownSource = text?.trim();
  const trimmedImage = image?.trim();

  if (!trimmedTitle && !markdownSource && !trimmedImage) {
    return null;
  }

  const cloudinaryUrl = trimmedImage ? getCloudinaryUrl(trimmedImage) ?? trimmedImage : '';
  const objectPosition = getObjectPositionFromFocal(imageFocal ?? undefined);
  const imageStyle = objectPosition ? { objectPosition } : undefined;
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
      {trimmedTitle ? (
        <h2
          className="text-3xl font-semibold text-stone-900 mb-6"
          {...(fieldPath ? getVisualEditorAttributes(`${fieldPath}.title`) : {})}
        >
          {trimmedTitle}
        </h2>
      ) : null}
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
      style={imageStyle}
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
