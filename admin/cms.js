(function initCustomCms() {
  'use strict';

  const LOCALE_CONTAINER_ID = 'cms-preview-locale-links';
  const SUPPORTED_LOCALES = ['en', 'pt', 'es'];
  const DEFAULT_LOCALE = 'en';
  const LOCALE_LABELS = {
    en: 'English',
    pt: 'Portuguese',
    es: 'Spanish',
  };
  const LOCALE_SHORT_LABELS = {
    en: 'EN',
    pt: 'PT',
    es: 'ES',
  };
  const LOCALE_MODE_STORAGE_KEY = 'kapunka.cms.localeMode';

  function waitForCms() {
    if (!window.CMS || !(window.React || window.h)) {
      window.setTimeout(waitForCms, 50);
      return;
    }

    bootstrapCms(window.CMS).catch((error) => {
      console.error('Failed to initialize CMS previews', error);
    });
  }

  function loadStoredLocaleMode() {
    try {
      const stored = window.localStorage.getItem(LOCALE_MODE_STORAGE_KEY);
      if (stored && (stored === 'all' || SUPPORTED_LOCALES.includes(stored))) {
        return stored;
      }
    } catch (error) {
      console.warn('Unable to read locale mode from storage', error);
    }
    return 'all';
  }

  function persistLocaleMode(mode) {
    try {
      window.localStorage.setItem(LOCALE_MODE_STORAGE_KEY, mode);
    } catch (error) {
      console.warn('Unable to persist locale mode', error);
    }
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
    const localeModeState = {
      mode: loadStoredLocaleMode(),
      pendingApply: false,
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
      container.style.flexDirection = 'column';
      container.style.alignItems = 'flex-end';
      container.style.gap = '4px';
      container.innerHTML = '';

      const previewRow = document.createElement('div');
      previewRow.style.display = 'flex';
      previewRow.style.alignItems = 'center';
      previewRow.style.gap = '6px';

      const previewLabel = document.createElement('span');
      previewLabel.textContent = 'Preview';
      previewLabel.style.opacity = '0.65';
      previewLabel.style.fontWeight = '600';
      previewLabel.style.fontSize = '10px';
      previewLabel.style.letterSpacing = '0.12em';
      previewLabel.style.textTransform = 'uppercase';

      previewRow.appendChild(previewLabel);

      const previewControls = document.createElement('div');
      previewControls.style.display = 'flex';
      previewControls.style.alignItems = 'center';
      previewControls.style.gap = '6px';

      SUPPORTED_LOCALES.forEach((locale) => {
        const link = document.createElement('a');
        link.href = buildLocaleHash(info.base, info.params, locale);
        link.textContent = LOCALE_SHORT_LABELS[locale] || locale.toUpperCase();
        link.style.color = '#243b53';
        link.style.opacity = locale === activeLocale ? '1' : '0.55';
        link.style.textDecoration = 'none';
        link.style.cursor = locale === activeLocale ? 'default' : 'pointer';
        link.style.fontWeight = locale === activeLocale ? '600' : '500';

        previewControls.appendChild(link);
      });

      previewRow.appendChild(previewControls);
      container.appendChild(previewRow);

      renderLocaleModeControls(container);
      scheduleLocaleModeApply();
    }

    function renderLocaleModeControls(container) {
      if (!container) {
        return;
      }

      const modeRow = document.createElement('div');
      modeRow.className = 'cms-locale-mode-row';
      modeRow.style.display = 'flex';
      modeRow.style.alignItems = 'center';
      modeRow.style.gap = '6px';

      const modeLabel = document.createElement('span');
      modeLabel.textContent = 'Edit';
      modeLabel.style.opacity = '0.65';
      modeLabel.style.fontWeight = '600';
      modeLabel.style.fontSize = '10px';
      modeLabel.style.letterSpacing = '0.12em';
      modeLabel.style.textTransform = 'uppercase';

      modeRow.appendChild(modeLabel);

      const buttonGroup = document.createElement('div');
      buttonGroup.style.display = 'flex';
      buttonGroup.style.gap = '4px';

      const modes = ['all', ...SUPPORTED_LOCALES];
      modes.forEach((mode) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.mode = mode;
        button.textContent = mode === 'all' ? 'ALL' : (LOCALE_SHORT_LABELS[mode] || mode.toUpperCase());
        button.style.border = '1px solid #bcccdc';
        button.style.borderRadius = '999px';
        button.style.background = localeModeState.mode === mode ? '#243b53' : '#ffffff';
        button.style.color = localeModeState.mode === mode ? '#f0f4f8' : '#243b53';
        button.style.padding = '2px 8px';
        button.style.fontSize = '10px';
        button.style.fontWeight = '600';
        button.style.letterSpacing = '0.08em';
        button.style.cursor = 'pointer';
        button.style.textTransform = 'uppercase';

        if (localeModeState.mode !== mode) {
          button.addEventListener('click', () => {
            setLocaleMode(mode);
          });
        } else {
          button.style.cursor = 'default';
        }

        buttonGroup.appendChild(button);
      });

      modeRow.appendChild(buttonGroup);
      container.appendChild(modeRow);
    }

    function scheduleLocaleModeApply() {
      if (localeModeState.pendingApply) {
        return;
      }

      localeModeState.pendingApply = true;
      window.requestAnimationFrame(() => {
        localeModeState.pendingApply = false;
        applyLocaleMode();
      });
    }

    function getLocaleFromTabElement(tab) {
      if (!tab || !tab.textContent) {
        return null;
      }

      const label = tab.textContent.trim().toLowerCase();
      return SUPPORTED_LOCALES.find((locale) => {
        const full = (LOCALE_LABELS[locale] || '').toLowerCase();
        const shortLabel = (LOCALE_SHORT_LABELS[locale] || '').toLowerCase();
        return label.includes(full) || label === shortLabel;
      }) || null;
    }

    function applyLocaleMode() {
      const mode = localeModeState.mode;
      const tablists = document.querySelectorAll('[role="tablist"]');

      tablists.forEach((tablist) => {
        const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
        const localeTabs = tabs
          .map((tab) => ({ tab, locale: getLocaleFromTabElement(tab) }))
          .filter((item) => Boolean(item.locale));

        if (!localeTabs.length) {
          return;
        }

        localeTabs.forEach(({ tab, locale }) => {
          const panelId = tab.getAttribute('aria-controls');
          const panel = panelId ? document.getElementById(panelId) : null;

          if (mode !== 'all' && locale !== mode) {
            tab.style.display = 'none';
            if (panel) {
              panel.style.display = 'none';
            }
          } else {
            tab.style.display = '';
            if (panel) {
              panel.style.display = '';
            }
          }
        });

        if (mode !== 'all') {
          const currentTab = localeTabs.find(({ tab }) => tab.getAttribute('aria-selected') === 'true' && tab.style.display !== 'none');
          if (!currentTab) {
            const fallback = localeTabs.find(({ locale }) => locale === mode) || localeTabs[0];
            if (fallback) {
              fallback.tab.click();
            }
          }
        }
      });
    }

    function setLocaleMode(mode) {
      if (mode !== 'all' && !SUPPORTED_LOCALES.includes(mode)) {
        return;
      }

      if (localeModeState.mode === mode) {
        return;
      }

      localeModeState.mode = mode;
      persistLocaleMode(mode);
      scheduleLocaleModeApply();
      scheduleLocaleRender();
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
    scheduleLocaleModeApply();

    const localeTabObserver = new MutationObserver(() => {
      scheduleLocaleModeApply();
    });
    localeTabObserver.observe(document.body, { childList: true, subtree: true });

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

    function getLocalizedString(value, fallback = '') {
      if (!value) {
        return fallback;
      }
      if (typeof value === 'string') {
        return value;
      }
      if (typeof value.toJS === 'function') {
        const plain = value.toJS();
        return plain.en || plain.pt || plain.es || fallback;
      }
      if (typeof value === 'object') {
        return value.en || value.pt || value.es || fallback;
      }
      return fallback;
    }

    function getLocalizedList(value) {
      if (!value) {
        return [];
      }
      if (Array.isArray(value)) {
        return value;
      }
      if (typeof value.toJS === 'function') {
        const plain = value.toJS();
        if (Array.isArray(plain)) {
          return plain;
        }
        if (plain && typeof plain === 'object') {
          return plain.en || plain.pt || plain.es || [];
        }
        return [];
      }
      if (typeof value === 'object') {
        const list = value.en || value.pt || value.es;
        return Array.isArray(list) ? list : [];
      }
      return [];
    }

    function normalizeListItems(list) {
      return list
        .map((item) => {
          if (typeof item === 'string') {
            return item;
          }
          if (item && typeof item === 'object') {
            return item.item || item.value || item.label || '';
          }
          return '';
        })
        .filter((item) => typeof item === 'string' && item.trim().length > 0);
    }

    const ANALYTICS_ENDPOINT = '/.netlify/functions/cms-analytics';
    const OFFLINE_QUEUE_KEY = 'cmsAnalyticsOfflineQueue';

    function enqueueOffline(body) {
      try {
        const queue = JSON.parse(window.localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
        queue.push(body);
        window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue.slice(-50)));
      } catch (error) {
        console.warn('[cms-analytics] Unable to persist offline queue', error);
      }
    }

    async function flushOfflineQueue() {
      let queue;
      try {
        queue = JSON.parse(window.localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
      } catch (error) {
        queue = [];
      }

      if (!Array.isArray(queue) || queue.length === 0) {
        return;
      }

      const pending = [...queue];
      window.localStorage.setItem(OFFLINE_QUEUE_KEY, '[]');

      await Promise.all(pending.map((body) => fetch(ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }).catch((error) => {
        console.warn('[cms-analytics] Failed to flush cached event', error);
        enqueueOffline(body);
      })));
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        flushOfflineQueue().catch((error) => {
          console.warn('[cms-analytics] Failed to flush queue after reconnect', error);
        });
      });
    }

    function trackCmsEvent(eventType, data = {}, options = {}) {
      const payload = {
        eventType,
        data,
        source: 'decap-admin',
        timestamp: new Date().toISOString(),
      };

      const body = JSON.stringify(payload);

      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function' && options.fireAndForget !== false) {
        try {
          const blob = new Blob([body], { type: 'application/json' });
          const sent = navigator.sendBeacon(ANALYTICS_ENDPOINT, blob);
          if (sent) {
            return;
          }
        } catch (error) {
          console.warn('[cms-analytics] sendBeacon failed', error);
        }
      }

      fetch(ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }).catch((error) => {
        console.warn('[cms-analytics] Network request failed, queueing offline event', error);
        enqueueOffline(body);
      });
    }

    function extractEntryMetadata(entry) {
      if (!entry) {
        return {};
      }

      const slug = getEntrySlug(entry);
      const path = typeof entry.get === 'function' ? entry.get('path') : entry.path;
      return { slug, path };
    }

    function extractEventMetadata(event) {
      const collection = event?.collection || event?.collectionName || event?.data?.collectionName || event?.data?.collection;
      const entry = event?.entry || event?.data?.entry;
      const metadata = extractEntryMetadata(entry);
      return {
        collection: typeof collection === 'string' ? collection : collection?.get?.('name') || collection?.name || 'unknown',
        ...metadata,
      };
    }

    function handleCmsError(type, error, context = {}) {
      const payload = {
        type,
        message: error?.message || (typeof error === 'string' ? error : 'Unknown error'),
        stack: error?.stack,
        context,
      };
      trackCmsEvent('cms:error', payload, { fireAndForget: false });
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

    function ProductsPreview({ entry }) {
      const items = asArray(getEntryValue(entry, ['data', 'items'], []));

      return createElement(
        PreviewLayout,
        null,
        createElement(
          'section',
          { className: 'cms-preview-card bg-white p-10 space-y-6 border border-stone-200' },
          createElement('div', { className: 'cms-preview-badge bg-stone-900/10 text-stone-800' }, 'Product catalog'),
          items.length > 0
            ? createElement(
                'div',
                { className: 'space-y-4' },
                items.map((product, index) => {
                  const name = getLocalizedString(product?.name, `Product ${index + 1}`);
                  const tagline = getLocalizedString(product?.tagline, '');
                  const rawBadges = getLocalizedList(product?.badges);
                  const badges = normalizeListItems(rawBadges).slice(0, 3);
                  return createElement(
                    'article',
                    {
                      key: `product-${product?.id || index}`,
                      className: 'flex flex-col gap-2 rounded-2xl border border-stone-200/70 bg-stone-50 p-5',
                    },
                    createElement(
                      'div',
                      { className: 'flex items-start justify-between gap-3' },
                      createElement('div', { className: 'space-y-1' },
                        createElement('h3', { className: 'text-lg font-semibold text-stone-900' }, name),
                        tagline
                          ? createElement('p', { className: 'text-sm text-stone-600' }, tagline)
                          : null,
                      ),
                      createElement('span', { className: 'cms-preview-pill bg-white text-stone-700' }, product?.id || 'Unassigned ID'),
                    ),
                    badges.length > 0
                      ? createElement(
                          'div',
                          { className: 'flex flex-wrap gap-2 pt-1' },
                          badges.map((badge, badgeIndex) => createElement('span', {
                            key: `badge-${badgeIndex}`,
                            className: 'cms-preview-pill bg-stone-900/10 text-stone-700',
                          }, badge)),
                        )
                      : null,
                  );
                }),
              )
            : createElement(
                'p',
                { className: 'text-sm text-stone-500' },
                'Add products to preview catalog summaries here.',
              ),
        ),
      );
    }

    function ArticlesPreview({ entry }) {
      const items = asArray(getEntryValue(entry, ['data', 'items'], []));

      return createElement(
        PreviewLayout,
        null,
        createElement(
          'section',
          { className: 'cms-preview-card bg-white p-10 space-y-6 border border-stone-200' },
          createElement('div', { className: 'cms-preview-badge bg-blue-100 text-blue-700' }, 'Article library'),
          items.length > 0
            ? createElement(
                'div',
                { className: 'space-y-4' },
                items.map((article, index) => {
                  const title = getLocalizedString(article?.title, `Article ${index + 1}`);
                  const preview = getLocalizedString(article?.preview, '');
                  const category = article?.category || 'uncategorised';
                  return createElement(
                    'article',
                    {
                      key: `article-${article?.slug || index}`,
                      className: 'rounded-2xl border border-stone-200/70 bg-stone-50 p-5 space-y-2',
                    },
                    createElement('span', { className: 'cms-preview-pill bg-stone-900/10 text-stone-700' }, category),
                    createElement('h3', { className: 'text-lg font-semibold text-stone-900' }, title),
                    preview
                      ? createElement('p', { className: 'text-sm text-stone-600 leading-relaxed' }, preview)
                      : null,
                  );
                }),
              )
            : createElement(
                'p',
                { className: 'text-sm text-stone-500' },
                'Add articles to preview how they appear in the Learn hub.',
              ),
        ),
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

    function ContactPreview(props) {
      const { entry } = props;
      noteEntryLocale(entry);
      scheduleLocaleRender();

      const heroTitle = getEntryValue(entry, ['data', 'heroTitle'], 'Invite visitors to reach out');
      const heroSubtitle = getEntryValue(entry, ['data', 'heroSubtitle'], 'Share how Kapunka can support enquiries.');
      const contactEmail = getEntryValue(entry, ['data', 'contactEmail'], '');
      const phone = getEntryValue(entry, ['data', 'phone'], '');
      const address = getEntryValue(entry, ['data', 'address'], '');
      const mapEmbedUrl = getEntryValue(entry, ['data', 'mapEmbedUrl'], '');
      const sections = asArray(getEntryValue(entry, ['data', 'sections'], []));

      const details = [];

      if (typeof contactEmail === 'string' && contactEmail.trim().length > 0) {
        details.push({ label: 'Email', value: contactEmail.trim(), type: 'text' });
      }

      if (typeof phone === 'string' && phone.trim().length > 0) {
        details.push({ label: 'Phone', value: phone.trim(), type: 'text' });
      }

      if (typeof address === 'string' && address.trim().length > 0) {
        details.push({ label: 'Address', value: address.trim(), type: 'address' });
      }

      if (typeof mapEmbedUrl === 'string' && mapEmbedUrl.trim().length > 0) {
        details.push({ label: 'Map embed URL', value: mapEmbedUrl.trim(), type: 'map' });
      }

      const renderedSections = sections.map((section, index) => renderHomeSection(section || {}, index));

      return createElement(
        PreviewLayout,
        null,
        createElement(Hero, {
          badge: 'Contact hero',
          headline: heroTitle,
          subheadline: heroSubtitle,
        }),
        createElement('section', { className: 'cms-preview-card border border-stone-200 bg-white p-8 space-y-6' },
          createElement('div', { className: 'flex flex-wrap items-center justify-between gap-3' },
            createElement('h2', { className: 'text-2xl font-semibold text-stone-900' }, 'Contact details'),
            createElement('span', { className: 'cms-preview-pill' }, `${details.length} item${details.length === 1 ? '' : 's'}`),
          ),
          details.length > 0
            ? createElement('dl', { className: 'cms-preview-contact-details sm:grid-cols-2' },
                details.map((item, idx) => createElement('div', { key: `detail-${idx}`, className: 'space-y-1' },
                  createElement('dt', { className: 'text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400' }, item.label),
                  createElement('dd', {
                    className: item.type === 'map'
                      ? 'cms-preview-monospace text-xs text-stone-500 break-all rounded-lg bg-stone-900/5 px-3 py-2'
                      : item.type === 'address'
                        ? 'text-sm text-stone-600 leading-relaxed whitespace-pre-line'
                        : 'text-sm text-stone-600 leading-relaxed',
                  }, item.value),
                )),
              )
            : createElement('p', { className: 'cms-preview-muted text-sm' }, 'Add an email, phone number, address, or map embed URL for the contact page.'),
        ),
        renderedSections.length > 0
          ? createElement('section', { className: 'space-y-6' },
              createElement('h2', { className: 'text-2xl font-semibold text-stone-900' }, 'Supporting sections'),
              createElement('div', { className: 'cms-preview-grid md:grid-cols-2' }, renderedSections),
            )
          : createElement('section', { className: 'cms-preview-card p-12 text-center text-stone-500 border border-dashed border-stone-300' }, 'Add optional sections such as FAQs or media blocks to round out the Contact page.'),
      );
    }

    function renderTrainingSection(section, index) {
      const type = typeof section.type === 'string' ? section.type : 'section';
      const title = section.title || section.heading || `Section ${index + 1}`;

      if (type === 'trainingList') {
        const entries = asArray(section.entries);
        const entryNodes = entries.length > 0
          ? entries.map((entry, idx) => createElement('div', { key: `training-entry-${idx}`, className: 'rounded-2xl border border-stone-200 bg-white/60 p-5 space-y-2' },
              createElement('h4', { className: 'text-sm font-semibold text-stone-900' }, entry.courseTitle || `Course ${idx + 1}`),
              entry.courseSummary
                ? createElement('p', { className: 'text-sm text-stone-600 leading-relaxed' }, entry.courseSummary)
                : null,
              entry.linkUrl
                ? createElement('span', { className: 'cms-preview-pill w-fit' }, entry.linkUrl)
                : null,
            ))
          : createElement('p', { className: 'cms-preview-muted text-sm' }, 'Add training entries with course titles, summaries, and optional links.');

        return createElement(SectionCard, {
          key: `training-section-${index}`,
          badge: type,
          title,
          meta: entries.length > 0 ? `${entries.length} course${entries.length === 1 ? '' : 's'}` : null,
        }, entryNodes);
      }

      if (type === 'timeline') {
        const milestones = asArray(section.entries);
        const milestoneNodes = milestones.length > 0
          ? milestones.map((milestone, idx) => createElement('div', { key: `timeline-entry-${idx}`, className: 'relative border-l-2 border-stone-200 pl-5 space-y-1' },
              createElement('span', { className: 'absolute -left-[9px] top-1.5 h-3 w-3 rounded-full bg-stone-400' }),
              createElement('h4', { className: 'text-sm font-semibold text-stone-900' }, milestone.title || `Milestone ${idx + 1}`),
              milestone.description
                ? createElement('p', { className: 'text-sm text-stone-600 leading-relaxed' }, milestone.description)
                : null,
            ))
          : createElement('p', { className: 'cms-preview-muted text-sm' }, 'Add timeline entries to outline the training journey.');

        return createElement(SectionCard, {
          key: `training-section-${index}`,
          badge: type,
          title,
          meta: milestones.length > 0 ? `${milestones.length} step${milestones.length === 1 ? '' : 's'}` : null,
        }, milestoneNodes);
      }

      if (type === 'videoGallery') {
        const videos = asArray(section.entries);
        const videoNodes = videos.length > 0
          ? createElement('div', { className: 'grid gap-3 sm:grid-cols-2' },
              videos.map((video, idx) => createElement('div', { key: `video-${idx}`, className: 'space-y-2 rounded-2xl border border-stone-200 bg-white p-4' },
                createElement('h4', { className: 'text-sm font-semibold text-stone-900' }, video.title || `Video ${idx + 1}`),
                video.description
                  ? createElement('p', { className: 'text-sm text-stone-600 leading-relaxed' }, video.description)
                  : null,
                video.videoUrl
                  ? createElement('div', { className: 'cms-preview-monospace text-xs text-stone-500 break-all rounded-lg bg-stone-900/5 px-3 py-2' }, video.videoUrl)
                  : null,
              )))
          : createElement('p', { className: 'cms-preview-muted text-sm' }, 'Add videos with titles, descriptions, and URLs to enrich the gallery.');

        return createElement(SectionCard, {
          key: `training-section-${index}`,
          badge: type,
          title,
          meta: videos.length > 0 ? `${videos.length} video${videos.length === 1 ? '' : 's'}` : null,
        }, videoNodes);
      }

      return renderHomeSection(section, index);
    }

    function TrainingPreview(props) {
      const { entry } = props;
      noteEntryLocale(entry);
      scheduleLocaleRender();

      const metaTitle = getEntryValue(entry, ['data', 'metaTitle'], 'Introduce the Kapunka training program');
      const metaDescription = getEntryValue(entry, ['data', 'metaDescription'], 'Summarise who the training supports and what participants will learn.');
      const sections = asArray(getEntryValue(entry, ['data', 'sections'], []));
      const renderedSections = sections.map((section, index) => renderTrainingSection(section || {}, index));

      return createElement(
        PreviewLayout,
        null,
        createElement('section', { className: 'cms-preview-card bg-white p-10 space-y-6 border border-stone-200' },
          createElement('div', { className: 'cms-preview-badge text-stone-700 bg-stone-100' }, 'Training overview'),
          createElement('h1', { className: 'text-4xl font-semibold text-stone-900 tracking-tight' }, metaTitle || 'Training page'),
          metaDescription
            ? createElement('p', { className: 'text-base text-stone-600 leading-relaxed max-w-3xl whitespace-pre-line' }, metaDescription)
            : createElement('p', { className: 'cms-preview-muted text-sm' }, 'Add meta description copy to introduce the training journey.'),
        ),
        renderedSections.length > 0
          ? createElement('section', { className: 'space-y-6' },
              createElement('h2', { className: 'text-2xl font-semibold text-stone-900' }, 'Training sections'),
              createElement('div', { className: 'cms-preview-grid md:grid-cols-2' }, renderedSections),
            )
          : createElement('section', { className: 'cms-preview-card p-12 text-center text-stone-500 border border-dashed border-stone-300' }, 'Add modules, timelines, or video galleries to preview the training experience.'),
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
        case 'contact':
          return createElement(ContactPreview, props);
        case 'training':
          return createElement(TrainingPreview, props);
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
                  <a class="cms-preview-quicklink" href="#/collections/articles/entries/articles">
                    <span class="text-sm font-semibold text-stone-900">Articles library</span>
                    <p class="text-xs text-stone-600 leading-relaxed">Edit Learn hub long-form content.</p>
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

    let registerPagePreviews;
    try {
      ({ registerPagePreviews } = await import('./preview-templates.js'));
    } catch (error) {
      console.warn('Failed to load targeted preview templates', error);
    }

    if (typeof registerPagePreviews === 'function') {
      try {
        registerPagePreviews(CMS, { ContactPreview, TrainingPreview });
      } catch (error) {
        console.warn('Failed to register targeted previews', error);
      }
    }

    trackCmsEvent('cms:booted', { version: CMS?.VERSION || 'unknown' });
    flushOfflineQueue().catch((error) => {
      console.warn('[cms-analytics] Initial queue flush failed', error);
    });

    const analyticsEvents = [
      { name: 'preSave', event: 'entry:preSave' },
      { name: 'postSave', event: 'entry:postSave' },
      { name: 'preDelete', event: 'entry:preDelete' },
      { name: 'postDelete', event: 'entry:postDelete' },
      { name: 'postPublish', event: 'entry:postPublish' },
      { name: 'postUnpublish', event: 'entry:postUnpublish' },
    ];

    analyticsEvents.forEach(({ name, event }) => {
      try {
        CMS.registerEventListener({
          name,
          handler: (payload = {}) => {
            const meta = extractEventMetadata(payload);
            trackCmsEvent(event, meta);
          },
        });
      } catch (error) {
        console.warn(`[cms-analytics] Failed to register ${name} listener`, error);
      }
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        handleCmsError('window:error', event.error || event.message, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        handleCmsError('window:unhandledrejection', event.reason, {});
      });
    }

    CMS.registerPreviewTemplate('pages', PagePreview);
    CMS.registerPreviewTemplate('products', ProductsPreview);
    CMS.registerPreviewTemplate('articles', ArticlesPreview);
  }

  waitForCms();
})();
