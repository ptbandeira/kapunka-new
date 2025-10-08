import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { getCloudinaryUrl } from '../utils/imageUrl';
import SectionRenderer from '../components/SectionRenderer';
import type { Language, PageContent, PageSection, TimelineEntry, TimelineSectionContent } from '../types';
import { fetchContentMarkdown } from '../utils/fetchContentMarkdown';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';
import { useVisualEditorSync } from '../contexts/VisualEditorSyncContext';
import Seo from '../src/components/Seo';
import { loadPage } from '../src/lib/content';
import { filterVisible } from '../utils/contentVisibility';
import { loadUnifiedPage } from '../utils/unifiedPageLoader';

const isTimelineEntry = (value: unknown): value is TimelineEntry => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const entry = value as Record<string, unknown>;
  return (
    typeof entry.year === 'string'
    && typeof entry.title === 'string'
    && typeof entry.description === 'string'
    && (entry.image === undefined || typeof entry.image === 'string')
  );
};

const isTimelineSection = (value: unknown): value is TimelineSectionContent => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const section = value as Record<string, unknown>;
  if (section.type !== 'timeline' || !Array.isArray(section.entries)) {
    return false;
  }

  return section.entries.every(isTimelineEntry);
};

const isImageTextHalfSection = (value: unknown): value is PageSection => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const section = value as Record<string, unknown>;

  return (
    section.type === 'imageTextHalf'
    && (section.image === undefined || typeof section.image === 'string')
    && (section.title === undefined || typeof section.title === 'string')
    && (section.text === undefined || typeof section.text === 'string')
  );
};

const isImageGridItem = (value: unknown): value is { image?: string; title?: string; subtitle?: string } => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    (item.image === undefined || typeof item.image === 'string')
    && (item.title === undefined || typeof item.title === 'string')
    && (item.subtitle === undefined || typeof item.subtitle === 'string')
  );
};

const isImageGridSection = (value: unknown): value is PageSection => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const section = value as Record<string, unknown>;

  return section.type === 'imageGrid' && Array.isArray(section.items) && section.items.every(isImageGridItem);
};

const SUPPORTED_SECTION_TYPES = new Set<PageSection['type']>([
  'timeline',
  'imageTextHalf',
  'imageGrid',
  'communityCarousel',
  'videoGallery',
  'trainingList',
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

  if (type === 'timeline') {
    return isTimelineSection(section);
  }

  if (type === 'imageTextHalf') {
    return isImageTextHalfSection(section);
  }

  if (type === 'imageGrid') {
    return isImageGridSection(section);
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

interface AboutStoryBlock {
  heading?: string;
  body?: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
}

interface AboutPageData extends Record<string, unknown> {
  metaTitle?: string;
  metaDescription?: string;
  headerTitle?: string;
  headerSubtitle?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  title?: string;
  storyTitle?: string;
  storyText1?: string;
  storyText2?: string;
  sourcingTitle?: string;
  sourcingText1?: string;
  sourcingText2?: string;
  sourcingImageAlt?: string;
  story?: AboutStoryBlock[];
  sections?: PageSection[];
  visible?: boolean;
}

interface AboutPageContentResult {
  data: AboutPageData;
  locale: Language;
}

interface StoryPageContentResult {
  data: PageContent;
  locale: Language;
}

const isAboutStoryBlock = (value: unknown): value is AboutStoryBlock => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const block = value as Record<string, unknown>;

  return (
    (block.heading === undefined || typeof block.heading === 'string')
    && (block.body === undefined || typeof block.body === 'string')
    && (block.imageUrl === undefined || block.imageUrl === null || typeof block.imageUrl === 'string')
    && (block.imageAlt === undefined || block.imageAlt === null || typeof block.imageAlt === 'string')
  );
};

const STRING_FIELDS: Array<keyof AboutPageData> = [
  'metaTitle',
  'metaDescription',
  'headerTitle',
  'headerSubtitle',
  'heroTitle',
  'heroSubtitle',
  'title',
  'storyTitle',
  'storyText1',
  'storyText2',
  'sourcingTitle',
  'sourcingText1',
  'sourcingText2',
  'sourcingImageAlt',
];

const isAboutPageContent = (value: unknown): value is AboutPageData => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const content = value as Record<string, unknown>;

  if (content.story !== undefined) {
    if (!Array.isArray(content.story) || !content.story.every(isAboutStoryBlock)) {
      return false;
    }
  }

  if (content.sections !== undefined) {
    if (!Array.isArray(content.sections) || !content.sections.every(isPageSection)) {
      return false;
    }
  }

  for (const field of STRING_FIELDS) {
    const candidate = content[field as string];
    if (candidate !== undefined && candidate !== null && typeof candidate !== 'string') {
      return false;
    }
  }

  if (content.visible !== undefined && typeof content.visible !== 'boolean') {
    return false;
  }

  return true;
};

const About: React.FC = () => {
  const { t, language, translate } = useLanguage();
  const { settings } = useSiteSettings();
  const translationsAboutFieldPath = `translations.${language}.about`;
  const defaultStoryImage = 'https://images.unsplash.com/photo-1598555769781-8714b14a293f?q=80&w=1974&auto=format&fit=crop';
  const defaultSourcingImage = 'https://images.unsplash.com/photo-1616893904984-7a57a3b35338?q=80&w=1964&auto=format&fit=crop';
  const storyImageSourceRaw = settings.about?.storyImage || defaultStoryImage;
  const sourcingImageSourceRaw = settings.about?.sourcingImage || defaultSourcingImage;
  const storyImageSource = storyImageSourceRaw ? storyImageSourceRaw.trim() : '';
  const sourcingImageSource = sourcingImageSourceRaw ? sourcingImageSourceRaw.trim() : '';
  const storyImage = storyImageSource ? getCloudinaryUrl(storyImageSource) ?? storyImageSource : '';
  const sourcingImage = sourcingImageSource ? getCloudinaryUrl(sourcingImageSource) ?? sourcingImageSource : '';
  const [aboutContent, setAboutContent] = useState<AboutPageContentResult | null>(null);
  const [aboutContentLoaded, setAboutContentLoaded] = useState(false);
  const [storyContent, setStoryContent] = useState<StoryPageContentResult | null>(null);
  const { contentVersion } = useVisualEditorSync();

  useEffect(() => {
    let isMounted = true;
    setAboutContent(null);
    setAboutContentLoaded(false);

    const loadAboutContent = async () => {
      try {
        const unified = await loadUnifiedPage<AboutPageData>('about', language);
        if (unified) {
          if (!isAboutPageContent(unified.data)) {
            console.error('Invalid about page content structure from unified loader');
          } else if (isMounted) {
            setAboutContent(unified);
            return;
          }
        }

        let result;

        try {
          result = await loadPage({
            slug: 'about',
            locale: language,
            loader: async ({ locale: currentLocale }) => fetchContentMarkdown<AboutPageData>(
              `/content/pages/${currentLocale}/about.md`,
              { cache: 'no-store' },
            ),
          });
        } catch (error) {
          console.error('Failed to load about page content', error);
          if (isMounted) {
            setAboutContent(null);
          }
          return;
        }

        if (!isMounted) {
          return;
        }

        let payload: unknown = result.data;

        if (!isAboutPageContent(payload) && result.localeUsed !== 'en') {
          try {
            result = await loadPage({
              slug: 'about',
              locale: 'en',
              loader: async ({ locale: fallbackLocale }) => fetchContentMarkdown<AboutPageData>(
                `/content/pages/${fallbackLocale}/about.md`,
                { cache: 'no-store' },
              ),
            });

            if (!isMounted) {
              return;
            }

            payload = result.data;
          } catch (fallbackError) {
            console.error('Failed to load fallback about page content', fallbackError);
            if (isMounted) {
              setAboutContent(null);
            }
            return;
          }
        }

        if (!isAboutPageContent(payload)) {
          console.error('Invalid about page content structure');
          if (isMounted) {
            setAboutContent(null);
          }
          return;
        }

        if (isMounted) {
        setAboutContent({
          data: payload,
          locale: result.localeUsed,
        });
        }
      } catch (error) {
        console.error('Unhandled error while loading about page content', error);
        if (isMounted) {
          setAboutContent(null);
        }
      } finally {
        if (isMounted) {
          setAboutContentLoaded(true);
        }
      }
    };

    loadAboutContent();

    return () => {
      isMounted = false;
    };
  }, [language, contentVersion]);

  useEffect(() => {
    if (!aboutContentLoaded) {
      return;
    }

    if (aboutContent?.data.sections && aboutContent.data.sections.length > 0) {
      setStoryContent(null);
      return;
    }

    let isMounted = true;
    setStoryContent(null);

    const loadStorySections = async () => {
      let result;

      try {
        result = await loadPage({
          slug: 'story',
          locale: language,
          loader: async ({ locale: currentLocale }) => fetchContentMarkdown<unknown>(
            `/content/pages/${currentLocale}/story.md`,
            { cache: 'no-store' },
          ),
        });
      } catch (error) {
        console.error('Failed to load story timeline content', error);
        if (isMounted) {
          setStoryContent(null);
        }
        return;
      }

      if (!isMounted) {
        return;
      }

      let payload: unknown = result.data;

      if (!isPageContent(payload) && result.localeUsed !== 'en') {
        try {
          result = await loadPage({
            slug: 'story',
            locale: 'en',
            loader: async ({ locale: fallbackLocale }) => fetchContentMarkdown<unknown>(
              `/content/pages/${fallbackLocale}/story.md`,
              { cache: 'no-store' },
            ),
          });

          if (!isMounted) {
            return;
          }

          payload = result.data;
        } catch (fallbackError) {
          console.error('Failed to load fallback story timeline content', fallbackError);
          if (isMounted) {
            setStoryContent(null);
          }
          return;
        }
      }

      if (!isPageContent(payload)) {
        console.error('Invalid story timeline content structure');
        if (isMounted) {
          setStoryContent(null);
        }
        return;
      }

      if (isMounted) {
        setStoryContent({
          data: payload,
          locale: result.localeUsed,
        });
      }
    };

    loadStorySections().catch((error) => {
      console.error('Unhandled error while loading about story sections', error);
    });

    return () => {
      isMounted = false;
    };
  }, [aboutContent, aboutContentLoaded, language, contentVersion]);

  const aboutFieldPath = useMemo(
    () => `pages.about_${aboutContent?.locale ?? language}`,
    [aboutContent, language],
  );

  const storyFieldPath = useMemo(
    () => `pages.story_${storyContent?.locale ?? language}`,
    [storyContent, language],
  );

  const aboutStoryBlocks = aboutContent?.data.story?.filter((block) => {
        if (!block) {
            return false;
        }

        const hasText = Boolean(block.heading?.trim()) || Boolean(block.body?.trim());
        const hasImage = Boolean(block.imageUrl?.trim());
        return hasText || hasImage;
    }) ?? [];

    const sectionsFromAbout = aboutContent?.data.visible === false
        ? []
        : filterVisible(aboutContent?.data.sections ?? []);
    const fallbackSections = storyContent?.data.visible === false
        ? []
        : filterVisible(storyContent?.data.sections ?? []);
    const sectionsToRender = sectionsFromAbout.length > 0 ? sectionsFromAbout : fallbackSections;
    const sectionsFieldPath = sectionsFromAbout.length > 0
        ? `${aboutFieldPath}.sections`
        : `${storyFieldPath}.sections`;

  const sanitize = (value?: string | null): string | undefined => {
    if (typeof value !== 'string') {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };

  const resolveAboutField = (
    keys: (keyof AboutPageData)[],
    fallbackValue: string | undefined,
    fallbackFieldPath?: string,
  ): { value: string; fieldPath?: string } => {
    for (const key of keys) {
      const raw = aboutContent?.data?.[key];
      if (typeof raw === 'string') {
        const candidate = sanitize(raw);
        if (candidate) {
          return {
            value: candidate,
            fieldPath: `${aboutFieldPath}.${key}`,
          };
        }
      }
    }

    const fallback = sanitize(fallbackValue) ?? '';
    return {
      value: fallback,
      fieldPath: fallbackFieldPath,
    };
  };

  const heroTitleData = resolveAboutField(
    ['headerTitle', 'heroTitle', 'title'],
    t('about.headerTitle'),
    `${translationsAboutFieldPath}.headerTitle`,
  );
  const heroSubtitleData = resolveAboutField(
    ['headerSubtitle', 'heroSubtitle'],
    t('about.headerSubtitle'),
    `${translationsAboutFieldPath}.headerSubtitle`,
  );
  const storyTitleData = resolveAboutField(
    ['storyTitle'],
    t('about.storyTitle'),
    `${translationsAboutFieldPath}.storyTitle`,
  );
  const storyText1Data = resolveAboutField(
    ['storyText1'],
    t('about.storyText1'),
    `${translationsAboutFieldPath}.storyText1`,
  );
  const storyText2Data = resolveAboutField(
    ['storyText2'],
    t('about.storyText2'),
    `${translationsAboutFieldPath}.storyText2`,
  );
  const sourcingTitleData = resolveAboutField(
    ['sourcingTitle'],
    t('about.sourcingTitle'),
    `${translationsAboutFieldPath}.sourcingTitle`,
  );
  const sourcingText1Data = resolveAboutField(
    ['sourcingText1'],
    t('about.sourcingText1'),
    `${translationsAboutFieldPath}.sourcingText1`,
  );
  const sourcingText2Data = resolveAboutField(
    ['sourcingText2'],
    t('about.sourcingText2'),
    `${translationsAboutFieldPath}.sourcingText2`,
  );

  const sourcingAltFromContent = typeof aboutContent?.data?.sourcingImageAlt === 'string'
    ? sanitize(aboutContent.data.sourcingImageAlt)
    : undefined;
  const sourcingAlt = sourcingAltFromContent
    ?? translate(settings.about?.sourcingAlt ?? t('about.sourcingImageAlt'));
  const storyAlt = translate(settings.about?.storyAlt ?? 'Brand story');

  const metaTitleBase = sanitize(aboutContent?.data.metaTitle)
    ?? sanitize(storyContent?.data.metaTitle)
    ?? sanitize(heroTitleData.value)
    ?? t('about.metaTitle');
  const computedDescription = sanitize(aboutContent?.data.metaDescription)
    ?? sanitize(storyContent?.data.metaDescription)
    ?? sanitize(heroSubtitleData.value)
    ?? t('about.metaDescription');
  const computedTitle = metaTitleBase.includes('Kapunka') ? metaTitleBase : `${metaTitleBase} | Kapunka Skincare`;
  const fallbackSocialImage = settings.home?.heroImage?.trim() ?? '';
  const socialImageCandidate = storyImage || sourcingImage || fallbackSocialImage;
  const socialImage = socialImageCandidate
    ? getCloudinaryUrl(socialImageCandidate) ?? socialImageCandidate
    : undefined;

  return (
    <div>
        <Seo
            title={computedTitle}
            description={computedDescription}
            image={socialImage}
            locale={language}
        />
      <header className="py-20 sm:py-32 bg-stone-100 text-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {heroTitleData.value ? (
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl font-semibold tracking-tight"
              {...getVisualEditorAttributes(heroTitleData.fieldPath)}
            >
              {heroTitleData.value}
            </motion.h1>
          ) : null}
          {heroSubtitleData.value ? (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-4 text-lg text-stone-600 max-w-3xl mx-auto"
              {...getVisualEditorAttributes(heroSubtitleData.fieldPath)}
            >
              {heroSubtitleData.value}
            </motion.p>
          ) : null}
        </div>
      </header>

      <div className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {aboutStoryBlocks.length > 0 ? (
            <>
              <div className="space-y-16">
                {aboutStoryBlocks.map((block, index) => {
                    const rawImageUrl = block.imageUrl?.trim() ?? '';
                    const imageUrl = rawImageUrl ? getCloudinaryUrl(rawImageUrl) ?? rawImageUrl : '';
                    const hasImage = Boolean(imageUrl);
                    const imageFirst = hasImage && index % 2 === 0;
                    const storyBlockFieldPath = `${aboutFieldPath}.story.${index}`;
                    const textOrderClass = hasImage ? (imageFirst ? 'md:order-2' : 'md:order-1') : '';
                    const imageOrderClass = hasImage ? (imageFirst ? 'md:order-1' : 'md:order-2') : '';
                    const bodyParagraphs = block.body
                        ? block.body.split(/\n\s*\n/).filter(Boolean)
                        : [];
                    const imageFieldPath = `${storyBlockFieldPath}.imageUrl`;

                    const textContent = (
                        <motion.div
                            initial={{ opacity: 0, x: imageFirst ? 30 : -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className={textOrderClass}
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
                                        ? bodyParagraphs.map((paragraph) => (
                                            <p key={`${block.heading ?? 'story'}-${paragraph}`}>{paragraph}</p>
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
                            className={imageOrderClass}
                            {...getVisualEditorAttributes(imageFieldPath)}
                        >
                    <img
                        src={imageUrl}
                        alt={block.imageAlt ?? block.heading ?? (heroTitleData.value || t('about.headerTitle'))}
                                className="rounded-lg shadow-lg"
                            />
                        </motion.div>
                    ) : null;

                    return (
                        <div
                            key={[block.heading, block.body, block.imageUrl]
                                .map((value) => (value ?? '').toString().trim())
                                .filter((value) => value.length > 0)
                                .join('|') || 'story-block'}
                            className={`grid gap-12 ${hasImage ? 'md:grid-cols-2 items-center' : ''}`}
                        >
                            {hasImage && imageFirst ? imageContent : textContent}
                            {hasImage && imageFirst ? textContent : null}
                            {hasImage && !imageFirst ? imageContent : null}
                        </div>
                    );
                })}
              </div>

              {sectionsToRender.length > 0 && (
                <div className="mt-20 sm:mt-28">
                  <SectionRenderer sections={sectionsToRender} fieldPath={sectionsFieldPath} />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                  {storyTitleData.value ? (
                    <h2
                      className="text-3xl font-semibold mb-6"
                      {...getVisualEditorAttributes(storyTitleData.fieldPath)}
                    >
                      {storyTitleData.value}
                    </h2>
                  ) : null}
                  <div className="text-stone-600 leading-relaxed space-y-4">
                    {storyText1Data.value ? (
                      <p {...getVisualEditorAttributes(storyText1Data.fieldPath)}>
                        {storyText1Data.value}
                      </p>
                    ) : null}
                    {storyText2Data.value ? (
                      <p {...getVisualEditorAttributes(storyText2Data.fieldPath)}>
                        {storyText2Data.value}
                      </p>
                    ) : null}
                  </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                  <img
                    src={storyImage}
                    alt={storyAlt}
                    className="rounded-lg shadow-lg"
                    {...getVisualEditorAttributes('site.about.storyImage')}
                  />
                </motion.div>
              </div>

              {sectionsToRender.length > 0 && (
                <div className="mt-20 sm:mt-28">
                  <SectionRenderer sections={sectionsToRender} fieldPath={sectionsFieldPath} />
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-12 items-center mt-20 sm:mt-28">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="md:order-2"
                >
                  {sourcingTitleData.value ? (
                    <h2
                      className="text-3xl font-semibold mb-6"
                      {...getVisualEditorAttributes(sourcingTitleData.fieldPath)}
                    >
                      {sourcingTitleData.value}
                    </h2>
                  ) : null}
                  <div className="text-stone-600 leading-relaxed space-y-4">
                    {sourcingText1Data.value ? (
                      <p {...getVisualEditorAttributes(sourcingText1Data.fieldPath)}>
                        {sourcingText1Data.value}
                      </p>
                    ) : null}
                    {sourcingText2Data.value ? (
                      <p {...getVisualEditorAttributes(sourcingText2Data.fieldPath)}>
                        {sourcingText2Data.value}
                      </p>
                    ) : null}
                  </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="md:order-1"
                >
                  <img
                    src={sourcingImage}
                    alt={sourcingAlt}
                    className="rounded-lg shadow-lg"
                    {...getVisualEditorAttributes('site.about.sourcingImage')}
                  />
                </motion.div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default About;
