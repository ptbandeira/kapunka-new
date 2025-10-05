import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import SectionRenderer from '../components/_legacy/SectionRenderer';
import { useLanguage } from '../contexts/LanguageContext';
import type { PageContent, PageSection } from '../types';
import { fetchVisualEditorMarkdown } from '../utils/fetchVisualEditorMarkdown';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';
import { useVisualEditorSync } from '../contexts/VisualEditorSyncContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';

const SUPPORTED_SECTION_TYPES = new Set<PageSection['type']>([
  'timeline',
  'imageTextHalf',
  'imageGrid',
  'videoGallery',
  'trainingList',
]);

const isPageSection = (value: unknown): value is PageSection => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const section = value as Record<string, unknown>;
  const type = section.type;

  if (typeof type !== 'string' || !SUPPORTED_SECTION_TYPES.has(type as PageSection['type'])) {
    return false;
  }

  if (type === 'imageGrid') {
    return Array.isArray(section.items);
  }

  if (type === 'timeline') {
    return Array.isArray(section.entries);
  }

  if (type === 'imageTextHalf') {
    return true;
  }

  if (type === 'videoGallery') {
    return section.entries === undefined || Array.isArray(section.entries);
  }

  if (type === 'trainingList') {
    return section.entries === undefined || Array.isArray(section.entries);
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

const Videos: React.FC = () => {
  const { t, language } = useLanguage();
  const { settings } = useSiteSettings();
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const { contentVersion } = useVisualEditorSync();

  useEffect(() => {
    let isMounted = true;
    setPageContent(null);

    const loadSections = async () => {
      const localesToTry = [language, 'en'].filter((locale, index, arr) => arr.indexOf(locale) === index);

      for (const locale of localesToTry) {
        try {
          const { data } = await fetchVisualEditorMarkdown<unknown>(
            `/content/pages/${locale}/videos.md`,
            { cache: 'no-store' },
          );
          if (!isMounted) {
            return;
          }

          if (isPageContent(data)) {
            setPageContent(data);
            return;
          }
        } catch (error) {
          if (locale === localesToTry[localesToTry.length - 1]) {
            console.error('Failed to load videos page content', error);
          }
        }
      }

      if (isMounted) {
        setPageContent(null);
      }
    };

    loadSections().catch((error) => {
      console.error('Unhandled error while loading videos page content', error);
    });

    return () => {
      isMounted = false;
    };
  }, [language, contentVersion]);

  const sections = pageContent?.sections ?? [];
  const sectionsFieldPath = `pages.videos_${language}.sections`;
  const sanitize = (value?: string | null): string | undefined => {
    if (typeof value !== 'string') {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };

  const baseMetaTitle = sanitize(pageContent?.metaTitle) ?? t('videos.metaTitle');
  const computedDescription = sanitize(pageContent?.metaDescription) ?? t('videos.metaDescription');
  const computedTitle = baseMetaTitle.includes('Kapunka')
    ? baseMetaTitle
    : `${baseMetaTitle} | Kapunka Skincare`;
  const socialImage = sanitize(settings.home?.heroImage);

  return (
    <div>
      <Head>
        <title>{computedTitle}</title>
        <meta name="description" content={computedDescription} />
        <meta property="og:title" content={computedTitle} />
        <meta property="og:description" content={computedDescription} />
        {socialImage ? <meta property="og:image" content={socialImage} /> : null}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={computedTitle} />
        <meta name="twitter:description" content={computedDescription} />
        {socialImage ? <meta name="twitter:image" content={socialImage} /> : null}
      </Head>

      <header className="py-20 sm:py-28 bg-stone-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl font-semibold tracking-tight"
            {...getVisualEditorAttributes(`translations.${language}.videos.title`)}
          >
            {t('videos.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-lg text-stone-600 max-w-2xl mx-auto"
            {...getVisualEditorAttributes(`translations.${language}.videos.subtitle`)}
          >
            {t('videos.subtitle')}
          </motion.p>
        </div>
      </header>

      {sections.length > 0 ? (
        <SectionRenderer sections={sections} fieldPath={sectionsFieldPath} />
      ) : (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <p className="text-center text-stone-500" {...getVisualEditorAttributes(`translations.${language}.common.loading`)}>
            {t('common.loading')}
          </p>
        </div>
      )}
    </div>
  );
};

export default Videos;
