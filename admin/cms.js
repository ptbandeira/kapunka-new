(function initCustomCms() {
  'use strict';

  const LOCALE_CONTAINER_ID = 'cms-preview-locale-links';
  const SUPPORTED_LOCALES = ['en', 'pt', 'es'];
  const DEFAULT_LOCALE = 'en';

  function waitForCms() {
    if (!window.CMS || !(window.React || window.h)) {
      window.setTimeout(waitForCms, 50);
      return;
    }

    bootstrapCms(window.CMS);
  }

  function bootstrapCms(CMS) {
    const ReactNamespace = window.React || { createElement: window.h };
    const createElement = ReactNamespace.createElement.bind(ReactNamespace);

    CMS.registerPreviewStyle('/admin/preview.css');

    const localeState = {
      latestEntryLocale: null,
      refreshScheduled: false,
    };

    function getLocaleFromPath(path) {
      if (typeof path !== 'string') {
        return null;
      }

      const match = path.match(/\/(en|pt|es)\//);
      return match ? match[1] : null;
    }

    function parseHashInfo() {
      const hash = window.location.hash || '';
      if (!hash) {
        return null;
      }

      const questionIndex = hash.indexOf('?');
      const base = questionIndex === -1 ? hash : hash.slice(0, questionIndex);
      const queryString = questionIndex === -1 ? '' : hash.slice(questionIndex + 1);
      const params = new window.URLSearchParams(queryString);
      const segments = base.replace(/^#\/?/, '').split('/').filter(Boolean);

      if (segments.length < 4 || segments[0] !== 'collections' || segments[2] !== 'entries') {
        return {
          view: 'other',
          base,
          params,
          collection: segments[1] || '',
          locale: params.get('locale') || null,
        };
      }

      return {
        view: 'entry',
        base,
        params,
        collection: segments[1] || '',
        slug: segments[3] || '',
        locale: params.get('locale') || null,
      };
    }

    function buildLocaleHash(base, params, locale) {
      const cloned = new window.URLSearchParams(params.toString());
      cloned.set('locale', locale);
      const search = cloned.toString();
      return search ? `${base}?${search}` : base;
    }

    function findPreviewHeader() {
      const selectors = [
        '[data-testid="preview-pane-top-bar"]',
        '[class*="PreviewPaneTopBar"]',
        '[class*="PreviewPaneHeader"]',
        '[class*="PreviewPane"] [class*="TopBar"]',
      ];

      for (const selector of selectors) {
        const node = document.querySelector(selector);
        if (node) {
          return node;
        }
      }

      return null;
    }

    function ensureLocaleContainer(header) {
      if (!header) {
        return null;
      }

      let container = header.querySelector(`#${LOCALE_CONTAINER_ID}`);
      if (!container) {
        container = document.createElement('div');
        container.id = LOCALE_CONTAINER_ID;
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.fontSize = '11px';
        container.style.letterSpacing = '0.08em';
        container.style.textTransform = 'uppercase';
        container.style.gap = '6px';
        container.style.marginLeft = 'auto';
        container.style.color = '#486581';
        container.style.userSelect = 'none';
        header.appendChild(container);
      }

      return container;
    }

    function renderLocaleLinks() {
      const header = findPreviewHeader();
      if (!header) {
        return;
      }

      const container = ensureLocaleContainer(header);
      if (!container) {
        return;
      }

      const info = parseHashInfo();
      if (!info || info.view !== 'entry' || info.collection !== 'pages') {
        container.style.display = 'none';
        return;
      }

      const activeLocale = info.locale || localeState.latestEntryLocale || DEFAULT_LOCALE;
      container.style.display = 'flex';
      container.innerHTML = '';

      SUPPORTED_LOCALES.forEach((locale, index) => {
        const link = document.createElement('a');
        link.href = buildLocaleHash(info.base, info.params, locale);
        link.textContent = locale.toUpperCase();
        link.style.color = '#243b53';
        link.style.opacity = locale === activeLocale ? '1' : '0.6';
        link.style.textDecoration = 'none';
        link.style.cursor = locale === activeLocale ? 'default' : 'pointer';

        container.appendChild(link);

        if (index < SUPPORTED_LOCALES.length - 1) {
          const separator = document.createElement('span');
          separator.textContent = '|';
          separator.style.opacity = '0.35';
          container.appendChild(separator);
        }
      });
    }

    function scheduleLocaleRender() {
      if (localeState.refreshScheduled) {
        return;
      }

      localeState.refreshScheduled = true;
      window.requestAnimationFrame(() => {
        localeState.refreshScheduled = false;
        renderLocaleLinks();
      });
    }

    function noteEntryLocale(entry) {
      if (!entry || typeof entry.get !== 'function') {
        return;
      }

      const path = entry.get('path');
      const localeFromPath = getLocaleFromPath(path);
      if (localeFromPath) {
        localeState.latestEntryLocale = localeFromPath;
      }
    }

    window.addEventListener('hashchange', scheduleLocaleRender);
    scheduleLocaleRender();

    function toPlain(value, fallback) {
      if (value === undefined || value === null) {
        return fallback;
      }

      if (typeof value.toJS === 'function') {
        return value.toJS();
      }

      if (typeof value.toArray === 'function') {
        return value.toArray();
      }

      return value;
    }

    function getEntryValue(entry, path, fallback) {
      if (!entry || typeof entry.getIn !== 'function') {
        return fallback;
      }

      const value = entry.getIn(path);
      return value === undefined ? fallback : toPlain(value, fallback);
    }

    function asArray(value) {
      const plain = toPlain(value, []);
      if (Array.isArray(plain)) {
        return plain;
      }

      return [];
    }

    function createSectionBadge(type, extraClassName) {
      return createElement(
        'span',
        { className: `cms-preview-badge ${extraClassName || ''}`.trim() },
        type,
      );
    }

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
            className: 'inline-flex items-center rounded-full bg-stone-900 text-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-stone-800 transition',
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
            className: 'inline-flex items-center rounded-full border border-stone-900 text-stone-900 px-4 py-2 text-sm font-medium hover:bg-stone-900 hover:text-white transition',
          },
          ctas.secondary.label || 'Secondary CTA',
        ));
      }

      if (buttons.length === 0) {
        return null;
      }

      return createElement(
        'div',
        { className: 'flex flex-wrap gap-3 mt-6' },
        buttons,
      );
    }

    function PreviewLayout(props) {
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

    function HomePreview(props) {
      const { entry } = props;
      const heroHeadline = getEntryValue(entry, ['data', 'heroHeadline'], 'Add a hero headline');
      const heroSubheadline = getEntryValue(entry, ['data', 'heroSubheadline'], 'Add a supporting statement');
      const heroCtas = getEntryValue(entry, ['data', 'heroCtas'], {});
      const sections = asArray(getEntryValue(entry, ['data', 'sections'], []));

      noteEntryLocale(entry);
      scheduleLocaleRender();

      const renderedSections = sections.map((section, index) => renderHomeSection(section || {}, index));

      return createElement(
        PreviewLayout,
        null,
        createElement(
          'section',
          { className: 'cms-preview-card p-10 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white' },
          createElement(
            'div',
            { className: 'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between' },
            createElement('div', { className: 'space-y-3' },
              createElement('div', { className: 'cms-preview-badge bg-white/15 text-white/90' }, 'Home hero'),
              createElement('h1', { className: 'text-4xl sm:text-5xl font-semibold tracking-tight' }, heroHeadline),
              createElement('p', { className: 'text-base sm:text-lg text-white/80 max-w-2xl leading-relaxed' }, heroSubheadline),
            ),
            renderHeroAlignment(entry),
          ),
          renderCtas({
            primary: heroCtas?.ctaPrimary,
            secondary: heroCtas?.ctaSecondary,
          }),
        ),
        createElement(
          'section',
          { className: 'space-y-6' },
          createElement('div', { className: 'flex items-center justify-between' },
            createElement('h2', { className: 'text-2xl font-semibold text-stone-900' }, 'Page Sections'),
            createElement('span', { className: 'cms-preview-pill' }, `${renderedSections.length} configured section${renderedSections.length === 1 ? '' : 's'}`),
          ),
          renderedSections.length > 0
            ? createElement('div', { className: 'cms-preview-grid md:grid-cols-2' }, renderedSections)
            : createElement('div', { className: 'cms-preview-card p-12 text-center text-stone-500' }, 'Add sections to preview how they will appear on the homepage.'),
        ),
      );
    }

    function renderHeroAlignment(entry) {
      const alignment = getEntryValue(entry, ['data', 'heroAlignment'], null);
      if (!alignment || typeof alignment !== 'object') {
        return null;
      }

      const items = [
        alignment.heroAlignX ? `Horizontal: ${alignment.heroAlignX}` : null,
        alignment.heroAlignY ? `Vertical: ${alignment.heroAlignY}` : null,
        alignment.heroTextPosition ? `Text position: ${alignment.heroTextPosition}` : null,
        alignment.heroOverlay ? `Overlay: ${alignment.heroOverlay}` : null,
        alignment.heroLayoutHint ? `Layout: ${alignment.heroLayoutHint}` : null,
      ].filter(Boolean);

      if (items.length === 0) {
        return null;
      }

      return createElement(
        'div',
        { className: 'rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs uppercase tracking-wide text-white/80 space-y-1 max-w-xs' },
        items.map((item, index) => createElement('div', { key: `hero-alignment-${index}` }, item)),
      );
    }

    function renderHomeSection(section, index) {
      const type = typeof section.type === 'string' ? section.type : 'section';
      const title = section.title || section.heading || section.headline || 'Untitled section';
      const key = `${type}-${index}`;
      const badge = createSectionBadge(type);

      let body = null;

      switch (type) {
        case 'productGrid':
          body = renderProductGridSection(section);
          break;
        case 'featureGrid':
          body = renderFeatureGridSection(section);
          break;
        case 'mediaShowcase':
          body = renderMediaShowcaseSection(section);
          break;
        case 'communityCarousel':
          body = renderCommunityCarouselSection(section);
          break;
        case 'newsletterSignup':
          body = renderNewsletterSection(section);
          break;
        case 'testimonials':
          body = renderTestimonialsSection(section);
          break;
        case 'faq':
          body = renderFaqSection(section);
          break;
        case 'mediaCopy':
          body = renderMediaCopySection(section);
          break;
        case 'video':
          body = renderVideoSection(section);
          break;
        case 'banner':
          body = renderBannerSection(section);
          break;
        default:
          body = renderGenericSection(section);
      }

      return createElement(
        'article',
        { key, className: 'cms-preview-card p-8 space-y-4 border border-stone-200/60' },
        createElement('div', { className: 'flex items-start justify-between gap-4' },
          createElement('div', { className: 'space-y-1' },
            badge,
            createElement('h3', { className: 'cms-preview-section-title text-stone-900' }, title),
          ),
          section.columns ? createElement('span', { className: 'cms-preview-pill' }, `${section.columns} column layout`) : null,
        ),
        body,
      );
    }

    function renderGenericSection(section) {
      const content = section.body || section.text || section.description;
      if (!content) {
        return createElement('p', { className: 'cms-preview-muted text-sm' }, 'Add copy or media to this section.');
      }

      return createElement('p', { className: 'text-sm text-stone-600 leading-relaxed whitespace-pre-wrap' }, content);
    }

    function renderProductGridSection(section) {
      const products = Array.isArray(section.products) ? section.products : [];
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

    function renderFeatureGridSection(section) {
      const items = Array.isArray(section.items) ? section.items : [];
      if (items.length === 0) {
        return createElement('p', { className: 'cms-preview-muted text-sm' }, 'Add feature items to populate this grid.');
      }

      return createElement(
        'div',
        { className: 'grid gap-4 sm:grid-cols-2' },
        items.map((item, idx) => createElement(
          'div',
          {
            key: `feature-${idx}`,
            className: 'rounded-2xl border border-stone-200 bg-white p-5 shadow-sm flex flex-col gap-2',
          },
          createElement('span', { className: 'font-medium text-stone-900' }, item.label || `Feature ${idx + 1}`),
          item.description ? createElement('p', { className: 'text-sm text-stone-600 leading-relaxed' }, item.description) : null,
        )),
      );
    }

    function renderMediaShowcaseSection(section) {
      const items = Array.isArray(section.items) ? section.items : [];
      if (items.length === 0) {
        return createElement('p', { className: 'cms-preview-muted text-sm' }, 'Add showcase items with imagery and CTAs.');
      }

      return createElement(
        'div',
        { className: 'grid gap-4 md:grid-cols-2' },
        items.map((item, idx) => createElement(
          'div',
          {
            key: `media-${idx}`,
            className: 'overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm',
          },
          item.image
            ? createElement('img', {
              src: item.image,
              alt: item.alt || item.title || 'Media item',
              className: 'h-40 w-full object-cover',
            })
            : createElement('div', {
              className: 'flex h-40 w-full items-center justify-center bg-stone-100 text-xs text-stone-500',
            }, 'Add an image'),
          createElement('div', { className: 'space-y-2 p-5' },
            item.eyebrow ? createElement('span', { className: 'text-xs font-semibold uppercase tracking-[0.18em] text-stone-500' }, item.eyebrow) : null,
            createElement('h4', { className: 'text-lg font-semibold text-stone-900' }, item.title || `Showcase ${idx + 1}`),
            item.body ? createElement('p', { className: 'text-sm text-stone-600 leading-relaxed' }, item.body) : null,
            item.ctaLabel ? createElement('span', { className: 'cms-preview-pill w-fit' }, item.ctaLabel) : null,
          ),
        )),
      );
    }

    function renderCommunityCarouselSection(section) {
      const slides = Array.isArray(section.slides) ? section.slides : [];
      return createElement(
        'div',
        { className: 'space-y-4' },
        createElement('p', { className: 'text-sm text-stone-600' }, 'Community imagery and quotes rotate in this carousel.'),
        slides.length > 0
          ? createElement('div', { className: 'grid grid-cols-2 sm:grid-cols-3 gap-3' },
            slides.slice(0, 6).map((slide, idx) => createElement(
              'div',
              {
                key: `slide-${idx}`,
                className: 'flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm',
              },
              slide.image
                ? createElement('img', {
                  src: slide.image,
                  alt: slide.alt || 'Community slide',
                  className: 'h-32 w-full object-cover',
                })
                : createElement('div', { className: 'flex h-32 items-center justify-center bg-stone-100 text-xs text-stone-500' }, 'Add a community image'),
              (slide.quote || slide.name) ? createElement('div', { className: 'space-y-1 p-4' },
                slide.quote ? createElement('p', { className: 'text-xs italic text-stone-600 line-clamp-3' }, `“${slide.quote}”`) : null,
                slide.name ? createElement('p', { className: 'text-xs font-medium text-stone-700' }, slide.name) : null,
                slide.role ? createElement('p', { className: 'text-[11px] uppercase tracking-wide text-stone-400' }, slide.role) : null,
              ) : null,
            )))
          : createElement('div', { className: 'cms-preview-card p-6 text-sm text-stone-500' }, 'Add slides with imagery, quotes, and names to activate the carousel.'),
      );
    }

    function renderNewsletterSection(section) {
      return createElement(
        'div',
        { className: 'rounded-3xl border border-amber-200 bg-amber-50 p-6 space-y-4 text-amber-900' },
        createElement('p', { className: 'text-xs uppercase tracking-[0.22em] font-semibold' }, section.background ? `${section.background} theme` : 'Newsletter signup'),
        createElement('h4', { className: 'text-xl font-semibold' }, section.title || 'Newsletter headline'),
        section.subtitle ? createElement('p', { className: 'text-sm leading-relaxed' }, section.subtitle) : null,
        createElement('div', { className: 'flex flex-col gap-2 text-sm' },
          createElement('div', { className: 'rounded-full bg-white px-4 py-2 text-stone-400 border border-amber-200/70' }, section.placeholder || 'Email placeholder'),
          createElement('div', { className: 'cms-preview-pill bg-amber-600 text-white w-fit' }, section.ctaLabel || 'CTA label'),
        ),
      );
    }

    function renderTestimonialsSection(section) {
      const testimonials = asArray(section.testimonials || section.quotes);
      if (testimonials.length === 0) {
        return createElement('p', { className: 'cms-preview-muted text-sm' }, 'Add testimonials with quotes, authors, and roles.');
      }

      return createElement(
        'div',
        { className: 'space-y-4' },
        testimonials.map((testimonial, idx) => createElement(
          'blockquote',
          {
            key: `testimonial-${idx}`,
            className: 'rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-3',
          },
          testimonial.quote || testimonial.text
            ? createElement('p', { className: 'text-sm text-stone-700 leading-relaxed italic' }, `“${testimonial.quote || testimonial.text}”`)
            : createElement('p', { className: 'text-sm text-stone-500' }, 'Add testimonial copy'),
          createElement('footer', { className: 'text-xs uppercase tracking-[0.2em] text-stone-400 flex flex-col gap-1' },
            createElement('span', null, testimonial.author || 'Author name'),
            testimonial.role ? createElement('span', { className: 'text-[11px] text-stone-300 normal-case' }, testimonial.role) : null,
          ),
        )),
      );
    }

    function renderFaqSection(section) {
      const items = Array.isArray(section.items) ? section.items : [];
      if (items.length === 0) {
        return createElement('p', { className: 'cms-preview-muted text-sm' }, 'Add question and answer pairs.');
      }

      return createElement(
        'div',
        { className: 'space-y-3' },
        items.map((item, idx) => createElement(
          'div',
          { key: `faq-${idx}`, className: 'rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-2' },
          createElement('p', { className: 'text-sm font-semibold text-stone-800' }, item.q || `Question ${idx + 1}`),
          item.a ? createElement('p', { className: 'text-sm text-stone-600 leading-relaxed' }, item.a) : null,
        )),
      );
    }

    function renderMediaCopySection(section) {
      const image = section.image && typeof section.image === 'object' ? section.image.src : section.image;
      const text = section.content?.body || section.body || '';

      return createElement(
        'div',
        { className: 'grid gap-5 md:grid-cols-2 items-start' },
        createElement('div', { className: 'space-y-3' },
          section.content?.heading || section.title
            ? createElement('h4', { className: 'text-lg font-semibold text-stone-900' }, section.content?.heading || section.title)
            : null,
          text
            ? createElement('p', { className: 'text-sm text-stone-600 leading-relaxed whitespace-pre-wrap' }, text)
            : createElement('p', { className: 'text-sm text-stone-400' }, 'Add body content to describe this block.'),
        ),
        image
          ? createElement('img', { src: image, alt: section.content?.image?.alt || section.imageAlt || 'Media image', className: 'w-full rounded-2xl object-cover border border-stone-200 shadow-sm' })
          : createElement('div', { className: 'flex h-44 w-full items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-100 text-xs text-stone-500' }, 'Upload an image to complete this split layout.'),
      );
    }

    function renderVideoSection(section) {
      if (!section.url) {
        return createElement('p', { className: 'cms-preview-muted text-sm' }, 'Paste a video URL to render this embed.');
      }

      return createElement('div', { className: 'rounded-2xl border border-stone-200 bg-black/90 text-white p-5 space-y-2' },
        createElement('p', { className: 'text-xs uppercase tracking-[0.22em] text-white/70' }, 'Video embed'),
        createElement('div', { className: 'rounded-xl border border-white/30 bg-black/40 px-4 py-3 font-mono text-xs break-all text-white/80' }, section.url),
      );
    }

    function renderBannerSection(section) {
      return createElement('div', { className: 'rounded-full bg-stone-900 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3' },
        createElement('span', { className: 'text-sm font-semibold tracking-wide uppercase text-white/80' }, section.text || 'Add banner copy'),
        section.cta ? createElement('span', { className: 'cms-preview-pill bg-white text-stone-900' }, section.cta) : null,
        section.url ? createElement('span', { className: 'text-xs text-white/60 truncate' }, section.url) : null,
      );
    }

    function LearnPreview(props) {
      const { entry } = props;
      noteEntryLocale(entry);
      scheduleLocaleRender();

      const heroTitle = getEntryValue(entry, ['data', 'heroTitle'], 'Add a Learn title');
      const heroSubtitle = getEntryValue(entry, ['data', 'heroSubtitle'], 'Introduce the Learn hub.');
      const categories = asArray(getEntryValue(entry, ['data', 'categories'], []));
      const sections = asArray(getEntryValue(entry, ['data', 'sections'], []));

      return createElement(
        PreviewLayout,
        null,
        createElement('section', { className: 'cms-preview-card bg-white p-10 space-y-6 border border-stone-200' },
          createElement('div', { className: 'cms-preview-badge text-stone-700 bg-stone-100' }, 'Learn hero'),
          createElement('h1', { className: 'text-4xl font-semibold text-stone-900 tracking-tight' }, heroTitle),
          createElement('p', { className: 'text-base text-stone-600 leading-relaxed max-w-3xl' }, heroSubtitle),
          categories.length > 0
            ? createElement('div', { className: 'flex flex-wrap gap-2 pt-2' },
              categories.map((category, idx) => createElement('span', { key: `category-${idx}`, className: 'cms-preview-pill bg-stone-900/10 text-stone-700' }, category.label || category.id || `Category ${idx + 1}`)),
            )
            : createElement('div', { className: 'cms-preview-pill bg-stone-900/10 text-stone-700' }, 'Add categories to help visitors filter content.'),
        ),
        sections.length > 0
          ? createElement('section', { className: 'space-y-6' },
              createElement('h2', { className: 'text-2xl font-semibold text-stone-900' }, 'Learn storytelling sections'),
              createElement('div', { className: 'cms-preview-grid md:grid-cols-2' }, sections.map((section, index) => renderGenericPageSection(section, index))))
          : createElement('section', { className: 'cms-preview-card p-12 text-center text-stone-500 border border-dashed border-stone-300' }, 'Add optional sections to enrich the Learn hub with additional context.'),
      );
    }

    function renderGenericPageSection(section, index) {
      const type = typeof section.type === 'string' ? section.type : 'section';
      const title = section.title || section.heading || section.headline || 'Untitled block';
      const body = section.body || section.text || section.description;

      return createElement('article', { key: `page-section-${index}`, className: 'cms-preview-card p-8 space-y-3 border border-stone-200/70' },
        createSectionBadge(type),
        createElement('h3', { className: 'text-xl font-semibold text-stone-900' }, title),
        body ? createElement('p', { className: 'text-sm text-stone-600 leading-relaxed whitespace-pre-wrap' }, body) : createElement('p', { className: 'cms-preview-muted text-sm' }, 'Add descriptive copy for this section.'),
      );
    }

    function MethodPreview(props) {
      const { entry } = props;
      noteEntryLocale(entry);
      scheduleLocaleRender();

      const heroTitle = getEntryValue(entry, ['data', 'heroTitle'], 'Introduce the method');
      const heroSubtitle = getEntryValue(entry, ['data', 'heroSubtitle'], 'Share how the method works.');
      const clinicalNotes = asArray(getEntryValue(entry, ['data', 'clinicalNotes'], []));
      const sections = asArray(getEntryValue(entry, ['data', 'sections'], []));

      const clinicalColumns = clinicalNotes.map((note, index) => createElement('div', { key: `note-${index}`, className: 'space-y-3 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm' },
        createElement('h3', { className: 'text-lg font-semibold text-stone-900' }, note.title || `Clinical note ${index + 1}`),
        Array.isArray(note.bullets) && note.bullets.length > 0
          ? createElement('ul', { className: 'cms-preview-list text-sm text-stone-600 leading-relaxed' },
              note.bullets.map((bullet, idx) => createElement('li', { key: `bullet-${index}-${idx}`, className: 'relative pl-4 before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-stone-400' }, bullet)))
          : createElement('p', { className: 'cms-preview-muted text-sm' }, 'Add supporting bullet points.'),
      ));

      return createElement(
        PreviewLayout,
        null,
        createElement('section', { className: 'cms-preview-card bg-gradient-to-br from-orange-50 via-stone-50 to-white border border-orange-100 p-10 space-y-5' },
          createElement('div', { className: 'cms-preview-badge bg-orange-100 text-orange-700' }, 'Method hero'),
          createElement('h1', { className: 'text-4xl font-semibold text-stone-900 tracking-tight' }, heroTitle),
          createElement('p', { className: 'text-base text-stone-600 leading-relaxed max-w-3xl' }, heroSubtitle),
        ),
        clinicalColumns.length > 0 ? createElement('section', { className: 'space-y-4' },
          createElement('h2', { className: 'text-2xl font-semibold text-stone-900' }, 'Clinical notes'),
          createElement('div', { className: 'grid gap-4 md:grid-cols-2' }, clinicalColumns),
        ) : null,
        sections.length > 0
          ? createElement('section', { className: 'space-y-6' },
              createElement('h2', { className: 'text-2xl font-semibold text-stone-900' }, 'Method sections'),
              createElement('div', { className: 'cms-preview-grid md:grid-cols-2' }, sections.map((section, index) => renderMethodSection(section, index))))
          : createElement('section', { className: 'cms-preview-card p-12 text-center text-stone-500 border border-dashed border-stone-300' }, 'Add method sections such as facts, bullet grids, or specialties.'),
      );
    }

    function renderMethodSection(section, index) {
      const type = typeof section.type === 'string' ? section.type : 'section';
      const title = section.title || section.heading || 'Untitled block';
      const text = section.text || section.body;
      const items = Array.isArray(section.items) ? section.items : [];
      const specialties = Array.isArray(section.specialties) ? section.specialties : [];

      let body = null;

      if (items.length > 0) {
        body = createElement('ul', { className: 'cms-preview-list text-sm text-stone-600 leading-relaxed' },
          items.map((item, idx) => createElement('li', { key: `method-item-${idx}`, className: 'relative pl-4 before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-stone-400' }, item)),
        );
      } else if (specialties.length > 0) {
        body = createElement('div', { className: 'space-y-3' },
          specialties.map((specialty, idx) => createElement('div', { key: `specialty-${idx}`, className: 'rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-2' },
            createElement('h4', { className: 'text-sm font-semibold uppercase tracking-[0.18em] text-stone-500' }, specialty.title || `Specialty ${idx + 1}`),
            Array.isArray(specialty.bullets) ? createElement('ul', { className: 'cms-preview-list text-xs text-stone-600 leading-relaxed' }, specialty.bullets.map((bullet, bulletIdx) => createElement('li', { key: `specialty-bullet-${idx}-${bulletIdx}`, className: 'relative pl-4 before:absolute before:left-0 before:top-1.5 before:h-1.5 before:w-1.5 before:rounded-full before:bg-stone-400' }, bullet))) : null,
          )),
        );
      } else if (text) {
        body = createElement('p', { className: 'text-sm text-stone-600 leading-relaxed whitespace-pre-wrap' }, text);
      } else {
        body = createElement('p', { className: 'cms-preview-muted text-sm' }, 'Add descriptive copy or bullet points for this section.');
      }

      return createElement('article', { key: `method-section-${index}`, className: 'cms-preview-card p-8 space-y-4 border border-stone-200/70' },
        createSectionBadge(type),
        createElement('h3', { className: 'text-xl font-semibold text-stone-900' }, title),
        body,
      );
    }

    function DashboardWidget() {
      const quickLinks = [
        {
          label: 'Home page',
          description: 'Hero, featured stories, and homepage sections.',
          href: '#/collections/pages/entries/home?locale=en',
        },
        {
          label: 'Learn page',
          description: 'Library categories and educational sections.',
          href: '#/collections/pages/entries/learn?locale=en',
        },
        {
          label: 'Method page',
          description: 'Clinical notes and sourcing details.',
          href: '#/collections/pages/entries/method?locale=en',
        },
        {
          label: 'Products catalog',
          description: 'Manage product copy, pricing, and imagery.',
          href: '#/collections/products/entries/catalog',
        },
      ];

      return createElement('div', { className: 'cms-preview-root bg-transparent py-8 px-6' },
        createElement('div', { className: 'mx-auto max-w-5xl space-y-6' },
          createElement('div', { className: 'cms-preview-card border border-stone-200 bg-white/95 p-8 shadow-xl' },
            createElement('div', { className: 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between' },
              createElement('div', { className: 'space-y-2' },
                createElement('span', { className: 'cms-preview-badge bg-stone-900 text-white' }, 'Editorial dashboard'),
                createElement('h2', { className: 'text-2xl font-semibold text-stone-900' }, 'Jump back into recent work'),
                createElement('p', { className: 'text-sm text-stone-600' }, 'Open your most-edited pages without searching the collection tree.'),
              ),
            ),
            createElement('div', { className: 'grid gap-4 sm:grid-cols-2 pt-6' },
              quickLinks.map((link) => createElement('a', { key: link.href, className: 'cms-preview-quicklink', href: link.href },
                createElement('span', { className: 'text-sm font-semibold text-stone-900' }, link.label),
                createElement('p', { className: 'text-xs text-stone-600 leading-relaxed' }, link.description),
                createElement('span', { className: 'text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400' }, 'Open →'),
              )),
            ),
          ),
        ),
      );
    }

    function injectDashboardWidget() {
      const root = document.querySelector('[data-testid="editorial-workflow"], [class*="WorkflowRoot"]');
      if (!root || root.querySelector('[data-dashboard-widget]')) {
        return;
      }

      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-dashboard-widget', 'true');
      root.insertBefore(wrapper, root.firstChild);

      if (window.ReactDOM && typeof window.ReactDOM.render === 'function') {
        window.ReactDOM.render(createElement(DashboardWidget), wrapper);
      } else {
        wrapper.innerHTML = `
          <section class="cms-preview-root bg-transparent py-8 px-6">
            <div class="mx-auto max-w-5xl space-y-6">
              <div class="cms-preview-card border border-stone-200 bg-white/95 p-8 shadow-xl">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div class="space-y-2">
                    <span class="cms-preview-badge bg-stone-900 text-white">Editorial dashboard</span>
                    <h2 class="text-2xl font-semibold text-stone-900">Jump back into recent work</h2>
                    <p class="text-sm text-stone-600">Open your most-edited pages without searching the collection tree.</p>
                  </div>
                </div>
                <div class="grid gap-4 sm:grid-cols-2 pt-6">
                  <a class="cms-preview-quicklink" href="#/collections/pages/entries/home?locale=en">
                    <span class="text-sm font-semibold text-stone-900">Home page</span>
                    <p class="text-xs text-stone-600 leading-relaxed">Hero, featured stories, and homepage sections.</p>
                    <span class="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Open →</span>
                  </a>
                  <a class="cms-preview-quicklink" href="#/collections/pages/entries/learn?locale=en">
                    <span class="text-sm font-semibold text-stone-900">Learn page</span>
                    <p class="text-xs text-stone-600 leading-relaxed">Library categories and educational sections.</p>
                    <span class="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Open →</span>
                  </a>
                  <a class="cms-preview-quicklink" href="#/collections/pages/entries/method?locale=en">
                    <span class="text-sm font-semibold text-stone-900">Method page</span>
                    <p class="text-xs text-stone-600 leading-relaxed">Clinical notes and sourcing details.</p>
                    <span class="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Open →</span>
                  </a>
                  <a class="cms-preview-quicklink" href="#/collections/products/entries/catalog">
                    <span class="text-sm font-semibold text-stone-900">Products catalog</span>
                    <p class="text-xs text-stone-600 leading-relaxed">Manage product copy, pricing, and imagery.</p>
                    <span class="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Open →</span>
                  </a>
                </div>
              </div>
            </div>
          </section>
        `;
      }
    }

    CMS.registerEventListener({
      name: 'preload',
      handler: () => {
        window.requestAnimationFrame(() => injectDashboardWidget());
      },
    });

    window.addEventListener('hashchange', () => {
      window.requestAnimationFrame(() => injectDashboardWidget());
    });

    CMS.registerWidget('dashboard', DashboardWidget);

    const homeTemplates = ['home_en', 'home_pt', 'home_es'];
    homeTemplates.forEach((template) => {
      CMS.registerPreviewTemplate(template, HomePreview);
    });

    const learnTemplates = ['learn_en', 'learn_pt', 'learn_es'];
    learnTemplates.forEach((template) => {
      CMS.registerPreviewTemplate(template, LearnPreview);
    });

    const methodTemplates = ['method_en', 'method_pt', 'method_es'];
    methodTemplates.forEach((template) => {
      CMS.registerPreviewTemplate(template, MethodPreview);
    });
  }

  waitForCms();
})();
