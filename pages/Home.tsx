import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import type { Components as MarkdownComponents } from 'react-markdown';
import { Helmet } from 'react-helmet-async';
import { z } from 'zod';
import ProductCard from '../components/ProductCard';
import TimelineSection from '../components/TimelineSection';
import ImageTextHalf from '../components/sections/ImageTextHalf';
import ImageGrid from '../components/sections/ImageGrid';
import { useLanguage } from '../contexts/LanguageContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import type {
  Product,
  Review,
  TimelineEntry,
  ImageGridItem,
  ClinicsBlockContent,
  GalleryRowContent,
  PageSection,
  PageContent,
} from '../types';

type HomeSection =
  | {
      type: 'hero';
      headline?: string;
      subheadline?: string;
      ctaPrimary?: string;
      ctaSecondary?: string;
      image?: string;
      imageRef?: string;
      overlay?: boolean;
      position?:
        | 'top-left'
        | 'top-center'
        | 'top-right'
        | 'middle-left'
        | 'middle-center'
        | 'middle-right'
        | 'bottom-left'
        | 'bottom-center'
        | 'bottom-right';
    }
  | {
      type: 'featureGrid';
      title?: string;
      items?: { label: string; description?: string; icon?: string }[];
      columns?: number;
    }
  | {
      type: 'mediaCopy';
      title?: string;
      body?: string;
      image?: string;
      imageRef?: string;
      layout?: 'image-left' | 'image-right';
      columns?: number;
    };

const heroAlignmentSchema = z
  .object({
    heroAlignX: z.enum(['left', 'center', 'right']).optional(),
    heroAlignY: z.enum(['top', 'middle', 'bottom']).optional(),
    heroLayoutHint: z
      .enum(['image-left', 'image-right', 'image-full', 'text-over-media', 'side-by-side'])
      .optional(),
    heroOverlay: z.union([z.string(), z.number(), z.boolean()]).optional(),
  })
  .passthrough();

const heroImagesSchema = z
  .object({
    heroImageLeft: z.string().nullable().optional(),
    heroImageRight: z.string().nullable().optional(),
  })
  .passthrough();

const heroCtasSchema = z
  .object({
    ctaPrimary: z.string().nullable().optional(),
    ctaSecondary: z.string().nullable().optional(),
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
    imageRef: z.string().optional(),
    layout: z.enum(['image-left', 'image-right']).optional(),
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

const structuredSectionSchema = z.discriminatedUnion('type', [
  pillarsSectionSchema,
  mediaCopySectionSchema,
  testimonialsSectionSchema,
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
    heroImageLeftRef: z.string().nullable().optional(),
    heroImageRightRef: z.string().nullable().optional(),
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

type HomePageContent = PageContent & {
  heroImageLeftRef?: string | null;
  heroImageRightRef?: string | null;
  heroImageLeftUrl?: string | null;
  heroImageRightUrl?: string | null;
  heroAlignment?: HeroAlignmentGroup;
  heroImages?: HeroImagesGroup;
  heroCtas?: HeroCtasGroup;
  rawSections: SectionEntry[];
  structuredSectionEntries: StructuredSectionEntry[];
  legacySectionEntries: LegacySectionEntry[];
  localSections: HomeSection[];
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

const HERO_VERTICAL_ALIGNMENT_CLASSES: Record<HeroVerticalAlignment, string> = {
  top: 'justify-start',
  middle: 'justify-center',
  bottom: 'justify-end',
};

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
    case 'side-by-side':
      return 'image-right';
    case 'text-over-media':
      return 'image-full';
    default:
      return 'image-full';
  }
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

interface BestsellersProps {
    intro?: string;
    introFieldPath?: string;
}

const Bestsellers: React.FC<BestsellersProps> = ({ intro, introFieldPath }) => {
    const { t, language } = useLanguage();
    const [products, setProducts] = useState<Product[]>([]);
    const { settings } = useSiteSettings();

    useEffect(() => {
        fetch('/content/products/index.json')
            .then(res => res.json())
            .then(data => setProducts(data.items ?? []));
    }, []);

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
                    data-nlv-field-path={`translations.${language}.home.bestsellersTitle`}
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
                        data-nlv-field-path={introFieldPath}
                    >
                        {intro}
                    </motion.p>
                )}
                {featuredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {featuredProducts.map((product) => {
                            const productIndex = products.findIndex((item) => item.id === product.id);
                            const productFieldPath = productIndex >= 0 ? `products.items.${productIndex}` : undefined;
                            return <ProductCard key={product.id} product={product} fieldPath={productFieldPath} />;
                        })}
                    </div>
                ) : (
                    <p
                        className="text-center"
                        data-nlv-field-path={`translations.${language}.common.loadingBestsellers`}
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

    const { clinicsTitle, clinicsBody, clinicsCtaHref, clinicsCtaLabel, clinicsImage } = data;
    const hasPrimaryContent = Boolean(
        (clinicsTitle && clinicsTitle.trim().length > 0)
            || (clinicsBody && clinicsBody.trim().length > 0)
            || (clinicsCtaLabel && clinicsCtaLabel.trim().length > 0)
            || (clinicsImage && clinicsImage.trim().length > 0),
    );

    if (!hasPrimaryContent) {
        return null;
    }

    const hasImage = Boolean(clinicsImage && clinicsImage.trim().length > 0);
    const effectiveHref = clinicsCtaHref && clinicsCtaHref.trim().length > 0 ? clinicsCtaHref : fallbackCtaHref;
    const isInternalLink = effectiveHref.startsWith('#/') || effectiveHref.startsWith('/');
    const internalPath = effectiveHref.startsWith('#/') ? effectiveHref.slice(1) : effectiveHref;
    const ctaLabel = clinicsCtaLabel && clinicsCtaLabel.trim().length > 0 ? clinicsCtaLabel : fallbackCtaLabel;

    return (
        <div className="py-16 sm:py-24 bg-white" data-nlv-field-path={fieldPath}>
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
                                data-nlv-field-path={fieldPath ? `${fieldPath}.clinicsTitle` : undefined}
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
                                data-nlv-field-path={fieldPath ? `${fieldPath}.clinicsBody` : undefined}
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
                                        to={internalPath.startsWith('/') ? internalPath : `/${internalPath}`}
                                        className="inline-flex items-center px-6 py-3 bg-stone-900 text-white font-semibold rounded-md hover:bg-stone-700 transition-colors"
                                        data-nlv-field-path={fieldPath ? `${fieldPath}.clinicsCtaHref` : undefined}
                                    >
                                        <span data-nlv-field-path={fieldPath ? `${fieldPath}.clinicsCtaLabel` : undefined}>
                                            {ctaLabel}
                                        </span>
                                    </Link>
                                ) : (
                                    <a
                                        href={effectiveHref}
                                        className="inline-flex items-center px-6 py-3 bg-stone-900 text-white font-semibold rounded-md hover:bg-stone-700 transition-colors"
                                        target="_blank"
                                        rel="noreferrer"
                                        data-nlv-field-path={fieldPath ? `${fieldPath}.clinicsCtaHref` : undefined}
                                    >
                                        <span data-nlv-field-path={fieldPath ? `${fieldPath}.clinicsCtaLabel` : undefined}>
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
                                src={clinicsImage}
                                alt={clinicsTitle ?? 'Clinics highlight'}
                                className="w-full rounded-lg shadow-lg object-cover"
                                data-nlv-field-path={fieldPath ? `${fieldPath}.clinicsImage` : undefined}
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
}

const galleryLayoutMap: Record<NonNullable<GalleryRowContent['layout']>, string> = {
    half: 'lg:grid-cols-2',
    thirds: 'lg:grid-cols-3',
    quarters: 'grid-cols-2 lg:grid-cols-4',
};

const GalleryRows: React.FC<GalleryRowsProps> = ({ rows, fieldPath }) => {
    const sanitizedRows = rows
        ?.map((row) => {
            if (!row) {
                return undefined;
            }

            const items = (row.items ?? []).filter((item) => Boolean(item?.image?.trim()));

            if (items.length === 0) {
                return undefined;
            }

            return { ...row, items };
        })
        .filter((row): row is GalleryRowContent & { items: NonNullable<GalleryRowContent['items']> } => Boolean(row)) ?? [];

    if (sanitizedRows.length === 0) {
        return null;
    }

    return (
        <section className="py-12 md:py-16 bg-stone-50" data-nlv-field-path={fieldPath}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                {sanitizedRows.map((row, rowIndex) => {
                    const rowFieldPath = fieldPath ? `${fieldPath}[${rowIndex}]` : undefined;
                    const layoutClass = row.layout ? galleryLayoutMap[row.layout] ?? 'lg:grid-cols-3' : 'lg:grid-cols-3';
                    const items = row.items ?? [];
                    const baseGridClass = row.layout === 'quarters' ? '' : 'grid-cols-1';
                    const gridClasses = ['grid', baseGridClass, layoutClass, 'gap-6'].filter(Boolean).join(' ');

                    return (
                        <div
                            key={`gallery-row-${rowIndex}`}
                            className={gridClasses}
                            data-nlv-field-path={rowFieldPath}
                        >
                            {items.map((item, itemIndex) => {
                                if (!item) {
                                    return null;
                                }

                                const imageSrc = item.image?.trim();
                                const caption = item.caption?.trim();
                                const altText = item.alt?.trim() ?? caption ?? 'Gallery highlight';
                                const hasContent = Boolean(imageSrc);

                                if (!hasContent) {
                                    return null;
                                }

                                const itemFieldPath = rowFieldPath ? `${rowFieldPath}.items[${itemIndex}]` : undefined;

                                return (
                                    <motion.figure
                                        key={`gallery-item-${rowIndex}-${itemIndex}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: itemIndex * 0.05 }}
                                        className="space-y-2"
                                        data-nlv-field-path={itemFieldPath}
                                    >
                                        <img
                                            src={imageSrc}
                                            alt={altText}
                                            className="w-full aspect-[4/3] object-cover rounded-lg shadow-md"
                                            data-nlv-field-path={itemFieldPath ? `${itemFieldPath}.image` : undefined}
                                        />
                                        {caption && (
                                            <figcaption
                                                className="mt-2 text-sm text-stone-600"
                                                data-nlv-field-path={itemFieldPath ? `${itemFieldPath}.caption` : undefined}
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

    useEffect(() => {
        fetch('/content/reviews/index.json')
            .then(res => res.json())
            .then(data => setReviews(data.items.slice(0, 3)));
    }, []);

    return (
        <div className="py-16 sm:py-24 bg-stone-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-3xl sm:text-4xl font-semibold text-center mb-12"
                    data-nlv-field-path={`translations.${language}.home.reviewsTitle`}
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
                                data-nlv-field-path={`reviews.items.${index}`}
                            >
                                <p className="text-stone-700 italic">
                                    &ldquo;
                                    <span data-nlv-field-path={`reviews.items.${index}.text.${language}`}>
                                        {translate(review.text)}
                                    </span>
                                    &rdquo;
                                </p>
                                <p
                                    className="mt-6 font-semibold"
                                    data-nlv-field-path={`reviews.items.${index}.author.${language}`}
                                >
                                    {translate(review.author)}
                                </p>
                                <p
                                    className="text-sm text-stone-500"
                                    data-nlv-field-path={`reviews.items.${index}.role.${language}`}
                                >
                                    {translate(review.role)}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <p
                        className="text-center"
                        data-nlv-field-path={`translations.${language}.common.loadingReviews`}
                    >
                        {t('common.loadingReviews')}
                    </p>
                )}
            </div>
        </div>
    );
};

const NewsletterSignup: React.FC = () => {
    const { t, language } = useLanguage();
    const [email, setEmail] = React.useState('');
    const [submitted, setSubmitted] = React.useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Newsletter signup:', email);
        setSubmitted(true);
    };

    return (
        <div className="py-16 sm:py-24 bg-stone-200">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2
                        className="text-3xl sm:text-4xl font-semibold mb-4"
                        data-nlv-field-path={`translations.${language}.home.newsletterTitle`}
                    >
                        {t('home.newsletterTitle')}
                    </h2>
                    <p
                        className="text-stone-600 mb-8"
                        data-nlv-field-path={`translations.${language}.home.newsletterSubtitle`}
                    >
                        {t('home.newsletterSubtitle')}
                    </p>
                    {submitted ? (
                        <p
                            className="text-lg text-green-700"
                            data-nlv-field-path={`translations.${language}.home.newsletterThanks`}
                        >
                            {t('home.newsletterThanks')}
                        </p>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('home.newsletterPlaceholder')}
                                required
                                className="flex-grow px-4 py-3 rounded-md border-stone-300 focus:ring-stone-500 focus:border-stone-500 transition"
                                data-nlv-field-path={`translations.${language}.home.newsletterPlaceholder`}
                            />
                            <button
                                type="submit"
                                className="px-6 py-3 bg-stone-900 text-white font-semibold rounded-md hover:bg-stone-700 transition-colors"
                            >
                                <span data-nlv-field-path={`translations.${language}.home.newsletterSubmit`}>
                                    {t('home.newsletterSubmit')}
                                </span>
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
  const { settings } = useSiteSettings();
  const siteHeroImage = settings.home?.heroImage ?? '/content/uploads/hero-abstract.jpg';
  const [pageContent, setPageContent] = useState<HomePageContent | null>(null);

  useEffect(() => {
    let isMounted = true;
    setPageContent(null);

    const loadSections = async () => {
      const localesToTry = [language, 'en'].filter((locale, index, arr) => arr.indexOf(locale) === index);

      for (const locale of localesToTry) {
        try {
          const response = await fetch(`/content/pages/${locale}/home.json`);
          if (!response.ok) {
            continue;
          }

          const data = (await response.json()) as unknown;

          if (!isMounted) {
            return;
          }

          const parsedResult = homeContentSchema.safeParse(data);
          if (!parsedResult.success) {
            continue;
          }

          const {
            sections: rawSections = [],
            heroAlignment,
            heroImages,
            heroCtas,
            ...rest
          } = parsedResult.data;
          const sections: HomeSection[] = Array.isArray(parsedResult.data?.sections)
            ? (parsedResult.data.sections.filter((section): section is HomeSection =>
                section?.type === 'hero' || section?.type === 'mediaCopy'
              ))
            : [];

          const structuredSectionEntries = rawSections.reduce<StructuredSectionEntry[]>((acc, section, index) => {
            const parsedSection = structuredSectionSchema.safeParse(section);
            if (parsedSection.success) {
              acc.push({ index, section: parsedSection.data });
            }
            return acc;
          }, []);

          const legacySectionEntries = rawSections.reduce<LegacySectionEntry[]>((acc, section, index) => {
            const parsedSection = legacySectionSchema.safeParse(section);
            if (parsedSection.success) {
              acc.push({ index, section: parsedSection.data });
            }
            return acc;
          }, []);

          const heroImageLeftUrl = heroImages?.heroImageLeft
            || (rest as HomeContentData).heroImageLeftRef
            || (rest as HomeContentData).heroImageLeft
            || null;
          const heroImageRightUrl = heroImages?.heroImageRight
            || (rest as HomeContentData).heroImageRightRef
            || (rest as HomeContentData).heroImageRight
            || null;

          if (!heroImageLeftUrl && !heroImageRightUrl && !hasWarnedMissingHeroImages) {
            console.warn('Home hero images are not configured. Add hero image references or legacy URLs in the CMS.');
            hasWarnedMissingHeroImages = true;
          }

          const baseContent = rest as PageContent & HomeContentData;
          const pageData: HomePageContent = {
            ...baseContent,
            heroAlignment,
            heroImages,
            heroCtas,
            heroImageLeftRef: (rest as HomeContentData).heroImageLeftRef ?? undefined,
            heroImageRightRef: (rest as HomeContentData).heroImageRightRef ?? undefined,
            heroImageLeftUrl,
            heroImageRightUrl,
            rawSections,
            structuredSectionEntries,
            legacySectionEntries,
            localSections: sections,
            sections: legacySectionEntries.map((entry) => entry.section as PageSection),
          };

          setPageContent(pageData);
          return;
        } catch (error) {
          if (locale === localesToTry[localesToTry.length - 1]) {
            console.error('Failed to load home sections', error);
          }
        }
      }

      if (isMounted) {
        setPageContent(null);
      }
    };

    void loadSections();

    return () => {
      isMounted = false;
    };
  }, [language]);

  const sanitizeString = (value?: string | null): string | undefined =>
    value && value.trim().length > 0 ? value.trim() : undefined;

  const pickImage = (local?: string, ref?: string) => local || ref || null;

  const homeFieldPath = `pages.home_${language}`;
  const heroHeadline = sanitizeString(pageContent?.heroHeadline) ?? t('home.heroTitle');
  const heroSubheadline = sanitizeString(pageContent?.heroSubheadline) ?? t('home.heroSubtitle');
  const heroPrimaryCta = sanitizeString(
    pageContent?.heroCtas?.ctaPrimary
      ?? pageContent?.heroPrimaryCta
      ?? pageContent?.heroCtaPrimary
      ?? pageContent?.ctaPrimary,
  ) ?? t('home.ctaShop');
  const heroSecondaryCta = sanitizeString(
    pageContent?.heroCtas?.ctaSecondary
      ?? pageContent?.heroSecondaryCta
      ?? pageContent?.heroCtaSecondary
      ?? pageContent?.ctaSecondary,
  ) ?? t('home.ctaClinics');
  const heroOverlay = resolveHeroOverlay(
    pageContent?.heroAlignment?.heroOverlay ?? (pageContent?.heroOverlay as string | number | boolean | null | undefined),
  ) ?? 'rgba(0,0,0,0.48)';
  const heroLayoutHint = normalizeHeroLayoutHint(
    pageContent?.heroAlignment?.heroLayoutHint ?? pageContent?.heroLayoutHint,
  );
  const heroImageLeftUrl = pageContent?.heroImageLeftUrl
    ?? pageContent?.heroImages?.heroImageLeft
    ?? pageContent?.heroImageLeftRef
    ?? pageContent?.heroImageLeft
    ?? null;
  const heroImageRightUrl = pageContent?.heroImageRightUrl
    ?? pageContent?.heroImages?.heroImageRight
    ?? pageContent?.heroImageRightRef
    ?? pageContent?.heroImageRight
    ?? null;
  const heroImageLeft = sanitizeString(heroImageLeftUrl);
  const heroImageRight = sanitizeString(heroImageRightUrl);
  const heroTextPosition = pageContent?.heroTextPosition ?? undefined;
  const heroTextPositionTuple = heroTextPosition ? HERO_TEXT_POSITION_MAP[heroTextPosition] : undefined;
  const heroAlignX: HeroHorizontalAlignment = heroTextPositionTuple?.[0]
    ?? normalizeHorizontalAlignment(pageContent?.heroAlignment?.heroAlignX ?? pageContent?.heroAlignX)
    ?? 'center';
  const heroAlignY: HeroVerticalAlignment = heroTextPositionTuple?.[1]
    ?? normalizeVerticalAlignment(pageContent?.heroAlignment?.heroAlignY ?? pageContent?.heroAlignY)
    ?? 'middle';
  const heroAlignmentClasses = `${HERO_HORIZONTAL_ALIGNMENT_CONTAINER_CLASSES[heroAlignX]} ${HERO_VERTICAL_ALIGNMENT_CLASSES[heroAlignY]}`;
  const heroMiddleNudge = heroLayoutHint === 'image-full' && heroAlignY === 'middle' ? 'pb-24 md:pb-28' : '';
  const heroTextAlignmentClass = HERO_HORIZONTAL_TEXT_ALIGNMENT_CLASSES[heroAlignX];
  const heroCtaAlignmentClass = HERO_CTA_ALIGNMENT_CLASSES[heroAlignX];

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
    ? heroInlineImage ?? siteHeroImage
    : siteHeroImage;
  const overlayStyle: React.CSSProperties = shouldRenderInlineImage
    ? { background: 'linear-gradient(90deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.7) 100%)' }
    : { background: heroOverlay };
  const heroTextColorClass = shouldRenderInlineImage ? 'text-stone-900' : 'text-white';
  const heroPrimaryButtonClasses = shouldRenderInlineImage
    ? 'px-8 py-3 bg-stone-900 text-white font-semibold rounded-md hover:bg-stone-700 transition-colors'
    : 'px-8 py-3 bg-white text-stone-900 font-semibold rounded-md hover:bg-white/90 transition-colors';
  const heroSecondaryButtonClasses = shouldRenderInlineImage
    ? 'px-8 py-3 bg-white/70 backdrop-blur-sm text-stone-900 font-semibold rounded-md hover:bg-white transition-colors'
    : 'px-8 py-3 border border-white/50 text-white font-semibold rounded-md hover:bg-white/10 transition-colors';
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
    ? `${homeFieldPath}.heroCtas.ctaPrimary`
    : pageContent?.heroPrimaryCta
      ? `${homeFieldPath}.heroPrimaryCta`
      : pageContent?.heroCtaPrimary
        ? `${homeFieldPath}.heroCtaPrimary`
        : `${homeFieldPath}.ctaPrimary`;
  const heroSecondaryCtaFieldPath = pageContent?.heroCtas
    ? `${homeFieldPath}.heroCtas.ctaSecondary`
    : pageContent?.heroSecondaryCta
      ? `${homeFieldPath}.heroSecondaryCta`
      : pageContent?.heroCtaSecondary
        ? `${homeFieldPath}.heroCtaSecondary`
        : `${homeFieldPath}.ctaSecondary`;

  const sections = Array.isArray(pageContent?.localSections) ? pageContent.localSections : [];
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

  const renderSection = (section: HomeSection, index: number): React.ReactNode => {
    const sectionFieldPath = `${homeFieldPath}.sections[${index}]`;

    switch (section.type) {
      case 'hero': {
        const mapPos = (
          pos?: HomeSection['position'],
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

        const { x: sectionAlignX, y: sectionAlignY } = mapPos(section.position);
        const sectionAlignmentClasses = `${HERO_HORIZONTAL_ALIGNMENT_CONTAINER_CLASSES[sectionAlignX]} ${HERO_VERTICAL_ALIGNMENT_CLASSES[sectionAlignY]}`;
        const sectionMiddleNudge = heroLayoutHint === 'image-full' && sectionAlignY === 'middle' ? 'pb-24 md:pb-28' : '';
        const sectionTextAlignmentClass = HERO_HORIZONTAL_TEXT_ALIGNMENT_CLASSES[sectionAlignX];
        const sectionCtaAlignmentClass = HERO_CTA_ALIGNMENT_CLASSES[sectionAlignX];
        const headline = sanitizeString(section.headline ?? null) ?? heroHeadline;
        const subheadline = sanitizeString(section.subheadline ?? null) ?? heroSubheadline;
        const primaryCta = sanitizeString(section.ctaPrimary ?? null) ?? heroPrimaryCta;
        const secondaryCta = sanitizeString(section.ctaSecondary ?? null) ?? heroSecondaryCta;
        const heroImageOverride = sanitizeString(pickImage(section.image, section.imageRef));
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
          ? inlineImageCandidate ?? heroImageOverride ?? heroImageRight ?? heroImageLeft ?? siteHeroImage
          : siteHeroImage;
        const overlayColor = section.overlay === false ? 'rgba(0,0,0,0)' : heroOverlay;
        const sectionOverlayStyle: React.CSSProperties = sectionShouldRenderInlineImage
          ? { background: 'linear-gradient(90deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.7) 100%)' }
          : { background: overlayColor };
        const sectionTextColorClass = sectionShouldRenderInlineImage ? 'text-stone-900' : 'text-white';
        const sectionPrimaryButtonClasses = sectionShouldRenderInlineImage
          ? 'px-8 py-3 bg-stone-900 text-white font-semibold rounded-md hover:bg-stone-700 transition-colors'
          : 'px-8 py-3 bg-white text-stone-900 font-semibold rounded-md hover:bg-white/90 transition-colors';
        const sectionSecondaryButtonClasses = sectionShouldRenderInlineImage
          ? 'px-8 py-3 bg-white/70 backdrop-blur-sm text-stone-900 font-semibold rounded-md hover:bg-white transition-colors'
          : 'px-8 py-3 border border-white/50 text-white font-semibold rounded-md hover:bg-white/10 transition-colors';
        const sectionGridClasses = sectionShouldRenderInlineImage
          ? 'grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'
          : 'flex flex-col items-center text-center';
        const sectionTextWrapperBaseClasses = sectionShouldRenderInlineImage
          ? `${heroLayoutHint === 'image-left' ? 'order-1 lg:order-2' : 'order-1'} space-y-6 max-w-xl`
          : 'space-y-6 max-w-3xl mx-auto';
        const sectionTextWrapperClasses = `${sectionTextWrapperBaseClasses} ${sectionTextAlignmentClass}`;
        const sectionImageWrapperClasses = sectionShouldRenderInlineImage
          ? `${heroLayoutHint === 'image-left' ? 'order-2 lg:order-1' : 'order-2'} w-full`
          : '';
        const heroImageFieldKey = section.image ? 'image' : section.imageRef ? 'imageRef' : 'image';
        const heroImageFieldPathForSection = `${sectionFieldPath}.${heroImageFieldKey}`;

        return (
          <div
            key={`section-hero-${index}`}
            className="relative h-screen bg-cover bg-center"
            style={{ backgroundImage: `url('${sectionBackgroundImage}')` }}
            data-nlv-field-path={sectionFieldPath}
          >
            <div className="absolute inset-0" style={sectionOverlayStyle}></div>
            <div className={`relative h-full flex ${sectionAlignmentClasses} ${sectionMiddleNudge}`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`w-full ${sectionTextColorClass}`}
              >
                <div className={`container mx-auto px-4 sm:px-6 lg:px-8 ${sectionGridClasses}`}>
                  <div className={sectionTextWrapperClasses}>
                    <h1
                      className="text-4xl md:text-6xl font-semibold tracking-tight"
                      data-nlv-field-path={`${sectionFieldPath}.headline`}
                    >
                      {headline}
                    </h1>
                    {subheadline && (
                      <div data-nlv-field-path={`${sectionFieldPath}.subheadline`}>
                        <ReactMarkdown components={heroMarkdownComponents}>
                          {subheadline}
                        </ReactMarkdown>
                      </div>
                    )}
                    <div className={`mt-8 flex flex-col sm:flex-row ${sectionCtaAlignmentClass} gap-4`}>
                      <Link to="/shop" className={sectionPrimaryButtonClasses}>
                        <span data-nlv-field-path={`${sectionFieldPath}.ctaPrimary`}>
                          {primaryCta}
                        </span>
                      </Link>
                      <Link to="/for-clinics" className={sectionSecondaryButtonClasses}>
                        <span data-nlv-field-path={`${sectionFieldPath}.ctaSecondary`}>
                          {secondaryCta}
                        </span>
                      </Link>
                    </div>
                  </div>
                  {sectionShouldRenderInlineImage && inlineImageCandidate && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className={sectionImageWrapperClasses}
                    >
                      <img
                        src={inlineImageCandidate}
                        alt={headline}
                        className="w-full max-h-[540px] rounded-lg shadow-lg object-cover"
                        data-nlv-field-path={heroImageFieldPathForSection}
                      />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        );
      }
      case 'featureGrid': {
        const sectionTitle = sanitizeString(section.title ?? null);
        const items = (section.items ?? [])
          .map((item) => ({
            label: sanitizeString(item.label ?? null),
            description: sanitizeString(item.description ?? null),
            icon: sanitizeString(item.icon ?? null),
          }))
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

        return (
          <section
            key={`section-featureGrid-${index}`}
            className="py-16 sm:py-24 bg-white"
            data-nlv-field-path={sectionFieldPath}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              {sectionTitle && (
                <h2 className="text-3xl sm:text-4xl font-semibold text-center">
                  <span data-nlv-field-path={`${sectionFieldPath}.title`}>{sectionTitle}</span>
                </h2>
              )}
              {items.length > 0 && (
                <div className={`mt-10 grid grid-cols-1 sm:grid-cols-2 ${columnsClass} gap-8`}>
                  {items.map((item, itemIndex) => (
                    <div
                      key={`feature-grid-${index}-${itemIndex}`}
                      className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm flex flex-col gap-3"
                      data-nlv-field-path={`${sectionFieldPath}.items.${itemIndex}`}
                    >
                      {item.icon && (
                        <img
                          src={item.icon}
                          alt={item.label ?? 'Feature icon'}
                          className="h-12 w-12 object-contain"
                          data-nlv-field-path={`${sectionFieldPath}.items.${itemIndex}.icon`}
                        />
                      )}
                      {item.label && (
                        <h3
                          className="text-lg font-semibold text-stone-900"
                          data-nlv-field-path={`${sectionFieldPath}.items.${itemIndex}.label`}
                        >
                          {item.label}
                        </h3>
                      )}
                      {item.description && (
                        <p
                          className="text-sm text-stone-600"
                          data-nlv-field-path={`${sectionFieldPath}.items.${itemIndex}.description`}
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
        const mediaImage = sanitizeString(pickImage(section.image, section.imageRef));
        if (!title && !body && !mediaImage) {
          return null;
        }

        const layout = section.layout === 'image-left' ? 'image-left' : 'image-right';
        const columns = Math.min(Math.max(section.columns ?? 2, 1), 3);
        const gridColumnsClass = columns === 1 ? 'lg:grid-cols-1' : columns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2';
        const gridClasses = `grid grid-cols-1 ${gridColumnsClass} gap-10 items-center`;
        const textColumnClasses = layout === 'image-left' ? 'order-2 lg:order-1 space-y-6' : 'order-1 space-y-6';
        const imageColumnClasses = layout === 'image-left' ? 'order-1 lg:order-2' : 'order-2';
        const imageFieldKey = section.image ? 'image' : section.imageRef ? 'imageRef' : 'image';

        return (
          <section
            key={`section-mediaCopy-${index}`}
            className="py-16 sm:py-24 bg-white"
            data-nlv-field-path={sectionFieldPath}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className={gridClasses}>
                <div className={textColumnClasses}>
                  {title && (
                    <h2
                      className="text-3xl sm:text-4xl font-semibold"
                      data-nlv-field-path={`${sectionFieldPath}.title`}
                    >
                      {title}
                    </h2>
                  )}
                  {body && (
                    <div
                      className="text-lg text-stone-600 space-y-4"
                      data-nlv-field-path={`${sectionFieldPath}.body`}
                    >
                      <ReactMarkdown>{body}</ReactMarkdown>
                    </div>
                  )}
                </div>
                <div className={imageColumnClasses}>
                  {mediaImage ? (
                    <img
                      src={mediaImage}
                      alt={title ?? 'Media highlight'}
                      className="w-full h-full object-cover rounded-lg shadow-sm"
                      data-nlv-field-path={`${sectionFieldPath}.${imageFieldKey}`}
                    />
                  ) : (
                    <div
                      className="w-full aspect-[4/3] rounded-lg border border-dashed border-stone-300 bg-stone-100 flex items-center justify-center text-sm text-stone-400"
                      data-nlv-field-path={`${sectionFieldPath}.${imageFieldKey}`}
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
            key={`legacy-${index}-timeline`}
            title={section.title}
            entries={section.entries as TimelineEntry[]}
            fieldPath={sectionFieldPath}
          />
        );
      case 'imageTextHalf':
        return (
          <ImageTextHalf
            key={`legacy-${index}-imageTextHalf`}
            image={section.image}
            title={section.title}
            text={section.text}
            fieldPath={sectionFieldPath}
          />
        );
      case 'imageGrid':
        return (
          <ImageGrid
            key={`legacy-${index}-imageGrid`}
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
      case 'pillars': {
        const sectionTitle = sanitizeString(section.title ?? null);
        const items = (section.items ?? [])
          .map((item) => ({
            label: sanitizeString(item.label ?? null),
            description: sanitizeString(item.description ?? null),
            icon: sanitizeString(item.icon ?? null),
          }))
          .filter((item) => item.label || item.description || item.icon);

        if (!sectionTitle && items.length === 0) {
          return null;
        }

        return (
          <section
            key={`structured-${index}-pillars`}
            className="py-16 sm:py-24 bg-white"
            data-nlv-field-path={sectionFieldPath}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              {sectionTitle && (
                <h2 className="text-3xl sm:text-4xl font-semibold text-center">
                  <span data-nlv-field-path={`${sectionFieldPath}.title`}>{sectionTitle}</span>
                </h2>
              )}
              {items.length > 0 && (
                <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {items.map((item, itemIndex) => (
                    <div
                      key={`pillars-${index}-${itemIndex}`}
                      className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm flex flex-col gap-3"
                      data-nlv-field-path={`${sectionFieldPath}.items.${itemIndex}`}
                    >
                      {item.icon && (
                        <img
                          src={item.icon}
                          alt={item.label ?? 'Feature icon'}
                          className="h-12 w-12 object-contain"
                          data-nlv-field-path={`${sectionFieldPath}.items.${itemIndex}.icon`}
                        />
                      )}
                      {item.label && (
                        <h3
                          className="text-lg font-semibold text-stone-900"
                          data-nlv-field-path={`${sectionFieldPath}.items.${itemIndex}.label`}
                        >
                          {item.label}
                        </h3>
                      )}
                      {item.description && (
                        <p
                          className="text-sm text-stone-600"
                          data-nlv-field-path={`${sectionFieldPath}.items.${itemIndex}.description`}
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
        const image = sanitizeString(section.image ?? null);
        const imageRef = sanitizeString(section.imageRef ?? null);
        if (!title && !body && !image && !imageRef) {
          return null;
        }

        const isImageLeft = section.layout === 'image-left';
        const textColumnClasses = `space-y-6 ${isImageLeft ? 'order-2 lg:order-2' : 'order-2 lg:order-1'}`;
        const imageColumnClasses = isImageLeft ? 'order-1 lg:order-1' : 'order-1 lg:order-2';
        const mediaImage = image ?? imageRef;
        const imageFieldPath = image
          ? `${sectionFieldPath}.image`
          : imageRef
            ? `${sectionFieldPath}.imageRef`
            : `${sectionFieldPath}.image`;

        return (
          <section
            key={`structured-${index}-mediaCopy`}
            className="py-16 sm:py-24 bg-white"
            data-nlv-field-path={sectionFieldPath}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className={textColumnClasses}>
                  {title && (
                    <h2
                      className="text-3xl font-semibold text-stone-900"
                      data-nlv-field-path={`${sectionFieldPath}.title`}
                    >
                      {title}
                    </h2>
                  )}
                  {body && (
                    <div
                      className="prose prose-stone max-w-none text-stone-700"
                      data-nlv-field-path={`${sectionFieldPath}.body`}
                    >
                      <ReactMarkdown>{body}</ReactMarkdown>
                    </div>
                  )}
                </div>
                <div className={imageColumnClasses}>
                  {mediaImage ? (
                    <img
                      src={mediaImage}
                      alt={title ?? 'Media highlight'}
                      className="w-full h-full object-cover rounded-lg shadow-sm"
                      data-nlv-field-path={imageFieldPath}
                    />
                  ) : (
                    <div
                      className="w-full aspect-[4/3] rounded-lg border border-dashed border-stone-300 bg-stone-100 flex items-center justify-center text-sm text-stone-400"
                      data-nlv-field-path={imageFieldPath}
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
        const quotes = (section.quotes ?? [])
          .map((quote) => ({
            text: sanitizeString(quote.text ?? null),
            author: sanitizeString(quote.author ?? null),
            role: sanitizeString(quote.role ?? null),
          }))
          .filter((quote) => Boolean(quote.text));

        if (quotes.length === 0) {
          return null;
        }

        return (
          <section
            key={`structured-${index}-testimonials`}
            className="py-16 sm:py-24 bg-stone-100"
            data-nlv-field-path={sectionFieldPath}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid gap-8 md:grid-cols-2">
                {quotes.map((quote, quoteIndex) => (
                  <blockquote
                    key={`testimonials-${index}-${quoteIndex}`}
                    className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm h-full flex flex-col"
                    data-nlv-field-path={`${sectionFieldPath}.quotes.${quoteIndex}`}
                  >
                    <p className="text-stone-700 leading-relaxed flex-1">
                      <span className="text-3xl leading-none text-stone-300" aria-hidden="true">“</span>
                      <span className="ml-2 align-middle">{quote.text}</span>
                    </p>
                    <footer className="mt-4 text-sm text-stone-500">
                      {quote.author && (
                        <span
                          className="font-semibold text-stone-700"
                          data-nlv-field-path={`${sectionFieldPath}.quotes.${quoteIndex}.author`}
                        >
                          {quote.author}
                        </span>
                      )}
                      {quote.role && (
                        <span
                          className="block"
                          data-nlv-field-path={`${sectionFieldPath}.quotes.${quoteIndex}.role`}
                        >
                          {quote.role}
                        </span>
                      )}
                    </footer>
                  </blockquote>
                ))}
              </div>
            </div>
          </section>
        );
      }
      default:
        return null;
    }
  };

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
    .filter((section): section is React.ReactNode => Boolean(section));

  const renderedLocalSections = sections
    .map((section, index) => renderSection(section, index))
    .filter((sectionNode): sectionNode is React.ReactNode => Boolean(sectionNode));

  return (
    <div>
      <Helmet>
        <title>{computedTitle}</title>
        <meta name="description" content={computedDescription} />
      </Helmet>
      {renderedLocalSections.length > 0 ? (
        renderedLocalSections
      ) : (
        <>
          <div
            className="relative h-screen bg-cover bg-center"
            style={{ backgroundImage: `url('${heroBackgroundImage}')` }}
            data-nlv-field-path="site.home.heroImage"
          >
            <div className="absolute inset-0" style={overlayStyle}></div>
            <div className={`relative h-full flex ${heroAlignmentClasses} ${heroMiddleNudge}`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`w-full ${heroTextColorClass}`}
              >
                <div className={`container mx-auto px-4 sm:px-6 lg:px-8 ${heroGridClasses}`}>
                  <div className={heroTextWrapperClasses}>
                    <h1
                      className="text-4xl md:text-6xl font-semibold tracking-tight"
                      data-nlv-field-path={`${homeFieldPath}.heroHeadline`}
                    >
                      {heroHeadline}
                    </h1>
                    {heroSubheadline && (
                      <div data-nlv-field-path={`${homeFieldPath}.heroSubheadline`}>
                        <ReactMarkdown components={heroMarkdownComponents}>
                          {heroSubheadline}
                        </ReactMarkdown>
                      </div>
                    )}
                    <div className={`mt-8 flex flex-col sm:flex-row ${heroCtaAlignmentClass} gap-4`}>
                      <Link to="/shop" className={heroPrimaryButtonClasses}>
                        <span data-nlv-field-path={heroPrimaryCtaFieldPath}>
                          {heroPrimaryCta}
                        </span>
                      </Link>
                      <Link to="/for-clinics" className={heroSecondaryButtonClasses}>
                        <span data-nlv-field-path={heroSecondaryCtaFieldPath}>
                          {heroSecondaryCta}
                        </span>
                      </Link>
                    </div>
                  </div>
                  {shouldRenderInlineImage && heroInlineImage && (
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
                        data-nlv-field-path={heroImageFieldPath}
                      />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
          {(brandIntroTitle || brandIntroText) && (
            <div className="container mx-auto max-w-3xl px-4 py-16 md:py-24">
              {brandIntroTitle && (
                <h2
                  className="text-3xl sm:text-4xl font-semibold text-center"
                  data-nlv-field-path={`${homeFieldPath}.brandIntro.title`}
                >
                  {brandIntroTitle}
                </h2>
              )}
              {brandIntroText && (
                <p
                  className="mt-6 prose prose-stone max-w-none text-stone-700 text-center"
                  data-nlv-field-path={`${homeFieldPath}.brandIntro.text`}
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
          <GalleryRows rows={galleryRowsData} fieldPath={`${homeFieldPath}.galleryRows`} />
          <Bestsellers intro={bestsellersIntro} introFieldPath={`${homeFieldPath}.bestsellersIntro`} />
          <Reviews />
          <NewsletterSignup />
        </>
      )}
    </div>
  );
};

export default Home;