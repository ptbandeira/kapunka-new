import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

export type JsonLd = Record<string, unknown> | Record<string, unknown>[];

export interface SeoProps {
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

  const metaTitle = sanitize(title);
  const metaDescription = sanitize(description);
  const metaImage = sanitize(image);
  const metaLocale = sanitize(locale);
  const metaType = sanitize(type) ?? 'website';
  const twitterCardType = sanitize(twitterCard) ?? 'summary_large_image';
  const metaSiteName = sanitize(siteName) ?? DEFAULT_SITE_NAME;

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
      {metaTitle ? <title>{metaTitle}</title> : null}
      {metaDescription ? <meta name="description" content={metaDescription} /> : null}
      {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}

      {metaTitle ? <meta property="og:title" content={metaTitle} /> : null}
      {metaDescription ? <meta property="og:description" content={metaDescription} /> : null}
      {canonicalUrl ? <meta property="og:url" content={canonicalUrl} /> : null}
      {metaSiteName ? <meta property="og:site_name" content={metaSiteName} /> : null}
      {metaType ? <meta property="og:type" content={metaType} /> : null}
      {metaLocale ? <meta property="og:locale" content={metaLocale} /> : null}
      {metaImage ? <meta property="og:image" content={metaImage} /> : null}

      {twitterCardType ? <meta name="twitter:card" content={twitterCardType} /> : null}
      {metaTitle ? <meta name="twitter:title" content={metaTitle} /> : null}
      {metaDescription ? <meta name="twitter:description" content={metaDescription} /> : null}
      {metaImage ? <meta name="twitter:image" content={metaImage} /> : null}

      {jsonLdPayloads.map((node, index) => (
        <script key={`jsonld-${index}`} type="application/ld+json">
          {JSON.stringify(node)}
        </script>
      ))}

      {children}
    </Helmet>
  );
};

export default Seo;
