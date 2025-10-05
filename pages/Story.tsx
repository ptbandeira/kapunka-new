import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import SectionRenderer from '../components/_legacy/SectionRenderer';
import { useLanguage } from '../contexts/LanguageContext';
import { useVisualEditorSync } from '../contexts/VisualEditorSyncContext';
import type { PageSection } from '../types';
import { fetchVisualEditorMarkdown } from '../utils/fetchVisualEditorMarkdown';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';
import { getCloudinaryUrl } from '../utils/imageUrl';

const SUPPORTED_SECTION_TYPES = new Set<PageSection['type']>([
  'timeline',
  'imageTextHalf',
  'imageGrid',
  'videoGallery',
  'trainingList',
]);

interface StoryBlock {
  heading?: string | null;
  body?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
}

interface StoryPageContent {
  metaTitle?: string;
  metaDescription?: string;
  tagline?: string;
  story?: StoryBlock[];
  sections?: PageSection[];
}

const isStoryBlock = (value: unknown): value is StoryBlock => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const block = value as Record<string, unknown>;

  return (
    (block.heading === undefined || block.heading === null || typeof block.heading === 'string')
    && (block.body === undefined || block.body === null || typeof block.body === 'string')
    && (block.imageUrl === undefined || block.imageUrl === null || typeof block.imageUrl === 'string')
    && (block.imageAlt === undefined || block.imageAlt === null || typeof block.imageAlt === 'string')
  );
};

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

const isStoryPageContent = (value: unknown): value is StoryPageContent => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const content = value as Record<string, unknown>;

  if (content.story !== undefined) {
    if (!Array.isArray(content.story) || !content.story.every(isStoryBlock)) {
      return false;
    }
  }

  if (content.sections !== undefined) {
    if (!Array.isArray(content.sections) || !content.sections.every(isPageSection)) {
      return false;
    }
  }

  return (
    (content.metaTitle === undefined || typeof content.metaTitle === 'string')
    && (content.metaDescription === undefined || typeof content.metaDescription === 'string')
    && (content.tagline === undefined || typeof content.tagline === 'string')
  );
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

const Story: React.FC = () => {
  const { t, language } = useLanguage();
  const { contentVersion } = useVisualEditorSync();
  const [pageContent, setPageContent] = useState<StoryPageContent | null>(null);

  useEffect(() => {
    let isMounted = true;
    setPageContent(null);

    const loadStoryContent = async () => {
      const localesToTry = [language, 'en'].filter((locale, index, arr) => arr.indexOf(locale) === index);

      for (const locale of localesToTry) {
        try {
          const { data } = await fetchVisualEditorMarkdown<unknown>(
            `/content/pages/${locale}/story.md`,
            { cache: 'no-store' },
          );

          if (!isMounted) {
            return;
          }

          if (isStoryPageContent(data)) {
            setPageContent(data);
            return;
          }
        } catch (error) {
          if (locale === localesToTry[localesToTry.length - 1]) {
            console.error('Failed to load story page content', error);
          }
        }
      }

      if (isMounted) {
        setPageContent(null);
      }
    };

    loadStoryContent().catch((error) => {
      console.error('Unhandled error while loading story page content', error);
    });

    return () => {
      isMounted = false;
    };
  }, [language, contentVersion]);

  const storyFieldPath = `pages.story_${language}`;
  const storyBlocks = useMemo(() => {
    if (!pageContent?.story) {
      return [] as Array<{ block: StoryBlock; index: number }>;
    }

    return pageContent.story
      .map((block, index) => ({ block, index }))
      .filter(({ block }) => {
        if (!block) {
          return false;
        }

        const hasText = Boolean(block.heading?.trim()) || Boolean(block.body?.trim());
        const hasImage = Boolean(block.imageUrl?.trim());
        return hasText || hasImage;
      });
  }, [pageContent?.story]);

  const sections = useMemo(() => {
    if (!pageContent?.sections) {
      return [] as PageSection[];
    }

    return pageContent.sections.filter(isPageSection);
  }, [pageContent?.sections]);

  const computedTitle = useMemo(() => {
    const baseTitle = pageContent?.metaTitle ?? t('nav.manifesto');
    return baseTitle.includes('Kapunka') ? baseTitle : `${baseTitle} | Kapunka Skincare`;
  }, [pageContent?.metaTitle, t]);

  const computedDescription = pageContent?.metaDescription ?? pageContent?.tagline ?? t('about.metaDescription');

  return (
    <div>
      <Helmet>
        <title>{computedTitle}</title>
        {computedDescription && <meta name="description" content={computedDescription} />}
      </Helmet>

      <header className="py-20 sm:py-32 bg-stone-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl font-semibold tracking-tight"
            {...getVisualEditorAttributes(`translations.${language}.nav.manifesto`)}
          >
            {t('nav.manifesto')}
          </motion.h1>
          {pageContent?.tagline ? (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-4 text-lg text-stone-600 max-w-2xl mx-auto"
              {...getVisualEditorAttributes(`${storyFieldPath}.tagline`)}
            >
              {pageContent.tagline}
            </motion.p>
          ) : null}
        </div>
      </header>

      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {storyBlocks.length > 0 ? (
            <div
              className="space-y-16"
              {...getVisualEditorAttributes(`${storyFieldPath}.story`)}
              data-sb-field-path={`${storyFieldPath}.story`}
            >
              {storyBlocks.map(({ block, index }) => {
                const rawImageUrl = block.imageUrl?.trim() ?? '';
                const imageUrl = rawImageUrl ? getCloudinaryUrl(rawImageUrl) ?? rawImageUrl : undefined;
                const hasImage = Boolean(imageUrl);
                const imageFirst = hasImage && index % 2 === 0;
                const storyBlockFieldPath = `${storyFieldPath}.story.${index}`;
                const bodyParagraphs = splitIntoParagraphs(block.body);

                const textContent = (
                  <motion.div
                    initial={{ opacity: 0, x: imageFirst ? 30 : -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className={hasImage ? (imageFirst ? 'md:order-2' : 'md:order-1') : ''}
                  >
                    {block.heading ? (
                      <h2
                        className="text-3xl font-semibold mb-6"
                        {...getVisualEditorAttributes(`${storyBlockFieldPath}.heading`)}
                      >
                        {block.heading}
                      </h2>
                    ) : null}
                    {block.body ? (
                      <div
                        className="text-stone-600 leading-relaxed space-y-4"
                        {...getVisualEditorAttributes(`${storyBlockFieldPath}.body`)}
                      >
                        {bodyParagraphs.length > 0
                          ? bodyParagraphs.map((paragraph, paragraphIndex) => (
                              <p key={`${storyBlockFieldPath}-paragraph-${paragraphIndex}`}>{paragraph}</p>
                            ))
                          : <p>{block.body}</p>}
                      </div>
                    ) : null}
                  </motion.div>
                );

                const imageContent = hasImage ? (
                  <motion.div
                    initial={{ opacity: 0, x: imageFirst ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className={imageFirst ? 'md:order-1' : 'md:order-2'}
                    {...getVisualEditorAttributes(`${storyBlockFieldPath}.imageUrl`)}
                  >
                    <img
                      src={imageUrl}
                      alt={block.imageAlt ?? block.heading ?? 'Story visual'}
                      className="rounded-lg shadow-lg"
                    />
                  </motion.div>
                ) : null;

                return (
                  <div
                    key={`${storyBlockFieldPath}`}
                    className={`grid gap-12 ${hasImage ? 'md:grid-cols-2 items-center' : ''}`}
                    {...getVisualEditorAttributes(storyBlockFieldPath)}
                    data-sb-field-path={storyBlockFieldPath}
                  >
                    {hasImage && imageFirst ? imageContent : textContent}
                    {hasImage && imageFirst ? textContent : null}
                    {hasImage && !imageFirst ? imageContent : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <p
              className="text-center text-stone-500"
              {...getVisualEditorAttributes(`translations.${language}.common.loading`)}
            >
              {t('common.loading')}
            </p>
          )}

          {sections.length > 0 ? (
            <div className="mt-20 sm:mt-28">
              <SectionRenderer sections={sections} fieldPath={`${storyFieldPath}.sections`} />
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
};

export default Story;
