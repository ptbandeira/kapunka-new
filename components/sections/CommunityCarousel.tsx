import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export interface CommunityCarouselSlideProps {
  image?: string;
  alt?: string;
  quote?: string;
  name?: string;
  role?: string;
  fieldPath?: string;
  imageFieldPath?: string;
  altFieldPath?: string;
  quoteFieldPath?: string;
  nameFieldPath?: string;
  roleFieldPath?: string;
}

interface CommunityCarouselProps {
  title?: string;
  slides: CommunityCarouselSlideProps[];
  fieldPath?: string;
  slidesFieldPath?: string;
  slideDuration?: number;
}

const MIN_DURATION = 4000;
const DEFAULT_DURATION = 8000;

const CommunityCarousel: React.FC<CommunityCarouselProps> = ({
  title,
  slides,
  fieldPath,
  slidesFieldPath,
  slideDuration = DEFAULT_DURATION,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const buildSlideKey = useCallback((slide: CommunityCarouselSlideProps | undefined, prefix: string): string => {
    if (!slide) {
      return prefix;
    }

    if (slide.fieldPath && slide.fieldPath.length > 0) {
      return `${prefix}-${slide.fieldPath}`;
    }

    const fallback = [slide.image, slide.quote, slide.name, slide.role, slide.alt]
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .join('|');

    return fallback.length > 0 ? `${prefix}-${fallback}` : prefix;
  }, []);

  const safeDuration = useMemo(() => Math.max(slideDuration, MIN_DURATION), [slideDuration]);
  const totalSlides = slides.length;

  useEffect(() => {
    setActiveIndex(0);
  }, [totalSlides]);

  useEffect(() => {
    if (totalSlides <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalSlides);
    }, safeDuration);

    return () => window.clearInterval(timer);
  }, [totalSlides, safeDuration]);

  const activeSlide = slides[activeIndex];

  const handleSelectSlide = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const { slideIndex } = event.currentTarget.dataset;
    if (!slideIndex) {
      return;
    }

    const parsedIndex = Number(slideIndex);
    if (!Number.isNaN(parsedIndex) && parsedIndex !== activeIndex) {
      setActiveIndex(parsedIndex);
    }
  }, [activeIndex]);

  return (
    <section className="py-20 sm:py-28 bg-stone-50" data-nlv-field-path={fieldPath}>
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {title && (
          <div className="max-w-3xl" data-nlv-field-path={fieldPath ? `${fieldPath}.title` : undefined}>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900">{title}</h2>
          </div>
        )}
        <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:items-center">
          <div className="relative flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative w-full max-w-md"
            >
              <motion.div
                aria-hidden
                className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-stone-200 via-white to-stone-100 shadow-xl"
                animate={{ y: ['0%', '4%', '0%'] }}
                transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
              />
              <AnimatePresence mode="wait">
                {activeSlide ? (
                  <motion.figure
                    key={buildSlideKey(activeSlide, 'community-slide')}
                    className="relative mx-auto aspect-[3/4] w-full overflow-hidden rounded-3xl bg-white shadow-2xl"
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -32 }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                    data-nlv-field-path={activeSlide.fieldPath}
                  >
                    {activeSlide.image ? (
                      <motion.img
                        src={activeSlide.image}
                        alt={activeSlide.alt ?? 'Community member enjoying Kapunka'}
                        className="h-full w-full object-cover"
                        initial={{ scale: 1.08 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        data-nlv-field-path={activeSlide.imageFieldPath}
                      />
                    ) : (
                      <div
                        className="flex h-full w-full flex-col items-center justify-center gap-2 bg-stone-100 text-center text-sm text-stone-500"
                        data-nlv-field-path={activeSlide.imageFieldPath}
                      >
                        <span className="font-medium">Add a community photo</span>
                        <span className="text-xs text-stone-400">Upload an image from the CMS</span>
                      </div>
                    )}
                    <span className="sr-only" data-nlv-field-path={activeSlide.altFieldPath}>
                      {activeSlide.alt ?? 'Add descriptive alt text for this slide'}
                    </span>
                  </motion.figure>
                ) : (
                  <div className="flex aspect-[3/4] w-full items-center justify-center rounded-3xl border border-dashed border-stone-200 bg-white text-stone-400">
                    <div data-nlv-field-path={slidesFieldPath}>Add your first community story</div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
          <div>
            <AnimatePresence mode="wait">
              {activeSlide ? (
                <motion.div
                  key={buildSlideKey(activeSlide, 'community-quote')}
                  className="space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  aria-live="polite"
                  data-nlv-field-path={activeSlide.fieldPath}
                >
                  <p className="text-lg leading-relaxed text-stone-700" data-nlv-field-path={activeSlide.quoteFieldPath}>
                    {activeSlide.quote ?? 'Use this space to share how Kapunka supports a routine or treatment story.'}
                  </p>
                  <div className="text-sm font-medium uppercase tracking-[0.25em] text-stone-400">
                    <span data-nlv-field-path={activeSlide.nameFieldPath}>
                      {activeSlide.name ?? 'Name or partner'}
                    </span>
                    {(activeSlide.role ?? '').trim().length > 0 && (
                      <span className="block text-xs font-normal normal-case tracking-normal text-stone-500" data-nlv-field-path={activeSlide.roleFieldPath}>
                        {activeSlide.role}
                      </span>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="community-empty"
                  className="rounded-3xl border border-dashed border-stone-200 bg-white p-10 text-center text-sm text-stone-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  data-nlv-field-path={slidesFieldPath}
                >
                  Add quotes and names to bring your Kapunka community to life.
                </motion.div>
              )}
            </AnimatePresence>
            {totalSlides > 1 && (
              <div className="mt-8 flex flex-wrap items-center gap-2" data-nlv-field-path={slidesFieldPath}>
                {slides.map((slide, index) => {
                  const slideKey = buildSlideKey(slide, 'carousel-dot');
                  return (
                    <button
                      key={slideKey}
                      type="button"
                      className={`h-2.5 w-8 rounded-full transition-all ${index === activeIndex ? 'bg-stone-900' : 'bg-stone-300 hover:bg-stone-400'}`}
                      onClick={handleSelectSlide}
                      aria-label={`Show community story ${index + 1}`}
                      aria-pressed={index === activeIndex}
                      data-slide-index={index}
                      data-nlv-field-path={slide.fieldPath}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunityCarousel;
