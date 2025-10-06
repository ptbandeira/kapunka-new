import React from 'react';
import ReactMarkdown from 'react-markdown';
import { getVisualEditorAttributes } from '../../utils/stackbitBindings';
import { getCloudinaryUrl } from '../../utils/imageUrl';
import { useLanguage } from '../../contexts/LanguageContext';
import type { MediaCopySectionContent, LocalizedNumber, LocalizedValue } from '../../types';

interface MediaCopyProps {
  section: MediaCopySectionContent;
  fieldPath?: string;
}

type MediaCopyLayout = 'image-left' | 'image-right' | 'overlay';

const coerceNumber = (
  translate: ReturnType<typeof useLanguage>['translate'],
  value: LocalizedNumber | undefined,
): number | undefined => {
  if (value == null) {
    return undefined;
  }

  const translated = translate<number | string>(value);
  if (typeof translated === 'number') {
    return translated;
  }

  const parsed = Number(translated);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const coerceEnum = <T extends string>(
  translate: ReturnType<typeof useLanguage>['translate'],
  value: LocalizedValue<T> | undefined,
  allowed: readonly T[],
  fallback: T,
): T => {
  if (value == null) {
    return fallback;
  }

  const translated = translate<T | string>(value);
  if (allowed.includes(translated as T)) {
    return translated as T;
  }

  return fallback;
};

const MediaCopy: React.FC<MediaCopyProps> = ({ section, fieldPath }) => {
  const { translate } = useLanguage();

  const titleSource = section.content?.heading ?? section.title;
  const bodySource = section.content?.body ?? section.body;
  const imageSource = section.content?.image ?? null;

  const resolvedTitle = titleSource ? translate(titleSource) : '';
  const resolvedBody = bodySource ? translate(bodySource) : '';

  const hasContentHeading = Boolean(section.content && 'heading' in section.content);
  const hasContentBody = Boolean(section.content && 'body' in section.content);

  const titleFieldPath = fieldPath
    ? hasContentHeading
      ? `${fieldPath}.content.heading`
      : `${fieldPath}.title`
    : undefined;

  const bodyFieldPath = fieldPath
    ? hasContentBody
      ? `${fieldPath}.content.body`
      : `${fieldPath}.body`
    : undefined;

  const layout = coerceEnum<MediaCopyLayout>(
    translate,
    section.layout,
    ['image-left', 'image-right', 'overlay'],
    'image-right',
  );

  const columns = coerceNumber(translate, section.columns);

  const rawImage = (() => {
    if (imageSource?.src) {
      return imageSource.src;
    }
    if (typeof section.image === 'string') {
      return section.image;
    }
    if (section.image && typeof section.image === 'object' && 'src' in section.image) {
      const candidate = section.image.src;
      if (typeof candidate === 'string') {
        return candidate;
      }
    }
    return undefined;
  })();

  const trimmedImage = rawImage?.trim();
  const imageUrl = trimmedImage ? getCloudinaryUrl(trimmedImage) ?? trimmedImage : undefined;

  const hasContentImage = Boolean(section.content && 'image' in section.content && section.content.image !== undefined);
  const usesObjectImage = !hasContentImage
    && typeof section.image === 'object'
    && section.image !== null
    && 'src' in section.image;

  const imageFieldPath = fieldPath
    ? hasContentImage
      ? `${fieldPath}.content.image.src`
      : usesObjectImage
        ? `${fieldPath}.image.src`
        : `${fieldPath}.image`
    : undefined;

  const altSource = imageSource?.alt ?? section.imageAlt;
  const imageAlt = altSource ? translate(altSource) : resolvedTitle || 'Featured media';

  const overlaySettings = section.overlay ?? {};

  const hasText = Boolean(resolvedTitle?.trim() || resolvedBody?.trim());
  const hasImage = Boolean(imageUrl);

  if (!hasText && !hasImage) {
    return null;
  }

  const containerAttributes = getVisualEditorAttributes(fieldPath);

  const textBlock = (
    <div className="space-y-6">
      {resolvedTitle?.trim() ? (
        <h2
          className="text-3xl sm:text-4xl font-semibold text-stone-900"
          {...getVisualEditorAttributes(titleFieldPath)}
        >
          {resolvedTitle}
        </h2>
      ) : null}
      {resolvedBody?.trim() ? (
        <div
          className="prose prose-stone max-w-none text-stone-600"
          {...getVisualEditorAttributes(bodyFieldPath)}
        >
          <ReactMarkdown>{resolvedBody}</ReactMarkdown>
        </div>
      ) : null}
    </div>
  );

  if (layout === 'overlay' && hasImage) {
    const textAlign = coerceEnum(
      translate,
      overlaySettings.textAlign,
      ['left', 'center', 'right'],
      'left',
    );
    const verticalAlign = coerceEnum(
      translate,
      overlaySettings.verticalAlign,
      ['start', 'center', 'end'],
      'start',
    );
    const theme = coerceEnum(
      translate,
      overlaySettings.theme,
      ['light', 'dark'],
      'light',
    );
    const alignmentClass = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
    }[verticalAlign];
    const textAlignClass = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    }[textAlign];
    const themeClass = theme === 'dark' ? 'text-stone-900' : 'text-white';
    const backgroundClass = (() => {
      const background = coerceEnum(
        translate,
        overlaySettings.background,
        ['none', 'scrim-light', 'scrim-dark', 'panel'],
        'scrim-dark',
      );
      switch (background) {
        case 'panel':
          return theme === 'dark'
            ? 'bg-white/90 backdrop-blur'
            : 'bg-black/60 backdrop-blur';
        case 'scrim-light':
          return 'bg-white/30 backdrop-blur';
        case 'scrim-dark':
          return 'bg-black/40 backdrop-blur';
        default:
          return '';
      }
    })();

    return (
      <section className="py-16 sm:py-24" {...containerAttributes} data-sb-field-path={fieldPath}>
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl">
            <img
              src={imageUrl}
              alt={imageAlt}
              className="h-full w-full object-cover"
              {...getVisualEditorAttributes(imageFieldPath)}
            />
            <div className="absolute inset-0 flex p-6 sm:p-10">
              <div
                className={`flex w-full max-w-2xl flex-col gap-6 ${alignmentClass} ${textAlignClass} ${themeClass} ${backgroundClass} p-6 sm:p-8 rounded-3xl`}
                style={{ margin: 'auto' }}
              >
                {textBlock}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const gridColumns = columns && columns >= 1 ? Math.min(Math.round(columns), 2) : hasImage ? 2 : 1;
  const gridClass = gridColumns === 1 ? 'grid-cols-1' : 'lg:grid-cols-2';
  const imageFirst = layout === 'image-left';

  return (
    <section className="py-16 sm:py-24 bg-white" {...containerAttributes} data-sb-field-path={fieldPath}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid gap-10 ${gridClass} items-center`}>
          {hasImage ? (
            <div className={imageFirst ? 'order-1' : gridColumns === 1 ? 'order-2' : 'order-2 lg:order-2'}>
              <img
                src={imageUrl}
                alt={imageAlt}
                className="w-full rounded-2xl object-cover shadow-sm"
                {...getVisualEditorAttributes(imageFieldPath)}
              />
            </div>
          ) : null}
          <div className={hasImage ? (imageFirst ? 'order-2 lg:order-2' : 'order-1') : 'order-1'}>
            {textBlock}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MediaCopy;
