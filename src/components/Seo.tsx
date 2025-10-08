import React, { useContext, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { LanguageContext } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { getCloudinaryUrl } from '@/utils/imageUrl';
import type { Language } from '@/types';

type JsonLd = Record<string, unknown> | Record<string, unknown>[];

interface SeoProps {
  title?: string | null;
  description?: string | null;
  url?: string | null;
  image?: string | null;
  locale?: string | null;
  type?: string | null;
  twitterCard?: string | null;
  siteName?: string | null;
  jsonLd?: JsonLd | null;
  children?: React.ReactNode;
}

const sanitize = (value?: string | null): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const getLocalizedValue = <T,>(
  value: Partial<Record<Language, T>> | null | undefined,
  preferredLanguage?: Language,
): T | undefined => {
  if (!value) {
    return undefined;
  }

  if (preferredLanguage) {
    const preferredValue = value[preferredLanguage];
    if (preferredValue !== undefined && preferredValue !== null) {
      return preferredValue;
    }
  }

  const englishValue = value.en;
  if (englishValue !== undefined && englishValue !== null) {
    return englishValue;
  }

  for (const candidate of Object.values(value)) {
    if (candidate !== undefined && candidate !== null) {
      return candidate;
    }
  }

  return undefined;
};

const SITE_URL = (() => {
  const sanitized = sanitize(typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SITE_URL ?? null : undefined);
  if (!sanitized) {
    return undefined;
  }

  return sanitized.replace(/\/+$/, '');
})();

const DEFAULT_SITE_NAME = 'Kapunka Skincare';

const Seo: React.FC<SeoProps> = ({
  title,
  description,
  url,
  image,
  locale,
  type,
  twitterCard,
  siteName,
  jsonLd,
  children,
}) => {
  const location = useLocation();
  const languageContext = useContext(LanguageContext);
  const { settings } = useSiteSettings();

  const canonicalUrl = useMemo(() => {
    const explicit = sanitize(url);
    if (explicit) {
      return explicit;
    }

    if (!SITE_URL) {
      return undefined;
    }

    return `${SITE_URL}${location.pathname}`;
  }, [url, location.pathname]);

  const contextLanguage = languageContext?.language;
  const metaTitle = sanitize(title);
  const metaDescription = sanitize(description);
  const metaImage = sanitize(image);
  const metaLocale = sanitize(locale) ?? sanitize(contextLanguage ?? null);
  const metaType = sanitize(type) ?? 'website';
  const twitterCardType = sanitize(twitterCard) ?? 'summary_large_image';
  const metaSiteName = sanitize(siteName) ?? DEFAULT_SITE_NAME;
  const defaultTitle = sanitize(
    getLocalizedValue(settings?.seo?.defaultTitle ?? null, contextLanguage),
  );
  const defaultDescription = sanitize(
    getLocalizedValue(settings?.seo?.defaultDescription ?? null, contextLanguage),
  );
  const resolvedTitle = metaTitle ?? defaultTitle ?? metaSiteName;
  const resolvedDescription = metaDescription ?? defaultDescription;
  const htmlLang = metaLocale ?? 'en';

  const faviconHref = useMemo(() => {
    const faviconSource = sanitize(settings?.seo?.favicon ?? null);
    if (!faviconSource) {
      return undefined;
    }

    const cloudinaryUrl = getCloudinaryUrl(faviconSource);
    return cloudinaryUrl ?? faviconSource;
  }, [settings?.seo?.favicon]);

  const faviconType = useMemo(() => {
    if (!faviconHref) {
      return undefined;
    }

    const normalized = faviconHref.toLowerCase();
    if (normalized.endsWith('.svg')) {
      return 'image/svg+xml';
    }
    if (normalized.endsWith('.png')) {
      return 'image/png';
    }
    if (normalized.endsWith('.ico')) {
      return 'image/x-icon';
    }
    if (normalized.endsWith('.jpg') || normalized.endsWith('.jpeg')) {
      return 'image/jpeg';
    }

    return undefined;
  }, [faviconHref]);

  const jsonLdPayloads = useMemo(() => {
    if (!jsonLd) {
      return [];
    }

    const nodes = Array.isArray(jsonLd) ? jsonLd : [jsonLd];

    return nodes
      .map((node) => (node && typeof node === 'object' ? node : null))
      .filter((node): node is Record<string, unknown> => Boolean(node));
  }, [jsonLd]);

  return (
    <Helmet>
      <html lang={htmlLang} />
      <title>{resolvedTitle}</title>
      {resolvedDescription ? <meta name="description" content={resolvedDescription} /> : null}
      {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}

      {resolvedTitle ? <meta property="og:title" content={resolvedTitle} /> : null}
      {resolvedDescription ? (
        <meta property="og:description" content={resolvedDescription} />
      ) : null}
      {canonicalUrl ? <meta property="og:url" content={canonicalUrl} /> : null}
      {metaSiteName ? <meta property="og:site_name" content={metaSiteName} /> : null}
      {metaType ? <meta property="og:type" content={metaType} /> : null}
      {metaLocale ? <meta property="og:locale" content={metaLocale} /> : null}
      {metaImage ? <meta property="og:image" content={metaImage} /> : null}

      {twitterCardType ? <meta name="twitter:card" content={twitterCardType} /> : null}
      {resolvedTitle ? <meta name="twitter:title" content={resolvedTitle} /> : null}
      {resolvedDescription ? (
        <meta name="twitter:description" content={resolvedDescription} />
      ) : null}
      {metaImage ? <meta name="twitter:image" content={metaImage} /> : null}

      {jsonLdPayloads.map((node, index) => (
        <script key={`jsonld-${index}`} type="application/ld+json">
          {JSON.stringify(node)}
        </script>
      ))}

      {faviconHref ? (
        <link rel="icon" href={faviconHref} type={faviconType} />
      ) : null}

      {children}
    </Helmet>
  );
};

export default Seo;
