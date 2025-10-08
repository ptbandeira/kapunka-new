import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import type { Components as MarkdownComponents } from 'react-markdown';
import SectionRenderer from '../components/SectionRenderer';
import { usePrefersReducedMotion } from '../src/hooks/usePrefersReducedMotion';
import { useLanguage } from '../contexts/LanguageContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { useVisualEditorSync } from '../contexts/VisualEditorSyncContext';
import type {
  PageContent,
  Language,
} from '../types';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';
import { buildLocalizedPath, SUPPORTED_LANGUAGES } from '../utils/localePaths';
import { getCloudinaryUrl, isAbsoluteUrl } from '../utils/imageUrl';
import Seo from '../src/components/Seo';
import { loadUnifiedPage } from '../utils/unifiedPageLoader';

type CmsCtaShape = {
  label?: string | null;
  href?: string | null;
};

type CmsCtaLike = string | CmsCtaShape | null | undefined;

type HeroHorizontalAlignment = 'left' | 'center' | 'right';
type HeroVerticalAlignment = 'top' | 'middle' | 'bottom';
type HeroTextAnchor =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'middle-center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';
type HeroTextPlacement = 'overlay' | 'below';

interface HeroAlignmentGroup {
  heroAlignX?: HeroHorizontalAlignment;
  heroAlignY?: HeroVerticalAlignment;
  heroLayoutHint?: string;
  heroOverlay?: string | number | boolean;
  heroTextPosition?: HeroTextPlacement;
  heroTextAnchor?: HeroTextAnchor;
}

interface HeroImagesGroup {
  heroImageLeft?: string | null;
  heroImageRight?: string | null;
}

interface HeroCtasGroup {
  ctaPrimary?: CmsCtaLike;
  ctaSecondary?: CmsCtaLike;
}

interface HomePageData extends PageContent {
  heroAlignment?: HeroAlignmentGroup;
  heroImages?: HeroImagesGroup;
  heroCtas?: HeroCtasGroup;
  hero?: {
    content?: {
      headline?: string;
      subheadline?: string;
      primaryCta?: CmsCtaShape | null;
      secondaryCta?: CmsCtaShape | null;
      image?: {
        src?: string | null;
        alt?: string | null;
      } | string | null;
    };
    ctas?: {
      primary?: CmsCtaShape | null;
      secondary?: CmsCtaShape | null;
    };
    layout?: {
      alignX?: HeroHorizontalAlignment | string;
      alignY?: HeroVerticalAlignment | string;
      textPosition?: HeroTextPlacement | string;
      textAnchor?: HeroTextAnchor | string;
      overlay?: string | number | boolean;
      layoutHint?: string;
    };
  };
  bestsellers?: {
    intro?: string;
    title?: string;
  };
}

type ContentSource = 'content' | 'visual-editor';

interface HomePageContent extends HomePageData {
  heroImageLeftUrl?: string | null;
  heroImageRightUrl?: string | null;
  heroImages?: HeroImagesGroup;
  resolvedLocale: Language;
  contentSource: ContentSource;
}

const heroMarkdownComponents: MarkdownComponents = {
  p: ({ children, ...props }) => (
    <p className="text-lg md:text-xl leading-relaxed" {...props}>
      {children}
    </p>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold" {...props}>
      {children}
    </strong>
  ),
};

const normalizeImagePath = (value: string | null | undefined, locale: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.startsWith('/content/')) {
    const normalizedContentPath = trimmed.startsWith('//')
      ? `/${trimmed.slice(2)}`
      : trimmed.startsWith('/')
        ? trimmed
        : `/${trimmed}`;
    const cloudinaryUrl = getCloudinaryUrl(normalizedContentPath);
    return cloudinaryUrl ?? normalizedContentPath;
  }

  if (trimmed.startsWith('/')) {
    const cloudinaryUrl = getCloudinaryUrl(trimmed);
    return cloudinaryUrl ?? trimmed;
  }

  if (isAbsoluteUrl(trimmed)) {
    const cloudinaryUrl = getCloudinaryUrl(trimmed);
    return cloudinaryUrl ?? trimmed;
  }

  const normalized = trimmed.replace(/^\.\/?/, '');

  if (normalized.startsWith('content/')) {
    const normalizedContentPath = `/${normalized}`;
    const cloudinaryUrl = getCloudinaryUrl(normalizedContentPath);
    return cloudinaryUrl ?? normalizedContentPath;
  }

  if (normalized.startsWith('shared/')) {
    const sharedPath = `/content/uploads/${normalized}`;
    const cloudinaryUrl = getCloudinaryUrl(sharedPath);
    return cloudinaryUrl ?? sharedPath;
  }

  const uploadsPath = normalized.startsWith('uploads/') ? normalized.slice('uploads/'.length) : normalized;
  const defaultPath = `/content/${locale}/uploads/${uploadsPath}`;
  const cloudinaryUrl = getCloudinaryUrl(defaultPath);

  return cloudinaryUrl ?? defaultPath;
};

const firstDefined = <T,>(values: ReadonlyArray<T | null | undefined>): T | undefined => {
  for (const value of values) {
    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return undefined;
};

const sanitizeCmsString = (value?: string | null): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const resolveLocalizedString = (value: unknown, language: Language): string | undefined => {
  if (typeof value === 'string') {
    return sanitizeCmsString(value);
  }

  if (!value) {
    return undefined;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      if (typeof entry === 'string') {
        const sanitizedEntry = sanitizeCmsString(entry);
        if (sanitizedEntry) {
          return sanitizedEntry;
        }
      }
    }
    return undefined;
  }

  if (typeof value !== 'object') {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const orderedLocales: Language[] = [];
  const preferredLocales: Language[] = [language, 'en', ...SUPPORTED_LANGUAGES];

  for (const locale of preferredLocales) {
    if (!SUPPORTED_LANGUAGES.includes(locale as Language)) {
      continue;
    }
    if (!orderedLocales.includes(locale as Language)) {
      orderedLocales.push(locale as Language);
    }
  }

  for (const locale of orderedLocales) {
    const candidate = record[locale];
    if (typeof candidate === 'string') {
      const sanitizedCandidate = sanitizeCmsString(candidate);
      if (sanitizedCandidate) {
        return sanitizedCandidate;
      }
    }
  }

  const fallbackCandidate = Object.values(record).find(
    (entry): entry is string => typeof entry === 'string' && Boolean(sanitizeCmsString(entry)),
  );

  return fallbackCandidate ? sanitizeCmsString(fallbackCandidate) : undefined;
};

const sanitizeCmsUrl = (value?: string | null): string | undefined => {
  const sanitized = sanitizeCmsString(value);

  if (!sanitized) {
    return undefined;
  }

  if (
    sanitized.startsWith('/')
    || sanitized.startsWith('#')
    || sanitized.startsWith('mailto:')
    || sanitized.startsWith('tel:')
    || isAbsoluteUrl(sanitized)
  ) {
    return sanitized;
  }

  return undefined;
};

const isCmsCtaObject = (value: unknown): value is CmsCtaShape => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return 'label' in value || 'href' in value;
};

const extractCmsCtaLabel = (value: CmsCtaLike, language: Language): string | undefined => {
  const rawLabel = typeof value === 'string'
    ? value
    : isCmsCtaObject(value)
      ? value.label ?? null
      : null;

  return resolveLocalizedString(rawLabel, language);
};

const extractCmsCtaHref = (value: CmsCtaLike, language: Language): string | undefined => {
  const rawHref = typeof value === 'string'
    ? value
    : isCmsCtaObject(value)
      ? value.href ?? null
      : null;

  const resolvedHref = resolveLocalizedString(rawHref, language);
  return sanitizeCmsUrl(resolvedHref ?? null);
};

const sanitizeOptionalCmsString = (value: unknown, language: Language): string | undefined =>
  resolveLocalizedString(value, language);

const toCmsCtaLike = (value: unknown): CmsCtaLike => {
  if (typeof value === 'string' || isCmsCtaObject(value)) {
    return value;
  }

  return undefined;
};

const normalizeHorizontalAlignment = (value?: string | null): HeroHorizontalAlignment | undefined => {
  if (value === 'left' || value === 'center' || value === 'right') {
    return value;
  }

  return undefined;
};

const normalizeVerticalAlignment = (value?: string | null): HeroVerticalAlignment | undefined => {
  if (value === 'top' || value === 'middle' || value === 'bottom') {
    return value;
  }

  return undefined;
};

const normalizeHeroLayoutHint = (value?: string | null): 'image-left' | 'image-right' | 'image-full' => {
  switch (value) {
    case 'image-left':
    case 'image-right':
    case 'image-full':
      return value;
    case 'bgImage':
    case 'bg':
      return 'image-full';
    case 'side-by-side':
      return 'image-right';
    case 'text-over-media':
      return 'image-full';
    default:
      return 'image-full';
  }
};

const HERO_TEXT_POSITION_MAP: Record<HeroTextAnchor, [HeroHorizontalAlignment, HeroVerticalAlignment]> = {
  'top-left': ['left', 'top'],
  'top-center': ['center', 'top'],
  'top-right': ['right', 'top'],
  'middle-left': ['left', 'middle'],
  'middle-center': ['center', 'middle'],
  'middle-right': ['right', 'middle'],
  'bottom-left': ['left', 'bottom'],
  'bottom-center': ['center', 'bottom'],
  'bottom-right': ['right', 'bottom'],
};

const normalizeHeroTextAnchor = (value?: string | null): HeroTextAnchor | undefined => {
  if (!value) {
    return undefined;
  }

  if (value in HERO_TEXT_POSITION_MAP) {
    return value as HeroTextAnchor;
  }

  return undefined;
};

const HERO_HORIZONTAL_ALIGNMENT_CONTAINER_CLASSES: Record<HeroHorizontalAlignment, string> = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
};

const HERO_HORIZONTAL_TEXT_ALIGNMENT_CLASSES: Record<HeroHorizontalAlignment, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

const HERO_CTA_ALIGNMENT_CLASSES: Record<HeroHorizontalAlignment, string> = {
  left: 'sm:justify-start',
  center: 'sm:justify-center',
  right: 'sm:justify-end',
};

const HERO_GRID_CONTAINER_CLASSES =
  'grid grid-cols-3 grid-rows-3 w-full h-full max-w-6xl mx-auto px-6 sm:px-10 py-16 md:py-20';

const HERO_GRID_COLUMN_CLASSES: Record<HeroHorizontalAlignment, string> = {
  left: 'col-start-1 col-end-2',
  center: 'col-start-2 col-end-3',
  right: 'col-start-3 col-end-4',
};

const HERO_GRID_ROW_CLASSES: Record<HeroVerticalAlignment, string> = {
  top: 'row-start-1 row-end-2',
  middle: 'row-start-2 row-end-3',
  bottom: 'row-start-3 row-end-4',
};

const HERO_GRID_JUSTIFY_CLASSES: Record<HeroHorizontalAlignment, string> = {
  left: 'justify-self-start',
  center: 'justify-self-center',
  right: 'justify-self-end',
};

const HERO_GRID_ALIGN_CLASSES: Record<HeroVerticalAlignment, string> = {
  top: 'self-start',
  middle: 'self-center',
  bottom: 'self-end',
};

const getHeroGridCellClasses = (
  horizontal: HeroHorizontalAlignment,
  vertical: HeroVerticalAlignment,
) =>
  `${HERO_GRID_COLUMN_CLASSES[horizontal]} ${HERO_GRID_ROW_CLASSES[vertical]} ${HERO_GRID_JUSTIFY_CLASSES[horizontal]} ${HERO_GRID_ALIGN_CLASSES[vertical]}`;

const resolveHeroOverlay = (value?: string | number | boolean | null): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    const normalized = trimmed.toLowerCase();
    if (normalized === 'light') {
      return 'rgba(0,0,0,0.16)';
    }
    if (normalized === 'medium') {
      return 'rgba(0,0,0,0.28)';
    }
    if (normalized === 'strong') {
      return 'rgba(0,0,0,0.48)';
    }
    if (
      trimmed.startsWith('#')
      || /^rgba?\(/i.test(trimmed)
      || /^hsla?\(/i.test(trimmed)
      || normalized.startsWith('linear-gradient')
      || normalized.startsWith('radial-gradient')
      || normalized.startsWith('conic-gradient')
    ) {
      return trimmed;
    }

    return undefined;
  }

  if (typeof value === 'number') {
    const normalized = value > 1 ? value / 100 : value;
    const clamped = Math.max(0, Math.min(normalized, 1));
    return `rgba(0,0,0,${clamped.toFixed(2)})`;
  }

  if (typeof value === 'boolean') {
    return value ? 'rgba(0,0,0,0.48)' : 'rgba(0,0,0,0)';
  }

  return undefined;
};

let hasWarnedMissingHeroImages = false;
let hasWarnedMissingHeroHeadline = false;

interface HeroValidationArgs {
  heroHeadline?: string | null;
  heroImages?: HeroImagesGroup | null;
  heroImageLeft?: string | null;
  heroImageRight?: string | null;
  heroFallback?: string;
}

const validateHeroContent = ({
  heroHeadline,
  heroImages,
  heroImageLeft,
  heroImageRight,
  heroFallback,
}: HeroValidationArgs): { heroImages?: HeroImagesGroup } => {
  const sanitizedHeadline = sanitizeCmsString(heroHeadline);
  const fallbackImage = sanitizeCmsString(heroFallback);
  let normalizedHeroImages = heroImages ?? undefined;

  if (!sanitizeCmsString(normalizedHeroImages?.heroImageLeft) && fallbackImage) {
    normalizedHeroImages = {
      ...(normalizedHeroImages ?? {}),
      heroImageLeft: fallbackImage,
    };
  }

  const heroImageLeftSanitized =
    sanitizeCmsString(normalizedHeroImages?.heroImageLeft) ?? sanitizeCmsString(heroImageLeft);
  const heroImageRightSanitized =
    sanitizeCmsString(normalizedHeroImages?.heroImageRight) ?? sanitizeCmsString(heroImageRight);

  const hasHeroImage = Boolean(
    heroImageLeftSanitized || heroImageRightSanitized,
  );

  if (import.meta.env.DEV) {
    if (!sanitizedHeadline && !hasWarnedMissingHeroHeadline) {
      console.warn('Home hero headline is missing. Add hero headline content in the CMS.');
      hasWarnedMissingHeroHeadline = true;
    }

    if (!hasHeroImage && !hasWarnedMissingHeroImages) {
      console.warn('Home hero images are not configured. Add hero image references or legacy URLs in the CMS.');
      hasWarnedMissingHeroImages = true;
    }
  }

  return { heroImages: normalizedHeroImages ?? undefined };
};

const Home: React.FC = () => {
  const { t, language } = useLanguage();
  const { settings: siteSettings } = useSiteSettings();
  const { contentVersion } = useVisualEditorSync();
  const prefersReducedMotion = usePrefersReducedMotion();
  const heroFallbackRaw = (() => {
    const extendedSettings = siteSettings as typeof siteSettings & { heroFallback?: string | null };
    const fallbackCandidate = extendedSettings.heroFallback ?? siteSettings.home?.heroImage;

    if (typeof fallbackCandidate === 'string') {
      const trimmed = fallbackCandidate.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }

    return undefined;
  })();
  const [pageContent, setPageContent] = useState<HomePageContent | null>(null);

  useEffect(() => {
    let isMounted = true;
    setPageContent(null);

    const loadContent = async () => {
      try {
        const unified = await loadUnifiedPage<HomePageData>('home', language);
        if (!isMounted) {
          return;
        }

        if (!unified) {
          setPageContent(null);
          return;
        }

        const { data, locale, source } = unified;
        const heroValidation = validateHeroContent({
          heroHeadline: data.heroHeadline,
          heroImages: data.heroImages ?? null,
          heroImageLeft: data.heroImageLeft ?? null,
          heroImageRight: data.heroImageRight ?? null,
          heroFallback: heroFallbackRaw,
        });
        const heroImages = heroValidation.heroImages ?? data.heroImages;

        const heroImageLeftCandidate = firstDefined([
          resolveLocalizedString(heroImages?.heroImageLeft ?? null, locale),
          resolveLocalizedString(data.heroImageLeft ?? null, locale),
          heroFallbackRaw,
        ]);
        const heroImageRightCandidate = firstDefined([
          resolveLocalizedString(heroImages?.heroImageRight ?? null, locale),
          resolveLocalizedString(data.heroImageRight ?? null, locale),
          heroFallbackRaw,
        ]);

        const heroImageLeftUrl = heroImageLeftCandidate
          ? normalizeImagePath(heroImageLeftCandidate, locale) ?? heroImageLeftCandidate
          : null;
        const heroImageRightUrl = heroImageRightCandidate
          ? normalizeImagePath(heroImageRightCandidate, locale) ?? heroImageRightCandidate
          : null;

        setPageContent({
          ...data,
          heroImages,
          heroImageLeftUrl,
          heroImageRightUrl,
          resolvedLocale: locale,
          contentSource: source,
        });
      } catch (error) {
        console.error('Failed to load home page content', error);
        if (isMounted) {
          setPageContent(null);
        }
      }
    };

    loadContent().catch((error) => {
      console.error('Unhandled error while loading home page content', error);
    });

    return () => {
      isMounted = false;
    };
  }, [language, heroFallbackRaw, contentVersion]);

  const contentLocale = pageContent?.resolvedLocale ?? language;
  const effectiveLocale: Language = SUPPORTED_LANGUAGES.includes(contentLocale as Language)
    ? (contentLocale as Language)
    : language;

  const homeFieldPath = pageContent
    ? pageContent.contentSource === 'visual-editor'
      ? `site.content.${pageContent.resolvedLocale}.pages.home`
      : `pages.home_${pageContent.resolvedLocale}`
    : `pages.home_${language}`;
  const heroHeadline = sanitizeCmsString(pageContent?.heroHeadline) ?? t('home.heroTitle');
  const heroSubheadline = sanitizeCmsString(pageContent?.heroSubheadline) ?? t('home.heroSubtitle');
  const heroPrimaryCtaCmsValue = pageContent?.heroCtas?.ctaPrimary;
  const heroSecondaryCtaCmsValue = pageContent?.heroCtas?.ctaSecondary;
  const heroPrimaryCtaLabel = firstDefined([
    extractCmsCtaLabel(heroPrimaryCtaCmsValue, language),
    sanitizeOptionalCmsString(pageContent?.heroPrimaryCta, language),
    sanitizeOptionalCmsString(pageContent?.heroCtaPrimary, language),
    sanitizeOptionalCmsString(pageContent?.ctaPrimary, language),
  ]) ?? t('home.ctaShop');
  const heroSecondaryCtaLabel = firstDefined([
    extractCmsCtaLabel(heroSecondaryCtaCmsValue, language),
    sanitizeOptionalCmsString(pageContent?.heroSecondaryCta, language),
    sanitizeOptionalCmsString(pageContent?.heroCtaSecondary, language),
    sanitizeOptionalCmsString(pageContent?.ctaSecondary, language),
  ]) ?? t('home.ctaClinics');
  const heroPrimaryCtaHref = firstDefined([
    extractCmsCtaHref(heroPrimaryCtaCmsValue, language),
    extractCmsCtaHref(toCmsCtaLike(pageContent?.heroPrimaryCta), language),
    extractCmsCtaHref(toCmsCtaLike(pageContent?.heroCtaPrimary), language),
    extractCmsCtaHref(toCmsCtaLike(pageContent?.ctaPrimary), language),
  ]) ?? '/shop';
  const heroSecondaryCtaHref = firstDefined([
    extractCmsCtaHref(heroSecondaryCtaCmsValue, language),
    extractCmsCtaHref(toCmsCtaLike(pageContent?.heroSecondaryCta), language),
    extractCmsCtaHref(toCmsCtaLike(pageContent?.heroCtaSecondary), language),
    extractCmsCtaHref(toCmsCtaLike(pageContent?.ctaSecondary), language),
  ]) ?? '/for-clinics';
  const heroPrimaryCta = heroPrimaryCtaLabel;
  const heroSecondaryCta = heroSecondaryCtaLabel;
  const heroAlignmentOverlayValue = pageContent?.heroAlignment?.heroOverlay;
  const heroOverlay = resolveHeroOverlay(
    heroAlignmentOverlayValue
      ?? (pageContent?.heroOverlay as string | number | boolean | null | undefined)
      ?? (pageContent?.heroAlignment ? undefined : 40),
  ) ?? resolveHeroOverlay(40) ?? 'rgba(0,0,0,0.40)';
  const heroLayoutHint = normalizeHeroLayoutHint(
    pageContent?.heroAlignment?.heroLayoutHint ?? pageContent?.heroLayoutHint ?? (pageContent?.heroAlignment ? undefined : 'bgImage'),
  );
  const heroSrcCandidate = firstDefined([
    resolveLocalizedString(pageContent?.heroImages?.heroImageLeft ?? null, effectiveLocale),
    resolveLocalizedString(pageContent?.heroImageLeft ?? null, effectiveLocale),
    heroFallbackRaw,
  ]);
  const heroSrc = heroSrcCandidate
    ? normalizeImagePath(heroSrcCandidate, effectiveLocale) ?? heroSrcCandidate
    : undefined;
  const heroImageLeftUrl = firstDefined([
    pageContent?.heroImageLeftUrl ?? undefined,
    normalizeImagePath(
      resolveLocalizedString(pageContent?.heroImages?.heroImageLeft ?? null, effectiveLocale) ?? null,
      effectiveLocale,
    ),
    normalizeImagePath(
      resolveLocalizedString(pageContent?.heroImageLeft ?? null, effectiveLocale) ?? null,
      effectiveLocale,
    ),
    heroSrc,
  ]);
  const heroImageRightUrl = firstDefined([
    pageContent?.heroImageRightUrl ?? undefined,
    normalizeImagePath(
      resolveLocalizedString(pageContent?.heroImages?.heroImageRight ?? null, effectiveLocale) ?? null,
      effectiveLocale,
    ),
    normalizeImagePath(
      resolveLocalizedString(pageContent?.heroImageRight ?? null, effectiveLocale) ?? null,
      effectiveLocale,
    ),
    heroSrc,
  ]);
  const heroImageLeft = sanitizeCmsString(heroImageLeftUrl);
  const heroImageRight = sanitizeCmsString(heroImageRightUrl);
  const heroTextPlacementRaw = pageContent?.heroAlignment?.heroTextPosition;
  const heroTextPlacement: HeroTextPlacement = heroTextPlacementRaw === 'below' ? 'below' : 'overlay';
  const heroTextAnchor = normalizeHeroTextAnchor(
    pageContent?.heroAlignment?.heroTextAnchor ?? pageContent?.heroTextPosition,
  );
  const heroTextPositionTuple = heroTextAnchor ? HERO_TEXT_POSITION_MAP[heroTextAnchor] : undefined;
  const heroAlignXFromAlignment = normalizeHorizontalAlignment(
    pageContent?.heroAlignment?.heroAlignX ?? pageContent?.heroAlignX,
  );
  const heroAlignYFromAlignment = normalizeVerticalAlignment(
    pageContent?.heroAlignment?.heroAlignY ?? pageContent?.heroAlignY,
  );
  const heroAlignX: HeroHorizontalAlignment = heroAlignXFromAlignment ?? heroTextPositionTuple?.[0] ?? 'center';
  const heroAlignY: HeroVerticalAlignment = heroAlignYFromAlignment ?? heroTextPositionTuple?.[1] ?? 'middle';
  const heroMiddleNudge = heroLayoutHint === 'image-full' && heroAlignY === 'middle' ? 'pb-24 md:pb-28' : '';
  const heroTextAlignmentClass = HERO_HORIZONTAL_TEXT_ALIGNMENT_CLASSES[heroAlignX];
  const heroCtaAlignmentClass = HERO_CTA_ALIGNMENT_CLASSES[heroAlignX];
  const heroOverlayCellClasses = getHeroGridCellClasses(heroAlignX, heroAlignY);

  let heroInlineImage: string | undefined;
  if (heroLayoutHint === 'image-left') {
    heroInlineImage = heroImageLeft ?? heroImageRight;
  } else if (heroLayoutHint === 'image-right') {
    heroInlineImage = heroImageRight ?? heroImageLeft;
  } else if (heroLayoutHint === 'image-full') {
    heroInlineImage = heroImageRight ?? heroImageLeft;
  }

  const shouldRenderInlineImage = Boolean(heroInlineImage && heroLayoutHint !== 'image-full');
  const heroBackgroundImage = heroLayoutHint === 'image-full'
    ? heroInlineImage ?? heroSrc
    : heroSrc ?? heroInlineImage;
  const heroPrefersLightText = !shouldRenderInlineImage && heroTextPlacement === 'overlay';
  const heroTextColorClass = heroPrefersLightText ? 'text-white' : 'text-stone-900';
  const heroPrimaryButtonClasses = heroPrefersLightText
    ? 'px-8 py-3 bg-white text-stone-900 font-semibold rounded-md hover:bg-white/90 transition-colors'
    : 'px-8 py-3 bg-stone-900 text-white font-semibold rounded-md hover:bg-stone-700 transition-colors';
  const heroSecondaryButtonClasses = heroPrefersLightText
    ? 'px-8 py-3 border border-white/50 text-white font-semibold rounded-md hover:bg-white/10 transition-colors'
    : 'px-8 py-3 bg-white/70 backdrop-blur-sm text-stone-900 font-semibold rounded-md hover:bg-white transition-colors';
  const heroOverlayPrimaryButtonClasses = 'inline-flex items-center justify-center px-7 py-3 rounded-md bg-white text-stone-900 font-semibold transition hover:bg-white/90';
  const heroOverlaySecondaryButtonClasses = 'inline-flex items-center justify-center px-7 py-3 rounded-md border border-white/70 text-white font-semibold transition hover:bg-white/10';
  const heroImagesFieldPath = pageContent?.heroImages ? `${homeFieldPath}.heroImages` : undefined;
  const heroImageLeftFieldPath = heroImagesFieldPath ? `${heroImagesFieldPath}.heroImageLeft` : `${homeFieldPath}.heroImageLeft`;
  const heroImageRightFieldPath = heroImagesFieldPath ? `${heroImagesFieldPath}.heroImageRight` : `${homeFieldPath}.heroImageRight`;
  const heroImageFieldPath = heroLayoutHint === 'image-left'
    ? heroImageLeftFieldPath
    : heroLayoutHint === 'image-right'
      ? heroImageRightFieldPath
      : heroInlineImage === heroImageRight
        ? heroImageRightFieldPath
        : heroInlineImage === heroImageLeft
          ? heroImageLeftFieldPath
          : heroImageRightFieldPath;
  const heroGridClasses = shouldRenderInlineImage
    ? 'grid grid-cols-1 lg:grid-cols-2 items-center gap-0'
    : heroTextPlacement === 'overlay'
      ? `flex flex-col ${HERO_HORIZONTAL_ALIGNMENT_CONTAINER_CLASSES[heroAlignX]}`
      : 'flex flex-col items-center text-center';
  const heroTextWrapperBaseClasses = shouldRenderInlineImage
    ? `${heroLayoutHint === 'image-left' ? 'order-1 lg:order-2' : 'order-1'} space-y-6 max-w-xl`
    : 'space-y-6 max-w-3xl mx-auto';
  const heroTextWrapperClasses = `${heroTextWrapperBaseClasses} ${heroTextAlignmentClass}`;
  const heroImageWrapperClasses = shouldRenderInlineImage
    ? `${heroLayoutHint === 'image-left' ? 'order-2 lg:order-1' : 'order-2'} w-full`
    : '';
  const heroImageAlt = heroHeadline;
  const heroPrimaryCtaFieldPath = pageContent?.heroCtas
    ? isCmsCtaObject(heroPrimaryCtaCmsValue)
      ? `${homeFieldPath}.heroCtas.ctaPrimary.label`
      : `${homeFieldPath}.heroCtas.ctaPrimary`
    : pageContent?.heroPrimaryCta
      ? `${homeFieldPath}.heroPrimaryCta`
      : pageContent?.heroCtaPrimary
        ? `${homeFieldPath}.heroCtaPrimary`
        : `${homeFieldPath}.ctaPrimary`;
  const heroPrimaryCtaHrefFieldPath = pageContent?.heroCtas && isCmsCtaObject(heroPrimaryCtaCmsValue)
    ? `${homeFieldPath}.heroCtas.ctaPrimary.href`
    : undefined;
  const heroSecondaryCtaFieldPath = pageContent?.heroCtas
    ? isCmsCtaObject(heroSecondaryCtaCmsValue)
      ? `${homeFieldPath}.heroCtas.ctaSecondary.label`
      : `${homeFieldPath}.heroCtas.ctaSecondary`
    : pageContent?.heroSecondaryCta
      ? `${homeFieldPath}.heroSecondaryCta`
      : pageContent?.heroCtaSecondary
        ? `${homeFieldPath}.heroCtaSecondary`
        : `${homeFieldPath}.ctaSecondary`;
  const heroSecondaryCtaHrefFieldPath = pageContent?.heroCtas && isCmsCtaObject(heroSecondaryCtaCmsValue)
    ? `${homeFieldPath}.heroCtas.ctaSecondary.href`
    : undefined;
  const heroPrimaryCtaIsInternal = !!heroPrimaryCtaHref && (heroPrimaryCtaHref.startsWith('#/') || heroPrimaryCtaHref.startsWith('/'));
  const heroSecondaryCtaIsInternal = !!heroSecondaryCtaHref && (heroSecondaryCtaHref.startsWith('#/') || heroSecondaryCtaHref.startsWith('/'));
  const heroPrimaryLinkTarget = heroPrimaryCtaIsInternal
    ? buildLocalizedPath(heroPrimaryCtaHref.startsWith('#/') ? heroPrimaryCtaHref.slice(1) : heroPrimaryCtaHref, language)
    : heroPrimaryCtaHref;
  const heroSecondaryLinkTarget = heroSecondaryCtaIsInternal
    ? buildLocalizedPath(heroSecondaryCtaHref.startsWith('#/') ? heroSecondaryCtaHref.slice(1) : heroSecondaryCtaHref, language)
    : heroSecondaryCtaHref;
const heroInlineImageNode = shouldRenderInlineImage && heroInlineImage
    ? (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className={`${heroImageWrapperClasses} h-full w-full`}
      >
        <img
          src={heroInlineImage}
          alt={heroImageAlt}
          className="w-full max-h-[540px] object-cover"
          {...getVisualEditorAttributes(heroImageFieldPath)}
        />
      </motion.div>
    )
    : null;
const heroContainerMarginClass = heroTextPlacement === 'overlay' ? 'mx-0' : 'mx-auto';
const heroContentOuterClasses = shouldRenderInlineImage
  ? ['w-full', heroContainerMarginClass].filter(Boolean).join(' ')
  : `container ${heroContainerMarginClass}`.trim();
const heroContentPaddingClasses = shouldRenderInlineImage ? '' : 'px-4 sm:px-6 lg:px-8';
const heroTextContent = (
    <div className={`${heroContentOuterClasses} ${heroContentPaddingClasses} ${heroGridClasses}`.trim()}>
      <div className={heroTextWrapperClasses}>
        <h1
          className="text-4xl md:text-6xl font-semibold tracking-tight"
          {...getVisualEditorAttributes(`${homeFieldPath}.heroHeadline`)}
        >
          {heroHeadline}
        </h1>
        {heroSubheadline && (
          <div {...getVisualEditorAttributes(`${homeFieldPath}.heroSubheadline`)}>
            <ReactMarkdown components={heroMarkdownComponents}>
              {heroSubheadline}
            </ReactMarkdown>
          </div>
        )}
        <div className={`mt-8 flex flex-col sm:flex-row ${heroCtaAlignmentClass} gap-4`}>
          {heroPrimaryCtaIsInternal ? (
            <Link
              to={heroPrimaryLinkTarget}
              className={heroPrimaryButtonClasses}
              {...getVisualEditorAttributes(heroPrimaryCtaHrefFieldPath)}
            >
              <span {...getVisualEditorAttributes(heroPrimaryCtaFieldPath)}>
                {heroPrimaryCta}
              </span>
            </Link>
          ) : (
            <a
              href={heroPrimaryLinkTarget}
              className={heroPrimaryButtonClasses}
              {...getVisualEditorAttributes(heroPrimaryCtaHrefFieldPath)}
              target={isAbsoluteUrl(heroPrimaryLinkTarget) ? '_blank' : undefined}
              rel={isAbsoluteUrl(heroPrimaryLinkTarget) ? 'noreferrer' : undefined}
            >
              <span {...getVisualEditorAttributes(heroPrimaryCtaFieldPath)}>
                {heroPrimaryCta}
              </span>
            </a>
          )}
          {heroSecondaryCta && (
            heroSecondaryCtaIsInternal ? (
              <Link
                to={heroSecondaryLinkTarget}
                className={heroSecondaryButtonClasses}
                {...getVisualEditorAttributes(heroSecondaryCtaHrefFieldPath)}
              >
                <span {...getVisualEditorAttributes(heroSecondaryCtaFieldPath)}>
                  {heroSecondaryCta}
                </span>
              </Link>
            ) : (
              <a
                href={heroSecondaryLinkTarget || '#'}
                className={heroSecondaryButtonClasses}
                {...getVisualEditorAttributes(heroSecondaryCtaHrefFieldPath)}
                target={heroSecondaryLinkTarget && isAbsoluteUrl(heroSecondaryLinkTarget) ? '_blank' : undefined}
                rel={heroSecondaryLinkTarget && isAbsoluteUrl(heroSecondaryLinkTarget) ? 'noreferrer' : undefined}
              >
                <span {...getVisualEditorAttributes(heroSecondaryCtaFieldPath)}>
                  {heroSecondaryCta}
                </span>
              </a>
            )
          )}
        </div>
      </div>
      {heroInlineImageNode}
    </div>
  );

  const heroOverlayContent = (
    <div className={`relative h-full ${HERO_GRID_CONTAINER_CLASSES} ${heroMiddleNudge}`}>
      <div className={heroOverlayCellClasses}>
        <motion.div
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 24 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className={`space-y-6 max-w-3xl ${heroTextAlignmentClass}`}
        >
          <h1
            className={`text-4xl md:text-6xl font-semibold tracking-tight ${heroTextColorClass}`}
            {...getVisualEditorAttributes(`${homeFieldPath}.heroHeadline`)}
          >
            {heroHeadline}
          </h1>
          {heroSubheadline && (
            <div
              className={`text-lg md:text-xl leading-relaxed ${heroTextColorClass}`}
              {...getVisualEditorAttributes(`${homeFieldPath}.heroSubheadline`)}
            >
              <ReactMarkdown components={heroMarkdownComponents}>
                {heroSubheadline}
              </ReactMarkdown>
            </div>
          )}
          <div className={`mt-8 flex flex-col sm:flex-row ${heroCtaAlignmentClass} gap-4`}>
            {heroPrimaryCta && (
              heroPrimaryCtaIsInternal ? (
                <Link
                  to={heroPrimaryLinkTarget}
                  className={heroOverlayPrimaryButtonClasses}
                  {...getVisualEditorAttributes(heroPrimaryCtaHrefFieldPath)}
                >
                  <span {...getVisualEditorAttributes(heroPrimaryCtaFieldPath)}>{heroPrimaryCta}</span>
                </Link>
              ) : (
                <a
                  href={heroPrimaryLinkTarget}
                  className={heroOverlayPrimaryButtonClasses}
                  {...getVisualEditorAttributes(heroPrimaryCtaHrefFieldPath)}
                  target={isAbsoluteUrl(heroPrimaryLinkTarget) ? '_blank' : undefined}
                  rel={isAbsoluteUrl(heroPrimaryLinkTarget) ? 'noreferrer' : undefined}
                >
                  <span {...getVisualEditorAttributes(heroPrimaryCtaFieldPath)}>{heroPrimaryCta}</span>
                </a>
              )
            )}
            {heroSecondaryCta && (
              heroSecondaryCtaIsInternal ? (
                <Link
                  to={heroSecondaryLinkTarget}
                  className={heroOverlaySecondaryButtonClasses}
                  {...getVisualEditorAttributes(heroSecondaryCtaHrefFieldPath)}
                >
                  <span {...getVisualEditorAttributes(heroSecondaryCtaFieldPath)}>{heroSecondaryCta}</span>
                </Link>
              ) : (
                <a
                  href={heroSecondaryLinkTarget || '#'}
                  className={heroOverlaySecondaryButtonClasses}
                  {...getVisualEditorAttributes(heroSecondaryCtaHrefFieldPath)}
                  target={heroSecondaryLinkTarget && isAbsoluteUrl(heroSecondaryLinkTarget) ? '_blank' : undefined}
                  rel={heroSecondaryLinkTarget && isAbsoluteUrl(heroSecondaryLinkTarget) ? 'noreferrer' : undefined}
                >
                  <span {...getVisualEditorAttributes(heroSecondaryCtaFieldPath)}>{heroSecondaryCta}</span>
                </a>
              )
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );

  const heroSection = (
    <section className="relative overflow-hidden bg-stone-900 text-white">
      {heroBackgroundImage && (
        <div className="absolute inset-0">
          <img
            src={heroBackgroundImage}
            alt={heroHeadline}
            className="h-full w-full object-cover"
            {...getVisualEditorAttributes(heroImageFieldPath)}
          />
        </div>
      )}
      <div
        className="relative"
        style={{ background: heroTextPlacement === 'overlay' ? heroOverlay : undefined }}
      >
        {heroTextPlacement === 'overlay' ? heroOverlayContent : heroTextContent}
      </div>
      {heroTextPlacement === 'below' && heroTextContent}
    </section>
  );

  const sections = pageContent?.sections ?? [];
  const homeSectionsFieldPath = `${homeFieldPath}.sections`;
  const computedTitle = pageContent?.metaTitle ?? `Kapunka Skincare | ${t('home.metaTitle')}`;
  const computedDescription = pageContent?.metaDescription ?? t('home.metaDescription');
  const brandIntroTitle = sanitizeCmsString(pageContent?.brandIntro?.title);
  const brandIntroText = sanitizeCmsString(pageContent?.brandIntro?.text);

  return (
    <div className="bg-white">
      <Seo title={computedTitle} description={computedDescription} />
      {heroSection}
      {(brandIntroTitle || brandIntroText) && (
        <div className="container mx-auto max-w-3xl px-4 py-16 md:py-24">
          {brandIntroTitle && (
            <h2
              className="text-3xl sm:text-4xl font-semibold text-center"
              {...getVisualEditorAttributes(`${homeFieldPath}.brandIntro.title`)}
            >
              {brandIntroTitle}
            </h2>
          )}
          {brandIntroText && (
            <p
              className="mt-6 prose prose-stone max-w-none text-stone-700 text-center"
              {...getVisualEditorAttributes(`${homeFieldPath}.brandIntro.text`)}
            >
              {brandIntroText}
            </p>
          )}
        </div>
      )}
      <SectionRenderer sections={sections} fieldPath={homeSectionsFieldPath} />
    </div>
  );
};

export default Home;
