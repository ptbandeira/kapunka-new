import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import SectionRenderer from '../components/SectionRenderer';
import { useLanguage } from '../contexts/LanguageContext';
import type { PageContent, PageSection } from '../types';

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

const Training: React.FC = () => {
  const { t, language } = useLanguage();
  const [pageContent, setPageContent] = useState<PageContent | null>(null);

  useEffect(() => {
    let isMounted = true;
    setPageContent(null);

    const loadSections = async () => {
      const localesToTry = [language, 'en'].filter((locale, index, arr) => arr.indexOf(locale) === index);

      for (const locale of localesToTry) {
        try {
          const response = await fetch(`/content/pages/${locale}/training.json`);
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
            console.error('Failed to load training page content', error);
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

  const sections = pageContent?.sections ?? [];
  const sectionsFieldPath = `pages.training_${language}.sections`;
  const computedTitle = pageContent?.metaTitle ?? `${t('training.metaTitle')} | Kapunka Skincare`;
  const computedDescription = pageContent?.metaDescription ?? t('training.metaDescription');

  return (
    <div>
      <Helmet>
        <title>{computedTitle}</title>
        <meta name="description" content={computedDescription} />
      </Helmet>

      <header className="py-20 sm:py-28 bg-stone-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl font-semibold tracking-tight"
            data-nlv-field-path={`translations.${language}.training.title`}
          >
            {t('training.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-lg text-stone-600 max-w-2xl mx-auto"
            data-nlv-field-path={`translations.${language}.training.subtitle`}
          >
            {t('training.subtitle')}
          </motion.p>
        </div>
      </header>

      {sections.length > 0 ? (
        <SectionRenderer sections={sections} fieldPath={sectionsFieldPath} />
      ) : (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <p className="text-center text-stone-500" data-nlv-field-path={`translations.${language}.common.loading`}>
            {t('common.loading')}
          </p>
        </div>
      )}
    </div>
  );
};

export default Training;
