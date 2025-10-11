import React from 'react';
import type { HeroSimpleSectionContent } from '../../types';

interface HeroSimpleProps {
  section: HeroSimpleSectionContent;
  fieldPath?: string;
}

const HeroSimple: React.FC<HeroSimpleProps> = ({ section, fieldPath }) => {
  const title = section.title?.trim();
  const subtitle = section.subtitle?.trim();
  const eyebrow = section.eyebrow?.trim();

  if (!title && !subtitle && !eyebrow) {
    return null;
  }

  // Field paths are no longer needed after visual editor removal

  return (
    <section className="py-16 sm:py-24">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 text-center">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
              {eyebrow}
            </p>
          ) : null}
          {title ? (
            <h1 className="text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
              {title}
            </h1>
          ) : null}
          {subtitle ? (
            <p className="mx-auto max-w-2xl text-lg text-stone-600">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default HeroSimple;
