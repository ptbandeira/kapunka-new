import React from 'react';
import type { HeroSimpleSectionContent, LocalizedValue } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface HeroSimpleProps {
  section: HeroSimpleSectionContent;
  fieldPath?: string;
}

const HeroSimple: React.FC<HeroSimpleProps> = ({ section, fieldPath }) => {
  const { language } = useLanguage();
  const title = section.content?.headline?.[language]?.trim();
  const subtitle = section.content?.subheadline?.[language]?.trim();
  const imageSrc = section.image || "https://res.cloudinary.com/du6xl727e/image/upload/v1759768424/pexels-reyna-2825461_qo3q1v.jpg";
  const primaryCta = section.ctas?.primary;
  const secondaryCta = section.ctas?.secondary;
  const layout = section.layout;

  const getLocalizedValue = <T,>(value: LocalizedValue<T> | undefined): T | undefined => {
    if (!value) return undefined;
    return typeof value === 'object' && 'en' in value ? value[language] : value as T;
  };

  // Early return if required data is missing
  if (!title) return null;

  const getTextAlignmentClass = (textAnchor: string) => {
    switch (textAnchor) {
      case 'bottom-left':
        return 'items-end justify-start';
      case 'bottom-center':
        return 'items-end justify-center';
      case 'bottom-right':
        return 'items-end justify-end';
      case 'middle-left':
        return 'items-center justify-start';
      case 'middle-center':
        return 'items-center justify-center';
      case 'middle-right':
        return 'items-center justify-end';
      case 'top-left':
        return 'items-start justify-start';
      case 'top-center':
        return 'items-start justify-center';
      case 'top-right':
        return 'items-start justify-end';
      default:
        return 'items-center justify-start';
    }
  };

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
          <div className={`absolute inset-0 ${getLocalizedValue(layout?.overlay) === 'strong' ? 'bg-gradient-to-l from-black/90 via-black/70 to-transparent' : 'bg-black/50'}`}></div>
        </div>
      )}

      {/* Content */}
      <div className="relative h-full">
        <div className="container mx-auto h-full">
          <div className={`flex h-full ${getTextAlignmentClass(getLocalizedValue(layout?.textAnchor) || 'bottom-left')}`}>
            <div className={`w-full max-w-2xl space-y-8 px-6 lg:px-8 text-white pt-20 ${
              getLocalizedValue(layout?.textPosition) === 'overlay' ? '' : 'lg:w-1/2'
            }`}>
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
                    href={primaryCta.href?.[language]}
                    className="inline-flex items-center px-6 py-3 text-sm font-medium tracking-wide text-gray-900 transition bg-white rounded-full hover:bg-white/90"
                  >
                    {primaryCta.label?.[language]}
                  </a>
                )}
                {secondaryCta && (
                  <a
                    href={secondaryCta.href?.[language]}
                    className="inline-flex items-center px-6 py-3 text-sm font-medium tracking-wide text-white transition border border-white/40 rounded-full hover:bg-white/10"
                  >
                    {secondaryCta.label?.[language]}
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
