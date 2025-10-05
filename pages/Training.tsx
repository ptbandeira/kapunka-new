import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import SectionRenderer from '../components/SectionRenderer';
import { useLanguage } from '../contexts/LanguageContext';
import type { PageContent, PageSection } from '../types';
import { fetchVisualEditorMarkdown } from '../utils/fetchVisualEditorMarkdown';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';
import { useVisualEditorSync } from '../contexts/VisualEditorSyncContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import Seo from '../src/components/Seo';
import { fetchTrainingProgramContent, TRAINING_PROGRAM_OBJECT_ID, type TrainingProgramContent } from '../utils/trainingProgramContent';

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
  const [programContent, setProgramContent] = useState<TrainingProgramContent | null>(null);
  const [programError, setProgramError] = useState<string | null>(null);
  const { contentVersion } = useVisualEditorSync();
  const { settings: siteSettings } = useSiteSettings();

  useEffect(() => {
    let isMounted = true;
    setPageContent(null);

    const loadSections = async () => {
      const localesToTry = [language, 'en'].filter((locale, index, arr) => arr.indexOf(locale) === index);

      for (const locale of localesToTry) {
        try {
          const { data } = await fetchVisualEditorMarkdown<unknown>(
            `/content/pages/${locale}/training.md`,
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
            console.error('Failed to load training page content', error);
          }
        }
      }

      if (isMounted) {
        setPageContent(null);
      }
    };

    loadSections().catch((error) => {
      console.error('Unhandled error while loading training sections', error);
    });

    return () => {
      isMounted = false;
    };
  }, [language, contentVersion]);

  useEffect(() => {
    let isMounted = true;
    setProgramContent(null);
    setProgramError(null);

    const loadProgramContent = async () => {
      try {
        const content = await fetchTrainingProgramContent();
        if (!isMounted) {
          return;
        }

        if (content) {
          setProgramContent(content);
        } else {
          setProgramError('Unable to load training program details.');
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setProgramError(error instanceof Error ? error.message : 'Unable to load training program details.');
      }
    };

    loadProgramContent().catch((error) => {
      if (!isMounted) {
        return;
      }
      setProgramError(error instanceof Error ? error.message : 'Unable to load training program details.');
    });

    return () => {
      isMounted = false;
    };
  }, [contentVersion]);

  const sections = pageContent?.sections ?? [];
  const sectionsFieldPath = `pages.training_${language}.sections`;

  const modules = useMemo(() => (
    programContent?.modules?.filter((module) => module && (module.title?.trim() || module.description?.trim())) ?? []
  ), [programContent?.modules]);
  const objectives = useMemo(() => (
    programContent?.objectives?.filter((objective) => objective && objective.trim().length > 0) ?? []
  ), [programContent?.objectives]);
  const callToActions = useMemo(() => (
    programContent?.callToActions?.filter((cta) => cta && (cta.label?.trim() || cta.url?.trim())) ?? []
  ), [programContent?.callToActions]);

  const baseMetaTitle = (programContent?.metaTitle ?? pageContent?.metaTitle ?? t('training.metaTitle'))?.trim();
  const computedTitle = baseMetaTitle ? `${baseMetaTitle} | Kapunka Skincare` : 'Kapunka Skincare';
  const computedDescription = (
    programContent?.metaDescription
    ?? pageContent?.metaDescription
    ?? t('training.metaDescription')
  );
  const socialImage = siteSettings.home?.heroImage;

  const heroTitle = programContent?.headline?.trim() || t('training.title');
  const heroSubtitle = programContent?.subheadline?.trim() || t('training.subtitle');
  const heroTitleAnnotations = programContent
    ? { 'data-sb-field-path': 'headline' }
    : getVisualEditorAttributes(`translations.${language}.training.title`);
  const heroSubtitleAnnotations = programContent
    ? { 'data-sb-field-path': 'subheadline' }
    : getVisualEditorAttributes(`translations.${language}.training.subtitle`);

  return (
    <div>
      <Seo
        title={computedTitle}
        description={computedDescription}
        image={socialImage}
        locale={language}
      />

      <header className="bg-stone-100 py-20 sm:py-28" data-sb-object-id={programContent ? TRAINING_PROGRAM_OBJECT_ID : undefined}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl font-semibold tracking-tight"
            {...heroTitleAnnotations}
          >
            {heroTitle}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-lg text-stone-600 max-w-2xl mx-auto"
            {...heroSubtitleAnnotations}
          >
            {heroSubtitle}
          </motion.p>
        </div>
      </header>

      {objectives.length > 0 ? (
        <section className="py-16 sm:py-20" data-sb-object-id={TRAINING_PROGRAM_OBJECT_ID}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm shadow-stone-100">
              <h2
                className="text-2xl font-semibold text-stone-900"
                {...getVisualEditorAttributes(`translations.${language}.training.objectivesHeading`)}
              >
                {t('training.objectivesHeading')}
              </h2>
              <ul className="mt-6 space-y-4 text-base text-stone-600" data-sb-field-path="objectives">
                {objectives.map((objective, index) => (
                  <li key={[objective, index].join('|')} className="flex items-start gap-3" data-sb-field-path={`objectives.${index}`}>
                    <span className="mt-1.5 inline-flex h-2 w-2 flex-none rounded-full bg-stone-900" aria-hidden="true" />
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {modules.length > 0 ? (
        <section className="bg-stone-50 py-16 sm:py-24" data-sb-object-id={TRAINING_PROGRAM_OBJECT_ID} data-sb-field-path="modules">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-3xl font-semibold text-stone-900"
                {...getVisualEditorAttributes(`translations.${language}.training.modulesHeading`)}
              >
                {t('training.modulesHeading')}
              </motion.h2>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-2">
              {modules.map((module, index) => (
                <motion.article
                  key={[module.title, index].join('|')}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.05 }}
                  className="flex h-full flex-col justify-between rounded-3xl border border-stone-200 bg-white p-8 shadow-sm shadow-stone-100"
                  data-sb-field-path={`modules.${index}`}
                >
                  <div>
                    {module.title ? (
                      <h3 className="text-xl font-semibold text-stone-900">{module.title}</h3>
                    ) : null}
                    {module.duration ? (
                      <p className="mt-2 text-sm font-medium uppercase tracking-wide text-stone-500">{module.duration}</p>
                    ) : null}
                    {module.description ? (
                      <p className="mt-4 text-base text-stone-600">{module.description}</p>
                    ) : null}
                  </div>
                  {module.learningOutcomes && module.learningOutcomes.length > 0 ? (
                    <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-stone-500" data-sb-field-path={`modules.${index}.learningOutcomes`}>
                      {module.learningOutcomes.map((outcome, outcomeIndex) => (
                        <li key={[outcome, outcomeIndex].join('|')} data-sb-field-path={`modules.${index}.learningOutcomes.${outcomeIndex}`}>
                          {outcome}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {callToActions.length > 0 ? (
        <section className="bg-stone-900 py-16 sm:py-24" data-sb-object-id={TRAINING_PROGRAM_OBJECT_ID} data-sb-field-path="callToActions">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-stone-100">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="text-3xl font-semibold"
              {...getVisualEditorAttributes(`translations.${language}.training.ctaHeading`)}
            >
              {t('training.ctaHeading')}
            </motion.h2>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {callToActions.map((cta, index) => (
                <a
                  key={[cta.label, cta.url, index].join('|')}
                  href={cta.url ?? '#'}
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-stone-900 shadow-sm transition-transform duration-300 hover:scale-[1.02]"
                  data-sb-field-path={`callToActions.${index}`}
                  target={cta.url ? '_blank' : undefined}
                  rel={cta.url ? 'noopener noreferrer' : undefined}
                >
                  {cta.label ?? t('training.learnMore')}
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {programError ? (
        <div className="container mx-auto px-4 py-6 text-center text-sm text-red-600">{programError}</div>
      ) : null}

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

export default Training;
