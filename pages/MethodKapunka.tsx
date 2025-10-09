import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { useVisualEditorSync } from '../contexts/VisualEditorSyncContext';
import { getCloudinaryUrl } from '../utils/imageUrl';
import Seo from '../src/components/Seo';
import { loadLocalizedMarkdown, toVisualEditorObjectId } from '../utils/localizedContent';

interface PillarContent {
  title?: string;
  description?: string;
}

interface MechanismStep {
  title?: string;
  description?: string;
}

interface MethodMedia {
  embedUrl?: string;
  video?: {
    url?: string;
    caption?: string;
  };
}

interface MethodContent {
  metaTitle?: string;
  metaDescription?: string;
  headline?: string;
  subheadline?: string;
  philosophy?: string;
  pillars?: {
    prevention?: PillarContent;
    cicatrisation?: PillarContent;
    deInflammation?: PillarContent;
    recovery?: PillarContent;
    emotionalSupport?: PillarContent;
  };
  arganMechanism?: {
    overview?: string;
    steps?: MechanismStep[];
  };
  media?: MethodMedia;
}

const METHOD_BASE_PATH = '/content/pages/method/index.md';
const METHOD_DOCUMENT_TYPE = 'MethodKapunkaPage';

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';

const isPillarContent = (value: unknown): value is PillarContent => {
  if (!isRecord(value)) {
    return false;
  }

  const { title, description } = value;
  return (
    (title === undefined || typeof title === 'string')
    && (description === undefined || typeof description === 'string')
  );
};

const isMechanismStep = (value: unknown): value is MechanismStep => {
  if (!isRecord(value)) {
    return false;
  }

  const { title, description } = value;
  return (
    (title === undefined || typeof title === 'string')
    && (description === undefined || typeof description === 'string')
  );
};

const isMethodMedia = (value: unknown): value is MethodMedia => {
  if (!isRecord(value)) {
    return false;
  }

  const { embedUrl, video } = value;
  if (embedUrl !== undefined && typeof embedUrl !== 'string') {
    return false;
  }

  if (video !== undefined) {
    if (!isRecord(video)) {
      return false;
    }

    if (video.url !== undefined && typeof video.url !== 'string') {
      return false;
    }

    if (video.caption !== undefined && typeof video.caption !== 'string') {
      return false;
    }
  }

  return true;
};

const isMethodContent = (value: unknown): value is MethodContent => {
  if (!isRecord(value)) {
    return false;
  }

  const { philosophy, pillars, arganMechanism, media, metaTitle, metaDescription } = value;

  if (philosophy !== undefined && typeof philosophy !== 'string') {
    return false;
  }

  if (pillars !== undefined) {
    if (!isRecord(pillars)) {
      return false;
    }

    const pillarEntries = ['prevention', 'cicatrisation', 'deInflammation', 'recovery', 'emotionalSupport'] as const;
    for (const key of pillarEntries) {
      const pillar = pillars[key];
      if (pillar !== undefined && !isPillarContent(pillar)) {
        return false;
      }
    }
  }

  if (arganMechanism !== undefined) {
    if (!isRecord(arganMechanism)) {
      return false;
    }

    if (arganMechanism.overview !== undefined && typeof arganMechanism.overview !== 'string') {
      return false;
    }

    if (arganMechanism.steps !== undefined) {
      if (!Array.isArray(arganMechanism.steps) || !arganMechanism.steps.every(isMechanismStep)) {
        return false;
      }
    }
  }

  if (media !== undefined && !isMethodMedia(media)) {
    return false;
  }

  const { headline, subheadline } = value;
  return (
    (headline === undefined || typeof headline === 'string')
    && (subheadline === undefined || typeof subheadline === 'string')
    && (metaTitle === undefined || typeof metaTitle === 'string')
    && (metaDescription === undefined || typeof metaDescription === 'string')
  );
};

const PILLAR_ORDER = ['prevention', 'cicatrisation', 'deInflammation', 'recovery', 'emotionalSupport'] as const;

const MethodKapunka: React.FC = () => {
  const [contentState, setContentState] = useState<{ content: MethodContent; filePath: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { contentVersion } = useVisualEditorSync();
  const { t, language } = useLanguage();
  const { settings } = useSiteSettings();

  useEffect(() => {
    let isMounted = true;
    setContentState(null);
    setError(null);

    const loadContent = async () => {
      try {
        const result = await loadLocalizedMarkdown<MethodContent>({
          slug: 'method-kapunka',
          locale: language,
          basePath: METHOD_BASE_PATH,
          validate: isMethodContent,
        });

        if (!isMounted) {
          return;
        }

        setContentState({ content: result.data, filePath: result.filePath });
        setError(null);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        console.error('Failed to load Method Kapunka content', err);
        setContentState(null);
        setError(err instanceof Error ? err.message : 'Failed to load Method Kapunka content.');
      }
    };

    loadContent().catch((err) => {
      if (!isMounted) {
        return;
      }
      console.error('Unhandled error while loading Method Kapunka content', err);
      setContentState(null);
      setError(err instanceof Error ? err.message : 'Failed to load Method Kapunka content.');
    });

    return () => {
      isMounted = false;
    };
  }, [language, contentVersion]);

  const content = contentState?.content ?? null;
  const methodObjectId = toVisualEditorObjectId(
    METHOD_DOCUMENT_TYPE,
    contentState?.filePath ?? METHOD_BASE_PATH,
  );

  const philosophyParagraphs = useMemo(() => {
    if (!content?.philosophy) {
      return [];
    }

    return content.philosophy
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0);
  }, [content?.philosophy]);

  const mechanismSteps = content?.arganMechanism?.steps?.filter((step) => step && (step.title?.trim() || step.description?.trim())) ?? [];

  const metaTitle = (content?.metaTitle ?? content?.headline ?? t('methodKapunka.metaTitle'))?.trim();
  const metaDescription = (
    content?.metaDescription
    ?? content?.subheadline
    ?? t('methodKapunka.metaDescription')
  )?.trim();
  const pageTitle = `${metaTitle} | Kapunka Skincare`;
  const fallbackSocialImage = settings.home?.heroImage?.trim() ?? '';
  const socialImageSource = content?.media?.video?.url?.trim()
    || content?.media?.embedUrl?.trim()
    || fallbackSocialImage;
  const socialImage = socialImageSource
    ? getCloudinaryUrl(socialImageSource) ?? socialImageSource
    : undefined;

  return (
    <div className="bg-white text-stone-800" data-sb-object-id={methodObjectId}>
      <Seo
        title={pageTitle}
        description={metaDescription}
        image={socialImage}
        locale={language}
      />

      <section className="bg-stone-100 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            className="text-4xl font-semibold tracking-tight sm:text-5xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            data-sb-field-path="headline"
          >
            {content?.headline ?? 'Method Kapunka'}
          </motion.h1>
          <motion.p
            className="mt-6 text-lg text-stone-600 sm:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            data-sb-field-path="subheadline"
          >
            {content?.subheadline ?? 'Bridging ancestral argan rituals with clinically sequenced recovery pathways.'}
          </motion.p>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {philosophyParagraphs.length > 0 ? (
            <div className="rounded-2xl bg-stone-900 p-8 text-stone-100 shadow-lg" data-sb-field-path="philosophy">
              <h2 className="text-2xl font-semibold">Philosophy</h2>
              <div className="mt-4 space-y-4 text-base leading-relaxed">
                {philosophyParagraphs.map((paragraph, index) => (
                  <p key={`philosophy-${index}`}>{paragraph}</p>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="bg-stone-50 py-16 sm:py-24" data-sb-field-path="pillars">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-baseline justify-between gap-6">
            <h2 className="text-3xl font-semibold text-stone-900">The five pillars</h2>
            <span className="text-sm uppercase tracking-wide text-stone-400">Prevention → Support</span>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {PILLAR_ORDER.map((key) => {
              const pillar = content?.pillars?.[key];
              if (!pillar || (!pillar.title && !pillar.description)) {
                return null;
              }

              return (
                <motion.div
                  key={key}
                  className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45 }}
                  data-sb-field-path={key}
                >
                  <h3 className="text-lg font-semibold uppercase tracking-wide text-stone-500">
                    {pillar.title ?? key}
                  </h3>
                  {pillar.description ? (
                    <p className="mt-3 text-base text-stone-600">{pillar.description}</p>
                  ) : null}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {content?.arganMechanism?.overview || mechanismSteps.length > 0 ? (
        <section className="py-16 sm:py-24" data-sb-field-path="arganMechanism">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
              <div className="md:flex md:items-start md:justify-between md:gap-10">
                <div className="md:w-1/3">
                  <h2 className="text-2xl font-semibold text-stone-900">Argan's mechanism</h2>
                  {content?.arganMechanism?.overview ? (
                    <p className="mt-4 text-base text-stone-600" data-sb-field-path="overview">
                      {content.arganMechanism.overview}
                    </p>
                  ) : null}
                </div>
                {mechanismSteps.length > 0 ? (
                  <div className="mt-8 grid gap-6 md:mt-0 md:w-2/3">
                    {mechanismSteps.map((step, index) => (
                      <motion.div
                        key={[step.title, index].join('|')}
                        className="rounded-xl bg-stone-50 p-5"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.45, delay: index * 0.05 }}
                        data-sb-field-path={`steps.${index}`}
                      >
                        {step.title ? (
                          <h3 className="text-lg font-semibold text-stone-800">{step.title}</h3>
                        ) : null}
                        {step.description ? (
                          <p className="mt-2 text-sm text-stone-600">{step.description}</p>
                        ) : null}
                      </motion.div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {content?.media?.embedUrl || content?.media?.video?.url ? (
        <section className="bg-stone-900 py-16 sm:py-24" data-sb-field-path="media">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-stone-100">
            <h2 className="text-2xl font-semibold">Watch Method Kapunka in practice</h2>
            <div className="mt-8 grid gap-10 md:grid-cols-2">
              {content?.media?.embedUrl ? (
                <div className="relative aspect-video overflow-hidden rounded-xl border border-stone-700 bg-stone-950">
                  <iframe
                    src={content.media.embedUrl}
                    title="Method Kapunka video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                    data-sb-field-path="embedUrl#@src"
                  />
                </div>
              ) : null}
              {content?.media?.video?.url ? (
                <div className="space-y-4">
                  <div className="relative aspect-video overflow-hidden rounded-xl border border-stone-700 bg-black">
                    <iframe
                      src={content.media.video.url}
                      title={content.media.video.caption ?? 'Method Kapunka video'}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="h-full w-full"
                      data-sb-field-path="video.url#@src"
                    />
                  </div>
                  {content.media.video.caption ? (
                    <p className="text-sm text-stone-300" data-sb-field-path="video.caption">
                      {content.media.video.caption}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {error ? (
        <div className="mx-auto max-w-3xl px-4 py-12 text-sm text-red-600">{error}</div>
      ) : null}
    </div>
  );
};

export default MethodKapunka;
