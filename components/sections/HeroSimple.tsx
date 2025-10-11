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
  const imageSrc = section.image;

  if (!title && !subtitle && !eyebrow) {
    return null;
  }

  return (
    <section className="relative h-screen bg-black">
      {/* Background Image */}
      {imageSrc && (
        <div className="absolute inset-0">
          <img
            src={imageSrc}
            alt={title || 'Hero background'}
            className="h-full w-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent"></div>
        </div>
      )}

      {/* Content */}
      <div className="relative h-full">
        <div className="container mx-auto h-full px-6 lg:px-8">
          <div className="flex h-full items-center justify-end">
            <div className="w-full max-w-xl space-y-6 text-white lg:w-1/2">
              {eyebrow && (
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/70">
                  {eyebrow}
                </p>
              )}
              {title && (
                <h1 className="text-5xl font-bold leading-tight tracking-tight text-white md:text-6xl lg:text-7xl">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-lg text-white/80 md:text-xl">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSimple;
