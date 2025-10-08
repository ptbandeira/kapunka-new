import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { TrainingCatalogContent, TrainingEntry } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { fetchContentJson } from '../utils/fetchContentJson';
import { useVisualEditorSync } from '../contexts/VisualEditorSyncContext';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';

interface TrainingListProps {
  title?: string;
  description?: string;
  entries?: TrainingEntry[];
  fieldPath?: string;
}

const loadTrainingCatalog = async (): Promise<TrainingEntry[]> => {
  try {
        const data = await fetchContentJson<TrainingCatalogContent>('/content/training.json');
    if (!data || !Array.isArray(data.trainings)) {
      return [];
    }

    return data.trainings.filter((entry): entry is TrainingEntry => typeof entry === 'object' && entry !== null);
  } catch (error) {
    console.error('Failed to load training entries', error);
    return [];
  }
};

const TrainingList: React.FC<TrainingListProps> = ({ title, description, entries, fieldPath }) => {
  const [catalogEntries, setCatalogEntries] = useState<TrainingEntry[]>([]);
  const { t, language } = useLanguage();
  const { contentVersion } = useVisualEditorSync();

  useEffect(() => {
    if (Array.isArray(entries) && entries.length > 0) {
      return;
    }

    let isMounted = true;

    const fetchTrainings = async () => {
      const trainings = await loadTrainingCatalog();
      if (isMounted) {
        setCatalogEntries(trainings);
      }
    };

    fetchTrainings().catch((error) => {
      console.error('Unhandled error while loading training list entries', error);
    });

    return () => {
      isMounted = false;
    };
  }, [entries, contentVersion]);

  const modules = useMemo(() => {
    const sourceEntries = Array.isArray(entries) && entries.length > 0 ? entries : catalogEntries;

    return sourceEntries.filter((entry): entry is TrainingEntry => {
      if (!entry) {
        return false;
      }

      const hasTitle = entry.courseTitle?.trim();
      const hasSummary = entry.courseSummary?.trim();
      const hasLink = entry.linkUrl?.trim();

      return Boolean(hasTitle || hasSummary || hasLink);
    });
  }, [entries, catalogEntries]);

  const trimmedTitle = title?.trim();
  const trimmedDescription = description?.trim();

  if (!trimmedTitle && !trimmedDescription && modules.length === 0) {
    return null;
  }

  return (
    <section
      className="py-16 sm:py-24"
      {...getVisualEditorAttributes(fieldPath)}
      data-sb-field-path={fieldPath}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {(trimmedTitle || trimmedDescription) && (
          <div className="mb-12 max-w-3xl">
            {trimmedTitle ? (
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900"
                {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.title` : undefined)}
                data-sb-field-path={fieldPath ? `${fieldPath}.title` : undefined}
              >
                {trimmedTitle}
              </motion.h2>
            ) : null}
            {trimmedDescription ? (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="mt-4 text-lg text-stone-600"
                {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.description` : undefined)}
                data-sb-field-path={fieldPath ? `${fieldPath}.description` : undefined}
              >
                {trimmedDescription}
              </motion.p>
            ) : null}
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          {modules.map((item, index) => {
            const key = `${item.courseTitle ?? 'training'}-${index}`;
            const itemFieldPath = fieldPath ? `${fieldPath}.entries.${index}` : undefined;
            const title = item.courseTitle?.trim();
            const summary = item.courseSummary?.trim();
            const hasSummary = Boolean(summary);
            const linkUrl = item.linkUrl?.trim();

            return (
              <motion.article
                key={key}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                className="flex h-full flex-col justify-between rounded-3xl border border-stone-200 bg-white p-8 shadow-sm shadow-stone-100"
                {...getVisualEditorAttributes(itemFieldPath)}
                data-sb-field-path={itemFieldPath}
              >
                <div>
                  {title ? (
                    <h3
                      className="text-xl font-semibold text-stone-900"
                      {...getVisualEditorAttributes(itemFieldPath ? `${itemFieldPath}.courseTitle` : undefined)}
                      data-sb-field-path={itemFieldPath ? `${itemFieldPath}.courseTitle` : undefined}
                    >
                      {title}
                    </h3>
                  ) : null}
                  {hasSummary ? (
                    <p
                      className="mt-4 text-sm text-stone-600"
                      {...getVisualEditorAttributes(itemFieldPath ? `${itemFieldPath}.courseSummary` : undefined)}
                      data-sb-field-path={itemFieldPath ? `${itemFieldPath}.courseSummary` : undefined}
                    >
                      {summary}
                    </p>
                  ) : null}
                </div>
                {hasSummary ? (
                  <div className="mt-6 flex items-center gap-3">
                    <a
                      href={linkUrl ?? '#'}
                      className={`inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition ${
                        linkUrl
                          ? 'bg-stone-900 text-white hover:bg-stone-700'
                          : 'cursor-not-allowed bg-stone-200 text-stone-500'
                      }`}
                      target={linkUrl ? '_blank' : undefined}
                      rel={linkUrl ? 'noopener noreferrer' : undefined}
                      aria-disabled={!linkUrl}
                      {...getVisualEditorAttributes(itemFieldPath ? `${itemFieldPath}.linkUrl` : undefined)}
                      data-sb-field-path={itemFieldPath ? `${itemFieldPath}.linkUrl` : undefined}
                    >
                      <span
                        {...getVisualEditorAttributes(`translations.${language}.training.learnMore`)}
                        data-sb-field-path={`translations.${language}.training.learnMore`}
                      >
                        {t('training.learnMore')}
                      </span>
                    </a>
                  </div>
                ) : null}
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrainingList;
