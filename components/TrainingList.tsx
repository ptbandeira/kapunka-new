import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { TrainingCatalogContent, TrainingEntry } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { fetchVisualEditorJson } from '../utils/fetchVisualEditorJson';
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
    const data = await fetchVisualEditorJson<TrainingCatalogContent>('/content/training.json');
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
    if (entries && entries.length > 0) {
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

  const items = useMemo(() => {
    if (entries && entries.length > 0) {
      return entries;
    }
    return catalogEntries;
  }, [entries, catalogEntries]);

  if (!title && !description && items.length === 0) {
    return null;
  }

  return (
    <section
      className="py-16 sm:py-24"
      {...getVisualEditorAttributes(fieldPath)}
      data-sb-field-path={fieldPath}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {(title || description) && (
          <div className="mb-12 max-w-3xl">
            {title && (
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900"
                {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.title` : undefined)}
                data-sb-field-path={fieldPath ? `${fieldPath}.title` : undefined}
              >
                {title}
              </motion.h2>
            )}
            {description && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="mt-4 text-lg text-stone-600"
                {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.description` : undefined)}
                data-sb-field-path={fieldPath ? `${fieldPath}.description` : undefined}
              >
                {description}
              </motion.p>
            )}
          </div>
        )}

        {items.length === 0 ? (
          <p
            className="text-stone-500"
            {...getVisualEditorAttributes(`translations.${language}.training.emptyState`)}
            data-sb-field-path={`translations.${language}.training.emptyState`}
          >
            {t('training.emptyState')}
          </p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {items.map((item, index) => {
              const key = `${item.courseTitle ?? 'training'}-${index}`;
              const itemFieldPath = fieldPath ? `${fieldPath}.entries.${index}` : undefined;

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
                    {item.courseTitle && (
                      <h3
                        className="text-xl font-semibold text-stone-900"
                        {...getVisualEditorAttributes(itemFieldPath ? `${itemFieldPath}.courseTitle` : undefined)}
                        data-sb-field-path={itemFieldPath ? `${itemFieldPath}.courseTitle` : undefined}
                      >
                        {item.courseTitle}
                      </h3>
                    )}
                    {item.courseSummary && (
                      <p
                        className="mt-4 text-sm text-stone-600"
                        {...getVisualEditorAttributes(itemFieldPath ? `${itemFieldPath}.courseSummary` : undefined)}
                        data-sb-field-path={itemFieldPath ? `${itemFieldPath}.courseSummary` : undefined}
                      >
                        {item.courseSummary}
                      </p>
                    )}
                  </div>
                  <div className="mt-6 flex items-center gap-3">
                    <a
                      href={item.linkUrl ?? '#'}
                      className={`inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition ${
                        item.linkUrl
                          ? 'bg-stone-900 text-white hover:bg-stone-700'
                          : 'cursor-not-allowed bg-stone-200 text-stone-500'
                      }`}
                      target={item.linkUrl ? '_blank' : undefined}
                      rel={item.linkUrl ? 'noopener noreferrer' : undefined}
                      aria-disabled={!item.linkUrl}
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
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default TrainingList;
