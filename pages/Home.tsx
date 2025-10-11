import React, { useState, useEffect } from 'react';
import SectionRenderer from '../components/SectionRenderer';
import { useLanguage } from '../contexts/LanguageContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import type {
  PageContent,
  Language,
  HeroSimpleSectionContent,
  Translatable,
} from '../types';
import { getCloudinaryUrl, isAbsoluteUrl } from '../utils/imageUrl';
import Seo from '../src/components/Seo';
import { loadUnifiedPage } from '../utils/unifiedPageLoader';

interface HomePageData extends PageContent {
  hero?: {
    content?: {
      headline?: string | Translatable;
      subheadline?: string | Translatable;
    };
    ctas?: {
      primary?: { 
        label?: string | Translatable;
        href?: string | Translatable; 
      };
      secondary?: {
        label?: string | Translatable;
        href?: string | Translatable;
      };
    };
    layout?: {
      alignX?: string;
      alignY?: string;
      textPosition?: string;
      textAnchor?: string;
      overlay?: string | number | boolean;
      layoutHint?: string;
    };
  };
  heroImageLeftUrl?: string | null;
  heroImageRightUrl?: string | null;
}



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

  
  const heroFallbackRaw = (() => {
    const extendedSettings = siteSettings as typeof siteSettings & { heroFallback?: string | null };
    const fallbackCandidate = extendedSettings.heroFallback ?? siteSettings.home?.heroImage;

    if (typeof fallbackCandidate === 'string') {
      const trimmed = fallbackCandidate.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }

    return undefined;
  })();
  
  const [pageContent, setPageContent] = useState<HomePageData | null>(null);

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

        setPageContent({
          ...data,
          heroImageLeftUrl: heroFallbackRaw ? normalizeImagePath(heroFallbackRaw, locale) : null,
          heroImageRightUrl: heroFallbackRaw ? normalizeImagePath(heroFallbackRaw, locale) : null,
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



  const heroSection: HeroSimpleSectionContent = {
  type: 'heroSimple',
  content: {
    headline: typeof pageContent.hero?.content?.headline === 'string'
      ? { en: pageContent.hero.content.headline, pt: '', es: '' }
      : pageContent.hero?.content?.headline ?? {
          en: t('home.heroTitle'),
          pt: t('home.heroTitle'),
          es: t('home.heroTitle')
        },
    subheadline: typeof pageContent.hero?.content?.subheadline === 'string'
      ? { en: pageContent.hero.content.subheadline, pt: '', es: '' }
      : pageContent.hero?.content?.subheadline ?? {
          en: t('home.heroSubtitle'),
          pt: t('home.heroSubtitle'),
          es: t('home.heroSubtitle')
        },
  },
  ctas: {
    primary: {
      label: typeof pageContent.hero?.ctas?.primary?.label === 'string'
            ? { en: pageContent.hero.ctas.primary.label, pt: '', es: '' }
            : pageContent.hero?.ctas?.primary?.label ?? {
                en: t('home.ctaShop'),
                pt: t('home.ctaShop'),
                es: t('home.ctaShop')
              },
      href: { en: '/shop', pt: '/shop', es: '/shop' }
    },
    secondary: {
      label: typeof pageContent.hero?.ctas?.secondary?.label === 'string'
            ? { en: pageContent.hero.ctas.secondary.label, pt: '', es: '' }
            : pageContent.hero?.ctas?.secondary?.label ?? {
                en: t('home.ctaClinics'),
                pt: t('home.ctaClinics'),
                es: t('home.ctaClinics')
              },
      href: { en: '/for-clinics', pt: '/for-clinics', es: '/for-clinics' }
    }
  },
  layout: {
    alignX: pageContent.hero?.layout?.alignX ?? 'left',
    alignY: pageContent.hero?.layout?.alignY ?? 'middle',
    textPosition: pageContent.hero?.layout?.textPosition ?? 'overlay',
    textAnchor: pageContent.hero?.layout?.textAnchor ?? 'bottom-left',
    overlay: pageContent.hero?.layout?.overlay ?? 'strong',
    layoutHint: pageContent.hero?.layout?.layoutHint ?? 'image-full'
  },
  image: pageContent.heroImageRightUrl ?? pageContent.heroImageLeftUrl ?? siteSettings.home?.heroImage
};

  const computedTitle = pageContent.metaTitle ?? `Kapunka Skincare | ${t('home.metaTitle')}`;
  const computedDescription = pageContent.metaDescription ?? t('home.metaDescription');

  return (
    <div className="bg-white">
      <Seo title={computedTitle} description={computedDescription} />
      <SectionRenderer sections={[heroSection, ...(pageContent.sections ?? [])]} />
    </div>
  );
};

export default Home;
