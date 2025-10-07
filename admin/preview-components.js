const ReactNamespace = window.React || { createElement: window.h };
const createElement = ReactNamespace.createElement || window.h;
const Fragment = ReactNamespace.Fragment || 'div';

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const asArray = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value.toArray === 'function') {
    return value.toArray();
  }

  if (typeof value.toJS === 'function') {
    return value.toJS();
  }

  return [];
};

const toPlainObject = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value.toJS === 'function') {
    return value.toJS();
  }

  if (typeof value.toArray === 'function') {
    return value.toArray();
  }

  if (typeof value === 'object') {
    return value;
  }

  return null;
};

const ABSOLUTE_URL_PATTERN = /^([a-z]+:)?\/\//i;
const uploadPrefixPatterns = [
  /^\/?content\/[a-z]{2}\/uploads\//i,
  /^\/?content\/uploads\//i,
  /^\/?static\/images\/uploads\//i,
  /^\/?images\/uploads\//i,
];
const DEFAULT_CLOUDINARY_TRANSFORMATIONS = ['f_auto', 'q_auto', 'dpr_auto'];

const getCmsInstance = () => (typeof window !== 'undefined' ? window.CMS : null);

const getCmsConfig = () => {
  const CMS = getCmsInstance();
  if (!CMS || typeof CMS.getConfig !== 'function') {
    return null;
  }
  return CMS.getConfig();
};

const stripUploadPrefixes = (value) => {
  return uploadPrefixPatterns.reduce((acc, pattern) => acc.replace(pattern, ''), value).replace(/^\/+/, '');
};

const normalizeTransformations = (groups) => {
  const transformations = [];

  asArray(groups).forEach((group) => {
    asArray(group).forEach((item) => {
      const plain = toPlainObject(item);
      if (!plain) {
        return;
      }

      Object.entries(plain).forEach(([key, val]) => {
        if (typeof val === 'string' && val.trim().length > 0) {
          transformations.push(`${key}_${val.trim()}`);
        }
      });
    });
  });

  if (transformations.length > 0) {
    return transformations.join(',');
  }

  return DEFAULT_CLOUDINARY_TRANSFORMATIONS.join(',');
};

const cachedCloudinarySettings = {
  resolved: false,
  base: null,
  transformations: null,
};

const previewImageCache = new Map();

const resolveCloudinarySettings = () => {
  if (cachedCloudinarySettings.resolved) {
    return cachedCloudinarySettings;
  }

  const config = getCmsConfig();
  if (!config || typeof config.getIn !== 'function') {
    return cachedCloudinarySettings;
  }

  const cloudName = config.getIn(['media_library', 'config', 'cloud_name']);
  if (typeof cloudName === 'string' && cloudName.trim().length > 0) {
    cachedCloudinarySettings.base = `https://res.cloudinary.com/${cloudName.trim()}/image/upload`;
  }

  const defaultTransformations = config.getIn(['media_library', 'config', 'default_transformations']);
  cachedCloudinarySettings.transformations = normalizeTransformations(defaultTransformations);
  cachedCloudinarySettings.resolved = true;

  return cachedCloudinarySettings;
};

const extractImagePath = (value) => {
  if (!value) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value.get === 'function') {
    const fromMap = value.get('src') || value.get('path');
    if (typeof fromMap === 'string') {
      return fromMap;
    }
  }

  if (typeof value.src === 'string') {
    return value.src;
  }

  if (typeof value.toJS === 'function') {
    const plain = value.toJS();
    if (plain && typeof plain.src === 'string') {
      return plain.src;
    }
    if (plain && typeof plain.path === 'string') {
      return plain.path;
    }
  }

  if (typeof value === 'object') {
    if (typeof value.path === 'string') {
      return value.path;
    }
    if (typeof value.url === 'string') {
      return value.url;
    }
  }

  return undefined;
};

const getPreviewImageSrc = (input) => {
  const raw = extractImagePath(input);
  if (!isNonEmptyString(raw)) {
    return undefined;
  }

  const trimmed = raw.trim();
  if (ABSOLUTE_URL_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const sanitized = stripUploadPrefixes(trimmed);
  const { base, transformations } = resolveCloudinarySettings();

  const cacheKey = `${base || ''}::${transformations || ''}::${sanitized}`;
  if (previewImageCache.has(cacheKey)) {
    return previewImageCache.get(cacheKey);
  }

  if (!base) {
    const fallback = sanitized || trimmed;
    previewImageCache.set(cacheKey, fallback);
    return fallback;
  }

  const segments = [base, transformations, sanitized]
    .filter((segment) => isNonEmptyString(segment));

  const resolved = segments
    .map((segment, index) => (index === 0 ? segment.replace(/\/+$/, '') : segment.replace(/^\/+/, '').replace(/\/+$/, '')))
    .join('/');
  previewImageCache.set(cacheKey, resolved);
  return resolved;
};

function renderCtas(ctas) {
  if (!ctas || (!ctas.primary && !ctas.secondary)) {
    return null;
  }

  const buttons = [];

  if (ctas.primary) {
    buttons.push(createElement(
      'a',
      {
        key: 'primary',
        href: ctas.primary.href || '#',
        className:
          'inline-flex items-center rounded-full bg-stone-900 text-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-stone-800 transition',
      },
      ctas.primary.label || 'Primary CTA',
    ));
  }

  if (ctas.secondary) {
    buttons.push(createElement(
      'a',
      {
        key: 'secondary',
        href: ctas.secondary.href || '#',
        className:
          'inline-flex items-center rounded-full border border-stone-900 text-stone-900 px-4 py-2 text-sm font-medium hover:bg-stone-900 hover:text-white transition',
      },
      ctas.secondary.label || 'Secondary CTA',
    ));
  }

  if (buttons.length === 0) {
    return null;
  }

  return createElement('div', { className: 'flex flex-wrap gap-3 mt-6' }, buttons);
}

function HeroAlignment({ alignment }) {
  const plain = toPlainObject(alignment);
  if (!plain) {
    return null;
  }

  const items = [
    plain.heroAlignX ? `Horizontal: ${plain.heroAlignX}` : null,
    plain.heroAlignY ? `Vertical: ${plain.heroAlignY}` : null,
    plain.heroTextPosition ? `Text position: ${plain.heroTextPosition}` : null,
    plain.heroOverlay ? `Overlay: ${plain.heroOverlay}` : null,
    plain.heroLayoutHint ? `Layout: ${plain.heroLayoutHint}` : null,
  ].filter(Boolean);

  if (items.length === 0) {
    return null;
  }

  return createElement(
    'div',
    {
      className:
        'rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs uppercase tracking-wide text-white/80 space-y-1 max-w-xs',
    },
    items.map((item, index) => createElement('div', { key: `hero-alignment-${index}` }, item)),
  );
}

export function PreviewLayout(props) {
  return createElement(
    'div',
    { className: 'cms-preview-root min-h-screen bg-stone-100 py-12 px-6 sm:px-10' },
    createElement(
      'div',
      { className: 'mx-auto max-w-6xl space-y-10' },
      props.children,
    ),
  );
}

export function Hero(props) {
  const headline = isNonEmptyString(props.headline) ? props.headline : 'Add a hero headline';
  const subheadline = isNonEmptyString(props.subheadline)
    ? props.subheadline
    : 'Add a supporting statement';

  return createElement(
    'section',
    { className: 'cms-preview-card p-10 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white' },
    createElement(
      'div',
      { className: 'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between' },
      createElement(
        'div',
        { className: 'space-y-3' },
        props.badge
          ? createElement('div', { className: 'cms-preview-badge bg-white/15 text-white/90' }, props.badge)
          : null,
        createElement('h1', { className: 'text-4xl sm:text-5xl font-semibold tracking-tight' }, headline),
        createElement(
          'p',
          { className: 'text-base sm:text-lg text-white/80 max-w-2xl leading-relaxed' },
          subheadline,
        ),
      ),
      createElement(HeroAlignment, { alignment: props.alignment }),
    ),
    renderCtas(props.ctas),
  );
}

export function SectionCard(props) {
  return createElement(
    'article',
    { className: 'cms-preview-card p-8 space-y-4 border border-stone-200/60' },
    createElement(
      'div',
      { className: 'flex items-start justify-between gap-4' },
      createElement(
        'div',
        { className: 'space-y-1' },
        props.badge
          ? createElement('span', { className: 'cms-preview-badge' }, props.badge)
          : null,
        props.title
          ? createElement('h3', { className: 'cms-preview-section-title text-stone-900' }, props.title)
          : null,
      ),
      props.meta ? createElement('span', { className: 'cms-preview-pill' }, props.meta) : null,
    ),
    props.children,
  );
}

export function ProductGrid(props) {
  const products = asArray(props.products);
  if (products.length === 0) {
    return createElement('p', { className: 'cms-preview-muted text-sm' }, 'Select product IDs to highlight.');
  }

  return createElement(
    'div',
    { className: 'grid gap-3 sm:grid-cols-2' },
    products.map((product, idx) => {
      const id = typeof product === 'string' ? product : product?.id;
      return createElement(
        'div',
        {
          key: `product-${idx}`,
          className: 'flex items-center justify-between rounded-xl border border-stone-200 px-4 py-3 bg-stone-50',
        },
        createElement('span', { className: 'font-medium text-stone-800' }, id || `Product ${idx + 1}`),
        createElement('span', { className: 'text-xs text-stone-500 uppercase tracking-wide' }, 'Featured'),
      );
    }),
  );
}

export function FeatureGrid(props) {
  const items = asArray(props.items);
  if (items.length === 0) {
    return createElement('p', { className: 'cms-preview-muted text-sm' }, 'Add feature items to populate this grid.');
  }

  return createElement(
    'div',
    { className: 'grid gap-4 sm:grid-cols-2' },
    items.map((item, idx) =>
      createElement(
        'div',
        {
          key: `feature-${idx}`,
          className: 'rounded-2xl border border-stone-200 bg-white p-5 shadow-sm flex flex-col gap-2',
        },
        createElement('span', { className: 'font-medium text-stone-900' }, item.label || `Feature ${idx + 1}`),
        item.description
          ? createElement('p', { className: 'text-sm text-stone-600 leading-relaxed' }, item.description)
          : null,
      ),
    ),
  );
}

export function MediaShowcase(props) {
  const items = asArray(props.items);
  if (items.length === 0) {
    return createElement('p', { className: 'cms-preview-muted text-sm' }, 'Add showcase items with imagery and CTAs.');
  }

  return createElement(
    'div',
    { className: 'grid gap-4 md:grid-cols-2' },
    items.map((item, idx) => {
      const imageSrc = getPreviewImageSrc(item.image) || extractImagePath(item.image);

      return createElement(
        'div',
        {
          key: `media-${idx}`,
          className: 'overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm',
        },
        isNonEmptyString(imageSrc)
          ? createElement('img', {
              src: imageSrc,
              alt: item.alt || item.title || 'Media item',
              className: 'h-40 w-full object-cover',
            })
          : createElement(
              'div',
              {
                className: 'flex h-40 w-full items-center justify-center bg-stone-100 text-xs text-stone-500',
              },
              'Add an image',
            ),
        createElement(
          'div',
          { className: 'space-y-2 p-5' },
          item.eyebrow
            ? createElement(
                'span',
                { className: 'text-xs font-semibold uppercase tracking-[0.18em] text-stone-500' },
                item.eyebrow,
              )
            : null,
          createElement('h4', { className: 'text-lg font-semibold text-stone-900' }, item.title || `Showcase ${idx + 1}`),
          item.body
            ? createElement('p', { className: 'text-sm text-stone-600 leading-relaxed' }, item.body)
            : null,
          item.ctaLabel ? createElement('span', { className: 'cms-preview-pill w-fit' }, item.ctaLabel) : null,
        ),
      );
    }),
  );
}

export function CommunityCarousel(props) {
  const slides = asArray(props.slides);
  return createElement(
    'div',
    { className: 'space-y-4' },
    createElement('p', { className: 'text-sm text-stone-600' }, 'Community imagery and quotes rotate in this carousel.'),
    slides.length > 0
      ? createElement(
          'div',
          { className: 'grid grid-cols-2 sm:grid-cols-3 gap-3' },
          slides.slice(0, 6).map((slide, idx) => {
            const imageSrc = getPreviewImageSrc(slide.image) || extractImagePath(slide.image);

            return createElement(
              'div',
              {
                key: `slide-${idx}`,
                className: 'flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm',
              },
              isNonEmptyString(imageSrc)
                ? createElement('img', {
                    src: imageSrc,
                    alt: slide.alt || 'Community slide',
                    className: 'h-32 w-full object-cover',
                  })
                : createElement(
                    'div',
                    { className: 'flex h-32 items-center justify-center bg-stone-100 text-xs text-stone-500' },
                    'Add a community image',
                  ),
              slide.quote || slide.name
                ? createElement(
                    'div',
                    { className: 'space-y-1 p-4' },
                    slide.quote
                      ? createElement('p', { className: 'text-xs italic text-stone-600 line-clamp-3' }, `“${slide.quote}”`)
                      : null,
                    slide.name
                      ? createElement(
                          'div',
                          { className: 'text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500' },
                          slide.name,
                          slide.role ? createElement('span', { className: 'block normal-case text-stone-400' }, slide.role) : null,
                        )
                      : null,
                  )
                : null,
            );
          }),
        )
      : createElement(
          'div',
          { className: 'rounded-2xl border border-dashed border-stone-300 bg-stone-100 p-6 text-sm text-stone-500' },
          'Add carousel slides with imagery and quotes.',
        ),
  );
}

export function NewsletterSignup(props) {
  return createElement(
    'div',
    { className: 'rounded-3xl border border-amber-200 bg-amber-50 p-6 space-y-4 text-amber-900' },
    createElement(
      'p',
      { className: 'text-xs uppercase tracking-[0.22em] font-semibold' },
      props.background ? `${props.background} theme` : 'Newsletter signup',
    ),
    createElement('h4', { className: 'text-xl font-semibold' }, props.title || 'Newsletter headline'),
    props.subtitle
      ? createElement('p', { className: 'text-sm leading-relaxed' }, props.subtitle)
      : null,
    createElement(
      'div',
      { className: 'flex flex-col gap-2 text-sm' },
      createElement(
        'div',
        { className: 'rounded-full bg-white px-4 py-2 text-stone-400 border border-amber-200/70' },
        props.placeholder || 'Email placeholder',
      ),
      createElement('div', { className: 'cms-preview-pill bg-amber-600 text-white w-fit' }, props.ctaLabel || 'CTA label'),
    ),
  );
}

export function Testimonials(props) {
  const testimonials = asArray(props.testimonials || props.quotes);
  if (testimonials.length === 0) {
    return createElement('p', { className: 'cms-preview-muted text-sm' }, 'Add testimonials with quotes, authors, and roles.');
  }

  return createElement(
    'div',
    { className: 'space-y-4' },
    testimonials.map((testimonial, idx) =>
      createElement(
        'blockquote',
        {
          key: `testimonial-${idx}`,
          className: 'rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-3',
        },
        testimonial.quote || testimonial.text
          ? createElement(
              'p',
              { className: 'text-sm text-stone-700 leading-relaxed italic' },
              `“${testimonial.quote || testimonial.text}”`,
            )
          : createElement('p', { className: 'text-sm text-stone-500' }, 'Add testimonial copy'),
        createElement(
          'footer',
          { className: 'text-xs uppercase tracking-[0.2em] text-stone-400 flex flex-col gap-1' },
          createElement('span', null, testimonial.author || 'Author name'),
          testimonial.role
            ? createElement('span', { className: 'text-[11px] text-stone-300 normal-case' }, testimonial.role)
            : null,
        ),
      ),
    ),
  );
}

export function Faq(props) {
  const items = asArray(props.items);
  if (items.length === 0) {
    return createElement('p', { className: 'cms-preview-muted text-sm' }, 'Add question and answer pairs.');
  }

  return createElement(
    'div',
    { className: 'space-y-3' },
    items.map((item, idx) =>
      createElement(
        'div',
        { key: `faq-${idx}`, className: 'rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-2' },
        createElement('p', { className: 'text-sm font-semibold text-stone-800' }, item.q || `Question ${idx + 1}`),
        item.a ? createElement('p', { className: 'text-sm text-stone-600 leading-relaxed' }, item.a) : null,
      ),
    ),
  );
}

export function MediaCopy(props) {
  const imageCandidate = props.image ?? props.content?.image;
  const imageSrc = getPreviewImageSrc(imageCandidate) || extractImagePath(imageCandidate);
  const text = props.content?.body || props.body || '';

  return createElement(
    'div',
    { className: 'grid gap-5 md:grid-cols-2 items-start' },
    createElement(
      'div',
      { className: 'space-y-3' },
      props.content?.heading || props.title
        ? createElement('h4', { className: 'text-lg font-semibold text-stone-900' }, props.content?.heading || props.title)
        : null,
      text
        ? createElement('p', { className: 'text-sm text-stone-600 leading-relaxed whitespace-pre-wrap' }, text)
        : createElement('p', { className: 'text-sm text-stone-400' }, 'Add body content to describe this block.'),
    ),
    isNonEmptyString(imageSrc)
      ? createElement('img', {
          src: imageSrc,
          alt: props.content?.image?.alt || props.imageAlt || 'Media image',
          className: 'w-full rounded-2xl object-cover border border-stone-200 shadow-sm',
        })
      : createElement(
          'div',
          {
            className:
              'flex h-44 w-full items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-100 text-xs text-stone-500',
          },
          'Upload an image to complete this split layout.',
        ),
  );
}

export function VideoSection(props) {
  if (!isNonEmptyString(props.url)) {
    return createElement('p', { className: 'cms-preview-muted text-sm' }, 'Paste a video URL to render this embed.');
  }

  return createElement(
    'div',
    { className: 'rounded-2xl border border-stone-200 bg-black/90 text-white p-5 space-y-2' },
    createElement('p', { className: 'text-xs uppercase tracking-[0.22em] text-white/70' }, 'Video embed'),
    createElement(
      'div',
      {
        className: 'rounded-xl border border-white/30 bg-black/40 px-4 py-3 font-mono text-xs break-all text-white/80',
      },
      props.url,
    ),
  );
}

export function Banner(props) {
  return createElement(
    'div',
    {
      className: 'rounded-full bg-stone-900 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3',
    },
    createElement('span', { className: 'text-sm font-semibold tracking-wide uppercase text-white/80' }, props.text || 'Add banner copy'),
    props.cta ? createElement('span', { className: 'cms-preview-pill bg-white text-stone-900' }, props.cta) : null,
    props.url ? createElement('span', { className: 'text-xs text-white/60 truncate' }, props.url) : null,
  );
}

export function GenericSection(props) {
  const content = props.body || props.text || props.description;
  if (!isNonEmptyString(content)) {
    return createElement('p', { className: 'cms-preview-muted text-sm' }, 'Add copy or media to this section.');
  }

  return createElement('p', { className: 'text-sm text-stone-600 leading-relaxed whitespace-pre-wrap' }, content);
}

export function HeroAlignmentSummary(props) {
  return createElement(HeroAlignment, props);
}

export default {
  PreviewLayout,
  Hero,
  SectionCard,
  ProductGrid,
  FeatureGrid,
  MediaShowcase,
  CommunityCarousel,
  NewsletterSignup,
  Testimonials,
  Faq,
  MediaCopy,
  VideoSection,
  Banner,
  GenericSection,
  HeroAlignmentSummary,
};
