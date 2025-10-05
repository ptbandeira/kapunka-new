import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { fetchVisualEditorMarkdown } from '../utils/fetchVisualEditorMarkdown';
import { useVisualEditorSync } from '../contexts/VisualEditorSyncContext';
import { getCloudinaryUrl } from '../utils/imageUrl';
import Seo from '../components/Seo';

interface ModuleContent {
  title?: string;
  duration?: string;
  description?: string;
  learningOutcomes?: string[];
}

interface PricingContent {
  tuition?: string;
  paymentOptions?: string[];
}

interface ModalitiesContent {
  onlineHours?: string;
  practicalSessions?: string;
}

interface CallToAction {
  label?: string;
  url?: string;
}

interface TrainingContent {
  metaTitle?: string;
  metaDescription?: string;
  headline?: string;
  subheadline?: string;
  objectives?: string[];
  modules?: ModuleContent[];
  modalities?: ModalitiesContent;
  pricing?: PricingContent;
  callToActions?: CallToAction[];
  metaTitle?: string;
  metaDescription?: string;
}

const TRAINING_FILE_PATH = '/content/pages/training/index.md';
const TRAINING_OBJECT_ID = 'TrainingProgramPage:content/pages/training/index.md';

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';

const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === 'string');

const isModuleContent = (value: unknown): value is ModuleContent => {
  if (!isRecord(value)) {
    return false;
  }

  const { title, duration, description, learningOutcomes } = value;
  return (
    (title === undefined || typeof title === 'string')
    && (duration === undefined || typeof duration === 'string')
    && (description === undefined || typeof description === 'string')
    && (learningOutcomes === undefined || isStringArray(learningOutcomes))
  );
};

const isPricingContent = (value: unknown): value is PricingContent => {
  if (!isRecord(value)) {
    return false;
  }

  const { tuition, paymentOptions } = value;
  return (
    (tuition === undefined || typeof tuition === 'string')
    && (paymentOptions === undefined || isStringArray(paymentOptions))
  );
};

const isModalitiesContent = (value: unknown): value is ModalitiesContent => {
  if (!isRecord(value)) {
    return false;
  }

  const { onlineHours, practicalSessions } = value;
  return (
    (onlineHours === undefined || typeof onlineHours === 'string')
    && (practicalSessions === undefined || typeof practicalSessions === 'string')
  );
};

const isCallToAction = (value: unknown): value is CallToAction => {
  if (!isRecord(value)) {
    return false;
  }

  const { label, url } = value;
  return (
    (label === undefined || typeof label === 'string')
    && (url === undefined || typeof url === 'string')
  );
};

const isTrainingContent = (value: unknown): value is TrainingContent => {
  if (!isRecord(value)) {
    return false;
  }

  const {
    objectives,
    modules,
    modalities,
    pricing,
    callToActions,
    headline,
    subheadline,
    metaTitle,
    metaDescription,
  } = value;

  if (objectives !== undefined && !isStringArray(objectives)) {
    return false;
  }

  if (modules !== undefined) {
    if (!Array.isArray(modules) || !modules.every(isModuleContent)) {
      return false;
    }
  }

  if (modalities !== undefined && !isModalitiesContent(modalities)) {
    return false;
  }

  if (pricing !== undefined && !isPricingContent(pricing)) {
    return false;
  }

  if (callToActions !== undefined) {
    if (!Array.isArray(callToActions) || !callToActions.every(isCallToAction)) {
      return false;
    }
  }

  return (
    (headline === undefined || typeof headline === 'string')
    && (subheadline === undefined || typeof subheadline === 'string')
    && (metaTitle === undefined || typeof metaTitle === 'string')
    && (metaDescription === undefined || typeof metaDescription === 'string')
  );
};

const TrainingProgram: React.FC = () => {
  const [content, setContent] = useState<TrainingContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t, language } = useLanguage();
  const { contentVersion } = useVisualEditorSync();
  const { settings } = useSiteSettings();

  useEffect(() => {
    let isMounted = true;
    setContent(null);
    setError(null);

    const loadContent = async () => {
      try {
        const { data } = await fetchVisualEditorMarkdown<unknown>(TRAINING_FILE_PATH, { cache: 'no-store' });
        if (!isMounted) {
          return;
        }

        if (isTrainingContent(data)) {
          setContent(data);
        } else {
          setError('Invalid training page content structure.');
        }
      } catch (err) {
        if (!isMounted) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load training content.');
      }
    };

    loadContent().catch((err) => {
      if (!isMounted) {
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load training content.');
    });

    return () => {
      isMounted = false;
    };
  }, [contentVersion]);

  const objectives = content?.objectives?.filter((item) => item.trim().length > 0) ?? [];
  const modules = content?.modules?.filter((module) => module && (module.title?.trim() || module.description?.trim())) ?? [];
  const paymentOptions = content?.pricing?.paymentOptions?.filter((option) => option.trim().length > 0) ?? [];
  const ctas = content?.callToActions?.filter((cta) => cta && (cta.label?.trim() || cta.url?.trim())) ?? [];

  const metaTitle = (content?.metaTitle ?? content?.headline ?? t('training.metaTitle'))?.trim();
  const metaDescription = (
    content?.metaDescription
    ?? content?.subheadline
    ?? t('training.metaDescription')
  )?.trim();
  const pageTitle = `${metaTitle} | Kapunka Skincare`;
  const rawSocialImage = settings.home?.heroImage?.trim() ?? '';
  const socialImage = rawSocialImage ? getCloudinaryUrl(rawSocialImage) ?? rawSocialImage : undefined;

  const formattedObjectives = useMemo(() => objectives, [objectives]);

  return (
    <div className="bg-stone-50 text-stone-900" data-sb-object-id={TRAINING_OBJECT_ID}>
      <Seo
        title={pageTitle}
        description={metaDescription}
        image={socialImage}
        locale={language}
      />

      <section className="bg-stone-900 py-20 text-stone-100 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            className="text-4xl font-semibold tracking-tight sm:text-5xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            data-sb-field-path="headline"
          >
            {content?.headline ?? 'Kapunka Clinical Training'}
          </motion.h1>
          <motion.p
            className="mt-5 text-lg text-stone-300 sm:text-xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            data-sb-field-path="subheadline"
          >
            {content?.subheadline ?? 'Equip practitioners with argan-based recovery protocols that blend science and ethics.'}
          </motion.p>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {formattedObjectives.length > 0 ? (
            <div className="rounded-2xl bg-white p-8 shadow-sm" data-sb-field-path="objectives">
              <h2 className="text-2xl font-semibold">Objectives</h2>
              <ul className="mt-6 space-y-4 text-base text-stone-600">
                {formattedObjectives.map((objective, index) => (
                  <li key={[objective, index].join('|')} className="flex items-start gap-3" data-sb-field-path={`${index}`}>
                    <span className="mt-1.5 inline-flex h-2 w-2 flex-none rounded-full bg-stone-900" aria-hidden="true" />
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      {modules.length > 0 ? (
        <section className="bg-stone-100 py-16 sm:py-24" data-sb-field-path="modules">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-semibold text-stone-900">Curriculum modules</h2>
            <div className="mt-12 space-y-6">
              {modules.map((module, index) => (
                <motion.div
                  key={[module.title, index].join('|')}
                  className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.05 }}
                  data-sb-field-path={`${index}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {module.title ? (
                      <h3 className="text-xl font-semibold text-stone-900">{module.title}</h3>
                    ) : null}
                    {module.duration ? (
                      <span className="inline-flex items-center rounded-full bg-stone-900 px-3 py-1 text-sm font-medium text-white">
                        {module.duration}
                      </span>
                    ) : null}
                  </div>
                  {module.description ? (
                    <p className="mt-4 text-base text-stone-600">{module.description}</p>
                  ) : null}
                  {module.learningOutcomes && module.learningOutcomes.length > 0 ? (
                    <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-stone-500" data-sb-field-path="learningOutcomes">
                      {module.learningOutcomes.map((outcome, outcomeIndex) => (
                        <li key={[outcome, outcomeIndex].join('|')} data-sb-field-path={`${outcomeIndex}`}>
                          {outcome}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {(content?.modalities?.onlineHours || content?.modalities?.practicalSessions || content?.pricing?.tuition || paymentOptions.length > 0) ? (
        <section className="py-16 sm:py-24">
          <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div className="rounded-2xl bg-white p-8 shadow-sm" data-sb-field-path="modalities">
              <h2 className="text-2xl font-semibold text-stone-900">Modalities</h2>
              {content?.modalities?.onlineHours ? (
                <p className="mt-4 text-base text-stone-600" data-sb-field-path="onlineHours">
                  <strong className="font-semibold text-stone-900">Online: </strong>
                  {content.modalities.onlineHours}
                </p>
              ) : null}
              {content?.modalities?.practicalSessions ? (
                <p className="mt-3 text-base text-stone-600" data-sb-field-path="practicalSessions">
                  <strong className="font-semibold text-stone-900">Practical: </strong>
                  {content.modalities.practicalSessions}
                </p>
              ) : null}
            </div>
            <div className="rounded-2xl bg-white p-8 shadow-sm" data-sb-field-path="pricing">
              <h2 className="text-2xl font-semibold text-stone-900">Pricing</h2>
              {content?.pricing?.tuition ? (
                <p className="mt-4 text-3xl font-semibold text-stone-900">
                  {content.pricing.tuition}
                </p>
              ) : null}
              {paymentOptions.length > 0 ? (
                <ul className="mt-4 space-y-2 text-sm text-stone-600" data-sb-field-path="paymentOptions">
                  {paymentOptions.map((option, index) => (
                    <li key={[option, index].join('|')} data-sb-field-path={`${index}`}>
                      {option}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {ctas.length > 0 ? (
        <section className="bg-stone-900 py-16 sm:py-24" data-sb-field-path="callToActions">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 text-center text-stone-100 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-semibold">Ready to join?</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {ctas.map((cta, index) => (
                <a
                  key={[cta.label, cta.url, index].join('|')}
                  href={cta.url ?? '#'}
                  className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-stone-900 shadow-sm transition-transform duration-300 hover:scale-105"
                  data-sb-field-path={`${index}`}
                >
                  {cta.label ?? 'Learn more'}
                </a>
              ))}
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

export default TrainingProgram;
