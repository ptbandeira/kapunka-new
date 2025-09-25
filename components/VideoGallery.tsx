import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import type { VideoEntry, VideoLibraryContent } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface VideoGalleryProps {
  title?: string;
  description?: string;
  entries?: VideoEntry[];
  fieldPath?: string;
}

const placeholderThumbnailClasses =
  'flex h-48 items-center justify-center rounded-xl bg-stone-200 text-stone-500';

const loadVideoLibrary = async (): Promise<VideoEntry[]> => {
  try {
    const response = await fetch('/content/videos.json');
    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as VideoLibraryContent;
    if (!data || !Array.isArray(data.videos)) {
      return [];
    }

    return data.videos.filter((video): video is VideoEntry => typeof video === 'object' && video !== null);
  } catch (error) {
    console.error('Failed to load video entries', error);
    return [];
  }
};

const VideoGallery: React.FC<VideoGalleryProps> = ({ title, description, entries, fieldPath }) => {
  const [libraryEntries, setLibraryEntries] = useState<VideoEntry[]>([]);
  const { t, language } = useLanguage();

  useEffect(() => {
    if (entries && entries.length > 0) {
      return;
    }

    let isMounted = true;

    const fetchVideos = async () => {
      const videos = await loadVideoLibrary();
      if (isMounted) {
        setLibraryEntries(videos);
      }
    };

    void fetchVideos();

    return () => {
      isMounted = false;
    };
  }, [entries]);

  const items = useMemo(() => {
    if (entries && entries.length > 0) {
      return entries;
    }
    return libraryEntries;
  }, [entries, libraryEntries]);

  if (!title && !description && items.length === 0) {
    return null;
  }

  return (
    <section className="py-16 sm:py-24" data-nlv-field-path={fieldPath}>
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
                data-nlv-field-path={fieldPath ? `${fieldPath}.title` : undefined}
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
                data-nlv-field-path={fieldPath ? `${fieldPath}.description` : undefined}
              >
                {description}
              </motion.p>
            )}
          </div>
        )}

        {items.length === 0 ? (
          <p
            className="text-stone-500"
            data-nlv-field-path={`translations.${language}.videos.emptyState`}
          >
            {t('videos.emptyState')}
          </p>
        ) : (
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => {
              const key = `${item.title ?? 'video'}-${index}`;
              const itemFieldPath = fieldPath ? `${fieldPath}.entries.${index}` : undefined;
              const hasThumbnail = typeof item.thumbnail === 'string' && item.thumbnail.trim().length > 0;

              return (
                <motion.article
                  key={key}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.05 }}
                  className="rounded-3xl bg-white p-6 shadow-sm shadow-stone-200"
                  data-nlv-field-path={itemFieldPath}
                >
                  <div className="relative overflow-hidden rounded-xl">
                    {hasThumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title ?? 'Video thumbnail'}
                        className="h-48 w-full object-cover"
                        loading="lazy"
                        data-nlv-field-path={itemFieldPath ? `${itemFieldPath}.thumbnail` : undefined}
                      />
                    ) : (
                      <div className={placeholderThumbnailClasses}>Thumbnail coming soon</div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/80 backdrop-blur">
                        <Play className="h-6 w-6 text-stone-800" />
                      </div>
                    </div>
                  </div>

                  {item.title && (
                    <h3
                      className="mt-6 text-xl font-semibold text-stone-900"
                      data-nlv-field-path={itemFieldPath ? `${itemFieldPath}.title` : undefined}
                    >
                      {item.title}
                    </h3>
                  )}

                  {item.description && (
                    <p
                      className="mt-3 text-sm text-stone-600"
                      data-nlv-field-path={itemFieldPath ? `${itemFieldPath}.description` : undefined}
                    >
                      {item.description}
                    </p>
                  )}

                  {item.videoUrl && (
                    <a
                      href={item.videoUrl}
                      className="mt-6 inline-flex items-center text-sm font-semibold text-stone-900 underline decoration-stone-300 decoration-2 underline-offset-4 transition hover:decoration-stone-500"
                      target="_blank"
                      rel="noopener noreferrer"
                      data-nlv-field-path={itemFieldPath ? `${itemFieldPath}.videoUrl` : undefined}
                    >
                      <span data-nlv-field-path={`translations.${language}.videos.watchLabel`}>
                        {t('videos.watchLabel')}
                      </span>
                    </a>
                  )}
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default VideoGallery;
