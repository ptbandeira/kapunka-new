import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import type { Components as MarkdownComponents } from 'react-markdown';
import SectionRenderer from '../components/SectionRenderer';
import { usePrefersReducedMotion } from '../src/hooks/usePrefersReducedMotion';
import { useLanguage } from '../contexts/LanguageContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import type {
  PageContent,
  Language,
} from '../types';
import { buildLocalizedPath, SUPPORTED_LANGUAGES } from '../utils/localePaths';
import { getCloudinaryUrl, isAbsoluteUrl } from '../utils/imageUrl';
import Seo from '../src/components/Seo';
import { loadUnifiedPage } from '../utils/unifiedPageLoader';
import { resolveCmsHref } from '../utils/cmsLinks';

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

interface HomePageContent extends HomePageData {
  heroImageLeftUrl?: string | null;
  heroImageRightUrl?: string | null;
  heroImages?: HeroImagesGroup;
  resolvedLocale: Language;
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

const Home: React.FC = () => {
  const { t, language } = useLanguage();
  const { settings: siteSettings } = useSiteSettings();
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

        const { data, locale } = unified;

        const heroImageLeftCandidate = firstDefined([
          data.heroImages?.heroImageLeft,
          data.heroImageLeft,
          heroFallbackRaw,
        ]);

        const heroImageRightCandidate = firstDefined([
          data.heroImages?.heroImageRight,
          data.heroImageRight,
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
          heroImages: data.heroImages,
          heroImageLeftUrl,
          heroImageRightUrl,
          resolvedLocale: locale,
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
  }, [language, heroFallbackRaw]);

  if (!pageContent) {
    return null;
  }

  const heroHeadline = pageContent.heroHeadline ?? t('home.heroTitle');
  const heroSubheadline = pageContent.heroSubheadline ?? t('home.heroSubtitle');
  const heroPrimaryCtaLabel = typeof pageContent.heroCtas?.ctaPrimary === 'string'
    ? pageContent.heroCtas.ctaPrimary
    : pageContent.heroCtas?.ctaPrimary?.label ?? t('home.ctaShop');
  const heroSecondaryCtaLabel = typeof pageContent.heroCtas?.ctaSecondary === 'string'
    ? pageContent.heroCtas.ctaSecondary
    : pageContent.heroCtas?.ctaSecondary?.label ?? t('home.ctaClinics');

  const heroPrimaryCtaHref = '/shop';
  const heroSecondaryCtaHref = '/for-clinics';

  const heroOverlay = 'rgba(0,0,0,0.40)';
  const heroImageLeftUrl = pageContent.heroImageLeftUrl;
  const heroImageRightUrl = pageContent.heroImageRightUrl;
  
  const heroLayoutHint = 'image-full';
  const heroAlignX: HeroHorizontalAlignment = 'center';
  const heroAlignY: HeroVerticalAlignment = 'middle';
  const heroTextPlacement: HeroTextPlacement = 'overlay';
  
  const heroTextColorClass = 'text-white';
  const heroPrimaryButtonClasses = 'px-8 py-3 bg-white text-stone-900 font-semibold rounded-md hover:bg-white/90 transition-colors';
  const heroSecondaryButtonClasses = 'px-8 py-3 border border-white/50 text-white font-semibold rounded-md hover:bg-white/10 transition-colors';
  
  const heroGridClasses = 'flex flex-col items-center text-center';
  const heroTextWrapperClasses = 'space-y-6 max-w-3xl mx-auto';

  const heroBackgroundImage = heroImageRightUrl ?? heroImageLeftUrl;
  const heroImageAlt = heroHeadline;

  const heroSection = (
    <section className="relative overflow-hidden bg-stone-900 text-white">
      {heroBackgroundImage && (
        <div className="absolute inset-0">
          <img
            src={heroBackgroundImage}
            alt={heroImageAlt}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div
        className="relative"
        style={{ background: heroOverlay }}
      >
        <div className={`${heroGridClasses} py-16 md:py-24 px-4 sm:px-6 lg:px-8`}>
          <div className={heroTextWrapperClasses}>
            <motion.h1 
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 24 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl font-semibold tracking-tight text-white"
            >
              {heroHeadline}
            </motion.h1>
            {heroSubheadline && (
              <motion.div
                initial={prefersReducedMotion ? undefined : { opacity: 0, y: 24 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-lg md:text-xl leading-relaxed text-white"
              >
                <ReactMarkdown components={heroMarkdownComponents}>
                  {heroSubheadline}
                </ReactMarkdown>
              </motion.div>
            )}
            <motion.div 
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 24 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-8 flex flex-col sm:flex-row sm:justify-center gap-4"
            >
              <Link
                to={heroPrimaryCtaHref}
                className={heroPrimaryButtonClasses}
              >
                <span>{heroPrimaryCtaLabel}</span>
              </Link>
              {heroSecondaryCtaLabel && (
                <Link
                  to={heroSecondaryCtaHref}
                  className={heroSecondaryButtonClasses}
                >
                  <span>{heroSecondaryCtaLabel}</span>
                </Link>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );

  const computedTitle = pageContent.metaTitle ?? `Kapunka Skincare | ${t('home.metaTitle')}`;
  const computedDescription = pageContent.metaDescription ?? t('home.metaDescription');

  return (
    <div className="bg-white">
      <Seo title={computedTitle} description={computedDescription} />
      {heroSection}
      <SectionRenderer sections={pageContent.sections ?? []} />
    </div>
  );
};

export default Home;
