import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import SectionRenderer from '../components/SectionRenderer';
import type { PageContent, PageSection, TimelineEntry, TimelineSectionContent } from '../types';

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

const isPageContent = (value: unknown): value is PageContent => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const content = value as Record<string, unknown>;
  if (!Array.isArray(content.sections)) {
    return false;
  }

  return content.sections.every(isTimelineSection);
};

const About: React.FC = () => {
    const { t, language } = useLanguage();
    const { settings } = useSiteSettings();
    const aboutFieldPath = `translations.${language}.about`;
    const defaultStoryImage = 'https://images.unsplash.com/photo-1598555769781-8714b14a293f?q=80&w=1974&auto=format&fit=crop';
    const defaultSourcingImage = 'https://images.unsplash.com/photo-1616893904984-7a57a3b35338?q=80&w=1964&auto=format&fit=crop';
    const storyImage = settings.about?.storyImage || defaultStoryImage;
    const sourcingImage = settings.about?.sourcingImage || defaultSourcingImage;
    const storyAlt = settings.about?.storyAlt || 'Brand story';
    const sourcingAlt = settings.about?.sourcingAlt || t('about.sourcingImageAlt');
    const [storyContent, setStoryContent] = useState<PageContent | null>(null);

    useEffect(() => {
        let isMounted = true;
        setStoryContent(null);

        const loadStorySections = async () => {
            const localesToTry = [language, 'en'].filter((locale, index, arr) => arr.indexOf(locale) === index);

            for (const locale of localesToTry) {
                try {
                    const response = await fetch(`/content/pages/${locale}/story.json`);
                    if (!response.ok) {
                        continue;
                    }

                    const data = (await response.json()) as unknown;
                    if (!isMounted) {
                        return;
                    }

                    if (isPageContent(data)) {
                        setStoryContent(data);
                        return;
                    }
                } catch (error) {
                    if (locale === localesToTry[localesToTry.length - 1]) {
                        console.error('Failed to load story timeline content', error);
                    }
                }
            }

            if (isMounted) {
                setStoryContent(null);
            }
        };

        void loadStorySections();

        return () => {
            isMounted = false;
        };
    }, [language]);

    const timelineFieldPath = `pages.story_${language}.sections`;
    const storySections = storyContent?.sections ?? [];
    const computedTitle = storyContent?.metaTitle ?? `${t('about.title')} | Kapunka Skincare`;
    const computedDescription = storyContent?.metaDescription ?? t('about.metaDescription');
  return (
    <div>
        <Helmet>
            <title>{computedTitle}</title>
            <meta name="description" content={computedDescription} />
        </Helmet>
      <header className="py-20 sm:py-32 bg-stone-100 text-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl font-semibold tracking-tight"
            data-nlv-field-path={`${aboutFieldPath}.headerTitle`}
          >
            {t('about.headerTitle')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-lg text-stone-600 max-w-3xl mx-auto"
            data-nlv-field-path={`${aboutFieldPath}.headerSubtitle`}
          >
            {t('about.headerSubtitle')}
          </motion.p>
        </div>
      </header>

      <div className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
            >
              <h2
                className="text-3xl font-semibold mb-6"
                data-nlv-field-path={`${aboutFieldPath}.storyTitle`}
              >
                {t('about.storyTitle')}
              </h2>
              <div className="text-stone-600 leading-relaxed space-y-4">
                <p data-nlv-field-path={`${aboutFieldPath}.storyText1`}>
                  {t('about.storyText1')}
                </p>
                <p data-nlv-field-path={`${aboutFieldPath}.storyText2`}>
                  {t('about.storyText2')}
                </p>
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
                data-nlv-field-path="site.about.storyImage"
              />
            </motion.div>
          </div>

          {storySections.length > 0 && (
            <div className="mt-20 sm:mt-28">
              <SectionRenderer sections={storySections} fieldPath={timelineFieldPath} />
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
              <h2
                className="text-3xl font-semibold mb-6"
                data-nlv-field-path={`${aboutFieldPath}.sourcingTitle`}
              >
                {t('about.sourcingTitle')}
              </h2>
              <div className="text-stone-600 leading-relaxed space-y-4">
                <p data-nlv-field-path={`${aboutFieldPath}.sourcingText1`}>
                  {t('about.sourcingText1')}
                </p>
                <p data-nlv-field-path={`${aboutFieldPath}.sourcingText2`}>
                  {t('about.sourcingText2')}
                </p>
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
                data-nlv-field-path="site.about.sourcingImage"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;