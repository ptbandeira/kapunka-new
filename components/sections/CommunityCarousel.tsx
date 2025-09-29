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
    <section
      className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 text-white"
      data-nlv-field-path={fieldPath}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        animate={{
          backgroundPosition: ['0% 0%', '50% 50%', '0% 0%'],
        }}
        transition={{ duration: 28, ease: 'easeInOut', repeat: Infinity }}
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(250, 214, 165, 0.12), transparent 55%), radial-gradient(circle at 80% 30%, rgba(255, 255, 255, 0.08), transparent 60%), radial-gradient(circle at 50% 80%, rgba(214, 173, 115, 0.16), transparent 65%)',
          backgroundSize: '160% 160%',
        }}
      />
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <div className="max-w-3xl" data-nlv-field-path={fieldPath ? `${fieldPath}.title` : undefined}>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">{title}</h2>
          </div>
        )}
        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center">
          <div className="relative">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-white/10 bg-stone-900/40 shadow-2xl shadow-stone-950/40">
              <div className="absolute inset-0 pointer-events-none">
                <motion.div
                  className="absolute -inset-20 rounded-[3rem] bg-gradient-to-r from-amber-500/10 via-transparent to-amber-400/10"
                  animate={{ x: ['-6%', '6%', '-6%'], y: ['-4%', '4%', '-4%'] }}
                  transition={{ duration: 18, ease: 'easeInOut', repeat: Infinity }}
                />
              </div>
              <AnimatePresence mode="wait">
                {activeSlide ? (
                  <motion.figure
                    key={buildSlideKey(activeSlide, 'community-slide')}
                    className="relative h-full w-full"
                    initial={{ opacity: 0, scale: 1.05, x: 60 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.98, x: -60 }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
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
                        className="flex h-full w-full flex-col items-center justify-center gap-2 bg-stone-900/60 text-center text-sm text-stone-300"
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
                  <div className="flex h-full w-full items-center justify-center text-center text-sm text-stone-300">
                    <div data-nlv-field-path={slidesFieldPath}>Add your first community story</div>
                  </div>
                )}
              </AnimatePresence>
            </div>
            {totalSlides > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3" data-nlv-field-path={slidesFieldPath}>
                {slides.map((slide, index) => {
                  const slideKey = buildSlideKey(slide, 'carousel-dot');
                  return (
                  <button
                    key={slideKey}
                    type="button"
                    className={`h-3 w-3 rounded-full border border-white/60 transition-all ${index === activeIndex ? 'scale-110 bg-white' : 'bg-white/30 hover:bg-white/50'}`}
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
          <div className="relative">
            <AnimatePresence mode="wait">
              {activeSlide ? (
                <motion.div
                  key={buildSlideKey(activeSlide, 'community-quote')}
                  className="space-y-6"
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -28 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  aria-live="polite"
                  data-nlv-field-path={activeSlide.fieldPath}
                >
                  <p className="text-lg leading-relaxed text-stone-100" data-nlv-field-path={activeSlide.quoteFieldPath}>
                    {activeSlide.quote ?? 'Use this space to share how Kapunka supports a routine or treatment story.'}
                  </p>
                  <div className="text-sm font-medium uppercase tracking-[0.2em] text-stone-300">
                    <span data-nlv-field-path={activeSlide.nameFieldPath}>
                      {activeSlide.name ?? 'Name or partner'}
                    </span>
                    {(activeSlide.role ?? '').trim().length > 0 && (
                      <span className="block text-xs font-normal normal-case tracking-normal text-stone-400" data-nlv-field-path={activeSlide.roleFieldPath}>
                        {activeSlide.role}
                      </span>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="community-empty"
                  className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-10 text-center text-sm text-stone-200"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  data-nlv-field-path={slidesFieldPath}
                >
                  Add quotes and names to bring your Kapunka community to life.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunityCarousel;
