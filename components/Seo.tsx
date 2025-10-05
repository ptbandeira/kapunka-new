import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

export type SeoProps = {
  title?: string | null;
  description?: string | null;
  url?: string | null;
  image?: string | null;
  locale?: string | null;
  type?: string;
  twitter?: string;
  children?: React.ReactNode;
};

const sanitize = (value?: string | null): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const buildCanonicalUrl = (
  explicitUrl: string | undefined,
  pathname: string,
  search: string,
  hash: string,
): string | undefined => {
  const sanitizedExplicit = sanitize(explicitUrl);
  if (sanitizedExplicit) {
    return sanitizedExplicit;
  }

  if (typeof window === 'undefined') {
    return undefined;
  }

  const origin = window.location.origin;
  const path = `${pathname}${search}${hash}`;
  return `${origin}${path}`;
};

const Seo: React.FC<SeoProps> = ({
  title,
  description,
  url,
  image,
  locale,
  type = 'website',
  twitter = 'summary_large_image',
  children,
}) => {
  const location = useLocation();

  const canonicalUrl = useMemo(
    () => buildCanonicalUrl(url ?? undefined, location.pathname, location.search, location.hash),
    [url, location.hash, location.pathname, location.search],
  );

  const metaTitle = sanitize(title);
  const metaDescription = sanitize(description);
  const metaImage = sanitize(image);
  const metaLocale = sanitize(locale);
  const metaType = sanitize(type) ?? 'website';
  const twitterCard = sanitize(twitter) ?? 'summary_large_image';

  return (
    <Helmet>
      {metaTitle ? <title>{metaTitle}</title> : null}
      {metaDescription ? <meta name="description" content={metaDescription} /> : null}
      {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}

      {metaTitle ? <meta property="og:title" content={metaTitle} /> : null}
      {metaDescription ? <meta property="og:description" content={metaDescription} /> : null}
      {canonicalUrl ? <meta property="og:url" content={canonicalUrl} /> : null}
      {metaType ? <meta property="og:type" content={metaType} /> : null}
      {metaLocale ? <meta property="og:locale" content={metaLocale} /> : null}
      {metaImage ? <meta property="og:image" content={metaImage} /> : null}

      {twitterCard ? <meta name="twitter:card" content={twitterCard} /> : null}
      {metaTitle ? <meta name="twitter:title" content={metaTitle} /> : null}
      {metaDescription ? <meta name="twitter:description" content={metaDescription} /> : null}
      {metaImage ? <meta name="twitter:image" content={metaImage} /> : null}

      {children}
    </Helmet>
  );
};

export default Seo;
