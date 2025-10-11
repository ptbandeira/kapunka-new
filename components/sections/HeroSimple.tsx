import React from 'react';
import type { HeroSimpleSectionContent } from '../../types';

interface HeroSimpleProps {
  section: HeroSimpleSectionContent;
  fieldPath?: string;
}

const HeroSimple: React.FC<HeroSimpleProps> = ({ section, fieldPath }) => {
  const title = section.title?.trim();
  const subtitle = section.subtitle?.trim();
  const imageSrc = section.image;
  const primaryCta = section.primaryCta;
  const secondaryCta = section.secondaryCta;

  if (!title) {
    return null;
  }

  return (
    <section className="relative h-screen xl:h-[120vh] bg-black">
      {/* Background Image */}
      {imageSrc && (
        <div className="absolute inset-0">
          <img
            src={imageSrc}
            alt={title || 'Hero background'}
            className="h-full w-full object-cover opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-black/90 via-black/70 to-transparent"></div>
        </div>
      )}

      {/* Content */}
      <div className="relative h-full">
        <div className="container mx-auto h-full">
          <div className="flex h-full items-center justify-end">
            <div className="w-full max-w-2xl space-y-8 px-6 lg:px-8 text-white lg:w-1/2 pt-20">
              <h1 className="text-5xl font-bold leading-none tracking-tight text-white md:text-6xl lg:text-7xl">
                {title}
              </h1>
              {subtitle && (
                <p className="text-lg leading-relaxed text-white/90 md:text-xl max-w-xl">
                  {subtitle}
                </p>
              )}
              <div className="flex flex-wrap gap-4 pt-4">
                {primaryCta && (
                  <a
                    href={primaryCta.href}
                    className="inline-flex items-center px-6 py-3 text-sm font-medium tracking-wide text-gray-900 transition bg-white rounded-full hover:bg-white/90"
                  >
                    {primaryCta.label}
                  </a>
                )}
                {secondaryCta && (
                  <a
                    href={secondaryCta.href}
                    className="inline-flex items-center px-6 py-3 text-sm font-medium tracking-wide text-white transition border border-white/40 rounded-full hover:bg-white/10"
                  >
                    {secondaryCta.label}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSimple;
