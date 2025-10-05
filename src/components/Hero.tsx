import React from 'react';
import { motion } from 'framer-motion';

import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

const EASING: [number, number, number, number] = [0.21, 0.75, 0.31, 0.96];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
} as const;

type HeroImage = {
  id?: string;
  src: string;
  alt: string;
  className?: string;
};

interface HeroProps extends React.HTMLAttributes<HTMLElement> {
  eyebrow?: React.ReactNode;
  heading: React.ReactNode;
  subheading?: React.ReactNode;
  images?: HeroImage[];
  actions?: React.ReactNode;
  align?: 'left' | 'center';
}

const buildContainerClassName = (align: HeroProps['align']): string => {
  switch (align) {
    case 'center':
      return 'text-center md:items-center md:text-center';
    case 'left':
    default:
      return 'text-left md:text-left md:items-start';
  }
};

const Hero: React.FC<HeroProps> = ({
  eyebrow,
  heading,
  subheading,
  images = [],
  actions,
  align = 'left',
  className,
  ...rest
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const containerAlignment = buildContainerClassName(align);

  const actionsAlignment = align === 'center' ? 'sm:justify-center' : 'sm:justify-start';

  const headingContent = (
    <>
      {eyebrow ? (
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-stone-500">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-stone-900">
        {heading}
      </h1>
      {subheading ? (
        <p className="text-lg text-stone-600 leading-relaxed md:max-w-2xl md:mx-0">
          {subheading}
        </p>
      ) : null}
      {actions ? (
        <div className={`mt-8 flex flex-col items-stretch gap-4 sm:flex-row ${actionsAlignment}`}>
          {actions}
        </div>
      ) : null}
    </>
  );

  const headingNode = prefersReducedMotion ? (
    <div className={`space-y-6 ${containerAlignment}`}>
      {headingContent}
    </div>
  ) : (
    <motion.div
      className={`space-y-6 ${containerAlignment}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.6 }}
      variants={fadeUp}
      transition={{ duration: 0.7, ease: EASING }}
    >
      {headingContent}
    </motion.div>
  );

  const renderedImages = images.map((image, index) => {
    const key = image.id ?? `${image.src}-${index}`;
    const imageNode = (
      <img
        src={image.src}
        alt={image.alt}
        className={`h-full w-full rounded-3xl object-cover shadow-lg ${image.className ?? ''}`}
        loading="lazy"
      />
    );

    if (prefersReducedMotion) {
      return (
        <div key={key} className="relative overflow-hidden rounded-3xl shadow-lg">
          {imageNode}
        </div>
      );
    }

    return (
      <motion.div
        key={key}
        className="relative overflow-hidden rounded-3xl shadow-lg"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
        variants={fadeUp}
        transition={{ duration: 0.6, ease: EASING, delay: index * 0.1 }}
        whileHover={{ y: -6 }}
      >
        {imageNode}
      </motion.div>
    );
  });

  const imageGridColumns = images.length > 1 ? 'md:grid-cols-2' : 'md:grid-cols-1';

  return (
    <section
      className={`relative overflow-hidden py-20 sm:py-24 ${className ?? ''}`.trim()}
      {...rest}
    >
      <div className="container mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
        {headingNode}
        {renderedImages.length > 0 ? (
          <div className={`grid gap-6 ${imageGridColumns}`}>
            {renderedImages}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export type { HeroProps, HeroImage };
export default Hero;
