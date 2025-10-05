import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import SectionRenderer from '../components/SectionRenderer';
import { useLanguage } from '../contexts/LanguageContext';
import { useVisualEditorSync } from '../contexts/VisualEditorSyncContext';
import type { PageSection } from '../types';
import { fetchVisualEditorMarkdown } from '../utils/fetchVisualEditorMarkdown';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';

const SUPPORTED_SECTION_TYPES = new Set<PageSection['type']>([
  'timeline',
  'imageTextHalf',
  'imageGrid',
  'videoGallery',
  'trainingList',
  'mediaCopy',
  'mediaShowcase',
  'featureGrid',
  'productGrid',
  'banner',
  'newsletterSignup',
  'communityCarousel',
  'testimonials',
  'facts',
  'bullets',
  'specialties',
]);

type ManifestoStatement = {
  heading?: string | null;
  highlight?: string | null;
  body?: string | null;
};

type BrandValue = {
  title?: string | null;
  description?: string | null;
};

type ClosingNote = {
  heading?: string | null;
  body?: string | null;
};

type StoryManifestoPageContent = {
  metaTitle?: string;
  metaDescription?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  manifestoIntro?: string;
  manifestoStatements?: ManifestoStatement[] | null;
  values?: BrandValue[] | null;
  closing?: ClosingNote | null;
  sections?: PageSection[] | null;
};

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

const isManifestoStatement = (value: unknown): value is ManifestoStatement => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const statement = value as Record<string, unknown>;

  return [statement.heading, statement.highlight, statement.body].every((field) => {
    return field === undefined || field === null || typeof field === 'string';
  });
};

const isBrandValue = (value: unknown): value is BrandValue => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const brandValue = value as Record<string, unknown>;

  return (brandValue.title === undefined || brandValue.title === null || typeof brandValue.title === 'string')
    && (brandValue.description === undefined || brandValue.description === null || typeof brandValue.description === 'string');
};

const isClosingNote = (value: unknown): value is ClosingNote => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const closingNote = value as Record<string, unknown>;

  return (closingNote.heading === undefined || closingNote.heading === null || typeof closingNote.heading === 'string')
    && (closingNote.body === undefined || closingNote.body === null || typeof closingNote.body === 'string');
};

const isPageSection = (value: unknown): value is PageSection => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const section = value as Record<string, unknown>;
  const { type } = section;

  if (typeof type !== 'string' || !SUPPORTED_SECTION_TYPES.has(type as PageSection['type'])) {
    return false;
  }

  return true;
};

const isStoryManifestoPageContent = (value: unknown): value is StoryManifestoPageContent => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const content = value as Record<string, unknown>;

  if (content.manifestoStatements !== undefined) {
    if (!Array.isArray(content.manifestoStatements) || !content.manifestoStatements.every(isManifestoStatement)) {
      return false;
    }
  }

  if (content.values !== undefined) {
    if (!Array.isArray(content.values) || !content.values.every(isBrandValue)) {
      return false;
    }
  }

  if (content.closing !== undefined) {
    if (content.closing !== null && !isClosingNote(content.closing)) {
      return false;
    }
  }

  if (content.sections !== undefined) {
    if (!Array.isArray(content.sections) || !content.sections.every(isPageSection)) {
      return false;
    }
  }

  return [
    content.metaTitle,
    content.metaDescription,
    content.heroTitle,
    content.heroSubtitle,
    content.manifestoIntro,
  ].every((field) => field === undefined || typeof field === 'string');
};

const splitIntoParagraphs = (value?: string | null): string[] => {
  if (!value) {
    return [];
  }

  return value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
};

const StoryManifestoPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { contentVersion } = useVisualEditorSync();
  const [pageContent, setPageContent] = useState<StoryManifestoPageContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setHasError(false);
    setPageContent(null);

    const loadStoryContent = async () => {
      const localesToTry = [language, 'en'].filter((locale, index, arr) => arr.indexOf(locale) === index);

      for (const locale of localesToTry) {
        try {
          const response = await fetchVisualEditorMarkdown<unknown>(
            `/content/pages/${locale}/story.md`,
            { cache: 'no-store' },
          );

          if (!isMounted) {
            return;
          }

          if (isStoryManifestoPageContent(response.data)) {
            setPageContent(response.data);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          if (locale === localesToTry[localesToTry.length - 1]) {
            console.error('Failed to load manifesto content', error);
          }
        }
      }

      if (!isMounted) {
        return;
      }

      setHasError(true);
      setIsLoading(false);
    };

    loadStoryContent().catch((error) => {
      console.error('Unhandled error while loading manifesto content', error);
      if (!isMounted) {
        return;
      }
      setHasError(true);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [language, contentVersion]);

  const storyFieldPath = `pages.story_${language}`;

  const manifestoStatements = useMemo(() => {
    if (!pageContent?.manifestoStatements) {
      return [] as Array<{ statement: ManifestoStatement; index: number }>;
    }

    return pageContent.manifestoStatements
      .map((statement, index) => ({ statement, index }))
      .filter(({ statement }) => {
        const hasHeading = isNonEmptyString(statement.heading);
        const hasHighlight = isNonEmptyString(statement.highlight);
        const hasBody = isNonEmptyString(statement.body);
        return hasHeading || hasHighlight || hasBody;
      });
  }, [pageContent?.manifestoStatements]);

  const values = useMemo(() => {
    if (!pageContent?.values) {
      return [] as Array<{ value: BrandValue; index: number }>;
    }

    return pageContent.values
      .map((value, index) => ({ value, index }))
      .filter(({ value }) => isNonEmptyString(value.title) || isNonEmptyString(value.description));
  }, [pageContent?.values]);

  const sections = useMemo(() => {
    if (!pageContent?.sections) {
      return [] as PageSection[];
    }

    return pageContent.sections.filter(isPageSection);
  }, [pageContent?.sections]);

  const closingNote = useMemo(() => {
    const closing = pageContent?.closing;
    if (!closing) {
      return null;
    }

    const hasHeading = isNonEmptyString(closing.heading);
    const hasBody = isNonEmptyString(closing.body);

    if (!hasHeading && !hasBody) {
      return null;
    }

    return closing;
  }, [pageContent?.closing]);

  const computedTitle = useMemo(() => {
    const baseTitle = pageContent?.metaTitle ?? t('nav.manifesto');
    return baseTitle.includes('Kapunka') ? baseTitle : `${baseTitle} | Kapunka Skincare`;
  }, [pageContent?.metaTitle, t]);

  const computedDescription = pageContent?.metaDescription ?? pageContent?.heroSubtitle ?? pageContent?.manifestoIntro ?? t('about.metaDescription');

  const manifestoIntroParagraphs = useMemo(() => splitIntoParagraphs(pageContent?.manifestoIntro), [pageContent?.manifestoIntro]);

  return (
    <div className="bg-stone-50 text-stone-900">
      <Helmet>
        <title>{computedTitle}</title>
        {computedDescription && <meta name="description" content={computedDescription} />}
      </Helmet>

      <header className="py-24 sm:py-32 bg-stone-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl font-semibold tracking-tight"
            {...getVisualEditorAttributes(`${storyFieldPath}.heroTitle`)}
          >
            {pageContent?.heroTitle ?? t('nav.manifesto')}
          </motion.h1>
          {isNonEmptyString(pageContent?.heroSubtitle) ? (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-4 text-lg text-stone-600 max-w-2xl mx-auto"
              {...getVisualEditorAttributes(`${storyFieldPath}.heroSubtitle`)}
            >
              {pageContent?.heroSubtitle}
            </motion.p>
          ) : null}
        </div>
      </header>

      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <p className="text-center text-stone-500" {...getVisualEditorAttributes(`translations.${language}.common.loading`)}>
                {t('common.loading')}
              </p>
            ) : null}

            {hasError && !isLoading ? (
              <p className="text-center text-stone-500" role="status">
                {t('common.unableToLoad')}
              </p>
            ) : null}

            {!isLoading && !hasError ? (
              <div className="space-y-16">
                {manifestoIntroParagraphs.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.6 }}
                    className="max-w-3xl mx-auto text-center"
                    {...getVisualEditorAttributes(`${storyFieldPath}.manifestoIntro`)}
                  >
                    {manifestoIntroParagraphs.map((paragraph) => (
                      <p key={paragraph} className="text-lg text-stone-600 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </motion.div>
                ) : null}

                {manifestoStatements.length > 0 ? (
                  <div
                    className="space-y-14"
                    {...getVisualEditorAttributes(`${storyFieldPath}.manifestoStatements`)}
                    data-sb-field-path={`${storyFieldPath}.manifestoStatements`}
                  >
                    {manifestoStatements.map(({ statement, index }) => {
                      const statementFieldPath = `${storyFieldPath}.manifestoStatements.${index}`;
                      const paragraphs = splitIntoParagraphs(statement.body);
                      const key = statement.heading ?? statement.highlight ?? (paragraphs[0] ?? `manifesto-${index}`);

                      return (
                        <motion.article
                          key={key}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: '-50px' }}
                          transition={{ duration: 0.5, delay: index * 0.05 }}
                          className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-100"
                          {...getVisualEditorAttributes(statementFieldPath)}
                          data-sb-field-path={statementFieldPath}
                        >
                          {isNonEmptyString(statement.heading) ? (
                            <h2 className="text-2xl font-semibold tracking-tight" {...getVisualEditorAttributes(`${statementFieldPath}.heading`)}>
                              {statement.heading}
                            </h2>
                          ) : null}
                          {isNonEmptyString(statement.highlight) ? (
                            <p
                              className="mt-3 text-base uppercase tracking-[0.2em] text-stone-400"
                              {...getVisualEditorAttributes(`${statementFieldPath}.highlight`)}
                            >
                              {statement.highlight}
                            </p>
                          ) : null}
                          {paragraphs.length > 0 ? (
                            <div
                              className="mt-5 space-y-4 text-stone-600 leading-relaxed"
                              {...getVisualEditorAttributes(`${statementFieldPath}.body`)}
                            >
                              {paragraphs.map((paragraph) => (
                                <p key={`${key}-${paragraph}`}>{paragraph}</p>
                              ))}
                            </div>
                          ) : null}
                        </motion.article>
                      );
                    })}
                  </div>
                ) : null}

                {values.length > 0 ? (
                  <div
                    className="rounded-2xl bg-stone-900 px-6 py-12 sm:px-10 sm:py-14 text-stone-100"
                    {...getVisualEditorAttributes(`${storyFieldPath}.values`)}
                    data-sb-field-path={`${storyFieldPath}.values`}
                  >
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                      className="text-3xl font-semibold tracking-tight text-center"
                    >
                      {t('story.valuesHeading')}
                    </motion.h2>
                    <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                      {values.map(({ value, index }) => {
                        const valueFieldPath = `${storyFieldPath}.values.${index}`;
                        const key = value.title ?? value.description ?? `value-${index}`;

                        return (
                          <motion.div
                            key={key}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                            className="rounded-xl bg-stone-800/50 p-6 shadow-sm ring-1 ring-stone-700"
                            {...getVisualEditorAttributes(valueFieldPath)}
                            data-sb-field-path={valueFieldPath}
                          >
                            {isNonEmptyString(value.title) ? (
                              <h3 className="text-lg font-semibold" {...getVisualEditorAttributes(`${valueFieldPath}.title`)}>
                                {value.title}
                              </h3>
                            ) : null}
                            {isNonEmptyString(value.description) ? (
                              <p
                                className="mt-3 text-sm leading-relaxed text-stone-300"
                                {...getVisualEditorAttributes(`${valueFieldPath}.description`)}
                              >
                                {value.description}
                              </p>
                            ) : null}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {closingNote ? (
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="rounded-2xl border border-stone-200 bg-white p-10 text-center"
                    {...getVisualEditorAttributes(`${storyFieldPath}.closing`)}
                    data-sb-field-path={`${storyFieldPath}.closing`}
                  >
                    {isNonEmptyString(closingNote.heading) ? (
                      <h2
                        className="text-2xl font-semibold tracking-tight"
                        {...getVisualEditorAttributes(`${storyFieldPath}.closing.heading`)}
                      >
                        {closingNote.heading}
                      </h2>
                    ) : null}
                    {isNonEmptyString(closingNote.body) ? (
                      <div
                        className="mt-4 space-y-4 text-stone-600 leading-relaxed"
                        {...getVisualEditorAttributes(`${storyFieldPath}.closing.body`)}
                      >
                        {splitIntoParagraphs(closingNote.body).map((paragraph) => (
                          <p key={paragraph}>{paragraph}</p>
                        ))}
                      </div>
                    ) : null}
                  </motion.section>
                ) : null}
              </div>
            ) : null}

            {sections.length > 0 ? (
              <div className="mt-20 sm:mt-28">
                <SectionRenderer sections={sections} fieldPath={`${storyFieldPath}.sections`} />
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
};

export default StoryManifestoPage;
