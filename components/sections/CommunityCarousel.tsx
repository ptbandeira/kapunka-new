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
  quoteDuration?: number;
}

const MIN_DURATION = 4000;
const DEFAULT_DURATION = 4000;
const DEFAULT_QUOTE_DURATION = 4000;

const OVERLAY_POSITIONS = [
  { top: '12%', left: '12%' },
  { top: '18%', left: '60%' },
  { top: '60%', left: '18%' },
  { top: '58%', left: '56%' },
  { top: '40%', left: '35%' },
];

const QuoteOverlay: React.FC<React.ComponentProps<typeof motion.div>> = (props) => (
  <motion.div {...props} />
);

const CommunityCarousel: React.FC<CommunityCarouselProps> = ({
  title,
  slides,
  fieldPath,
  slidesFieldPath,
  slideDuration = DEFAULT_DURATION,
  quoteDuration,
}) => {
  const safeDuration = useMemo(() => Math.max(slideDuration, MIN_DURATION), [slideDuration]);
  const resolvedQuoteDuration = useMemo(() => {
    const overridden = typeof quoteDuration === 'number' && Number.isFinite(quoteDuration)
      ? quoteDuration
      : Math.max(safeDuration * 1.5, DEFAULT_QUOTE_DURATION);
    return Math.max(overridden, MIN_DURATION);
  }, [quoteDuration, safeDuration]);
  const slidesWithImages = useMemo(
    () => slides.filter((slide) => Boolean(slide?.image)),
    [slides],
  );
  const marqueeSlides = useMemo(() => (
    slidesWithImages.length > 0 ? [...slidesWithImages, ...slidesWithImages] : []
  ), [slidesWithImages]);

  const slidesWithQuotes = useMemo(
    () => slides.filter((slide) => typeof slide?.quote === 'string' && slide.quote.trim().length > 0),
    [slides],
  );
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [quotePositionIndex, setQuotePositionIndex] = useState(0);

  useEffect(() => {
    if (slidesWithQuotes.length === 0) {
      setQuoteIndex(0);
      return undefined;
    }

    const timer = window.setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % slidesWithQuotes.length);
      setQuotePositionIndex((prev) => (prev + 1) % OVERLAY_POSITIONS.length);
    }, resolvedQuoteDuration);

    return () => window.clearInterval(timer);
  }, [slidesWithQuotes.length, resolvedQuoteDuration]);

  const currentQuoteSlide = slidesWithQuotes[quoteIndex];
  const overlayPosition = OVERLAY_POSITIONS[quotePositionIndex % OVERLAY_POSITIONS.length];

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

  const loopDuration = useMemo(() => {
    if (slidesWithImages.length === 0) {
      return safeDuration;
    }
    return Math.max(safeDuration * slidesWithImages.length, MIN_DURATION * slidesWithImages.length);
  }, [safeDuration, slidesWithImages.length]);

  const maskStyle: React.CSSProperties = useMemo(() => ({
    maskImage: 'linear-gradient(to right, transparent, rgba(0,0,0,1) 10%, rgba(0,0,0,1) 90%, transparent)',
    WebkitMaskImage: 'linear-gradient(to right, transparent, rgba(0,0,0,1) 10%, rgba(0,0,0,1) 90%, transparent)',
  }), []);

  return (
    <section
      className="py-20 sm:py-28 bg-stone-50"
      data-nlv-field-path={fieldPath}
      data-sb-field-path={fieldPath}
    >
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {title && (
          <div
            className="max-w-3xl"
            data-nlv-field-path={fieldPath ? `${fieldPath}.title` : undefined}
            data-sb-field-path={fieldPath ? `${fieldPath}.title` : undefined}
          >
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900">{title}</h2>
          </div>
        )}
        <div className="mt-14">
          <div className="relative overflow-hidden">
            <div
              className="relative overflow-hidden"
              style={maskStyle}
              data-nlv-field-path={slidesFieldPath}
              data-sb-field-path={slidesFieldPath}
            >
              {marqueeSlides.length > 0 ? (
                <div
                  className="flex items-center gap-6 animate-carousel-scroll"
                  style={{ animationDuration: `${loopDuration}ms` }}
                >
                  {marqueeSlides.map((slide, index) => (
                    <figure
                      key={buildSlideKey(slide, `marquee-slide-${index}`)}
                      className="group relative flex-shrink-0 w-40 h-40 sm:w-48 sm:h-48 lg:w-56 lg:h-56 overflow-hidden bg-stone-100"
                      data-nlv-field-path={slide.fieldPath}
                      data-sb-field-path={slide.fieldPath}
                    >
                      {slide.image ? (
                        <img
                          src={slide.image}
                          alt={slide.alt ?? 'Kapunka ritual in our community'}
                          className="h-full w-full object-cover"
                          data-nlv-field-path={slide.imageFieldPath}
                          data-sb-field-path={slide.imageFieldPath}
                        />
                      ) : (
                        <div
                          className="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-xs text-stone-400"
                          data-nlv-field-path={slide.imageFieldPath}
                          data-sb-field-path={slide.imageFieldPath}
                        >
                          <span className="font-medium text-stone-500">Add a photo</span>
                          <span>Upload via CMS</span>
                        </div>
                      )}
                      <span
                        className="sr-only"
                        data-nlv-field-path={slide.altFieldPath}
                        data-sb-field-path={slide.altFieldPath}
                      >
                        {slide.alt ?? 'Community carousel image'}
                      </span>
                    </figure>
                  ))}
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center text-sm text-stone-400">
                  Add community images to activate this carousel.
                </div>
              )}
            </div>

            <AnimatePresence mode="popLayout">
              {currentQuoteSlide ? (
                <QuoteOverlay
                  key={buildSlideKey(currentQuoteSlide, 'hovering-quote')}
                  className="pointer-events-none absolute max-w-xs rounded-2xl bg-stone-900/90 p-5 text-left text-sm text-white shadow-2xl backdrop-blur"
                  style={{ ...overlayPosition }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  aria-live="polite"
                >
                  <p
                    className="leading-relaxed"
                    data-nlv-field-path={currentQuoteSlide.quoteFieldPath}
                    data-sb-field-path={currentQuoteSlide.quoteFieldPath}
                  >
                    {currentQuoteSlide.quote?.trim() ?? 'Share how Kapunka shows up in your community.'}
                  </p>
                  <div className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                    <span
                      data-nlv-field-path={currentQuoteSlide.nameFieldPath}
                      data-sb-field-path={currentQuoteSlide.nameFieldPath}
                    >
                      {currentQuoteSlide.name ?? 'Community voice'}
                    </span>
                  </div>
                  {(currentQuoteSlide.role ?? '').trim().length > 0 && (
                    <div
                      className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-white/60"
                      data-nlv-field-path={currentQuoteSlide.roleFieldPath}
                      data-sb-field-path={currentQuoteSlide.roleFieldPath}
                    >
                      {currentQuoteSlide.role}
                    </div>
                  )}
                </QuoteOverlay>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunityCarousel;
