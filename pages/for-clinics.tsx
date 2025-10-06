import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import SectionRenderer from '../components/SectionRenderer';
import { useLanguage } from '../contexts/LanguageContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { useVisualEditorSync } from '../contexts/VisualEditorSyncContext';
import { filterVisible } from '../utils/contentVisibility';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';
import { getCloudinaryUrl } from '../utils/imageUrl';
import {
  loadClinicsPageContent,
  type ClinicsPageContentResult,
} from '../utils/loadClinicsPageContent';
import Seo from '../src/components/Seo';
import type { PageSection } from '../types';

type TextCandidate = {
  value: unknown;
  fieldPath: string;
};

type TextWithFieldPath = {
  value: string;
  fieldPath: string;
};

type CtaWithFieldPath = {
  label: string;
  href: string;
  labelFieldPath: string;
  hrefFieldPath?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

type SectionCandidate = Record<string, unknown> & { type: string; visible?: boolean };

const isSectionCandidate = (value: unknown): value is SectionCandidate => (
  isRecord(value) && typeof value.type === 'string'
);

const sanitizeString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const resolveTextWithFieldPath = (
  candidates: TextCandidate[],
  fallback: TextCandidate,
): TextWithFieldPath => {
  for (const candidate of candidates) {
    const sanitized = sanitizeString(candidate.value);
    if (sanitized) {
      return { value: sanitized, fieldPath: candidate.fieldPath };
    }
  }

  const fallbackValue = sanitizeString(fallback.value) ?? '';

  return {
    value: fallbackValue,
    fieldPath: fallback.fieldPath,
  };
};

const extractCtaValue = (value: unknown): { label?: string; href?: string } => {
  if (isRecord(value)) {
    return {
      label: sanitizeString(value.label),
      href: sanitizeString(value.href),
    };
  }

  const label = sanitizeString(value);
  return label ? { label } : {};
};

const resolveCta = (
  candidates: CtaWithFieldPath[],
  fallback: CtaWithFieldPath,
): CtaWithFieldPath => {
  for (const candidate of candidates) {
    const label = sanitizeString(candidate.label);
    if (label) {
      const href = sanitizeString(candidate.href) ?? fallback.href;
      return {
        label,
        href,
        labelFieldPath: candidate.labelFieldPath,
        hrefFieldPath: candidate.hrefFieldPath,
      };
    }
  }

  return fallback;
};

const ForClinics: React.FC = () => {
  const { t, language } = useLanguage();
  const { settings } = useSiteSettings();
  const { contentVersion } = useVisualEditorSync();
  const [pageContent, setPageContent] = useState<ClinicsPageContentResult | null>(null);

  useEffect(() => {
    let isMounted = true;

    setPageContent(null);

    loadClinicsPageContent(language)
      .then((result) => {
        if (!isMounted) {
          return;
        }

        setPageContent(result);
      })
      .catch((error) => {
        console.error('Failed to load clinics page content', error);
        if (isMounted) {
          setPageContent(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [language, contentVersion]);

  const clinicsFieldPath = useMemo(() => {
    if (!pageContent) {
      return `pages.clinics_${language}`;
    }

    return pageContent.source === 'visual-editor'
      ? `site.content.${pageContent.locale}.pages.clinics`
      : `pages.clinics_${pageContent.locale}`;
  }, [language, pageContent]);

  const translationsFieldPath = `translations.${language}.clinics`;

  const translatedMetaTitle = sanitizeString(t('clinics.metaTitle'))
    ?? sanitizeString(t('clinics.title'))
    ?? 'Kapunka Clinics';
  const baseMetaTitle = sanitizeString(pageContent?.data.metaTitle) ?? translatedMetaTitle;
  const pageTitle = baseMetaTitle.includes('Kapunka')
    ? baseMetaTitle
    : `${baseMetaTitle} | Kapunka Skincare`;
  const metaDescription = sanitizeString(pageContent?.data.metaDescription)
    ?? t('clinics.metaDescription');

  const heroData = isRecord(pageContent?.data.hero) ? pageContent?.data.hero : null;
  const heroContent = heroData && isRecord(heroData.content) ? heroData.content : null;
  const heroCtas = heroData && isRecord(heroData.ctas) ? heroData.ctas : null;
  const heroPrimaryCtaRaw = heroCtas && 'primary' in heroCtas ? (heroCtas as Record<string, unknown>).primary : undefined;
  const heroFieldCtas = isRecord(pageContent?.data.heroCtas) ? pageContent?.data.heroCtas : null;
  const heroPrimaryFieldRaw = heroFieldCtas && 'ctaPrimary' in heroFieldCtas
    ? (heroFieldCtas as Record<string, unknown>).ctaPrimary
    : undefined;

  const heroTitleSource = resolveTextWithFieldPath([
    { value: heroContent?.headline, fieldPath: `${clinicsFieldPath}.hero.content.headline` },
    { value: heroContent?.title, fieldPath: `${clinicsFieldPath}.hero.content.title` },
    { value: heroData?.headline, fieldPath: `${clinicsFieldPath}.hero.headline` },
    { value: heroData?.title, fieldPath: `${clinicsFieldPath}.hero.title` },
    { value: pageContent?.data.heroHeadline, fieldPath: `${clinicsFieldPath}.heroHeadline` },
    { value: pageContent?.data.heroTitle, fieldPath: `${clinicsFieldPath}.heroTitle` },
  ], {
    value: t('clinics.heroTitle'),
    fieldPath: `${translationsFieldPath}.heroTitle`,
  });

  const heroSubtitleSource = resolveTextWithFieldPath([
    { value: heroContent?.subheadline, fieldPath: `${clinicsFieldPath}.hero.content.subheadline` },
    { value: heroContent?.body, fieldPath: `${clinicsFieldPath}.hero.content.body` },
    { value: heroData?.subheadline, fieldPath: `${clinicsFieldPath}.hero.subheadline` },
    { value: heroData?.subtitle, fieldPath: `${clinicsFieldPath}.hero.subtitle` },
    { value: pageContent?.data.heroSubheadline, fieldPath: `${clinicsFieldPath}.heroSubheadline` },
    { value: pageContent?.data.heroSubtitle, fieldPath: `${clinicsFieldPath}.heroSubtitle` },
  ], {
    value: t('clinics.heroSubtitle'),
    fieldPath: `${translationsFieldPath}.heroSubtitle`,
  });

  const heroEyebrowSource = resolveTextWithFieldPath([
    { value: heroContent?.eyebrow, fieldPath: `${clinicsFieldPath}.hero.content.eyebrow` },
    { value: heroData?.eyebrow, fieldPath: `${clinicsFieldPath}.hero.eyebrow` },
    { value: pageContent?.data.heroEyebrow, fieldPath: `${clinicsFieldPath}.heroEyebrow` },
  ], {
    value: '',
    fieldPath: `${clinicsFieldPath}.heroEyebrow`,
  });
  const heroEyebrow = heroEyebrowSource.value ? heroEyebrowSource : null;

  const ctaLink = settings.clinics?.ctaLink ?? '#/contact';

  const heroPrimaryCtaCandidates: CtaWithFieldPath[] = [];

  if (heroPrimaryCtaRaw !== undefined) {
    const { label, href } = extractCtaValue(heroPrimaryCtaRaw);
    const basePath = `${clinicsFieldPath}.hero.ctas.primary`;
    heroPrimaryCtaCandidates.push({
      label: label ?? '',
      href: href ?? '',
      labelFieldPath: isRecord(heroPrimaryCtaRaw) ? `${basePath}.label` : basePath,
      hrefFieldPath: isRecord(heroPrimaryCtaRaw) ? `${basePath}.href` : undefined,
    });
  }

  if (heroPrimaryFieldRaw !== undefined) {
    const { label, href } = extractCtaValue(heroPrimaryFieldRaw);
    const basePath = `${clinicsFieldPath}.heroCtas.ctaPrimary`;
    heroPrimaryCtaCandidates.push({
      label: label ?? '',
      href: href ?? '',
      labelFieldPath: isRecord(heroPrimaryFieldRaw) ? `${basePath}.label` : basePath,
      hrefFieldPath: isRecord(heroPrimaryFieldRaw) ? `${basePath}.href` : undefined,
    });
  }

  if (pageContent?.data.heroPrimaryCta !== undefined) {
    const { label, href } = extractCtaValue(pageContent.data.heroPrimaryCta);
    const basePath = `${clinicsFieldPath}.heroPrimaryCta`;
    heroPrimaryCtaCandidates.push({
      label: label ?? '',
      href: href ?? '',
      labelFieldPath: isRecord(pageContent.data.heroPrimaryCta) ? `${basePath}.label` : basePath,
      hrefFieldPath: isRecord(pageContent.data.heroPrimaryCta) ? `${basePath}.href` : undefined,
    });
  }

  if (pageContent?.data.heroCtaPrimary !== undefined) {
    const { label, href } = extractCtaValue(pageContent.data.heroCtaPrimary);
    const basePath = `${clinicsFieldPath}.heroCtaPrimary`;
    heroPrimaryCtaCandidates.push({
      label: label ?? '',
      href: href ?? '',
      labelFieldPath: isRecord(pageContent.data.heroCtaPrimary) ? `${basePath}.label` : basePath,
      hrefFieldPath: isRecord(pageContent.data.heroCtaPrimary) ? `${basePath}.href` : undefined,
    });
  }

  if (pageContent?.data.ctaButton !== undefined) {
    heroPrimaryCtaCandidates.push({
      label: pageContent.data.ctaButton,
      href: '',
      labelFieldPath: `${clinicsFieldPath}.ctaButton`,
    });
  }

  const heroPrimaryCtaFallbackLabel = sanitizeString(t('clinics.ctaButton')) ?? t('clinics.ctaButton');
  const heroPrimaryCta = resolveCta(heroPrimaryCtaCandidates, {
    label: heroPrimaryCtaFallbackLabel,
    href: ctaLink,
    labelFieldPath: `${translationsFieldPath}.ctaButton`,
  });

  const ctaTitleSource = resolveTextWithFieldPath([
    { value: pageContent?.data.ctaTitle, fieldPath: `${clinicsFieldPath}.ctaTitle` },
  ], {
    value: t('clinics.ctaTitle'),
    fieldPath: `${translationsFieldPath}.ctaTitle`,
  });

  const ctaSubtitleSource = resolveTextWithFieldPath([
    { value: pageContent?.data.ctaSubtitle, fieldPath: `${clinicsFieldPath}.ctaSubtitle` },
  ], {
    value: t('clinics.ctaSubtitle'),
    fieldPath: `${translationsFieldPath}.ctaSubtitle`,
  });

  const sectionsResult = useMemo(() => {
    const rawSections: SectionCandidate[] = Array.isArray(pageContent?.data.sections)
      ? (pageContent.data.sections as unknown[]).filter(isSectionCandidate)
      : [];
    const normalizedSections = filterVisible(rawSections);

    if (normalizedSections.length > 0) {
      return {
        sections: normalizedSections,
        fieldPath: `${clinicsFieldPath}.sections`,
      };
    }

    const translationSections = t<unknown>('clinics.sections');
    const translationArray: SectionCandidate[] = Array.isArray(translationSections)
      ? translationSections.filter(isSectionCandidate)
      : [];
    const normalizedTranslations = filterVisible(translationArray);

    return {
      sections: normalizedTranslations,
      fieldPath: normalizedTranslations.length > 0
        ? `${translationsFieldPath}.sections`
        : undefined,
    };
  }, [pageContent?.data.sections, clinicsFieldPath, t, translationsFieldPath]);

  const sections: SectionCandidate[] = sectionsResult.sections;
  const sectionsFieldPath = sectionsResult.fieldPath;

  const rawSocialImage = settings.home?.heroImage?.trim() ?? '';
  const socialImage = rawSocialImage ? getCloudinaryUrl(rawSocialImage) ?? rawSocialImage : undefined;
  const rootObjectId = getVisualEditorAttributes(clinicsFieldPath)['data-sb-object-id'];
  const sectionsToRender = sections as unknown as PageSection[];
  const heroPrimaryCtaFieldPath = heroPrimaryCta.hrefFieldPath
    ? `${heroPrimaryCta.labelFieldPath} ${heroPrimaryCta.hrefFieldPath}#@href`
    : heroPrimaryCta.labelFieldPath;
  const shouldRenderCtaSection = Boolean(
    sanitizeString(ctaTitleSource.value)
    || sanitizeString(ctaSubtitleSource.value)
    || sanitizeString(heroPrimaryCta.label),
  );

  return (
    <div className="bg-white text-stone-900" data-sb-object-id={rootObjectId}>
      <Seo
        title={pageTitle}
        description={metaDescription}
        image={socialImage}
        locale={language}
      />

      <main>
        <section className="bg-stone-100 py-20 sm:py-28">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            {heroEyebrow ? (
              <motion.p
                className="text-sm font-semibold uppercase tracking-wide text-stone-500"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                {...getVisualEditorAttributes(heroEyebrow.fieldPath)}
              >
                {heroEyebrow.value}
              </motion.p>
            ) : null}
            <motion.h1
              className="mt-3 text-4xl font-semibold tracking-tight text-stone-900 sm:mt-4 sm:text-5xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              {...getVisualEditorAttributes(heroTitleSource.fieldPath)}
            >
              {heroTitleSource.value}
            </motion.h1>
            <motion.p
              className="mt-5 text-lg text-stone-600 sm:text-xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              {...getVisualEditorAttributes(heroSubtitleSource.fieldPath)}
            >
              {heroSubtitleSource.value}
            </motion.p>
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <a
                href={heroPrimaryCta.href || ctaLink}
                className="inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2"
                {...getVisualEditorAttributes(heroPrimaryCtaFieldPath)}
              >
                {heroPrimaryCta.label}
              </a>
            </motion.div>
          </div>
        </section>

        {sectionsToRender.length > 0 && sectionsFieldPath ? (
          <SectionRenderer sections={sectionsToRender} fieldPath={sectionsFieldPath} />
        ) : null}

        {shouldRenderCtaSection ? (
          <section className="bg-stone-900 py-16 text-white sm:py-20">
            <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
              <motion.h2
                className="text-3xl font-semibold tracking-tight sm:text-4xl"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                {...getVisualEditorAttributes(ctaTitleSource.fieldPath)}
              >
                {ctaTitleSource.value}
              </motion.h2>
              <motion.p
                className="mt-4 text-base text-stone-200 sm:text-lg"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                {...getVisualEditorAttributes(ctaSubtitleSource.fieldPath)}
              >
                {ctaSubtitleSource.value}
              </motion.p>
              <motion.div
                className="mt-8"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <a
                  href={heroPrimaryCta.href || ctaLink}
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-base font-semibold text-stone-900 transition hover:bg-stone-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
                  {...getVisualEditorAttributes(heroPrimaryCtaFieldPath)}
                >
                  {heroPrimaryCta.label}
                </a>
              </motion.div>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
};

export default ForClinics;
