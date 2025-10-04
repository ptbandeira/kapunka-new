import React from 'react';
import { getVisualEditorAttributes } from '../../utils/stackbitBindings';
import type { HomeShowcaseSection, SectionWithMeta } from '../../homePageBuilderTypes';
import { resolveLocalizedText } from './utils';

interface ShowcaseProps extends SectionWithMeta<HomeShowcaseSection> {}

const Showcase: React.FC<ShowcaseProps> = ({
  eyebrow,
  headline,
  text_content,
  media_gallery,
  language,
  fieldPath,
}) => {
  const resolvedEyebrow = resolveLocalizedText(eyebrow, language);
  const resolvedHeadline = resolveLocalizedText(headline, language);
  const resolvedText = resolveLocalizedText(text_content, language);
  const galleryItems = Array.isArray(media_gallery) ? media_gallery.filter(Boolean) : [];

  if (!resolvedHeadline && galleryItems.length === 0 && !resolvedText) {
    return null;
  }

  return (
    <section className="bg-white py-16 sm:py-24" {...getVisualEditorAttributes(fieldPath)}>
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {resolvedEyebrow ? (
          <p
            className="text-sm uppercase tracking-[0.3em] text-stone-500"
            {...getVisualEditorAttributes(`${fieldPath}.eyebrow`)}
          >
            {resolvedEyebrow}
          </p>
        ) : null}
        {resolvedHeadline ? (
          <h2
            className="mt-4 text-3xl font-semibold text-stone-900 sm:text-4xl"
            {...getVisualEditorAttributes(`${fieldPath}.headline`)}
          >
            {resolvedHeadline}
          </h2>
        ) : null}
        {resolvedText ? (
          <p
            className="mt-6 text-base text-stone-600 sm:text-lg"
            {...getVisualEditorAttributes(`${fieldPath}.text_content`)}
          >
            {resolvedText}
          </p>
        ) : null}
        {galleryItems.length > 0 ? (
          <div
            className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            {...getVisualEditorAttributes(`${fieldPath}.media_gallery`)}
          >
            {galleryItems.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50"
                {...getVisualEditorAttributes(`${fieldPath}.media_gallery.${index}`)}
              >
                <img src={item} alt={resolvedHeadline ?? 'Showcase'} className="h-60 w-full object-cover" />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default Showcase;
