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

    bootstrapCms(window.CMS).catch((error) => {
      console.error('Failed to initialize CMS previews', error);
    });
  }

  async function bootstrapCms(CMS) {
    const ReactNamespace = window.React || { createElement: window.h };
    const createElement = ReactNamespace.createElement.bind(ReactNamespace);

    const {
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
    } = await import('./preview-components.js');

    CMS.registerPreviewStyle('/admin/preview.css');
    CMS.registerPreviewStyle('/styles/globals.css');

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

    function getEntrySlug(entry) {
      if (!entry || typeof entry.get !== 'function') {
        return '';
      }

      const directSlug = entry.get('slug');
      if (typeof directSlug === 'string' && directSlug.trim()) {
        return directSlug.trim();
      }

      const dataSlug = entry.getIn && entry.getIn(['data', 'slug']);
      if (typeof dataSlug === 'string' && dataSlug.trim()) {
        return dataSlug.trim();
      }

      const path = entry.get('path');
      if (typeof path === 'string' && path) {
        const normalized = path.replace(/\.md$/, '');
        const segments = normalized.split('/').filter(Boolean);
        return segments[segments.length - 1] || '';
      }

      return '';
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

    function HomePreview(props) {
      const { entry } = props;
      const heroHeadline = getEntryValue(entry, ['data', 'heroHeadline'], 'Add a hero headline');
      const heroSubheadline = getEntryValue(entry, ['data', 'heroSubheadline'], 'Add a supporting statement');
      const heroCtas = getEntryValue(entry, ['data', 'heroCtas'], {});
      const heroAlignment = getEntryValue(entry, ['data', 'heroAlignment'], null);
      const sections = asArray(getEntryValue(entry, ['data', 'sections'], []));

      noteEntryLocale(entry);
      scheduleLocaleRender();

      const renderedSections = sections.map((section, index) => renderHomeSection(section || {}, index));

      return createElement(
        PreviewLayout,
        null,
        createElement(Hero, {
          badge: 'Home hero',
          headline: heroHeadline,
          subheadline: heroSubheadline,
          ctas: {
            primary: heroCtas?.ctaPrimary,
            secondary: heroCtas?.ctaSecondary,
          },
          alignment: heroAlignment,
        }),
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

    function renderHomeSection(section, index) {
      const type = typeof section.type === 'string' ? section.type : 'section';
      const title = section.title || section.heading || section.headline || 'Untitled section';
      const key = `${type}-${index}`;
      let body = null;

      switch (type) {
        case 'productGrid':
          body = createElement(ProductGrid, section);
          break;
        case 'featureGrid':
          body = createElement(FeatureGrid, section);
          break;
        case 'mediaShowcase':
          body = createElement(MediaShowcase, section);
          break;
        case 'communityCarousel':
          body = createElement(CommunityCarousel, section);
          break;
        case 'newsletterSignup':
          body = createElement(NewsletterSignup, section);
          break;
        case 'testimonials':
          body = createElement(Testimonials, section);
          break;
        case 'faq':
          body = createElement(Faq, section);
          break;
        case 'mediaCopy':
          body = createElement(MediaCopy, section);
          break;
        case 'video':
          body = createElement(VideoSection, section);
          break;
        case 'banner':
          body = createElement(Banner, section);
          break;
        default:
          body = createElement(GenericSection, section);
      }

      return createElement(
        SectionCard,
        {
          key,
          badge: type,
          title,
          meta: section.columns ? `${section.columns} column layout` : null,
        },
        body,
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

      return createElement(
        SectionCard,
        {
          key: `page-section-${index}`,
          badge: type,
          title,
        },
        createElement(GenericSection, section),
      );
    }

    function GenericPagePreview(props) {
      const { entry } = props;
      noteEntryLocale(entry);
      scheduleLocaleRender();

      const slug = getEntrySlug(entry) || 'page';
      const heroTitle = getEntryValue(entry, ['data', 'heroTitle'], null)
        || getEntryValue(entry, ['data', 'headerTitle'], null)
        || getEntryValue(entry, ['data', 'title'], null)
        || `Previewing ${slug}`;
      const heroSubtitle = getEntryValue(entry, ['data', 'heroSubtitle'], null)
        || getEntryValue(entry, ['data', 'headerSubtitle'], null)
        || getEntryValue(entry, ['data', 'description'], null)
        || 'Configure sections to see a live preview of this page.';
      const sections = asArray(getEntryValue(entry, ['data', 'sections'], []));

      return createElement(
        PreviewLayout,
        null,
        createElement('section', { className: 'cms-preview-card bg-white p-10 space-y-6 border border-stone-200' },
          createElement('div', { className: 'cms-preview-badge text-stone-700 bg-stone-100' }, `Page hero · ${slug}`),
          createElement('h1', { className: 'text-4xl font-semibold text-stone-900 tracking-tight' }, heroTitle),
          heroSubtitle
            ? createElement('p', { className: 'text-base text-stone-600 leading-relaxed max-w-3xl' }, heroSubtitle)
            : null,
        ),
        sections.length > 0
          ? createElement('section', { className: 'space-y-6' },
              createElement('h2', { className: 'text-2xl font-semibold text-stone-900' }, 'Page sections'),
              createElement('div', { className: 'cms-preview-grid md:grid-cols-2' }, sections.map((section, index) => renderGenericPageSection(section || {}, index))),
            )
          : createElement('section', { className: 'cms-preview-card p-12 text-center text-stone-500 border border-dashed border-stone-300' }, 'Add sections to preview the page layout.'),
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

    function PagePreview(props) {
      const slug = getEntrySlug(props.entry);

      switch (slug) {
        case 'home':
          return createElement(HomePreview, props);
        case 'learn':
          return createElement(LearnPreview, props);
        case 'method':
          return createElement(MethodPreview, props);
        default:
          return createElement(GenericPagePreview, props);
      }
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

    CMS.registerPreviewTemplate('pages', PagePreview);
  }

  waitForCms();
})();
