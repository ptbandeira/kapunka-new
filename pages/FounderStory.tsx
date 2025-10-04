import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { fetchVisualEditorMarkdown } from '../utils/fetchVisualEditorMarkdown';
import { useVisualEditorSync } from '../contexts/VisualEditorSyncContext';

interface MicroStory {
  quote?: string;
  attribution?: string;
  context?: string;
}

interface MilestoneImage {
  src?: string;
  alt?: string;
}

interface Milestone {
  year?: string;
  title?: string;
  description?: string;
  image?: MilestoneImage;
}

interface GalleryImage {
  src?: string;
  alt?: string;
}

interface HeroImage {
  src?: string;
  alt?: string;
}

interface FounderStoryContent {
  headline?: string;
  subheadline?: string;
  body?: string;
  microStories?: MicroStory[];
  keyMilestones?: Milestone[];
  images?: {
    hero?: HeroImage;
    gallery?: GalleryImage[];
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';

const isMicroStory = (value: unknown): value is MicroStory => {
  if (!isRecord(value)) {
    return false;
  }

  const { quote, attribution, context } = value;
  return (
    (quote === undefined || typeof quote === 'string')
    && (attribution === undefined || typeof attribution === 'string')
    && (context === undefined || typeof context === 'string')
  );
};

const isMilestoneImage = (value: unknown): value is MilestoneImage => {
  if (!isRecord(value)) {
    return false;
  }

  const { src, alt } = value;
  return (
    (src === undefined || typeof src === 'string')
    && (alt === undefined || typeof alt === 'string')
  );
};

const isMilestone = (value: unknown): value is Milestone => {
  if (!isRecord(value)) {
    return false;
  }

  const { year, title, description, image } = value;
  return (
    (year === undefined || typeof year === 'string')
    && (title === undefined || typeof title === 'string')
    && (description === undefined || typeof description === 'string')
    && (image === undefined || isMilestoneImage(image))
  );
};

const isGalleryImage = (value: unknown): value is GalleryImage => {
  if (!isRecord(value)) {
    return false;
  }

  const { src, alt } = value;
  return (
    (src === undefined || typeof src === 'string')
    && (alt === undefined || typeof alt === 'string')
  );
};

const isHeroImage = (value: unknown): value is HeroImage => isGalleryImage(value);

const isFounderStoryContent = (value: unknown): value is FounderStoryContent => {
  if (!isRecord(value)) {
    return false;
  }

  const { microStories, keyMilestones, images } = value;

  if (microStories !== undefined) {
    if (!Array.isArray(microStories) || !microStories.every(isMicroStory)) {
      return false;
    }
  }

  if (keyMilestones !== undefined) {
    if (!Array.isArray(keyMilestones) || !keyMilestones.every(isMilestone)) {
      return false;
    }
  }

  if (images !== undefined) {
    if (!isRecord(images)) {
      return false;
    }

    if (images.hero !== undefined && !isHeroImage(images.hero)) {
      return false;
    }

    if (images.gallery !== undefined) {
      if (!Array.isArray(images.gallery) || !images.gallery.every(isGalleryImage)) {
        return false;
      }
    }
  }

  const { headline, subheadline, body } = value;
  return (
    (headline === undefined || typeof headline === 'string')
    && (subheadline === undefined || typeof subheadline === 'string')
    && (body === undefined || typeof body === 'string')
  );
};

const FOUNDER_STORY_PATH = '/content/pages/about/index.md';
const FOUNDER_STORY_OBJECT_ID = 'FoundersStoryPage:content/pages/about/index.md';

const FounderStory: React.FC = () => {
  const [content, setContent] = useState<FounderStoryContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { contentVersion } = useVisualEditorSync();

  useEffect(() => {
    let isMounted = true;
    setContent(null);
    setError(null);

    const loadContent = async () => {
      try {
        const { data } = await fetchVisualEditorMarkdown<unknown>(FOUNDER_STORY_PATH, { cache: 'no-store' });
        if (!isMounted) {
          return;
        }

        if (isFounderStoryContent(data)) {
          setContent(data);
        } else {
          setError('Invalid founder story content structure.');
        }
      } catch (err) {
        if (!isMounted) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load founder story content.');
      }
    };

    loadContent().catch((err) => {
      if (!isMounted) {
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load founder story content.');
    });

    return () => {
      isMounted = false;
    };
  }, [contentVersion]);

  const heroImage = content?.images?.hero;
  const galleryImages = content?.images?.gallery?.filter((image) => Boolean(image?.src?.trim())) ?? [];
  const microStories = content?.microStories?.filter((story) => story && (story.quote?.trim() || story.context?.trim())) ?? [];
  const milestones = content?.keyMilestones?.filter((milestone) => (
    Boolean(milestone?.title?.trim()) || Boolean(milestone?.description?.trim()) || Boolean(milestone?.year?.trim())
  )) ?? [];

  const bodyParagraphs = useMemo(() => {
    if (!content?.body) {
      return [];
    }

    return content.body
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0);
  }, [content?.body]);

  const pageTitle = content?.headline ?? 'Founder Story';
  const pageDescription = content?.subheadline ?? 'Discover the story behind Kapunka.';

  return (
    <div className="bg-stone-50 text-stone-800" data-sb-object-id={FOUNDER_STORY_OBJECT_ID}>
      <Helmet>
        <title>{pageTitle} | Kapunka Skincare</title>
        <meta name="description" content={pageDescription} />
      </Helmet>

      <section className="relative overflow-hidden bg-stone-100">
        {heroImage?.src ? (
          <div className="absolute inset-0">
            <img
              src={heroImage.src}
              alt={heroImage.alt ?? 'Founder story hero'}
              className="h-full w-full object-cover opacity-40"
              data-sb-field-path="images.hero.src#@src images.hero.alt#@alt"
            />
          </div>
        ) : null}
        <div className="relative z-10 mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <motion.h1
            className="text-4xl font-semibold tracking-tight sm:text-5xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            data-sb-field-path="headline"
          >
            {content?.headline ?? 'Rooted in cooperatives, refined for clinics'}
          </motion.h1>
          <motion.p
            className="mt-6 text-lg text-stone-600 sm:text-xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            data-sb-field-path="subheadline"
          >
            {content?.subheadline ?? 'Co-founder Monica brings Moroccan argan rituals to modern clinics.'}
          </motion.p>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {bodyParagraphs.length > 0 ? (
            <div className="space-y-6 text-lg leading-relaxed text-stone-700" data-sb-field-path="body">
              {bodyParagraphs.map((paragraph, index) => (
                <p key={`body-${index}`}>{paragraph}</p>
              ))}
            </div>
          ) : null}

          {microStories.length > 0 ? (
            <div className="mt-16 space-y-12" data-sb-field-path="microStories">
              <h2 className="text-2xl font-semibold text-stone-900">Micro-stories</h2>
              <div className="grid gap-8 sm:grid-cols-2">
                {microStories.map((story, index) => (
                  <motion.blockquote
                    key={[story.quote, story.attribution, story.context, index].join('|')}
                    className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    data-sb-field-path={`${index}`}
                  >
                    {story.quote ? (
                      <p className="text-lg font-medium text-stone-900">“{story.quote}”</p>
                    ) : null}
                    {story.attribution ? (
                      <cite className="mt-4 block text-sm font-semibold uppercase tracking-wide text-stone-500">
                        {story.attribution}
                      </cite>
                    ) : null}
                    {story.context ? (
                      <p className="mt-2 text-sm text-stone-500">{story.context}</p>
                    ) : null}
                  </motion.blockquote>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {milestones.length > 0 ? (
        <section className="bg-white py-16 sm:py-24" data-sb-field-path="keyMilestones">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-semibold text-stone-900">Key milestones</h2>
            <div className="mt-10 space-y-10">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={[milestone.year, milestone.title, index].join('|')}
                  className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  data-sb-field-path={`${index}`}
                >
                  <div>
                    {milestone.year ? (
                      <span className="text-sm font-semibold uppercase tracking-wide text-stone-400">
                        {milestone.year}
                      </span>
                    ) : null}
                    {milestone.title ? (
                      <h3 className="mt-2 text-2xl font-semibold text-stone-900">{milestone.title}</h3>
                    ) : null}
                    {milestone.description ? (
                      <p className="mt-4 text-base text-stone-600">{milestone.description}</p>
                    ) : null}
                  </div>
                  {milestone.image?.src ? (
                    <div className="overflow-hidden rounded-xl border border-stone-100 shadow-sm">
                      <img
                        src={milestone.image.src}
                        alt={milestone.image.alt ?? milestone.title ?? 'Milestone'}
                        className="h-full w-full object-cover"
                        data-sb-field-path={`image.src#@src image.alt#@alt`}
                      />
                    </div>
                  ) : null}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {galleryImages.length > 0 ? (
        <section className="bg-stone-100 py-16 sm:py-24" data-sb-field-path="images.gallery">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-semibold text-stone-900">Gallery</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {galleryImages.map((image, index) => (
                <motion.div
                  key={[image.src, image.alt, index].join('|')}
                  className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.04 }}
                  data-sb-field-path={`${index}`}
                >
                  {image.src ? (
                    <img
                      src={image.src}
                      alt={image.alt ?? 'Founder gallery'}
                      className="h-56 w-full object-cover"
                      data-sb-field-path="src#@src alt#@alt"
                    />
                  ) : null}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {error ? (
        <div className="mx-auto max-w-3xl px-4 pb-16 text-sm text-red-600">{error}</div>
      ) : null}
    </div>
  );
};

export default FounderStory;
