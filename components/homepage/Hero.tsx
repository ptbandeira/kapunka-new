import React from 'react';
import { getVisualEditorAttributes } from '../../utils/stackbitBindings';
import type { HomeHeroSection, SectionWithMeta } from '../../homePageBuilderTypes';
import { resolveLocalizedText, resolveCtaClassName } from './utils';

interface HeroProps extends SectionWithMeta<HomeHeroSection> {}

const Hero: React.FC<HeroProps> = ({
  headline,
  subtext,
  background_image,
  cta,
  language,
  fieldPath,
}) => {
  const resolvedHeadline = resolveLocalizedText(headline, language);
  const resolvedSubtext = resolveLocalizedText(subtext, language);
  const resolvedCtaLabel = resolveLocalizedText(cta?.label, language);
  const hasCta = Boolean(resolvedCtaLabel && cta?.url);

  if (!resolvedHeadline && !resolvedSubtext) {
    return null;
  }

  const backgroundImage = background_image?.trim();

  return (
    <section
      className="relative isolate overflow-hidden bg-stone-900 text-white"
      {...getVisualEditorAttributes(fieldPath)}
    >
      {backgroundImage ? (
        <img
          src={backgroundImage}
          alt={resolvedHeadline ?? resolvedSubtext ?? 'Hero background'}
          className="absolute inset-0 h-full w-full object-cover"
          {...getVisualEditorAttributes(`${fieldPath}.background_image`)}
        />
      ) : null}
      <div className="absolute inset-0 bg-stone-950/60" aria-hidden="true" />
      <div className="relative mx-auto flex min-h-[70vh] w-full max-w-5xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-8">
        {resolvedHeadline ? (
          <h1
            className="text-4xl font-semibold tracking-tight sm:text-5xl"
            {...getVisualEditorAttributes(`${fieldPath}.headline`)}
          >
            {resolvedHeadline}
          </h1>
        ) : null}
        {resolvedSubtext ? (
          <p
            className="mt-6 max-w-2xl text-base text-stone-200 sm:text-lg"
            {...getVisualEditorAttributes(`${fieldPath}.subtext`)}
          >
            {resolvedSubtext}
          </p>
        ) : null}
        {hasCta ? (
          <div className="mt-10">
            <a
              href={cta?.url ?? '#'}
              className={resolveCtaClassName(cta?.style)}
              {...getVisualEditorAttributes(`${fieldPath}.cta`)}
            >
              {resolvedCtaLabel}
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default Hero;
