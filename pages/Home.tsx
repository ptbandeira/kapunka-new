import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import type { Components as MarkdownComponents } from 'react-markdown';
import { z } from 'zod';
import ProductCard from '../components/ProductCard';
import TimelineSection from '../components/TimelineSection';
import ImageTextHalf from '../components/sections/ImageTextHalf';
import ImageGrid from '../components/sections/ImageGrid';
import CommunityCarousel from '../components/sections/CommunityCarousel';
import MediaShowcase from '../components/sections/MediaShowcase';
import { usePrefersReducedMotion } from '../src/hooks/usePrefersReducedMotion';
import { useLanguage } from '../contexts/LanguageContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { useVisualEditorSync } from '../contexts/VisualEditorSyncContext';
import type {
  Product,
  Review,
  TimelineEntry,
  ImageGridItem,
  ClinicsBlockContent,
  GalleryRowContent,
  PageSection,
  PageContent,
  Language,
  TestimonialEntry,
  VisibilityFlag,
  MediaShowcaseSectionContent,
} from '../types';
import { fetchVisualEditorJson } from '../utils/fetchVisualEditorJson';
import { fetchVisualEditorMarkdown, type VisualEditorMarkdownDocument } from '../utils/fetchVisualEditorMarkdown';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';
import { fetchTestimonialsByRefs } from '../utils/fetchTestimonialsByRefs';
import { buildLocalizedPath } from '../utils/localePaths';
import { getCloudinaryUrl, isAbsoluteUrl } from '../utils/imageUrl';
import { filterVisible } from '../utils/contentVisibility';
import Seo from '../src/components/Seo';
import { loadPage, type LoadPageResult } from '../src/lib/content';
import { loadUnifiedPage } from '../utils/unifiedPageLoader';

interface ProductsResponse {
  items?: Product[];
}

interface ReviewsResponse {
  items?: Review[];
}

type MarkdownPageDocument<T> = VisualEditorMarkdownDocument<T> & Record<string, unknown>;

type CmsCtaShape = {
  label?: string | null;
  href?: string | null;
};

type MediaCopyOverlaySettings = {
  columnStart?: number;
  columnSpan?: number;
  rowStart?: number;
  rowSpan?: number;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'start' | 'center' | 'end';
  theme?: 'light' | 'dark';
  background?: 'none' | 'scrim-light' | 'scrim-dark' | 'panel';
  cardWidth?: 'sm' | 'md' | 'lg';
};

type HeroSectionPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'middle-center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

type HeroSectionContentFields = {
  headline?: string;
  subheading?: string;
  primaryCta?: CmsCtaShape | null;
  secondaryCta?: CmsCtaShape | null;
  image?: {
    src?: string | null;
    alt?: string | null;
  } | null;
  position?: HeroSectionPosition;
};

type MediaCopyContentFields = {
  heading?: string;
  body?: string;
  cta?: CmsCtaShape | null;
  image?: {
    src?: string | null;
    alt?: string | null;
  } | null;
};

type TestimonialEntryFields = {
  quote?: string | null;
  author?: string | null;
  role?: string | null;
  avatar?: string | null;
  testimonialRef?: string | null;
};

type NormalizedTestimonial = {
  text: string;
  author?: string;
  role?: string;
  avatar?: string;
  relationRef?: string;
};

type HomeSection = (
  | {
      type: 'hero';
      content?: HeroSectionContentFields | null;
      headline?: string;
      subheadline?: string;
      ctaPrimary?: string | CmsCtaShape;
      ctaSecondary?: string | CmsCtaShape;
      image?: string | { src?: string | null } | null;
      imageAlt?: string;
      overlay?: boolean;
      position?: HeroSectionPosition;
    }
  | {
      type: 'featureGrid';
      title?: string;
      items?: { label: string; description?: string; icon?: string }[];
      columns?: number;
    }
  | {
      type: 'productGrid';
      title?: string;
      products?: { id: string }[];
      columns?: number;
    }
  | {
      type: 'mediaCopy';
      content?: MediaCopyContentFields | null;
      title?: string;
      body?: string;
      image?: string | { src?: string | null } | null;
      imageAlt?: string;
      layout?: 'image-left' | 'image-right' | 'overlay';
      columns?: number;
      overlay?: MediaCopyOverlaySettings;
    }
  | {
      type: 'testimonials';
      title?: string;
      testimonials?: TestimonialEntryFields[];
      quotes?: { text?: string; author?: string; role?: string }[];
    }
  | {
      type: 'faq';
      title?: string;
      items?: { q?: string; a?: string }[];
    }
  | {
      type: 'banner';
      text?: string;
      cta?: string;
      url?: string;
    }
  | {
      type: 'communityCarousel';
      title?: string;
      slides?: {
        image?: string;
        alt?: string;
        quote?: string;
        name?: string;
        role?: string;
      }[];
      slideDuration?: number;
      quoteDuration?: number;
    }
  | {
      type: 'newsletterSignup';
      title?: string;
      subtitle?: string;
      placeholder?: string;
      ctaLabel?: string;
      confirmation?: string;
      background?: 'light' | 'beige' | 'dark';
      alignment?: 'left' | 'center';
    }
  | {
      type: 'video';
      title?: string;
      url?: string;
    }
  | {
      type: 'mediaShowcase';
      title?: string;
      items?: Array<{
        eyebrow?: string;
        title?: string;
        body?: string;
        image?: string;
        imageAlt?: string;
        ctaLabel?: string;
        ctaHref?: string;
      }>;
    }
) & VisibilityFlag;

const HOME_SECTION_TYPES = [
  'hero',
  'featureGrid',
  'productGrid',
  'mediaCopy',
  'testimonials',
  'faq',
  'banner',
  'newsletterSignup',
  'communityCarousel',
  'video',
  'mediaShowcase',
] as const;

const HOME_SECTION_TYPE_SET = new Set<HomeSection['type']>(HOME_SECTION_TYPES);

const isHomeSectionType = (value: unknown): value is HomeSection['type'] => (
  typeof value === 'string' && HOME_SECTION_TYPE_SET.has(value as HomeSection['type'])
);

const heroAlignmentSchema = z
  .object({
    heroAlignX: z.enum(['left', 'center', 'right']).optional(),
    heroAlignY: z.enum(['top', 'middle', 'bottom']).optional(),
    heroLayoutHint: z
      .enum(['image-left', 'image-right', 'image-full', 'text-over-media', 'side-by-side', 'bgImage', 'bg'])
      .optional(),
    heroOverlay: z.union([z.string(), z.number(), z.boolean()]).optional(),
    heroTextPosition: z.enum(['overlay', 'below']).optional(),
    heroTextAnchor: z
      .enum([
        'top-left',
        'top-center',
        'top-right',
        'middle-left',
        'middle-center',
        'middle-right',
        'bottom-left',
        'bottom-center',
        'bottom-right',
      ])
      .optional(),
  })
  .passthrough();

const heroImagesSchema = z
  .object({
    heroImageLeft: z.string().nullable().optional(),
    heroImageRight: z.string().nullable().optional(),
  })
  .passthrough();

const ctaLinkSchema = z
  .object({
    label: z.string().nullable().optional(),
    href: z.string().nullable().optional(),
  })
  .passthrough();

const ctaValueSchema = z.union([z.string(), ctaLinkSchema, z.null()]);

const heroCtasSchema = z
  .object({
    ctaPrimary: ctaValueSchema.optional(),
    ctaSecondary: ctaValueSchema.optional(),
  })
  .passthrough();

const timelineEntrySchema = z
  .object({
    year: z.string(),
    title: z.string(),
    description: z.string(),
    image: z.string().optional(),
  })
  .passthrough();

const timelineSectionSchema = z
  .object({
    type: z.literal('timeline'),
    title: z.string().optional(),
    entries: z.array(timelineEntrySchema),
  })
  .passthrough();

const imageTextHalfSectionSchema = z
  .object({
    type: z.literal('imageTextHalf'),
    image: z.string().optional(),
    title: z.string().optional(),
    text: z.string().optional(),
  })
  .passthrough();

const imageGridItemSchema = z
  .object({
    image: z.string().optional(),
    title: z.string().optional(),
    subtitle: z.string().optional(),
  })
  .passthrough();

const imageGridSectionSchema = z
  .object({
    type: z.literal('imageGrid'),
    items: z.array(imageGridItemSchema),
  })
  .passthrough();

const communityCarouselSlideSchema = z
  .object({
    image: z.string().optional(),
    alt: z.string().optional(),
    quote: z.string().optional(),
    name: z.string().optional(),
    role: z.string().optional(),
  })
  .passthrough();

const communityCarouselSectionSchema = z
  .object({
    type: z.literal('communityCarousel'),
    title: z.string().optional(),
    slides: z.array(communityCarouselSlideSchema).optional(),
    slideDuration: z.number().optional(),
    quoteDuration: z.number().optional(),
  })
  .passthrough();

const faqItemSchema = z
  .object({
    q: z.string().optional(),
    a: z.string().optional(),
  })
  .passthrough();

const faqSectionSchema = z
  .object({
    type: z.literal('faq'),
    title: z.string().optional(),
    items: z.array(faqItemSchema).optional(),
  })
  .passthrough();

const bannerSectionSchema = z
  .object({
    type: z.literal('banner'),
    text: z.string().optional(),
    cta: z.string().optional(),
    url: z.string().optional(),
  })
  .passthrough();

const videoSectionSchema = z
  .object({
    type: z.literal('video'),
    title: z.string().optional(),
    url: z.string().optional(),
  })
  .passthrough();

const newsletterSignupSectionSchema = z
  .object({
    type: z.literal('newsletterSignup'),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    placeholder: z.string().optional(),
    ctaLabel: z.string().optional(),
    confirmation: z.string().optional(),
    background: z.enum(['light', 'beige', 'dark']).optional(),
    alignment: z.enum(['left', 'center']).optional(),
  })
  .passthrough();

const legacySectionSchema = z.discriminatedUnion('type', [
  timelineSectionSchema,
  imageTextHalfSectionSchema,
  imageGridSectionSchema,
]);

const pillarsItemSchema = z
  .object({
    label: z.string().optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
  })
  .passthrough();

const pillarsSectionSchema = z
  .object({
    type: z.literal('pillars'),
    title: z.string().optional(),
    items: z.array(pillarsItemSchema).optional(),
  })
  .passthrough();

const mediaCopySectionSchema = z
  .object({
    type: z.literal('mediaCopy'),
    title: z.string().optional(),
    body: z.string().optional(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    layout: z.enum(['image-left', 'image-right', 'overlay']).optional(),
    columns: z.number().int().optional(),
    overlay: z
      .object({
        columnStart: z.number().int().min(1).max(6).optional(),
        columnSpan: z.number().int().min(1).max(6).optional(),
        rowStart: z.number().int().min(1).max(6).optional(),
        rowSpan: z.number().int().min(1).max(6).optional(),
        textAlign: z.enum(['left', 'center', 'right']).optional(),
        verticalAlign: z.enum(['start', 'center', 'end']).optional(),
        theme: z.enum(['light', 'dark']).optional(),
        background: z.enum(['none', 'scrim-light', 'scrim-dark', 'panel']).optional(),
        cardWidth: z.enum(['sm', 'md', 'lg']).optional(),
      })
      .optional(),
  })
  .passthrough();

const testimonialQuoteSchema = z
  .object({
    text: z.string().optional(),
    author: z.string().optional(),
    role: z.string().optional(),
  })
  .passthrough();

const testimonialsSectionSchema = z
  .object({
    type: z.literal('testimonials'),
    quotes: z.array(testimonialQuoteSchema).optional(),
  })
  .passthrough();

const mediaShowcaseItemSchema = z
  .object({
    eyebrow: z.string().optional(),
    title: z.string().optional(),
    body: z.string().optional(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    ctaLabel: z.string().optional(),
    ctaHref: z.string().optional(),
  })
  .passthrough();

const mediaShowcaseSectionSchema = z
  .object({
    type: z.literal('mediaShowcase'),
    title: z.string().optional(),
    items: z.array(mediaShowcaseItemSchema).optional(),
  })
  .passthrough();

const structuredSectionSchema = z.discriminatedUnion('type', [
  communityCarouselSectionSchema,
  newsletterSignupSectionSchema,
  pillarsSectionSchema,
  mediaCopySectionSchema,
  testimonialsSectionSchema,
  faqSectionSchema,
  bannerSectionSchema,
  videoSectionSchema,
  mediaShowcaseSectionSchema,
]);

const genericSectionSchema = z.object({ type: z.string() }).passthrough();

const sectionSchema = z.union([structuredSectionSchema, legacySectionSchema, genericSectionSchema]);

const galleryRowSchema = z
  .object({
    layout: z.enum(['half', 'thirds', 'quarters']).optional(),
    items: z
      .array(
        z
          .object({
            image: z.string().optional(),
            alt: z.string().optional(),
            caption: z.string().optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();

const clinicsBlockSchema = z
  .object({
    clinicsTitle: z.string().optional(),
    clinicsBody: z.string().optional(),
    clinicsCtaLabel: z.string().optional(),
    clinicsCtaHref: z.string().optional(),
    clinicsImage: z.string().optional(),
  })
  .passthrough();

const homeContentSchema = z
  .object({
    sections: z.array(sectionSchema).optional(),
    heroAlignment: heroAlignmentSchema.optional(),
    heroImages: heroImagesSchema.optional(),
    heroCtas: heroCtasSchema.optional(),
    heroHeadline: z.string().optional(),
    heroSubheadline: z.string().optional(),
    heroPrimaryCta: z.string().optional(),
    heroSecondaryCta: z.string().optional(),
    heroOverlay: z.union([z.string(), z.number(), z.boolean()]).optional(),
    heroLayoutHint: z.string().optional(),
    heroAlignX: z.string().optional(),
    heroAlignY: z.string().optional(),
    heroTextPosition: z.string().optional(),
    heroImageLeft: z.string().nullable().optional(),
    heroImageRight: z.string().nullable().optional(),
    brandIntro: z
      .object({
        title: z.string().optional(),
        text: z.string().optional(),
      })
      .optional(),
    clinicsBlock: clinicsBlockSchema.optional(),
    galleryRows: z.array(galleryRowSchema).optional(),
    bestsellersIntro: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    meta: z
      .object({
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
      })
      .optional(),
    heroCtaPrimary: z.string().optional(),
    heroCtaSecondary: z.string().optional(),
    ctaPrimary: z.string().optional(),
    ctaSecondary: z.string().optional(),
  })
  .passthrough();

type HeroAlignmentGroup = z.infer<typeof heroAlignmentSchema>;
type HeroImagesGroup = z.infer<typeof heroImagesSchema>;
type HeroCtasGroup = z.infer<typeof heroCtasSchema>;
type StructuredSection = z.infer<typeof structuredSectionSchema>;
type LegacySection = z.infer<typeof legacySectionSchema>;
type SectionEntry = z.infer<typeof sectionSchema>;
type HomeContentData = z.infer<typeof homeContentSchema>;
type StructuredSectionEntry = { index: number; section: StructuredSection };
type LegacySectionEntry = { index: number; section: LegacySection };

const isHomeSection = (section: unknown): section is HomeSection => {
  if (!section || typeof section !== 'object') {
    return false;
  }

  const typeValue = (section as { type?: unknown }).type;
  return isHomeSectionType(typeValue);
};

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

type HeroHorizontalAlignment = 'left' | 'center' | 'right';
type HeroVerticalAlignment = 'top' | 'middle' | 'bottom';
type HeroTextAnchor = NonNullable<PageContent['heroTextPosition']>;

type HomePageContent = PageContent & {
  heroImageLeftUrl?: string | null;
  heroImageRightUrl?: string | null;
  heroAlignment?: HeroAlignmentGroup;
  heroImages?: HeroImagesGroup;
  heroCtas?: HeroCtasGroup;
  rawSections: SectionEntry[];
  structuredSectionEntries: StructuredSectionEntry[];
  legacySectionEntries: LegacySectionEntry[];
  localSections: HomeSection[];
  hasSectionsArray: boolean;
  shouldRenderLocalSections: boolean;
  resolvedLocale: Language;
  contentSource: ContentSource;
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

const HERO_GRID_CONTAINER_CLASSES = 'grid grid-cols-3 grid-rows-3 w-full h-full p-6 sm:p-10';

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

const HERO_TEXT_POSITION_MAP: Record<
  NonNullable<PageContent['heroTextPosition']>,
  [HeroHorizontalAlignment, HeroVerticalAlignment]
> = {
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

const normalizeImagePath = (value: string | null | undefined, locale: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.startsWith('/content/')) {
    const normalizedContentPath = trimmed.startsWith('//') ? `/${trimmed.slice(2)}` : trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
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

type CmsCtaLike = string | CmsCtaShape | null | undefined;

type ContentSource = 'content' | 'visual-editor';

const extractCmsCtaLabel = (value: CmsCtaLike): string | undefined => {
  if (typeof value === 'string') {
    return sanitizeCmsString(value);
  }

  if (isCmsCtaObject(value)) {
    return sanitizeCmsString(value.label ?? null);
  }

  return undefined;
};

const extractCmsCtaHref = (value: CmsCtaLike): string | undefined => {
  if (typeof value === 'string') {
    return sanitizeCmsUrl(value);
  }

  if (isCmsCtaObject(value)) {
    return sanitizeCmsUrl(value.href ?? null);
  }

  return undefined;
};

const extractCmsCta = (value: CmsCtaLike): { label?: string; href?: string } => ({
  label: extractCmsCtaLabel(value),
  href: extractCmsCtaHref(value),
});

const sanitizeOptionalCmsString = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    return sanitizeCmsString(value);
  }

  return undefined;
};

const toCmsCtaLike = (value: unknown): CmsCtaLike => {
  if (typeof value === 'string' || isCmsCtaObject(value)) {
    return value;
  }

  return undefined;
};

const createKeyFromParts = (prefix: string, parts: Array<string | null | undefined>) => {
  const key = parts
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter((part) => part.length > 0)
    .join('|');

  return key.length > 0 ? `${prefix}-${key}` : prefix;
};

const clampInteger = (value: unknown, min: number, max: number, fallback: number) => {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    return fallback;
  }

  const rounded = Math.round(value);
  if (rounded < min) {
    return min;
  }
  if (rounded > max) {
    return max;
  }
  return rounded;
};

const OVERLAY_GRID_SIZE = 6;

type NormalizedOverlaySettings = {
  columnStart: number;
  columnEnd: number;
  rowStart: number;
  rowEnd: number;
  textAlign: 'left' | 'center' | 'right';
  verticalAlign: 'start' | 'center' | 'end';
  theme: 'light' | 'dark';
  background: 'none' | 'scrim-light' | 'scrim-dark' | 'panel';
  cardWidth: 'sm' | 'md' | 'lg';
};

const normalizeOverlaySettings = (overlay?: MediaCopyOverlaySettings | null): NormalizedOverlaySettings => {
  const defaults: NormalizedOverlaySettings = {
    columnStart: 2,
    columnEnd: 5,
    rowStart: 4,
    rowEnd: 6,
    textAlign: 'left',
    verticalAlign: 'start',
    theme: 'light',
    background: 'scrim-dark',
    cardWidth: 'md',
  };

  if (!overlay || typeof overlay !== 'object') {
    return defaults;
  }

  const columnStart = clampInteger(overlay.columnStart, 1, OVERLAY_GRID_SIZE, defaults.columnStart);
  const columnSpan = clampInteger(overlay.columnSpan, 1, OVERLAY_GRID_SIZE, defaults.columnEnd - defaults.columnStart);
  const maxColumnSpan = OVERLAY_GRID_SIZE - columnStart + 1;
  const effectiveColumnSpan = Math.min(columnSpan, maxColumnSpan);
  const columnEnd = Math.min(columnStart + effectiveColumnSpan, OVERLAY_GRID_SIZE + 1);

  const rowStart = clampInteger(overlay.rowStart, 1, OVERLAY_GRID_SIZE, defaults.rowStart);
  const rowSpan = clampInteger(overlay.rowSpan, 1, OVERLAY_GRID_SIZE, defaults.rowEnd - defaults.rowStart);
  const maxRowSpan = OVERLAY_GRID_SIZE - rowStart + 1;
  const effectiveRowSpan = Math.min(rowSpan, maxRowSpan);
  const rowEnd = Math.min(rowStart + effectiveRowSpan, OVERLAY_GRID_SIZE + 1);

  const textAlign = overlay.textAlign === 'left' || overlay.textAlign === 'center' || overlay.textAlign === 'right'
    ? overlay.textAlign
    : defaults.textAlign;

  const verticalAlign =
    overlay.verticalAlign === 'start' || overlay.verticalAlign === 'center' || overlay.verticalAlign === 'end'
      ? overlay.verticalAlign
      : defaults.verticalAlign;

  const theme = overlay.theme === 'light' || overlay.theme === 'dark' ? overlay.theme : defaults.theme;

  const background =
    overlay.background === 'none' || overlay.background === 'scrim-light' || overlay.background === 'scrim-dark' || overlay.background === 'panel'
      ? overlay.background
      : defaults.background;

  const cardWidth = overlay.cardWidth === 'sm' || overlay.cardWidth === 'md' || overlay.cardWidth === 'lg'
    ? overlay.cardWidth
    : defaults.cardWidth;

  return {
    columnStart,
    columnEnd,
    rowStart,
    rowEnd,
    textAlign,
    verticalAlign,
    theme,
    background,
    cardWidth,
  };
};

const overlayBackgroundClassMap: Record<NormalizedOverlaySettings['background'], string> = {
  none: 'bg-transparent',
  'scrim-light': 'bg-white/80 backdrop-blur-sm',
  'scrim-dark': 'bg-black/60 backdrop-blur-sm',
  panel: 'bg-stone-900/85 backdrop-blur-sm',
};

const overlayCardWidthClassMap: Record<NormalizedOverlaySettings['cardWidth'], string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
};

const isInternalNavigationHref = (href?: string | null): href is string => {
  if (!href) {
    return false;
  }

  return href.startsWith('#/') || href.startsWith('/');
};

const normalizeInternalHref = (href: string): string => {
  if (href.startsWith('#/')) {
    const normalized = href.slice(1);
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
  }

  if (!href.startsWith('/')) {
    return `/${href}`;
  }

  return href;
};

const isExternalHttpUrl = (href?: string): href is string => {
  if (!href) {
    return false;
  }

  return /^https?:\/\//i.test(href);
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

const normalizeHeroTextAnchor = (value?: string | null): HeroTextAnchor | undefined => {
  if (!value) {
    return undefined;
  }

  if (value in HERO_TEXT_POSITION_MAP) {
    return value as HeroTextAnchor;
  }

  return undefined;
};

const resolveHeroOverlay = (value?: string | number | boolean | null): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
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

interface BestsellersProps {
    intro?: string;
    introFieldPath?: string;
}

const Bestsellers: React.FC<BestsellersProps> = ({ intro, introFieldPath }) => {
    const { t, language } = useLanguage();
    const [products, setProducts] = useState<Product[]>([]);
    const { settings } = useSiteSettings();
    const { contentVersion } = useVisualEditorSync();

    useEffect(() => {
        let isMounted = true;

        const loadProducts = async () => {
            try {
                const data = await fetchVisualEditorJson<ProductsResponse>('/content/products/index.json');
                if (!isMounted) {
                    return;
                }
                setProducts(Array.isArray(data.items) ? data.items : []);
            } catch (error) {
                if (isMounted) {
                    console.error('Failed to load bestseller products', error);
                    setProducts([]);
                }
            }
        };

        loadProducts().catch((error) => {
            console.error('Unhandled error while loading bestseller products', error);
        });

        return () => {
            isMounted = false;
        };
    }, [contentVersion]);

    const featuredProductIds = useMemo(() => {
        const ids = settings.home?.featuredProductIds ?? [];

        return ids.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
    }, [settings]);

    const curatedProducts = useMemo(() => {
        if (featuredProductIds.length === 0 || products.length === 0) {
            return [];
        }

        const productMap = new Map(products.map(product => [product.id, product]));
        const uniqueIds = Array.from(new Set(featuredProductIds));

        return uniqueIds
            .map(id => productMap.get(id))
            .filter((product): product is Product => Boolean(product));
    }, [products, featuredProductIds]);

    const fallbackProducts = useMemo(() => products.slice(0, 3), [products]);

    const featuredProducts = curatedProducts.length > 0 ? curatedProducts : fallbackProducts;

    return (
        <div className="py-16 sm:py-24 bg-stone-100">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-3xl sm:text-4xl font-semibold text-center mb-12"
                    {...getVisualEditorAttributes(`translations.${language}.home.bestsellersTitle`)}
                >
                    {t('home.bestsellersTitle')}
                </motion.h2>
                {intro && (
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-center text-stone-600 max-w-3xl mx-auto -mt-8 mb-12"
                        {...getVisualEditorAttributes(introFieldPath)}
                    >
                        {intro}
                    </motion.p>
                )}
                {featuredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {featuredProducts.map((product, index) => {
                            const productIndex = products.findIndex((item) => item.id === product.id);
                            const productFieldPath = productIndex >= 0 ? `products.items.${productIndex}` : undefined;
                            return (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    fieldPath={productFieldPath}
                                />
                            );
                        })}
                    </div>
                ) : (
                    <p
                        className="text-center"
                        {...getVisualEditorAttributes(`translations.${language}.common.loadingBestsellers`)}
                    >
                        {t('common.loadingBestsellers')}
                    </p>
                )}
            </div>
        </div>
    );
};

interface ClinicsBlockProps {
    data?: ClinicsBlockContent;
    fieldPath?: string;
    fallbackCtaHref: string;
    fallbackCtaLabel: string;
}

const clinicsMarkdownComponents: MarkdownComponents = {
    p: ({ children, ...props }) => (
        <p className="text-stone-600 leading-relaxed" {...props}>
            {children}
        </p>
    ),
    ul: ({ children, ...props }) => (
        <ul className="list-disc list-inside text-stone-600 leading-relaxed space-y-2" {...props}>
            {children}
        </ul>
    ),
    ol: ({ children, ...props }) => (
        <ol className="list-decimal list-inside text-stone-600 leading-relaxed space-y-2" {...props}>
            {children}
        </ol>
    ),
    li: ({ children, ...props }) => (
        <li className="text-stone-600 leading-relaxed" {...props}>
            {children}
        </li>
    ),
};

const ClinicsBlock: React.FC<ClinicsBlockProps> = ({ data, fieldPath, fallbackCtaHref, fallbackCtaLabel }) => {
    if (!data) {
        return null;
    }

    const { language } = useLanguage();
    const { clinicsTitle, clinicsBody, clinicsCtaHref, clinicsCtaLabel, clinicsImage } = data;
    const trimmedClinicsImage = clinicsImage?.trim() ?? '';
    const clinicsImageUrl = trimmedClinicsImage ? getCloudinaryUrl(trimmedClinicsImage) ?? trimmedClinicsImage : '';
    const hasPrimaryContent = Boolean(
        (clinicsTitle && clinicsTitle.trim().length > 0)
            || (clinicsBody && clinicsBody.trim().length > 0)
            || (clinicsCtaLabel && clinicsCtaLabel.trim().length > 0)
            || (trimmedClinicsImage.length > 0),
    );

    if (!hasPrimaryContent) {
        return null;
    }

    const hasImage = Boolean(clinicsImageUrl);
    const effectiveHref = clinicsCtaHref && clinicsCtaHref.trim().length > 0 ? clinicsCtaHref : fallbackCtaHref;
    const isInternalLink = effectiveHref.startsWith('#/') || effectiveHref.startsWith('/');
    const internalPath = effectiveHref.startsWith('#/') ? effectiveHref.slice(1) : effectiveHref;
    const ctaLabel = clinicsCtaLabel && clinicsCtaLabel.trim().length > 0 ? clinicsCtaLabel : fallbackCtaLabel;

    return (
        <div className="py-16 sm:py-24 bg-white" {...getVisualEditorAttributes(fieldPath)}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className={`grid grid-cols-1 gap-12 ${hasImage ? 'lg:grid-cols-2 items-center' : ''}`}>
                    <div>
                        {clinicsTitle && (
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="text-3xl sm:text-4xl font-semibold"
                                {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.clinicsTitle` : undefined)}
                            >
                                {clinicsTitle}
                            </motion.h2>
                        )}
                        {clinicsBody && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                                className="mt-6 space-y-4"
                                {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.clinicsBody` : undefined)}
                            >
                                <ReactMarkdown components={clinicsMarkdownComponents}>
                                    {clinicsBody}
                                </ReactMarkdown>
                            </motion.div>
                        )}
                        {ctaLabel && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="mt-8"
                            >
                                {isInternalLink ? (
                                    <Link
                                        to={buildLocalizedPath(internalPath.startsWith('/') ? internalPath : `/${internalPath}`, language)}
                                        className="inline-flex items-center px-6 py-3 bg-stone-900 text-white font-semibold rounded-md hover:bg-stone-700 transition-colors"
                                        {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.clinicsCtaHref` : undefined)}
                                    >
                                        <span {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.clinicsCtaLabel` : undefined)}>
                                            {ctaLabel}
                                        </span>
                                    </Link>
                                ) : (
                                    <a
                                        href={effectiveHref}
                                        className="inline-flex items-center px-6 py-3 bg-stone-900 text-white font-semibold rounded-md hover:bg-stone-700 transition-colors"
                                        target="_blank"
                                        rel="noreferrer"
                                        {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.clinicsCtaHref` : undefined)}
                                    >
                                        <span {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.clinicsCtaLabel` : undefined)}>
                                            {ctaLabel}
                                        </span>
                                    </a>
                                )}
                            </motion.div>
                        )}
                    </div>
                    {hasImage && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="w-full"
                        >
                            <img
                                src={clinicsImageUrl}
                                alt={clinicsTitle ?? clinicsBody ?? fallbackCtaLabel}
                                className="w-full rounded-lg shadow-lg object-cover"
                                {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.clinicsImage` : undefined)}
                            />
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface GalleryRowsProps {
    rows?: GalleryRowContent[];
    fieldPath?: string;
    fallbackAlt?: string;
}

const galleryLayoutMap: Record<NonNullable<GalleryRowContent['layout']>, string> = {
    half: 'lg:grid-cols-2',
    thirds: 'lg:grid-cols-3',
    quarters: 'grid-cols-2 lg:grid-cols-4',
};

const GalleryRows: React.FC<GalleryRowsProps> = ({ rows, fieldPath, fallbackAlt }) => {
    const sanitizedRows = rows
        ?.map((row) => {
            if (!row) {
                return null;
            }

            const items = (row.items ?? []).filter((item) => Boolean(item?.image?.trim()));

            if (items.length === 0) {
                return null;
            }

            return { ...row, items };
        })
        .filter((row): row is GalleryRowContent & { items: NonNullable<GalleryRowContent['items']> } => Boolean(row)) ?? [];

    if (sanitizedRows.length === 0) {
        return null;
    }

    return (
        <section className="py-12 md:py-16 bg-stone-50" {...getVisualEditorAttributes(fieldPath)}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                {sanitizedRows.map((row, rowIndex) => {
                    const rowFieldPath = fieldPath ? `${fieldPath}[${rowIndex}]` : undefined;
                    const layoutClass = row.layout ? galleryLayoutMap[row.layout] ?? 'lg:grid-cols-3' : 'lg:grid-cols-3';
                    const items = row.items ?? [];
                    const baseGridClass = row.layout === 'quarters' ? '' : 'grid-cols-1';
                    const gridClasses = ['grid', baseGridClass, layoutClass, 'gap-6'].filter(Boolean).join(' ');
                    const rowKey = createKeyFromParts('gallery-row', [
                        row.layout ?? undefined,
                        items.map((item) => item?.image ?? item?.caption ?? item?.alt ?? '').join('|'),
                    ]);

                    return (
                        <div
                            key={rowKey}
                            className={gridClasses}
                            {...getVisualEditorAttributes(rowFieldPath)}
                        >
                            {items.map((item, itemIndex) => {
                                if (!item) {
                                    return null;
                                }

                                const rawImageSrc = item.image?.trim() ?? '';
                                const imageSrc = rawImageSrc ? getCloudinaryUrl(rawImageSrc) ?? rawImageSrc : '';
                                const caption = item.caption?.trim();
                                const altText = item.alt?.trim() ?? caption ?? fallbackAlt ?? 'Gallery image';
                                const hasContent = Boolean(imageSrc);

                                if (!hasContent) {
                                    return null;
                                }

                                const itemFieldPath = rowFieldPath ? `${rowFieldPath}.items[${itemIndex}]` : undefined;
                                const galleryItemKey = createKeyFromParts('gallery-item', [imageSrc, caption, altText]);

                                return (
                                    <motion.figure
                                        key={galleryItemKey}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: itemIndex * 0.05 }}
                                        className="space-y-2"
                                        {...getVisualEditorAttributes(itemFieldPath)}
                                    >
                                        <img
                                            src={imageSrc}
                                            alt={altText}
                                            className="w-full aspect-[4/3] object-cover rounded-lg shadow-md"
                                            {...getVisualEditorAttributes(itemFieldPath ? `${itemFieldPath}.image` : undefined)}
                                        />
                                        {caption && (
                                            <figcaption
                                                className="mt-2 text-sm text-stone-600"
                                                {...getVisualEditorAttributes(itemFieldPath ? `${itemFieldPath}.caption` : undefined)}
                                            >
                                                {caption}
                                            </figcaption>
                                        )}
                                    </motion.figure>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

const Reviews: React.FC = () => {
    const { t, translate, language } = useLanguage();
    const [reviews, setReviews] = useState<Review[]>([]);
    const { contentVersion } = useVisualEditorSync();

    useEffect(() => {
        let isMounted = true;

        const loadReviews = async () => {
            try {
                const data = await fetchVisualEditorJson<ReviewsResponse>('/content/reviews/index.json');
                if (!isMounted) {
                    return;
                }
                const items = Array.isArray(data.items) ? data.items : [];
                setReviews(items.slice(0, 3));
            } catch (error) {
                if (isMounted) {
                    console.error('Failed to load reviews', error);
                    setReviews([]);
                }
            }
        };

        loadReviews().catch((error) => {
            console.error('Unhandled error while loading reviews', error);
        });

        return () => {
            isMounted = false;
        };
    }, [contentVersion]);

    return (
        <div className="py-16 sm:py-24 bg-stone-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-3xl sm:text-4xl font-semibold text-center mb-12"
                    {...getVisualEditorAttributes(`translations.${language}.home.reviewsTitle`)}
                >
                    {t('home.reviewsTitle')}
                </motion.h2>
                {reviews.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {reviews.map((review, index) => (
                            <motion.div
                                key={review.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className="p-8 bg-stone-100 rounded-lg text-center"
                                {...getVisualEditorAttributes(`reviews.items.${index}`)}
                            >
                                <p className="text-stone-700 italic">
                                    &ldquo;
                                    <span {...getVisualEditorAttributes(`reviews.items.${index}.text.${language}`)}>
                                        {translate(review.text)}
                                    </span>
                                    &rdquo;
                                </p>
                                <p
                                    className="mt-6 font-semibold"
                                    {...getVisualEditorAttributes(`reviews.items.${index}.author.${language}`)}
                                >
                                    {translate(review.author)}
                                </p>
                                <p
                                    className="text-sm text-stone-500"
                                    {...getVisualEditorAttributes(`reviews.items.${index}.role.${language}`)}
                                >
                                    {translate(review.role)}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <p
                        className="text-center"
                        {...getVisualEditorAttributes(`translations.${language}.common.loadingReviews`)}
                    >
                        {t('common.loadingReviews')}
                    </p>
                )}
            </div>
        </div>
    );
};

type NewsletterBackground = 'light' | 'beige' | 'dark';

interface NewsletterSignupProps {
  title?: string;
  subtitle?: string;
  placeholder?: string;
  ctaLabel?: string;
  confirmation?: string;
  alignment?: 'left' | 'center';
  background?: NewsletterBackground;
  fieldPath?: string;
}

const newsletterBackgroundClassMap: Record<NewsletterBackground, string> = {
  light: 'bg-stone-200 text-stone-900',
  beige: 'bg-amber-50 text-stone-900',
  dark: 'bg-stone-900 text-white',
};

const NewsletterSignup: React.FC<NewsletterSignupProps> = ({
  title,
  subtitle,
  placeholder,
  ctaLabel,
  confirmation,
  alignment = 'center',
  background = 'light',
  fieldPath,
}) => {
  const { t } = useLanguage();
  const [email, setEmail] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleEmailChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  }, [setEmail]);

  const resolvedTitle = title?.trim().length ? title : t('home.newsletterTitle');
  const resolvedSubtitle = subtitle?.trim().length ? subtitle : t('home.newsletterSubtitle');
  const resolvedPlaceholder = placeholder?.trim().length ? placeholder : t('home.newsletterPlaceholder');
  const resolvedCtaLabel = ctaLabel?.trim().length ? ctaLabel : t('home.newsletterSubmit');
  const resolvedConfirmation = confirmation?.trim().length ? confirmation : t('home.newsletterThanks');

  const backgroundClass = newsletterBackgroundClassMap[background] ?? newsletterBackgroundClassMap.light;
  const isDark = background === 'dark';
  const alignmentWrapperClass = alignment === 'left' ? 'items-start text-left' : 'items-center text-center';
  const formAlignmentClass = alignment === 'left' ? 'sm:flex-row sm:justify-start' : 'sm:flex-row sm:justify-center';
  const containerMaxWidth = alignment === 'left' ? 'max-w-3xl' : 'max-w-2xl';
  const inputClasses = isDark
    ? 'flex-grow px-4 py-3 rounded-md border border-white/40 bg-white/10 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/60 focus:border-white/60 transition'
    : 'flex-grow px-4 py-3 rounded-md border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-stone-500 transition';
  const buttonClasses = isDark
    ? 'px-6 py-3 bg-white text-stone-900 font-semibold rounded-md hover:bg-white/90 transition-colors'
    : 'px-6 py-3 bg-stone-900 text-white font-semibold rounded-md hover:bg-stone-700 transition-colors';

  return (
    <div className={`py-16 sm:py-24 ${backgroundClass}`} {...getVisualEditorAttributes(fieldPath)}>
      <div className={`container mx-auto px-4 sm:px-6 lg:px-8 ${containerMaxWidth}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={`flex flex-col gap-4 ${alignmentWrapperClass}`}
        >
          <h2
            className="text-3xl sm:text-4xl font-semibold"
            {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.title` : undefined)}
          >
            {resolvedTitle}
          </h2>
          {resolvedSubtitle && (
            <p
              className={`text-base sm:text-lg ${isDark ? 'text-white/80' : 'text-stone-600'}`}
              {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.subtitle` : undefined)}
            >
              {resolvedSubtitle}
            </p>
          )}
          {submitted ? (
            <p
              className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-green-700'}`}
              {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.confirmation` : undefined)}
            >
              {resolvedConfirmation}
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className={`flex w-full flex-col gap-2 sm:max-w-xl ${formAlignmentClass}`}
            >
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder={resolvedPlaceholder}
                required
                className={inputClasses}
                {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.placeholder` : undefined)}
              />
              <button type="submit" className={buttonClasses}>
                <span {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.ctaLabel` : undefined)}>{resolvedCtaLabel}</span>
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
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
  const [products, setProducts] = useState<Product[]>([]);
  const [testimonialLibrary, setTestimonialLibrary] = useState<Record<string, TestimonialEntry>>({});

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        const data = await fetchVisualEditorJson<ProductsResponse>('/content/products/index.json');
        if (!isMounted) {
          return;
        }

        setProducts(Array.isArray(data?.items) ? data.items : []);
      } catch (error) {
        if (isMounted) {
          console.error('Failed to load products for home sections', error);
          setProducts([]);
        }
      }
    };

    loadProducts().catch((error) => {
      console.error('Unhandled error while loading products for home sections', error);
    });

    return () => {
      isMounted = false;
    };
  }, [contentVersion]);

  useEffect(() => {
    let isMounted = true;
    setPageContent(null);

    const loadSections = async () => {
      const applyParsedHomeContent = (
        parsedData: HomeContentData,
        localeUsed: Language,
        fieldPathSource: ContentSource,
      ) => {
        if (!isMounted) {
          return;
        }

        const hasSectionsArray = Array.isArray(parsedData?.sections);
        const rawSections: SectionEntry[] = hasSectionsArray ? (parsedData.sections ?? []) : [];
        const heroAlignmentData = parsedData?.heroAlignment;
        let heroImagesData: HeroImagesGroup | undefined = parsedData?.heroImages ?? undefined;
        const heroCtasData = parsedData?.heroCtas;
        const heroHeadlineData = parsedData?.heroHeadline;
        const heroSubheadlineData = parsedData?.heroSubheadline;

        const heroValidation = validateHeroContent({
          heroHeadline: heroHeadlineData,
          heroImages: heroImagesData,
          heroImageLeft: parsedData?.heroImageLeft ?? null,
          heroImageRight: parsedData?.heroImageRight ?? null,
          heroFallback: heroFallbackRaw,
        });
        heroImagesData = heroValidation.heroImages ?? heroImagesData;
        const sections: HomeSection[] = hasSectionsArray
          ? rawSections.reduce<HomeSection[]>((acc, section) => {
              if (!isHomeSection(section)) {
                return acc;
              }

              if (section.visible === false) {
                return acc;
              }

              acc.push(section);
              return acc;
            }, [])
          : [];

        const shouldRenderLocal = hasSectionsArray && (sections.length > 0 || localeUsed !== language);

        const structuredSectionEntries = rawSections.reduce<StructuredSectionEntry[]>((acc, section, index) => {
          if (section && typeof section === 'object' && 'visible' in section && (section as { visible?: unknown }).visible === false) {
            return acc;
          }

          const parsedSection = structuredSectionSchema.safeParse(section);
          if (parsedSection.success) {
            acc.push({ index, section: parsedSection.data });
          }
          return acc;
        }, []);

        const legacySectionEntries = rawSections.reduce<LegacySectionEntry[]>((acc, section, index) => {
          if (section && typeof section === 'object' && 'visible' in section && (section as { visible?: unknown }).visible === false) {
            return acc;
          }

          const parsedSection = legacySectionSchema.safeParse(section);
          if (parsedSection.success) {
            acc.push({ index, section: parsedSection.data });
          }
          return acc;
        }, []);

        const heroImageLeftCandidate = firstDefined([
          heroImagesData?.heroImageLeft,
          parsedData?.heroImageLeft,
          heroFallbackRaw,
        ]);
        const heroImageRightCandidate = firstDefined([
          heroImagesData?.heroImageRight,
          parsedData?.heroImageRight,
          heroFallbackRaw,
        ]);
        const heroImageLeftUrl = normalizeImagePath(heroImageLeftCandidate, localeUsed) ?? null;
        const heroImageRightUrl = normalizeImagePath(heroImageRightCandidate, localeUsed) ?? null;

        if (
          import.meta.env.DEV
          && !heroImageLeftUrl
          && !heroImageRightUrl
          && !hasWarnedMissingHeroImages
        ) {
          console.warn('Home hero images are not configured. Add hero image references or legacy URLs in the CMS.');
          hasWarnedMissingHeroImages = true;
        }

        const baseContent = parsedData as PageContent & HomeContentData;
        const pageData: HomePageContent = {
          ...baseContent,
          ...(heroHeadlineData !== undefined ? { heroHeadline: heroHeadlineData } : {}),
          ...(heroSubheadlineData !== undefined ? { heroSubheadline: heroSubheadlineData } : {}),
          heroAlignment: heroAlignmentData,
          heroImages: heroImagesData,
          heroCtas: heroCtasData,
          heroImageLeftUrl,
          heroImageRightUrl,
          rawSections,
          structuredSectionEntries,
          legacySectionEntries,
          localSections: sections,
          hasSectionsArray,
          shouldRenderLocalSections: shouldRenderLocal,
          sections: legacySectionEntries.map((entry) => entry.section as PageSection),
          resolvedLocale: localeUsed,
          contentSource: fieldPathSource,
        };

        setPageContent(pageData);
      };

      try {
        const unified = await loadUnifiedPage<HomeContentData>('home', language);
        if (unified) {
          const unifiedParse = homeContentSchema.safeParse(unified.data);
          if (!unifiedParse.success) {
            console.error('Invalid unified home content structure', unifiedParse.error);
          } else {
            applyParsedHomeContent(unifiedParse.data, unified.locale, 'visual-editor');
            return;
          }
        }
      } catch (error) {
        console.error('Failed to load unified home page content', error);
      }

      let result: LoadPageResult<MarkdownPageDocument<unknown>>;

      try {
        result = await loadPage<MarkdownPageDocument<unknown>>({
          slug: 'home',
          locale: language,
          loader: async ({ locale: currentLocale }) => {
            const doc = await fetchVisualEditorMarkdown<unknown>(
              `/content/pages/${currentLocale}/home.md`,
              { cache: 'no-store' },
            );
            return doc as MarkdownPageDocument<unknown>;
          },
        });
      } catch (error) {
        console.error('Failed to load home sections', error);
        if (isMounted) {
          setPageContent(null);
        }
        return;
      }

      if (!isMounted) {
        return;
      }

      let parsedResult = homeContentSchema.safeParse(result.data);

      if (!parsedResult.success && result.localeUsed !== 'en') {
        try {
          result = await loadPage<MarkdownPageDocument<unknown>>({
            slug: 'home',
            locale: 'en',
            loader: async ({ locale: fallbackLocale }) => {
              const doc = await fetchVisualEditorMarkdown<unknown>(
                `/content/pages/${fallbackLocale}/home.md`,
                { cache: 'no-store' },
              );
              return doc as MarkdownPageDocument<unknown>;
            },
          });

          if (!isMounted) {
            return;
          }

          parsedResult = homeContentSchema.safeParse(result.data);
        } catch (fallbackError) {
          console.error('Failed to load fallback home sections', fallbackError);
          if (isMounted) {
            setPageContent(null);
          }
          return;
        }
      }

      if (!parsedResult.success) {
        if (import.meta.env.DEV) {
          console.warn('Invalid home content schema', parsedResult.error);
        }
        if (isMounted) {
          setPageContent(null);
        }
        return;
      }

      applyParsedHomeContent(
        parsedResult.data,
        result.localeUsed,
        result.source === 'visual-editor' ? 'visual-editor' : 'content',
      );
    };

    loadSections().catch((error) => {
      console.error('Unhandled error while loading home page sections', error);
    });

    return () => {
      isMounted = false;
    };
  }, [language, heroFallbackRaw, contentVersion]);

  const sanitizeString = sanitizeCmsString;
  const contentLocale = pageContent?.resolvedLocale ?? language;

  const pickImage = (local?: string | { src?: string | null } | null) => {
    let candidate: string | null = null;

    if (typeof local === 'string') {
      candidate = local;
    } else if (local && typeof local === 'object') {
      const source = 'src' in local ? local.src : undefined;
      candidate = typeof source === 'string' ? source : null;
    }

    if (!candidate) {
      return null;
    }

    const normalized = normalizeImagePath(candidate, contentLocale);
    if (normalized) {
      return normalized;
    }

    const trimmed = candidate.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  const homeFieldPath = pageContent
    ? pageContent.contentSource === 'visual-editor'
      ? `site.content.${pageContent.resolvedLocale}.pages.home`
      : `pages.home_${pageContent.resolvedLocale}`
    : `pages.home_${language}`;
  const heroHeadline = sanitizeString(pageContent?.heroHeadline) ?? t('home.heroTitle');
  const heroSubheadline = sanitizeString(pageContent?.heroSubheadline) ?? t('home.heroSubtitle');
  const heroPrimaryCtaCmsValue = pageContent?.heroCtas?.ctaPrimary;
  const heroSecondaryCtaCmsValue = pageContent?.heroCtas?.ctaSecondary;
  const heroPrimaryCtaLabel = firstDefined([
    extractCmsCtaLabel(heroPrimaryCtaCmsValue),
    sanitizeOptionalCmsString(pageContent?.heroPrimaryCta),
    sanitizeOptionalCmsString(pageContent?.heroCtaPrimary),
    sanitizeOptionalCmsString(pageContent?.ctaPrimary),
  ]) ?? t('home.ctaShop');
  const heroSecondaryCtaLabel = firstDefined([
    extractCmsCtaLabel(heroSecondaryCtaCmsValue),
    sanitizeOptionalCmsString(pageContent?.heroSecondaryCta),
    sanitizeOptionalCmsString(pageContent?.heroCtaSecondary),
    sanitizeOptionalCmsString(pageContent?.ctaSecondary),
  ]) ?? t('home.ctaClinics');
  const heroPrimaryCtaHref = firstDefined([
    extractCmsCtaHref(heroPrimaryCtaCmsValue),
    extractCmsCtaHref(toCmsCtaLike(pageContent?.heroPrimaryCta)),
    extractCmsCtaHref(toCmsCtaLike(pageContent?.heroCtaPrimary)),
    extractCmsCtaHref(toCmsCtaLike(pageContent?.ctaPrimary)),
  ]) ?? '/shop';
  const heroSecondaryCtaHref = firstDefined([
    extractCmsCtaHref(heroSecondaryCtaCmsValue),
    extractCmsCtaHref(toCmsCtaLike(pageContent?.heroSecondaryCta)),
    extractCmsCtaHref(toCmsCtaLike(pageContent?.heroCtaSecondary)),
    extractCmsCtaHref(toCmsCtaLike(pageContent?.ctaSecondary)),
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
    pageContent?.heroImages?.heroImageLeft,
    pageContent?.heroImageLeft,
    heroFallbackRaw,
  ]);
  const heroSrc = sanitizeString(normalizeImagePath(heroSrcCandidate, contentLocale));
  const heroImageLeftUrl = firstDefined([
    pageContent?.heroImageLeftUrl ?? undefined,
    normalizeImagePath(pageContent?.heroImages?.heroImageLeft, contentLocale),
    normalizeImagePath(pageContent?.heroImageLeft, contentLocale),
    heroSrc,
  ]);
  const heroImageRightUrl = firstDefined([
    pageContent?.heroImageRightUrl ?? undefined,
    normalizeImagePath(pageContent?.heroImages?.heroImageRight, contentLocale),
    normalizeImagePath(pageContent?.heroImageRight, contentLocale),
    heroSrc,
  ]);
  const heroImageLeft = sanitizeString(heroImageLeftUrl);
  const heroImageRight = sanitizeString(heroImageRightUrl);
  const heroTextPlacementRaw = pageContent?.heroAlignment?.heroTextPosition;
  const heroTextPlacement: 'overlay' | 'below' = heroTextPlacementRaw === 'below' ? 'below' : 'overlay';
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
  const overlayStyle: React.CSSProperties = shouldRenderInlineImage && heroTextPlacement === 'overlay'
    ? { background: 'linear-gradient(90deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.7) 100%)' }
    : { background: heroOverlay };
  const heroPrefersLightText = !shouldRenderInlineImage && heroTextPlacement === 'overlay';
  const heroTextColorClass = heroPrefersLightText ? 'text-white' : 'text-stone-900';
  const heroPrimaryButtonClasses = heroPrefersLightText
    ? 'px-8 py-3 bg-white text-stone-900 font-semibold rounded-md hover:bg-white/90 transition-colors'
    : 'px-8 py-3 bg-stone-900 text-white font-semibold rounded-md hover:bg-stone-700 transition-colors';
  const heroSecondaryButtonClasses = heroPrefersLightText
    ? 'px-8 py-3 border border-white/50 text-white font-semibold rounded-md hover:bg-white/10 transition-colors'
    : 'px-8 py-3 bg-white/70 backdrop-blur-sm text-stone-900 font-semibold rounded-md hover:bg-white transition-colors';
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
    ? 'grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'
    : heroTextPlacement === 'overlay'
      ? `flex flex-col ${HERO_HORIZONTAL_ALIGNMENT_CONTAINER_CLASSES[heroAlignX]}`
      : 'flex flex-col items-center text-center';
  const heroTextWrapperBaseClasses = shouldRenderInlineImage
    ? `${heroLayoutHint === 'image-left' ? 'order-1 lg:order-2' : 'order-1'} space-y-6 max-w-xl`
    : 'space-y-6 max-w-3xl';
  const heroTextWrapperAlignmentClass = shouldRenderInlineImage
    ? ''
    : heroTextPlacement === 'overlay'
      ? heroAlignX === 'left'
        ? 'mr-auto'
        : heroAlignX === 'right'
          ? 'ml-auto'
          : 'mx-auto'
      : 'mx-auto';
  const heroTextWrapperClasses = `${heroTextWrapperBaseClasses} ${heroTextAlignmentClass} ${heroTextWrapperAlignmentClass}`.trim();
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
  const heroPrimaryCtaIsInternal = isInternalNavigationHref(heroPrimaryCtaHref);
  const heroSecondaryCtaIsInternal = isInternalNavigationHref(heroSecondaryCtaHref);
  const heroPrimaryLinkTarget = heroPrimaryCtaIsInternal
    ? buildLocalizedPath(normalizeInternalHref(heroPrimaryCtaHref), language)
    : heroPrimaryCtaHref;
  const heroSecondaryLinkTarget = heroSecondaryCtaIsInternal
    ? buildLocalizedPath(normalizeInternalHref(heroSecondaryCtaHref), language)
    : heroSecondaryCtaHref;
  const heroInlineImageNode = shouldRenderInlineImage && heroInlineImage
    ? (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className={heroImageWrapperClasses}
      >
        <img
          src={heroInlineImage}
          alt={heroImageAlt}
          className="w-full max-h-[540px] rounded-lg shadow-lg object-cover"
          {...getVisualEditorAttributes(heroImageFieldPath)}
        />
      </motion.div>
    )
    : null;
  const heroContainerMarginClass = heroTextPlacement === 'overlay' ? 'mx-0' : 'mx-auto';
  const heroTextContent = (
    <div className={`container ${heroContainerMarginClass} px-4 sm:px-6 lg:px-8 ${heroGridClasses}`}>
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
              target={isExternalHttpUrl(heroPrimaryLinkTarget) ? '_blank' : undefined}
              rel={isExternalHttpUrl(heroPrimaryLinkTarget) ? 'noreferrer' : undefined}
            >
              <span {...getVisualEditorAttributes(heroPrimaryCtaFieldPath)}>
                {heroPrimaryCta}
              </span>
            </a>
          )}
          {heroSecondaryCtaIsInternal ? (
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
              href={heroSecondaryLinkTarget}
              className={heroSecondaryButtonClasses}
              {...getVisualEditorAttributes(heroSecondaryCtaHrefFieldPath)}
              target={isExternalHttpUrl(heroSecondaryLinkTarget) ? '_blank' : undefined}
              rel={isExternalHttpUrl(heroSecondaryLinkTarget) ? 'noreferrer' : undefined}
            >
              <span {...getVisualEditorAttributes(heroSecondaryCtaFieldPath)}>
                {heroSecondaryCta}
              </span>
            </a>
          )}
        </div>
      </div>
      {heroInlineImageNode}
    </div>
  );
  const heroTextMotion = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={`w-full ${heroTextColorClass}`}
    >
      {heroTextContent}
    </motion.div>
  );

  const sections = pageContent?.visible === false
    ? []
    : filterVisible(pageContent?.localSections ?? []);
  const homeSections = pageContent?.rawSections ?? [];
  const homeSectionsFieldPath = `${homeFieldPath}.sections`;
  const computedTitle = pageContent?.metaTitle ?? `Kapunka Skincare | ${t('home.metaTitle')}`;
  const computedDescription = pageContent?.metaDescription ?? t('home.metaDescription');
  const clinicsBlockData = pageContent?.clinicsBlock;
  const galleryRowsData = pageContent?.galleryRows;
  const bestsellersIntro = sanitizeString(pageContent?.bestsellersIntro);
  const brandIntroTitle = sanitizeString(pageContent?.brandIntro?.title);
  const brandIntroText = sanitizeString(pageContent?.brandIntro?.text);

  const structuredSectionsByIndex = useMemo(() => {
    const map = new Map<number, StructuredSection>();
    pageContent?.structuredSectionEntries.forEach(({ index, section }) => {
      map.set(index, section);
    });
    return map;
  }, [pageContent]);

  const legacySectionsByIndex = useMemo(() => {
    const map = new Map<number, LegacySection>();
    pageContent?.legacySectionEntries.forEach(({ index, section }) => {
      map.set(index, section);
    });
    return map;
  }, [pageContent]);

  const productsById = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((product) => {
      map.set(product.id, product);
    });
    return map;
  }, [products]);
  const referencedTestimonialRefs = useMemo(() => {
    const refs = new Set<string>();

    const collectRefs = (candidateSections: unknown) => {
      if (!Array.isArray(candidateSections)) {
        return;
      }

      candidateSections.forEach((section) => {
        if (!section || typeof section !== 'object') {
          return;
        }

        const typedSection = section as { type?: string; testimonials?: unknown };
        if (typedSection.type !== 'testimonials') {
          return;
        }

        const entries = Array.isArray(typedSection.testimonials) ? typedSection.testimonials : [];
        entries.forEach((entry) => {
          if (!entry || typeof entry !== 'object') {
            return;
          }

          const refCandidate =
            'testimonialRef' in entry && typeof entry.testimonialRef === 'string'
              ? entry.testimonialRef.trim()
              : '';

          if (refCandidate.length > 0) {
            refs.add(refCandidate);
          }
        });
      });
    };

    collectRefs(sections);
    collectRefs(homeSections);

    return Array.from(refs);
  }, [sections, homeSections]);

  useEffect(() => {
    let isMounted = true;

    if (referencedTestimonialRefs.length === 0) {
      setTestimonialLibrary({});
      return () => {
        isMounted = false;
      };
    }

    fetchTestimonialsByRefs(referencedTestimonialRefs)
      .then((library) => {
        if (!isMounted) {
          return;
        }
        setTestimonialLibrary(library);
      })
      .catch((error) => {
        console.warn('Failed to resolve home testimonial references', error);
        if (isMounted) {
          setTestimonialLibrary({});
        }
      });

    return () => {
      isMounted = false;
    };
  }, [referencedTestimonialRefs, contentVersion]);

  const renderSection = (section: HomeSection, index: number): React.ReactNode => {
    const sectionFieldPath = `${homeFieldPath}.sections[${index}]`;

    switch (section.type) {
      case 'hero': {
        const heroSection = section as Extract<HomeSection, { type: 'hero' }>;
        const heroContentFields = heroSection.content ?? null;
        const mapPos = (
          pos?: HeroSectionPosition | null,
        ): { x: HeroHorizontalAlignment; y: HeroVerticalAlignment } => {
          switch (pos) {
            case 'top-left':
              return { x: 'left', y: 'top' };
            case 'top-center':
              return { x: 'center', y: 'top' };
            case 'top-right':
              return { x: 'right', y: 'top' };
            case 'middle-left':
              return { x: 'left', y: 'middle' };
            case 'middle-center':
              return { x: 'center', y: 'middle' };
            case 'middle-right':
              return { x: 'right', y: 'middle' };
            case 'bottom-left':
              return { x: 'left', y: 'bottom' };
            case 'bottom-center':
              return { x: 'center', y: 'bottom' };
            case 'bottom-right':
              return { x: 'right', y: 'bottom' };
            default:
              return { x: heroAlignX, y: heroAlignY };
          }
        };

        const heroSectionPosition = heroContentFields?.position ?? heroSection.position;
        const { x: sectionAlignX, y: sectionAlignY } = mapPos(heroSectionPosition ?? null);
        const sectionOverlayCellClasses = getHeroGridCellClasses(sectionAlignX, sectionAlignY);
        const sectionMiddleNudge = heroLayoutHint === 'image-full' && sectionAlignY === 'middle' ? 'pb-24 md:pb-28' : '';
        const sectionTextAlignmentClass = HERO_HORIZONTAL_TEXT_ALIGNMENT_CLASSES[sectionAlignX];
        const sectionCtaAlignmentClass = HERO_CTA_ALIGNMENT_CLASSES[sectionAlignX];
        const headline = sanitizeString((heroContentFields?.headline ?? heroSection.headline) ?? null) ?? heroHeadline;
        const subheadline = sanitizeString((heroContentFields?.subheading ?? heroSection.subheadline) ?? null) ?? heroSubheadline;

        const primaryCtaSource = heroContentFields?.primaryCta ?? heroSection.ctaPrimary;
        const secondaryCtaSource = heroContentFields?.secondaryCta ?? heroSection.ctaSecondary;
        const sectionPrimaryCta = extractCmsCta(primaryCtaSource);
        const sectionSecondaryCta = extractCmsCta(secondaryCtaSource);
        const primaryCta = sectionPrimaryCta.label ?? heroPrimaryCta;
        const primaryCtaHref = sectionPrimaryCta.href ?? heroPrimaryCtaHref;
        const secondaryCta = sectionSecondaryCta.label ?? heroSecondaryCta;
        const secondaryCtaHref = sectionSecondaryCta.href ?? heroSecondaryCtaHref;
        const sectionPrimaryCtaIsObject = isCmsCtaObject(primaryCtaSource);
        const sectionSecondaryCtaIsObject = isCmsCtaObject(secondaryCtaSource);
        const sectionPrimaryCtaFieldBase = heroSection.content
          ? `${sectionFieldPath}.content.primaryCta`
          : `${sectionFieldPath}.ctaPrimary`;
        const sectionSecondaryCtaFieldBase = heroSection.content
          ? `${sectionFieldPath}.content.secondaryCta`
          : `${sectionFieldPath}.ctaSecondary`;
        const sectionPrimaryCtaLabelFieldPath = sectionPrimaryCtaIsObject
          ? `${sectionPrimaryCtaFieldBase}.label`
          : sectionPrimaryCtaFieldBase;
        const sectionSecondaryCtaLabelFieldPath = sectionSecondaryCtaIsObject
          ? `${sectionSecondaryCtaFieldBase}.label`
          : sectionSecondaryCtaFieldBase;
        const sectionPrimaryCtaHrefFieldPath = sectionPrimaryCtaIsObject
          ? `${sectionPrimaryCtaFieldBase}.href`
          : undefined;
        const sectionSecondaryCtaHrefFieldPath = sectionSecondaryCtaIsObject
          ? `${sectionSecondaryCtaFieldBase}.href`
          : undefined;

        const heroImageSource = heroContentFields?.image ?? heroSection.image ?? null;
        const heroImageOverride = sanitizeString(pickImage(heroImageSource));
        const inlineImageAlt = sanitizeString(
          (heroContentFields?.image?.alt ?? heroSection.imageAlt) ?? null,
        ) ?? headline;
        const inlineImageCandidate = (() => {
          if (heroLayoutHint === 'image-left') {
            return heroImageOverride ?? heroImageLeft ?? heroImageRight;
          }

          if (heroLayoutHint === 'image-right') {
            return heroImageOverride ?? heroImageRight ?? heroImageLeft;
          }

          return heroImageOverride ?? heroImageRight ?? heroImageLeft;
        })();
        const sectionShouldRenderInlineImage = Boolean(inlineImageCandidate && heroLayoutHint !== 'image-full');
        const sectionBackgroundImage = heroLayoutHint === 'image-full'
          ? inlineImageCandidate ?? heroImageOverride ?? heroImageRight ?? heroImageLeft ?? heroSrc
          : heroSrc ?? heroImageOverride ?? heroImageRight ?? heroImageLeft;
        const overlayColor = heroSection.overlay === false ? 'rgba(0,0,0,0)' : heroOverlay;
        const sectionOverlayStyle: React.CSSProperties = sectionShouldRenderInlineImage && heroTextPlacement === 'overlay'
          ? { background: 'linear-gradient(90deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.7) 100%)' }
          : { background: overlayColor };
        const sectionPrefersLightText = !sectionShouldRenderInlineImage && heroTextPlacement === 'overlay';
        const sectionTextColorClass = sectionPrefersLightText ? 'text-white' : 'text-stone-900';
        const buttonMotionClasses =
          'transform-gpu transition-transform duration-200 hover:-translate-y-0.5 focus-visible:-translate-y-0.5 motion-reduce:transform-none motion-reduce:hover:transform-none motion-reduce:focus-visible:transform-none';
        const sectionPrimaryButtonClasses = sectionPrefersLightText
          ? `px-8 py-3 bg-white text-stone-900 font-semibold rounded-md hover:bg-white/90 transition-colors ${buttonMotionClasses}`
          : `px-8 py-3 bg-stone-900 text-white font-semibold rounded-md hover:bg-stone-700 transition-colors ${buttonMotionClasses}`;
        const sectionSecondaryButtonClasses = sectionPrefersLightText
          ? `px-8 py-3 border border-white/50 text-white font-semibold rounded-md hover:bg-white/10 transition-colors ${buttonMotionClasses}`
          : `px-8 py-3 bg-white/70 backdrop-blur-sm text-stone-900 font-semibold rounded-md hover:bg-white transition-colors ${buttonMotionClasses}`;
        const sectionGridClasses = sectionShouldRenderInlineImage
          ? 'grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'
          : heroTextPlacement === 'overlay'
            ? `flex flex-col ${HERO_HORIZONTAL_ALIGNMENT_CONTAINER_CLASSES[sectionAlignX]}`
            : 'flex flex-col items-center text-center';
        const sectionTextWrapperBaseClasses = sectionShouldRenderInlineImage
          ? `${heroLayoutHint === 'image-left' ? 'order-1 lg:order-2' : 'order-1'} space-y-6 max-w-xl`
          : 'space-y-6 max-w-3xl mx-auto';
        const sectionTextWrapperClasses = `${sectionTextWrapperBaseClasses} ${sectionTextAlignmentClass}`;
        const sectionImageWrapperClasses = sectionShouldRenderInlineImage
          ? `${heroLayoutHint === 'image-left' ? 'order-2 lg:order-1' : 'order-2'} w-full`
          : '';
        const heroHeadlineFieldPath = heroSection.content
          ? `${sectionFieldPath}.content.headline`
          : `${sectionFieldPath}.headline`;
        const heroSubheadlineFieldPath = heroSection.content
          ? `${sectionFieldPath}.content.subheading`
          : `${sectionFieldPath}.subheadline`;
        const heroImageFieldBase = heroSection.content
          ? `${sectionFieldPath}.content.image`
          : `${sectionFieldPath}.image`;
        const heroImageFieldPathForSection = heroSection.content
          ? `${heroImageFieldBase}.src`
          : heroImageFieldBase;

        const heroRevealProps = {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.2 },
          transition: { duration: 0.6, delay: 0.1 },
        } as const;
        const sectionInlineImageNode = sectionShouldRenderInlineImage && inlineImageCandidate
          ? prefersReducedMotion
            ? (
              <div
                className={sectionImageWrapperClasses}
                {...getVisualEditorAttributes(heroImageFieldPathForSection)}
              >
                <img
                  src={inlineImageCandidate}
                  alt={inlineImageAlt}
                  className="w-full max-h-[540px] rounded-lg shadow-lg object-cover"
                />
              </div>
            )
            : (
              <motion.div
                {...heroRevealProps}
                className={sectionImageWrapperClasses}
                {...getVisualEditorAttributes(heroImageFieldPathForSection)}
              >
                <img
                  src={inlineImageCandidate}
                  alt={inlineImageAlt}
                  className="w-full max-h-[540px] rounded-lg shadow-lg object-cover"
                />
              </motion.div>
            )
          : null;
        const sectionContainerMarginClass = heroTextPlacement === 'overlay' ? 'mx-0' : 'mx-auto';
        const sectionTextContent = (
          <div className={`container ${sectionContainerMarginClass} px-4 sm:px-6 lg:px-8 ${sectionGridClasses}`}>
            <div className={sectionTextWrapperClasses}>
              <h1
                className="text-4xl md:text-6xl font-semibold tracking-tight"
                {...getVisualEditorAttributes(heroHeadlineFieldPath)}
              >
                {headline}
              </h1>
              {subheadline && (
                <div {...getVisualEditorAttributes(heroSubheadlineFieldPath)}>
                  <ReactMarkdown components={heroMarkdownComponents}>
                    {subheadline}
                  </ReactMarkdown>
                </div>
              )}
              <div className={`mt-8 flex flex-col sm:flex-row ${sectionCtaAlignmentClass} gap-4`}>
                {primaryCta && (
                  isInternalNavigationHref(primaryCtaHref) ? (
                    <Link
                      to={buildLocalizedPath(normalizeInternalHref(primaryCtaHref), language)}
                      className={sectionPrimaryButtonClasses}
                      {...getVisualEditorAttributes(sectionPrimaryCtaHrefFieldPath)}
                    >
                      <span {...getVisualEditorAttributes(sectionPrimaryCtaLabelFieldPath)}>{primaryCta}</span>
                    </Link>
                  ) : (
                    <a
                      href={primaryCtaHref}
                      className={sectionPrimaryButtonClasses}
                      {...getVisualEditorAttributes(sectionPrimaryCtaHrefFieldPath)}
                      target={isExternalHttpUrl(primaryCtaHref) ? '_blank' : undefined}
                      rel={isExternalHttpUrl(primaryCtaHref) ? 'noreferrer' : undefined}
                    >
                      <span {...getVisualEditorAttributes(sectionPrimaryCtaLabelFieldPath)}>{primaryCta}</span>
                    </a>
                  )
                )}
                {secondaryCta && (
                  isInternalNavigationHref(secondaryCtaHref) ? (
                    <Link
                      to={buildLocalizedPath(normalizeInternalHref(secondaryCtaHref), language)}
                      className={sectionSecondaryButtonClasses}
                      {...getVisualEditorAttributes(sectionSecondaryCtaHrefFieldPath)}
                    >
                      <span {...getVisualEditorAttributes(sectionSecondaryCtaLabelFieldPath)}>{secondaryCta}</span>
                    </Link>
                  ) : (
                    <a
                      href={secondaryCtaHref}
                      className={sectionSecondaryButtonClasses}
                      {...getVisualEditorAttributes(sectionSecondaryCtaHrefFieldPath)}
                      target={isExternalHttpUrl(secondaryCtaHref) ? '_blank' : undefined}
                      rel={isExternalHttpUrl(secondaryCtaHref) ? 'noreferrer' : undefined}
                    >
                      <span {...getVisualEditorAttributes(sectionSecondaryCtaLabelFieldPath)}>{secondaryCta}</span>
                    </a>
                  )
                )}
              </div>
            </div>
            {sectionInlineImageNode}
          </div>
        );
        const sectionTextMotion = prefersReducedMotion
          ? (
            <div className={`w-full ${sectionTextColorClass}`}>
              {sectionTextContent}
            </div>
          )
          : (
            <motion.div
              {...heroRevealProps}
              className={`w-full ${sectionTextColorClass}`}
            >
              {sectionTextContent}
            </motion.div>
          );

        const heroKey = createKeyFromParts('section-hero', [
          headline,
          subheadline,
          sectionBackgroundImage ?? undefined,
          heroTextPlacement,
          heroSectionPosition ?? undefined,
        ]);

        return (
          <React.Fragment key={heroKey}>
            {sectionBackgroundImage ? (
              <div
                className="relative h-screen bg-cover bg-center"
                style={{ backgroundImage: `url('${sectionBackgroundImage}')` }}
                {...getVisualEditorAttributes(sectionFieldPath)}
              >
                <div className="absolute inset-0" style={sectionOverlayStyle}></div>
                {heroTextPlacement === 'overlay' && (
                  <div className={`relative h-full ${HERO_GRID_CONTAINER_CLASSES} ${sectionMiddleNudge}`}>
                    <div className={sectionOverlayCellClasses}>{sectionTextMotion}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative h-screen bg-stone-900" {...getVisualEditorAttributes(sectionFieldPath)}>
                {heroTextPlacement === 'overlay' && (
                  <div className={`relative h-full ${HERO_GRID_CONTAINER_CLASSES} ${sectionMiddleNudge}`}>
                    <div className={sectionOverlayCellClasses}>{sectionTextMotion}</div>
                  </div>
                )}
              </div>
            )}
            {heroTextPlacement === 'below' && sectionTextMotion}
          </React.Fragment>
        );
      }
      case 'featureGrid': {
        const sectionTitle = sanitizeString(section.title ?? null);
        const items = (section.items ?? [])
          .map((item) => {
            const icon = sanitizeString(item.icon ?? null);
            const iconUrl = icon ? getCloudinaryUrl(icon) ?? icon : undefined;

            return {
              label: sanitizeString(item.label ?? null),
              description: sanitizeString(item.description ?? null),
              icon: iconUrl,
            };
          })
          .filter((item) => item.label || item.description || item.icon);
        const columnClassMap: Record<number, string> = {
          2: 'lg:grid-cols-2',
          3: 'lg:grid-cols-3',
          4: 'lg:grid-cols-4',
        };
        const normalizedColumns = Math.min(Math.max(section.columns ?? 4, 2), 4);
        const columnsClass = columnClassMap[normalizedColumns] ?? 'lg:grid-cols-4';

        if (!sectionTitle && items.length === 0) {
          return null;
        }

        const featureGridKey = createKeyFromParts('section-feature-grid', [
          sectionTitle,
          columnsClass,
          items.map((item) => item.label ?? item.description ?? item.icon ?? '').join('|'),
        ]);

        return (
          <section
            key={featureGridKey}
            className="py-16 sm:py-24 bg-white"
            {...getVisualEditorAttributes(sectionFieldPath)}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              {sectionTitle && (
                <h2 className="text-3xl sm:text-4xl font-semibold text-center">
                  <span {...getVisualEditorAttributes(`${sectionFieldPath}.title`)}>{sectionTitle}</span>
                </h2>
              )}
              {items.length > 0 && (
                <div className={`mt-10 grid grid-cols-1 sm:grid-cols-2 ${columnsClass} gap-8`}>
                  {items.map((item, itemIndex) => (
                    <div
                      key={createKeyFromParts('feature-grid-item', [item.label, item.icon, item.description])}
                      className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm flex flex-col gap-3"
                      {...getVisualEditorAttributes(`${sectionFieldPath}.items.${itemIndex}`)}
                    >
                      {item.icon && (
                        <img
                          src={item.icon}
                          alt={item.label ?? sectionTitle ?? computedTitle}
                          className="h-12 w-12 object-contain"
                          {...getVisualEditorAttributes(`${sectionFieldPath}.items.${itemIndex}.icon`)}
                        />
                      )}
                      {item.label && (
                        <h3
                          className="text-lg font-semibold text-stone-900"
                          {...getVisualEditorAttributes(`${sectionFieldPath}.items.${itemIndex}.label`)}
                        >
                          {item.label}
                        </h3>
                      )}
                      {item.description && (
                        <p
                          className="text-sm text-stone-600"
                          {...getVisualEditorAttributes(`${sectionFieldPath}.items.${itemIndex}.description`)}
                        >
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      }
      case 'productGrid': {
        const sectionTitle = sanitizeString(section.title ?? null);
        const productIds = (section.products ?? [])
          .map((item) => sanitizeString(item?.id ?? null))
          .filter((id): id is string => Boolean(id));
        const resolvedProducts = productIds
          .map((id) => productsById.get(id))
          .filter((product): product is Product => Boolean(product));

        if (!sectionTitle && resolvedProducts.length === 0) {
          return null;
        }

        const productGridKey = createKeyFromParts('section-product-grid', [
          sectionTitle,
          productIds.join('|'),
        ]);

        return (
          <section
            key={productGridKey}
            className="py-16 sm:py-24 bg-stone-100"
            {...getVisualEditorAttributes(sectionFieldPath)}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              {sectionTitle && (
                prefersReducedMotion ? (
                  <h2 className="text-3xl sm:text-4xl font-semibold text-center mb-12">
                    <span {...getVisualEditorAttributes(`${sectionFieldPath}.title`)}>{sectionTitle}</span>
                  </h2>
                ) : (
                  <motion.h2
                    className="text-3xl sm:text-4xl font-semibold text-center mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  >
                    <span {...getVisualEditorAttributes(`${sectionFieldPath}.title`)}>{sectionTitle}</span>
                  </motion.h2>
                )
              )}
              {resolvedProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {resolvedProducts.map((product, index) => {
                    const productIndex = products.findIndex((item) => item.id === product.id);
                    const productFieldPath = productIndex >= 0 ? `products.items.${productIndex}` : undefined;
                    const productCard = (
                      <ProductCard
                        product={product}
                        fieldPath={productFieldPath}
                      />
                    );
                    if (prefersReducedMotion) {
                      return (
                        <div key={product.id} className="h-full">
                          {productCard}
                        </div>
                      );
                    }

                    return (
                      <motion.div
                        key={product.id}
                        className="h-full"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.6, delay: 0.1 + index * 0.05 }}
                      >
                        {productCard}
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <p
                  className="text-center"
                  {...getVisualEditorAttributes(`translations.${language}.common.loadingProducts`)}
                >
                  {t('common.loadingProducts')}
                </p>
              )}
            </div>
          </section>
        );
      }
      case 'mediaCopy': {
        const mediaContent = section.content ?? null;
        const title = sanitizeString((mediaContent?.heading ?? section.title) ?? null);
        const body = sanitizeString((mediaContent?.body ?? section.body) ?? null);
        const mediaImage = sanitizeString(pickImage(mediaContent?.image ?? section.image));
        const imageAlt =
          sanitizeString((mediaContent?.image?.alt ?? section.imageAlt ?? title) ?? null)
          ?? computedTitle;
        if (!title && !body && !mediaImage) {
          return null;
        }

        const layout =
          section.layout === 'image-left' || section.layout === 'image-right' || section.layout === 'overlay'
            ? section.layout
            : 'image-right';
        const requestedColumns =
          typeof section.columns === 'number' && Number.isFinite(section.columns)
            ? Math.max(1, Math.min(Math.round(section.columns), 2))
            : undefined;
        const hasImage = Boolean(mediaImage);
        const effectiveColumns = requestedColumns ?? (hasImage ? 2 : 1);
        const mediaTitleFieldPath = mediaContent
          ? `${sectionFieldPath}.content.heading`
          : `${sectionFieldPath}.title`;
        const mediaBodyFieldPath = mediaContent
          ? `${sectionFieldPath}.content.body`
          : `${sectionFieldPath}.body`;
        const mediaImageFieldBase = mediaContent
          ? `${sectionFieldPath}.content.image`
          : `${sectionFieldPath}.image`;
        const mediaImageFieldPath = mediaContent
          ? `${mediaImageFieldBase}.src`
          : mediaImageFieldBase;

        if (layout === 'overlay' && hasImage) {
          const overlaySettings = normalizeOverlaySettings(section.overlay);
          const overlayCardWidthClass = overlayCardWidthClassMap[overlaySettings.cardWidth];
          const mediaCopyKey = createKeyFromParts('section-media-copy', [
            title,
            body,
            mediaImage,
            layout,
            `${overlaySettings.columnStart}-${overlaySettings.columnEnd}`,
            `${overlaySettings.rowStart}-${overlaySettings.rowEnd}`,
            overlaySettings.textAlign,
            overlaySettings.verticalAlign,
            overlaySettings.theme,
            overlaySettings.background,
          ]);

          const overlayPlacementStyle: React.CSSProperties = {
            gridColumn: `${overlaySettings.columnStart} / ${overlaySettings.columnEnd}`,
            gridRow: `${overlaySettings.rowStart} / ${overlaySettings.rowEnd}`,
            justifySelf:
              overlaySettings.textAlign === 'center'
                ? 'center'
                : overlaySettings.textAlign === 'right'
                  ? 'end'
                  : 'start',
            alignSelf:
              overlaySettings.verticalAlign === 'center'
                ? 'center'
                : overlaySettings.verticalAlign === 'end'
                  ? 'end'
                  : 'start',
          };

          const overlayTextAlignClass =
            overlaySettings.textAlign === 'center'
              ? 'text-center'
              : overlaySettings.textAlign === 'right'
                ? 'text-right'
                : 'text-left';
          const overlayThemeClass = overlaySettings.theme === 'dark' ? 'text-stone-900' : 'text-white';
          const overlayBackgroundClass = overlayBackgroundClassMap[overlaySettings.background];

          return (
            <section
              key={mediaCopyKey}
              className="py-12 sm:py-16 bg-white"
              {...getVisualEditorAttributes(sectionFieldPath)}
            >
              <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="relative overflow-hidden rounded-3xl shadow-xl lg:min-h-[520px]">
                  <img
                    src={mediaImage}
                    alt={imageAlt}
                    className="h-full w-full object-cover"
                    {...getVisualEditorAttributes(mediaImageFieldPath)}
                  />
                  <div
                    className="pointer-events-none absolute inset-0 grid"
                    style={{
                      gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
                      gridTemplateRows: 'repeat(6, minmax(0, 1fr))',
                    }}
                  >
                    <div
                      className={`pointer-events-auto flex flex-col gap-4 p-6 sm:p-8 lg:p-10 rounded-3xl shadow-xl ${overlayBackgroundClass} ${overlayThemeClass} ${overlayTextAlignClass} ${overlayCardWidthClass}`}
                      style={overlayPlacementStyle}
                    >
                      {title && (
                        <h2
                          className="text-3xl sm:text-4xl font-semibold"
                          {...getVisualEditorAttributes(mediaTitleFieldPath)}
                        >
                          {title}
                        </h2>
                      )}
                      {body && (
                        <div
                          className="text-lg leading-relaxed lg:text-xl"
                          {...getVisualEditorAttributes(mediaBodyFieldPath)}
                        >
                          <ReactMarkdown>{body}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        if (!hasImage || effectiveColumns === 1) {
          const mediaCopyKey = createKeyFromParts('section-media-copy', [title, body, mediaImage, layout]);
          const singleColumnAlignment = (() => {
            if (layout === 'image-left') {
              return { container: 'items-start text-left', text: 'text-left' };
            }

            if (layout === 'image-right') {
              return { container: 'items-end text-right', text: 'text-right' };
            }

            return { container: 'items-center text-center', text: 'text-center' };
          })();

          return (
            <section
              key={mediaCopyKey}
              className={layout === 'overlay' ? 'py-12 sm:py-16 bg-white' : 'py-16 sm:py-24 bg-white'}
              {...getVisualEditorAttributes(sectionFieldPath)}
            >
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className={`mx-auto flex max-w-3xl flex-col gap-6 ${singleColumnAlignment.container}`}>
                  {title && (
                    <h2
                      className={`text-3xl sm:text-4xl font-semibold ${singleColumnAlignment.text}`}
                      {...getVisualEditorAttributes(mediaTitleFieldPath)}
                    >
                      {title}
                    </h2>
                  )}
                  {body && (
                    <div
                      className={`${singleColumnAlignment.text} text-lg text-stone-600 space-y-4`}
                      {...getVisualEditorAttributes(mediaBodyFieldPath)}
                    >
                      <ReactMarkdown>{body}</ReactMarkdown>
                    </div>
                  )}
                  {hasImage && (
                    <div className="w-full" {...getVisualEditorAttributes(mediaImageFieldPath)}>
                      <img
                        src={mediaImage}
                        alt={imageAlt}
                        className="w-full rounded-lg object-cover shadow-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        }

        const gridClasses = layout === 'overlay'
          ? 'grid grid-cols-1 lg:grid-cols-2 gap-10 items-center'
          : 'grid grid-cols-1 lg:grid-cols-2 gap-10 items-center';
        const textColumnClasses = layout === 'image-left' ? 'order-2 lg:order-1 space-y-6' : 'order-1 space-y-6';
        const imageColumnClasses = layout === 'image-left' ? 'order-1 lg:order-2' : 'order-2';
        const mediaCopyKey = createKeyFromParts('section-media-copy', [title, body, mediaImage, layout]);

        return (
          <section
            key={mediaCopyKey}
            className={layout === 'overlay' ? 'py-12 sm:py-16 bg-white' : 'py-16 sm:py-24 bg-white'}
            {...getVisualEditorAttributes(sectionFieldPath)}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className={gridClasses}>
                <div className={textColumnClasses}>
                  {title && (
                    <h2
                      className="text-3xl sm:text-4xl font-semibold"
                      {...getVisualEditorAttributes(mediaTitleFieldPath)}
                    >
                      {title}
                    </h2>
                  )}
                  {body && (
                    <div
                      className="text-lg text-stone-600 space-y-4"
                      {...getVisualEditorAttributes(mediaBodyFieldPath)}
                    >
                      <ReactMarkdown>{body}</ReactMarkdown>
                    </div>
                  )}
                </div>
                {hasImage && (
                  <div className={imageColumnClasses}>
                    <img
                      src={mediaImage}
                      alt={imageAlt}
                      className="w-full h-full object-cover rounded-lg shadow-sm"
                      {...getVisualEditorAttributes(mediaImageFieldPath)}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      }
      case 'communityCarousel': {
        const sectionTitle = sanitizeString(section.title ?? null);
        const slides = (section.slides ?? []).map((slide, slideIndex) => {
          const basePath = `${sectionFieldPath}.slides[${slideIndex}]`;
          const image = sanitizeString(pickImage(slide.image));
          const alt = sanitizeString(slide.alt ?? null);
          const quote = sanitizeString(slide.quote ?? null);
          const name = sanitizeString(slide.name ?? null);
          const role = sanitizeString(slide.role ?? null);
          const imageFieldPath = `${basePath}.image`;

          return {
            image,
            alt,
            quote,
            name,
            role,
            fieldPath: basePath,
            imageFieldPath,
            altFieldPath: `${basePath}.alt`,
            quoteFieldPath: `${basePath}.quote`,
            nameFieldPath: `${basePath}.name`,
            roleFieldPath: `${basePath}.role`,
          };
        });

        const slideDuration =
          typeof section.slideDuration === 'number' && Number.isFinite(section.slideDuration)
            ? section.slideDuration
            : undefined;

        const quoteDuration =
          typeof section.quoteDuration === 'number' && Number.isFinite(section.quoteDuration)
            ? section.quoteDuration
            : undefined;

        if (!sectionTitle && slides.length === 0) {
          return null;
        }

        const carouselKey = createKeyFromParts('section-community-carousel', [
          sectionTitle,
          slides.map((slide) => slide.fieldPath ?? slide.image ?? slide.quote ?? '').join('|'),
        ]);

        return (
          <CommunityCarousel
            key={carouselKey}
            title={sectionTitle}
            slides={slides}
            fieldPath={sectionFieldPath}
            slidesFieldPath={`${sectionFieldPath}.slides`}
            slideDuration={slideDuration}
            quoteDuration={quoteDuration}
          />
        );
      }
      default:
        return null;
    }
  };

  const renderLegacySection = (section: LegacySection, index: number) => {
    const sectionFieldPath = `${homeSectionsFieldPath}.${index}`;

    switch (section.type) {
      case 'timeline':
        return (
          <TimelineSection
            key={createKeyFromParts('legacy-timeline', [section.title, section.entries.map((entry) => `${entry.year}-${entry.title}`).join('|')])}
            title={section.title}
            entries={section.entries as TimelineEntry[]}
            fieldPath={sectionFieldPath}
          />
        );
      case 'imageTextHalf':
        return (
          <ImageTextHalf
            key={createKeyFromParts('legacy-imageTextHalf', [section.title, section.text, section.image])}
            image={section.image}
            title={section.title}
            text={section.text}
            imageAlt={(section as { imageAlt?: string }).imageAlt}
            fieldPath={sectionFieldPath}
          />
        );
      case 'imageGrid':
        return (
          <ImageGrid
            key={createKeyFromParts('legacy-imageGrid', [section.items.map((item) => item.image ?? item.title ?? item.subtitle ?? '').join('|')])}
            items={section.items as ImageGridItem[]}
            fieldPath={sectionFieldPath}
          />
        );
      default:
        return null;
    }
  };

  const renderStructuredSection = (section: StructuredSection, index: number) => {
    const sectionFieldPath = `${homeSectionsFieldPath}.${index}`;

    switch (section.type) {
      case 'communityCarousel': {
        const sectionTitle = sanitizeString(section.title ?? null);
        const slides = (section.slides ?? []).map((slide, slideIndex) => {
          const basePath = `${sectionFieldPath}.slides.${slideIndex}`;
          const image = sanitizeString(pickImage(slide.image));
          const alt = sanitizeString(slide.alt ?? null);
          const quote = sanitizeString(slide.quote ?? null);
          const name = sanitizeString(slide.name ?? null);
          const role = sanitizeString(slide.role ?? null);
          const focalCandidate = (slide as { imageFocal?: { x?: unknown; y?: unknown } | null }).imageFocal ?? null;
          const imageFocal = focalCandidate && typeof focalCandidate === 'object'
            ? {
                x: typeof focalCandidate.x === 'number' ? focalCandidate.x : undefined,
                y: typeof focalCandidate.y === 'number' ? focalCandidate.y : undefined,
              }
            : undefined;
          const imageFieldPath = `${basePath}.image`;

          return {
            image,
            alt,
            quote,
            name,
            role,
            imageFocal,
            fieldPath: basePath,
            imageFieldPath,
            altFieldPath: `${basePath}.alt`,
            quoteFieldPath: `${basePath}.quote`,
            nameFieldPath: `${basePath}.name`,
            roleFieldPath: `${basePath}.role`,
          };
        });

        const slideDuration =
          typeof section.slideDuration === 'number' && Number.isFinite(section.slideDuration)
            ? section.slideDuration
            : undefined;

        const quoteDuration =
          typeof section.quoteDuration === 'number' && Number.isFinite(section.quoteDuration)
            ? section.quoteDuration
            : undefined;

        if (!sectionTitle && slides.length === 0) {
          return null;
        }

        const structuredCarouselKey = createKeyFromParts('structured-community-carousel', [
          sectionTitle,
          slides.map((slide) => slide.fieldPath ?? slide.image ?? slide.quote ?? '').join('|'),
        ]);

        return (
          <CommunityCarousel
            key={structuredCarouselKey}
            title={sectionTitle}
            slides={slides}
            fieldPath={sectionFieldPath}
            slidesFieldPath={`${sectionFieldPath}.slides`}
            slideDuration={slideDuration}
            quoteDuration={quoteDuration}
          />
        );
      }
      case 'newsletterSignup': {
        const title = sanitizeString(section.title ?? null) ?? undefined;
        const subtitle = sanitizeString(section.subtitle ?? null) ?? undefined;
        const placeholder = sanitizeString(section.placeholder ?? null) ?? undefined;
        const ctaLabel = sanitizeString(section.ctaLabel ?? null) ?? undefined;
        const confirmation = sanitizeString(section.confirmation ?? null) ?? undefined;
        const background = section.background === 'beige' || section.background === 'dark' ? section.background : 'light';
        const alignment = section.alignment === 'left' ? 'left' : 'center';
        const hasCopy = Boolean(title || subtitle || placeholder || ctaLabel || confirmation);
        const structuredNewsletterKey = createKeyFromParts('structured-newsletter', [
          title,
          subtitle,
          placeholder,
          ctaLabel,
          confirmation,
          background,
          alignment,
        ]);

        if (!hasCopy) {
          return (
            <NewsletterSignup
              key={structuredNewsletterKey}
              background={background}
              alignment={alignment}
              fieldPath={sectionFieldPath}
            />
          );
        }

        return (
          <NewsletterSignup
            key={structuredNewsletterKey}
            title={title}
            subtitle={subtitle}
            placeholder={placeholder}
            ctaLabel={ctaLabel}
            confirmation={confirmation}
            background={background}
            alignment={alignment}
            fieldPath={sectionFieldPath}
          />
        );
      }
      case 'pillars': {
        const sectionTitle = sanitizeString(section.title ?? null);
        const items = (section.items ?? [])
          .map((item) => {
            const icon = sanitizeString(item.icon ?? null);
            const iconUrl = icon ? getCloudinaryUrl(icon) ?? icon : undefined;

            return {
              label: sanitizeString(item.label ?? null),
              description: sanitizeString(item.description ?? null),
              icon: iconUrl,
            };
          })
          .filter((item) => item.label || item.description || item.icon);

        if (!sectionTitle && items.length === 0) {
          return null;
        }

        const pillarsKey = createKeyFromParts('structured-pillars', [
          sectionTitle,
          items.map((item) => item.label ?? item.description ?? item.icon ?? '').join('|'),
        ]);

        return (
          <section
            key={pillarsKey}
            className="py-16 sm:py-24 bg-white"
            {...getVisualEditorAttributes(sectionFieldPath)}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              {sectionTitle && (
                <h2 className="text-3xl sm:text-4xl font-semibold text-center">
                  <span {...getVisualEditorAttributes(`${sectionFieldPath}.title`)}>{sectionTitle}</span>
                </h2>
              )}
              {items.length > 0 && (
                <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {items.map((item, itemIndex) => (
                    <div
                      key={createKeyFromParts('pillar-item', [item.label, item.icon, item.description])}
                      className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm flex flex-col gap-3"
                      {...getVisualEditorAttributes(`${sectionFieldPath}.items.${itemIndex}`)}
                    >
                      {item.icon && (
                        <img
                          src={item.icon}
                          alt={item.label ?? sectionTitle ?? computedTitle}
                          className="h-12 w-12 object-contain"
                          {...getVisualEditorAttributes(`${sectionFieldPath}.items.${itemIndex}.icon`)}
                        />
                      )}
                      {item.label && (
                        <h3
                          className="text-lg font-semibold text-stone-900"
                          {...getVisualEditorAttributes(`${sectionFieldPath}.items.${itemIndex}.label`)}
                        >
                          {item.label}
                        </h3>
                      )}
                      {item.description && (
                        <p
                          className="text-sm text-stone-600"
                          {...getVisualEditorAttributes(`${sectionFieldPath}.items.${itemIndex}.description`)}
                        >
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      }
      case 'mediaCopy': {
        const title = sanitizeString(section.title ?? null);
        const body = sanitizeString(section.body ?? null);
        const mediaImage = sanitizeString(pickImage(section.image));
        const imageAlt = sanitizeString(section.imageAlt ?? null) ?? title ?? computedTitle;
        const mediaTitleFieldPath = `${sectionFieldPath}.title`;
        const mediaBodyFieldPath = `${sectionFieldPath}.body`;
        const mediaImageFieldPath = `${sectionFieldPath}.image`;
        if (!title && !body && !mediaImage) {
          return null;
        }

        const layout =
          section.layout === 'image-left' || section.layout === 'image-right' || section.layout === 'overlay'
            ? section.layout
            : 'image-right';
        const requestedColumns =
          typeof section.columns === 'number' && Number.isFinite(section.columns)
            ? Math.max(1, Math.min(Math.round(section.columns), 2))
            : undefined;
        const hasImage = Boolean(mediaImage);
        const effectiveColumns = requestedColumns ?? (hasImage ? 2 : 1);

        if (layout === 'overlay' && hasImage) {
          const overlaySettings = normalizeOverlaySettings(section.overlay);
          const overlayCardWidthClass = overlayCardWidthClassMap[overlaySettings.cardWidth];
          const structuredMediaCopyKey = createKeyFromParts('structured-media-copy', [
            title,
            body,
            mediaImage,
            layout,
            `${overlaySettings.columnStart}-${overlaySettings.columnEnd}`,
            `${overlaySettings.rowStart}-${overlaySettings.rowEnd}`,
            overlaySettings.textAlign,
            overlaySettings.verticalAlign,
            overlaySettings.theme,
            overlaySettings.background,
          ]);

          const overlayPlacementStyle: React.CSSProperties = {
            gridColumn: `${overlaySettings.columnStart} / ${overlaySettings.columnEnd}`,
            gridRow: `${overlaySettings.rowStart} / ${overlaySettings.rowEnd}`,
            justifySelf:
              overlaySettings.textAlign === 'center'
                ? 'center'
                : overlaySettings.textAlign === 'right'
                  ? 'end'
                  : 'start',
            alignSelf:
              overlaySettings.verticalAlign === 'center'
                ? 'center'
                : overlaySettings.verticalAlign === 'end'
                  ? 'end'
                  : 'start',
          };

          const overlayTextAlignClass =
            overlaySettings.textAlign === 'center'
              ? 'text-center'
              : overlaySettings.textAlign === 'right'
                ? 'text-right'
                : 'text-left';
          const overlayThemeClass = overlaySettings.theme === 'dark' ? 'text-stone-900' : 'text-white';
          const overlayBackgroundClass = overlayBackgroundClassMap[overlaySettings.background];

          return (
            <section
              key={structuredMediaCopyKey}
              className="py-12 sm:py-16 bg-white"
              {...getVisualEditorAttributes(sectionFieldPath)}
            >
              <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="relative overflow-hidden rounded-3xl shadow-xl lg:min-h-[520px]">
                  <img
                    src={mediaImage}
                    alt={imageAlt}
                    className="h-full w-full object-cover"
                    {...getVisualEditorAttributes(mediaImageFieldPath)}
                  />
                  <div
                    className="pointer-events-none absolute inset-0 grid"
                    style={{
                      gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
                      gridTemplateRows: 'repeat(6, minmax(0, 1fr))',
                    }}
                  >
                    <div
                      className={`pointer-events-auto flex flex-col gap-4 p-6 sm:p-8 lg:p-10 rounded-3xl shadow-xl ${overlayBackgroundClass} ${overlayThemeClass} ${overlayTextAlignClass} ${overlayCardWidthClass}`}
                      style={overlayPlacementStyle}
                    >
                      {title && (
                        <h2
                          className="text-3xl sm:text-4xl font-semibold"
                          {...getVisualEditorAttributes(mediaTitleFieldPath)}
                        >
                          {title}
                        </h2>
                      )}
                      {body && (
                        <div
                          className="text-lg leading-relaxed lg:text-xl"
                          {...getVisualEditorAttributes(mediaBodyFieldPath)}
                        >
                          <ReactMarkdown>{body}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        if (!hasImage || effectiveColumns === 1) {
          const structuredMediaCopyKey = createKeyFromParts('structured-media-copy', [
            title,
            body,
            mediaImage,
            layout,
          ]);

          const singleColumnAlignment = (() => {
            if (layout === 'image-left') {
              return { container: 'items-start text-left', text: 'text-left' };
            }

            if (layout === 'image-right') {
              return { container: 'items-end text-right', text: 'text-right' };
            }

            return { container: 'items-center text-center', text: 'text-center' };
          })();

          return (
            <section
              key={structuredMediaCopyKey}
              className={layout === 'overlay' ? 'py-12 sm:py-16 bg-white' : 'py-16 sm:py-24 bg-white'}
              {...getVisualEditorAttributes(sectionFieldPath)}
            >
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className={`mx-auto flex max-w-3xl flex-col gap-6 ${singleColumnAlignment.container}`}>
                  {title && (
                    <h2
                      className={`text-3xl sm:text-4xl font-semibold ${singleColumnAlignment.text}`}
                      {...getVisualEditorAttributes(mediaTitleFieldPath)}
                    >
                      {title}
                    </h2>
                  )}
                  {body && (
                    <div
                      className={`${singleColumnAlignment.text} text-lg text-stone-600 space-y-4`}
                      {...getVisualEditorAttributes(mediaBodyFieldPath)}
                    >
                      <ReactMarkdown>{body}</ReactMarkdown>
                    </div>
                  )}
                  {hasImage && (
                    <div className="w-full" {...getVisualEditorAttributes(mediaImageFieldPath)}>
                      <img
                        src={mediaImage}
                        alt={imageAlt}
                        className="w-full rounded-lg object-cover shadow-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        }

        const isImageLeft = layout === 'image-left';
        const textColumnClasses = `space-y-6 ${isImageLeft ? 'order-2 lg:order-2' : 'order-2 lg:order-1'}`;
        const imageColumnClasses = isImageLeft ? 'order-1 lg:order-1' : 'order-1 lg:order-2';
        const structuredMediaCopyKey = createKeyFromParts('structured-media-copy', [
          title,
          body,
          mediaImage,
          layout,
        ]);

        return (
          <section
            key={structuredMediaCopyKey}
            className={layout === 'overlay' ? 'py-12 sm:py-16 bg-white' : 'py-16 sm:py-24 bg-white'}
            {...getVisualEditorAttributes(sectionFieldPath)}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className={textColumnClasses}>
                  {title && (
                    <h2
                      className="text-3xl font-semibold text-stone-900"
                      {...getVisualEditorAttributes(mediaTitleFieldPath)}
                    >
                      {title}
                    </h2>
                  )}
                  {body && (
                    <div
                      className="prose prose-stone max-w-none text-stone-700"
                      {...getVisualEditorAttributes(mediaBodyFieldPath)}
                    >
                      <ReactMarkdown>{body}</ReactMarkdown>
                    </div>
                  )}
                </div>
                <div className={imageColumnClasses}>
                  {mediaImage ? (
                    <img
                      src={mediaImage}
                      alt={imageAlt}
                      className="w-full h-full object-cover rounded-lg shadow-sm"
                      {...getVisualEditorAttributes(mediaImageFieldPath)}
                    />
                  ) : (
                    <div
                      className="w-full aspect-[4/3] rounded-lg border border-dashed border-stone-300 bg-stone-100 flex items-center justify-center text-sm text-stone-400"
                      {...getVisualEditorAttributes(mediaImageFieldPath)}
                    >
                      Image coming soon
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        );
      }
      case 'testimonials': {
        const testimonialSection = section as Extract<HomeSection, { type: 'testimonials' }>;
        const sectionTitle = sanitizeString(testimonialSection.title ?? null);
        const testimonialsList = (testimonialSection.testimonials ?? [])
          .map<NormalizedTestimonial | null>((entry) => {
            const relationRef = sanitizeString(entry?.testimonialRef ?? null) ?? undefined;
            const resolved = relationRef ? testimonialLibrary[relationRef] : undefined;

            const text = sanitizeString(entry?.quote ?? resolved?.quote ?? null) ?? undefined;
            if (!text) {
              return null;
            }

            const author = sanitizeString(entry?.author ?? resolved?.name ?? null) ?? undefined;
            const role = sanitizeString(entry?.role ?? resolved?.title ?? null) ?? undefined;
            const avatarCandidate = sanitizeString(entry?.avatar ?? resolved?.avatar ?? null) ?? undefined;
            const avatar = avatarCandidate ? getCloudinaryUrl(avatarCandidate) ?? avatarCandidate : undefined;

            return {
              text,
              author,
              role,
              avatar,
              relationRef,
            };
          })
          .filter((entry): entry is NormalizedTestimonial => Boolean(entry));

        const legacyQuotes = (testimonialSection.quotes ?? [])
          .map<NormalizedTestimonial | null>((quote) => {
            const text = sanitizeString(quote.text ?? null) ?? undefined;
            if (!text) {
              return null;
            }

            return {
              text,
              author: sanitizeString(quote.author ?? null) ?? undefined,
              role: sanitizeString(quote.role ?? null) ?? undefined,
            };
          })
          .filter((quote): quote is NormalizedTestimonial => Boolean(quote));

        const quotes = testimonialsList.length > 0 ? testimonialsList : legacyQuotes;

        if (quotes.length === 0) {
          return null;
        }

        const testimonialsFieldBase = testimonialsList.length > 0
          ? `${sectionFieldPath}.testimonials`
          : `${sectionFieldPath}.quotes`;

        const testimonialsKeyParts: Array<string | null | undefined> = [
          sectionTitle,
          quotes.map((quote) => quote.text).join('|'),
        ];
        const testimonialsKey = createKeyFromParts('structured-testimonials', testimonialsKeyParts);

        return (
          <section
            key={testimonialsKey}
            className="py-16 sm:py-24 bg-stone-100"
            {...getVisualEditorAttributes(sectionFieldPath)}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid gap-8 md:grid-cols-2">
                {quotes.map((quote, quoteIndex) => {
                  const quoteKeyParts: Array<string | null | undefined> = [
                    quote.text,
                    quote.author,
                    quote.role,
                    'avatar' in quote ? quote.avatar : undefined,
                    'relationRef' in quote ? quote.relationRef : undefined,
                  ];
                  const quoteKey = createKeyFromParts('testimonial', quoteKeyParts);
                  const quoteFieldPath = `${testimonialsFieldBase}.${quoteIndex}`;

                  return (
                    <blockquote
                      key={quoteKey}
                      className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm h-full flex flex-col"
                      {...getVisualEditorAttributes(quoteFieldPath)}
                    >
                      <p className="text-stone-700 leading-relaxed flex-1">
                        <span className="text-3xl leading-none text-stone-300" aria-hidden="true">“</span>
                        <span className="ml-2 align-middle">{quote.text}</span>
                      </p>
                      <footer className="mt-4 text-sm text-stone-500 flex items-center gap-3">
                        {'avatar' in quote && quote.avatar ? (
                          <img
                            src={quote.avatar}
                            alt={quote.author ?? t('home.testimonialAvatarAlt')}
                            className="h-10 w-10 rounded-full object-cover"
                            {...getVisualEditorAttributes(`${quoteFieldPath}.avatar`)}
                          />
                        ) : null}
                        <span className="flex-1">
                          {quote.author && (
                            <span
                              className="block font-semibold text-stone-700"
                              {...getVisualEditorAttributes(`${quoteFieldPath}.author`)}
                            >
                              {quote.author}
                            </span>
                          )}
                          {quote.role && (
                            <span
                              className="block"
                              {...getVisualEditorAttributes(`${quoteFieldPath}.role`)}
                            >
                              {quote.role}
                            </span>
                          )}
                        </span>
                      </footer>
                    </blockquote>
                  );
                })}
              </div>
            </div>
          </section>
        );
      }
      case 'faq': {
        const sectionTitle = sanitizeString(section.title ?? null);
        const items = (section.items ?? [])
          .map((item) => ({
            question: sanitizeString(item.q ?? null),
            answer: sanitizeString(item.a ?? null),
          }))
          .filter((item) => Boolean(item.question && item.answer));

        if (items.length === 0) {
          return null;
        }

        const listWrapperClasses = sectionTitle ? 'mt-12 space-y-6' : 'space-y-6';
        const faqSectionKey = createKeyFromParts('section-faq', [
          sectionTitle,
          items.map((item) => item.question ?? '').join('|'),
        ]);

        return (
          <section
            key={faqSectionKey}
            className="py-16 sm:py-24 bg-white"
            {...getVisualEditorAttributes(sectionFieldPath)}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
              {sectionTitle && (
                <h2
                  className="text-3xl sm:text-4xl font-semibold text-center"
                  {...getVisualEditorAttributes(`${sectionFieldPath}.title`)}
                >
                  {sectionTitle}
                </h2>
              )}
              <div className={listWrapperClasses} {...getVisualEditorAttributes(`${sectionFieldPath}.items`)}>
              {items.map((item, itemIndex) => (
                <div
                    key={createKeyFromParts('faq-item', [item.question, item.answer])}
                    className="bg-stone-50 border border-stone-200 rounded-2xl p-6"
                    {...getVisualEditorAttributes(`${sectionFieldPath}.items.${itemIndex}`)}
                  >
                    <h3
                      className="text-xl font-semibold text-stone-900"
                      {...getVisualEditorAttributes(`${sectionFieldPath}.items.${itemIndex}.q`)}
                    >
                      {item.question}
                    </h3>
                    <p
                      className="mt-3 text-stone-600 leading-relaxed"
                      {...getVisualEditorAttributes(`${sectionFieldPath}.items.${itemIndex}.a`)}
                    >
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      }
      
      case 'banner': {
        const text = sanitizeString(section.text ?? null);
        const cta = sanitizeString(section.cta ?? null);
        const url = sanitizeString(section.url ?? null);

        if (!text) {
          return null;
        }

        const isInternalLink = Boolean(url && (url.startsWith('#/') || url.startsWith('/')));
        const internalPath = url?.startsWith('#/') ? url.slice(1) : url;
        const buttonClasses =
          'inline-flex items-center px-6 py-3 bg-white text-stone-900 font-semibold rounded-md hover:bg-white/90 transition-colors';
        const bannerKey = createKeyFromParts('section-banner', [text, cta, url]);

        return (
          <section
            key={bannerKey}
            className="py-12 sm:py-16 bg-stone-900 text-white"
            {...getVisualEditorAttributes(sectionFieldPath)}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
              <p className="text-xl sm:text-2xl font-semibold" {...getVisualEditorAttributes(`${sectionFieldPath}.text`)}>
                {text}
              </p>
              {cta && url && (
                <div className="mt-6">
                  {isInternalLink ? (
                    <Link
                      to={buildLocalizedPath(
                        internalPath?.startsWith('/') ? internalPath : `/${internalPath ?? ''}`,
                        language,
                      )}
                      className={buttonClasses}
                      {...getVisualEditorAttributes(`${sectionFieldPath}.url`)}
                    >
                      <span {...getVisualEditorAttributes(`${sectionFieldPath}.cta`)}>{cta}</span>
                    </Link>
                  ) : (
                    <a
                      href={url}
                      className={buttonClasses}
                      target="_blank"
                      rel="noreferrer"
                      {...getVisualEditorAttributes(`${sectionFieldPath}.url`)}
                    >
                      <span {...getVisualEditorAttributes(`${sectionFieldPath}.cta`)}>{cta}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </section>
        );
      }
      case 'video': {
        const title = sanitizeString(section.title ?? null);
        const videoUrl = sanitizeString(section.url ?? null);

        if (!videoUrl) {
          return null;
        }

        const videoKey = createKeyFromParts('section-video', [title, videoUrl]);

        return (
          <section
            key={videoKey}
            className="py-16 sm:py-24 bg-white"
            {...getVisualEditorAttributes(sectionFieldPath)}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
              {title && (
                <h2
                  className="text-3xl sm:text-4xl font-semibold text-center mb-8"
                  {...getVisualEditorAttributes(`${sectionFieldPath}.title`)}
                >
                  {title}
                </h2>
              )}
              <div
                className="relative w-full overflow-hidden rounded-2xl shadow-lg aspect-video"
                {...getVisualEditorAttributes(`${sectionFieldPath}.url`)}
              >
                <iframe
                  src={videoUrl}
                  title={title ?? 'Featured video'}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-presentation"
                  allowFullScreen
                />
              </div>
            </div>
          </section>
        );
      }
      case 'mediaShowcase': {
        const showcaseTitle = sanitizeString(section.title ?? null);
        const normalizedItems = (section.items ?? [])
          .map((item) => ({
            eyebrow: sanitizeString(item.eyebrow ?? null) ?? undefined,
            title: sanitizeString(item.title ?? null) ?? undefined,
            body: sanitizeString(item.body ?? null) ?? undefined,
            image: sanitizeString(pickImage(item.image)) ?? undefined,
            imageAlt: sanitizeString(item.imageAlt ?? null) ?? undefined,
            ctaLabel: sanitizeString(item.ctaLabel ?? null) ?? undefined,
            ctaHref: sanitizeString(item.ctaHref ?? null) ?? undefined,
          }))
          .filter((item) => item.image || item.title || item.body || item.ctaHref || item.ctaLabel);

        if (!showcaseTitle && normalizedItems.length === 0) {
          return null;
        }

        const mediaShowcaseSection = {
          ...section,
          type: 'mediaShowcase' as const,
        } as MediaShowcaseSectionContent;

        return (
          <MediaShowcase
            key={createKeyFromParts('section-media-showcase', [showcaseTitle, normalizedItems.map((item) => item.title ?? item.image ?? '').join('|')])}
            section={mediaShowcaseSection}
            fieldPath={sectionFieldPath}
          />
        );
      }
      default:
        return null;
    }
  };

  const shouldRenderLocalSections = pageContent?.shouldRenderLocalSections ?? false;

  const renderedSections = homeSections
    .map((_, index) => {
      const structured = structuredSectionsByIndex.get(index);
      if (structured) {
        return renderStructuredSection(structured, index);
      }

      const legacy = legacySectionsByIndex.get(index);
      if (legacy) {
        return renderLegacySection(legacy, index);
      }

      return null;
    })
    .filter(Boolean) as React.ReactNode[];

  const renderedLocalSections = sections
    .map((section, index) => renderSection(section, index))
    .filter(Boolean) as React.ReactNode[];

  const socialImage = heroBackgroundImage
    ?? heroInlineImage
    ?? heroImageLeft
    ?? heroImageRight
    ?? siteSettings.home?.heroImage
    ?? undefined;

  const seoImage = socialImage
    ? isAbsoluteUrl(socialImage)
      ? socialImage
      : getCloudinaryUrl(socialImage) ?? socialImage
    : undefined;

  const brandName = useMemo(() => {
    const brandValue = siteSettings.brand?.name;

    if (!brandValue) {
      return 'Kapunka Skincare';
    }

    if (typeof brandValue === 'string') {
      const trimmed = brandValue.trim();
      return trimmed.length > 0 ? trimmed : 'Kapunka Skincare';
    }

    const localized = brandValue[language];
    if (typeof localized === 'string') {
      const trimmedLocalized = localized.trim();
      if (trimmedLocalized.length > 0) {
        return trimmedLocalized;
      }
    }

    const fallbackOrder: Language[] = ['en', 'pt', 'es'];
    for (const locale of fallbackOrder) {
      const candidate = brandValue[locale];
      if (typeof candidate === 'string') {
        const trimmedCandidate = candidate.trim();
        if (trimmedCandidate.length > 0) {
          return trimmedCandidate;
        }
      }
    }

    const firstAvailable = Object.values(brandValue).find(
      (entry): entry is string => typeof entry === 'string' && entry.trim().length > 0,
    );

    return firstAvailable?.trim() ?? 'Kapunka Skincare';
  }, [language, siteSettings.brand?.name]);

  const siteUrl = useMemo(() => {
    const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim();
    if (raw.length > 0) {
      return raw.replace(/\/+$/, '');
    }

    if (typeof window !== 'undefined') {
      return window.location.origin;
    }

    return undefined;
  }, []);

  const organizationJsonLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: brandName,
    ...(siteUrl ? { url: siteUrl } : {}),
    ...(seoImage ? { logo: seoImage } : {}),
  }), [brandName, seoImage, siteUrl]);

  return (
    <div>
      <Seo
        title={computedTitle}
        description={computedDescription}
        image={seoImage}
        locale={language}
        siteName={brandName}
        jsonLd={organizationJsonLd}
      />
      {shouldRenderLocalSections ? (
        renderedLocalSections
      ) : (
        <>
          {heroBackgroundImage ? (
            <div
              className="relative h-screen bg-cover bg-center"
              style={{ backgroundImage: `url('${heroBackgroundImage}')` }}
              {...getVisualEditorAttributes('site.home.heroImage')}
            >
              <div className="absolute inset-0" style={overlayStyle}></div>
              {heroTextPlacement === 'overlay' && (
                <div className={`relative h-full ${HERO_GRID_CONTAINER_CLASSES} ${heroMiddleNudge}`}>
                  <div className={heroOverlayCellClasses}>{heroTextMotion}</div>
                </div>
              )}
            </div>
          ) : (
            <div
              className="relative h-screen bg-stone-900"
              {...getVisualEditorAttributes('site.home.heroImage')}
            >
              {heroTextPlacement === 'overlay' && (
                <div className={`relative h-full ${HERO_GRID_CONTAINER_CLASSES} ${heroMiddleNudge}`}>
                  <div className={heroOverlayCellClasses}>{heroTextMotion}</div>
                </div>
              )}
            </div>
          )}
          {heroTextPlacement === 'below' && heroTextMotion}
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
          <ClinicsBlock
            data={clinicsBlockData}
            fieldPath={`${homeFieldPath}.clinicsBlock`}
            fallbackCtaHref="/for-clinics"
            fallbackCtaLabel={t('home.ctaClinics')}
          />
          {renderedSections.length > 0 && renderedSections}
          <GalleryRows
            rows={galleryRowsData}
            fieldPath={`${homeFieldPath}.galleryRows`}
            fallbackAlt={computedTitle}
          />
          <Bestsellers intro={bestsellersIntro} introFieldPath={`${homeFieldPath}.bestsellersIntro`} />
          <Reviews />
          <NewsletterSignup />
        </>
      )}
    </div>
  );
};

export default Home;
