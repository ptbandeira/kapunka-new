import React from 'react';
import { getVisualEditorAttributes } from '../../utils/stackbitBindings';
import type { HomeContactBannerSection, SectionWithMeta } from '../../homePageBuilderTypes';
import { resolveCtaClassName, resolveLocalizedText } from './utils';

interface ContactBannerProps extends SectionWithMeta<HomeContactBannerSection> {}

const ContactBanner: React.FC<ContactBannerProps> = ({ headline, cta, language, fieldPath }) => {
  const resolvedHeadline = resolveLocalizedText(headline, language);
  const resolvedCtaLabel = resolveLocalizedText(cta?.label, language);
  const hasCta = Boolean(resolvedCtaLabel && cta?.url);

  if (!resolvedHeadline && !hasCta) {
    return null;
  }

  return (
    <section className="bg-stone-900 py-16 text-white sm:py-20" {...getVisualEditorAttributes(fieldPath)}>
      <div className="container mx-auto flex max-w-4xl flex-col items-center justify-between gap-6 px-4 text-center sm:flex-row sm:text-left">
        {resolvedHeadline ? (
          <h2 className="text-2xl font-semibold sm:text-3xl" {...getVisualEditorAttributes(`${fieldPath}.headline`)}>
            {resolvedHeadline}
          </h2>
        ) : null}
        {hasCta ? (
          <a
            href={cta?.url ?? '#'}
            className={resolveCtaClassName(cta?.style)}
            {...getVisualEditorAttributes(`${fieldPath}.cta`)}
          >
            {resolvedCtaLabel}
          </a>
        ) : null}
      </div>
    </section>
  );
};

export default ContactBanner;
