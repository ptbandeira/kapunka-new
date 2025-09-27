import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import type { Components as MarkdownComponents } from 'react-markdown';
import { Helmet } from 'react-helmet-async';
import ProductCard from '../components/ProductCard';
import SectionRenderer from '../components/SectionRenderer';
import { useLanguage } from '../contexts/LanguageContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import type {
  Product,
  Review,
  PageSection,
  TimelineEntry,
  TimelineSectionContent,
  ImageTextHalfSectionContent,
  ImageGridItem,
  ImageGridSectionContent,
  PageContent,
  ClinicsBlockContent,
  GalleryRowContent,
} from '../types';

const isTimelineEntry = (value: unknown): value is TimelineEntry => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const entry = value as Record<string, unknown>;

  return (
    typeof entry.year === 'string'
    && typeof entry.title === 'string'
    && typeof entry.description === 'string'
    && (entry.image === undefined || typeof entry.image === 'string')
  );
};

const isTimelineSection = (value: unknown): value is TimelineSectionContent => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const section = value as Record<string, unknown>;
  return section.type === 'timeline' && Array.isArray(section.entries) && section.entries.every(isTimelineEntry);
};

const isImageTextHalfSection = (value: unknown): value is ImageTextHalfSectionContent => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const section = value as Record<string, unknown>;

  return (
    section.type === 'imageTextHalf'
    && (section.image === undefined || typeof section.image === 'string')
    && (section.title === undefined || typeof section.title === 'string')
    && (section.text === undefined || typeof section.text === 'string')
  );
};

const isImageGridItem = (value: unknown): value is ImageGridItem => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    (item.image === undefined || typeof item.image === 'string')
    && (item.title === undefined || typeof item.title === 'string')
    && (item.subtitle === undefined || typeof item.subtitle === 'string')
  );
};

const isImageGridSection = (value: unknown): value is ImageGridSectionContent => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const section = value as Record<string, unknown>;

  return section.type === 'imageGrid' && Array.isArray(section.items) && section.items.every(isImageGridItem);
};

const isPageSection = (value: unknown): value is PageSection => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const section = value as Record<string, unknown>;

  if (section.type === 'timeline') {
    return isTimelineSection(section);
  }

  if (section.type === 'imageTextHalf') {
    return isImageTextHalfSection(section);
  }

  if (section.type === 'imageGrid') {
    return isImageGridSection(section);
  }

  return false;
};

const isPageContent = (value: unknown): value is PageContent => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const content = value as Record<string, unknown>;

  if (!Array.isArray(content.sections)) {
    return false;
  }

  return content.sections.every(isPageSection);
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

type HeroHorizontalAlignment = 'left' | 'center';
type HeroVerticalAlignment = 'top' | 'middle' | 'bottom';

const HERO_HORIZONTAL_ALIGNMENT_CONTAINER_CLASSES: Record<HeroHorizontalAlignment, string> = {
  left: 'items-start text-left',
  center: 'items-center text-center',
};

const HERO_HORIZONTAL_TEXT_ALIGNMENT_CLASSES: Record<HeroHorizontalAlignment, string> = {
  left: 'text-left',
  center: 'text-center',
};

const HERO_CTA_ALIGNMENT_CLASSES: Record<HeroHorizontalAlignment, string> = {
  left: 'sm:justify-start',
  center: 'sm:justify-center',
};

const HERO_VERTICAL_ALIGNMENT_CLASSES: Record<HeroVerticalAlignment, string> = {
  top: 'justify-start',
  middle: 'justify-center',
  bottom: 'justify-end',
};

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
  const [pageContent, setPageContent] = useState<PageContent | null>(null);

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

          if (isPageContent(data)) {
            setPageContent(data);
            return;
          }
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

  const homeFieldPath = `pages.home_${language}`;
  const heroHeadline = sanitizeString(pageContent?.heroHeadline) ?? t('home.heroTitle');
  const heroSubheadline = sanitizeString(pageContent?.heroSubheadline) ?? t('home.heroSubtitle');
  const heroPrimaryCta = sanitizeString(pageContent?.heroPrimaryCta) ?? t('home.ctaShop');
  const heroSecondaryCta = sanitizeString(pageContent?.heroSecondaryCta) ?? t('home.ctaClinics');
  const heroOverlay = sanitizeString(pageContent?.heroOverlay) ?? 'rgba(0,0,0,0.48)';
  const heroLayoutHint = pageContent?.heroLayoutHint ?? 'image-full';
  const heroImageLeft = sanitizeString(pageContent?.heroImageLeft);
  const heroImageRight = sanitizeString(pageContent?.heroImageRight);
  const heroAlignX: HeroHorizontalAlignment = pageContent?.heroAlignX === 'center' ? 'center' : 'left';
  const heroAlignY: HeroVerticalAlignment =
    pageContent?.heroAlignY === 'top'
      ? 'top'
      : pageContent?.heroAlignY === 'middle'
        ? 'middle'
        : 'bottom';
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
  const heroImageFieldPath = heroLayoutHint === 'image-left'
    ? `${homeFieldPath}.heroImageLeft`
    : heroLayoutHint === 'image-right'
      ? `${homeFieldPath}.heroImageRight`
      : heroInlineImage === heroImageRight
        ? `${homeFieldPath}.heroImageRight`
        : heroInlineImage === heroImageLeft
          ? `${homeFieldPath}.heroImageLeft`
          : undefined;
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

  const homeSections = pageContent?.sections ?? [];
  const homeSectionsFieldPath = `${homeFieldPath}.sections`;
  const computedTitle = pageContent?.metaTitle ?? `Kapunka Skincare | ${t('home.metaTitle')}`;
  const computedDescription = pageContent?.metaDescription ?? t('home.metaDescription');
  const clinicsBlockData = pageContent?.clinicsBlock;
  const galleryRowsData = pageContent?.galleryRows;
  const bestsellersIntro = sanitizeString(pageContent?.bestsellersIntro);
  const brandIntroTitle = sanitizeString(pageContent?.brandIntro?.title);
  const brandIntroText = sanitizeString(pageContent?.brandIntro?.text);

  return (
    <div>
        <Helmet>
            <title>{computedTitle}</title>
            <meta name="description" content={computedDescription} />
        </Helmet>
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
                    <span data-nlv-field-path={`${homeFieldPath}.heroPrimaryCta`}>
                      {heroPrimaryCta}
                    </span>
                  </Link>
                  <Link to="/for-clinics" className={heroSecondaryButtonClasses}>
                    <span data-nlv-field-path={`${homeFieldPath}.heroSecondaryCta`}>
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
      {homeSections.length > 0 && (
        <SectionRenderer sections={homeSections} fieldPath={homeSectionsFieldPath} />
      )}
      <GalleryRows rows={galleryRowsData} fieldPath={`${homeFieldPath}.galleryRows`} />
      <Bestsellers intro={bestsellersIntro} introFieldPath={`${homeFieldPath}.bestsellersIntro`} />
      <Reviews />
      <NewsletterSignup />
    </div>
  );
};

export default Home;