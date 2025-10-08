import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import SectionRenderer from '../components/SectionRenderer';
import Seo from '../src/components/Seo';
import { useLanguage } from '../contexts/LanguageContext';
import type { PageContent, PageSection } from '../types';
import { fetchContentMarkdown } from '../utils/fetchContentMarkdown';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';
import { useVisualEditorSync } from '../contexts/VisualEditorSyncContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { getCloudinaryUrl } from '../utils/imageUrl';
import { filterVisible } from '../utils/contentVisibility';

const SUPPORTED_SECTION_TYPES = new Set<PageSection['type']>([
  'timeline',
  'imageTextHalf',
  'imageGrid',
  'videoGallery',
  'trainingList',
  'communityCarousel',
  'productTabs',
  'mediaCopy',
  'mediaShowcase',
  'featureGrid',
  'productGrid',
  'banner',
  'newsletterSignup',
  'testimonials',
  'facts',
  'bullets',
  'specialties',
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

  if (type === 'videoGallery' || type === 'trainingList') {
    return section.entries === undefined || Array.isArray(section.entries);
  }

  return true;
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
          const { data } = await fetchContentMarkdown<unknown>(
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

  const sections = pageContent?.visible === false
    ? []
    : filterVisible(pageContent?.sections ?? []);
  const sectionsFieldPath = `pages.videos_${language}.sections`;
  const metaTitle = (pageContent?.metaTitle ?? t('videos.metaTitle'))?.trim();
  const metaDescription = (pageContent?.metaDescription ?? t('videos.metaDescription'))?.trim();
  const pageTitle = `${metaTitle} | Kapunka Skincare`;
  const rawSocialImage = settings.home?.heroImage?.trim() ?? '';
  const socialImage = rawSocialImage ? getCloudinaryUrl(rawSocialImage) ?? rawSocialImage : undefined;

  return (
    <div>
      <Seo
        title={pageTitle}
        description={metaDescription}
        image={socialImage}
        locale={language}
      />

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
