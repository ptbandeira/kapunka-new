import { createElement } from 'react';
import { stateManager } from './state-manager.js';
import { getPreviewImageSrc } from './image-utils.js';

export function PreviewLayout({ children }) {
  return createElement('div', { className: 'cms-preview-root' }, children);
}

export function Hero({ badge, headline, subheadline, ctas, alignment }) {
  return createElement(
    'section',
    { className: 'cms-preview-card p-10 space-y-6' },
    createElement('div', { className: 'cms-preview-badge' }, badge),
    createElement('div', { className: 'space-y-4' },
      headline && createElement('h1', { className: 'text-4xl font-semibold text-stone-900 tracking-tight' }, headline),
      subheadline && createElement('p', { className: 'text-base text-stone-600 leading-relaxed max-w-3xl' }, subheadline),
      ctas && createElement('div', { className: 'flex flex-wrap gap-4' },
        ctas.primary && createElement('span', { className: 'cms-preview-cta primary' }, ctas.primary.label || 'Primary CTA'),
        ctas.secondary && createElement('span', { className: 'cms-preview-cta secondary' }, ctas.secondary.label || 'Secondary CTA'),
      ),
    ),
  );
}

export function SectionCard({ badge, title, meta, children }) {
  return createElement(
    'article',
    { className: 'cms-preview-card p-8 space-y-4' },
    createElement('div', { className: 'flex items-center justify-between gap-3' },
      createElement('div', { className: 'space-y-2' },
        createElement('div', { className: 'cms-preview-badge' }, badge),
        createElement('h3', { className: 'text-xl font-semibold text-stone-900' }, title),
      ),
      meta && createElement('span', { className: 'cms-preview-pill' }, meta),
    ),
    children,
  );
}

export function createSectionBadge(type, extraClassName) {
  return createElement(
    'span',
    { className: `cms-preview-badge ${extraClassName || ''}`.trim() },
    type,
  );
}

export function GenericSection({ text, items }) {
  if (Array.isArray(items) && items.length > 0) {
    return createElement('ul', { className: 'cms-preview-list text-sm text-stone-600 leading-relaxed' },
      items.map((item, idx) => createElement('li', { key: `item-${idx}` }, item)),
    );
  }

  if (typeof text === 'string' && text.trim()) {
    return createElement('p', { className: 'text-sm text-stone-600 leading-relaxed whitespace-pre-wrap' }, text.trim());
  }

  return createElement('p', { className: 'cms-preview-muted text-sm' }, 'Add section content.');
}

export function DashboardWidget() {
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

export function renderHomeSection(section, index) {
  const type = section?.type || 'section';
  const title = section?.title || section?.heading || `Section ${index + 1}`;

  return createElement(
    SectionCard,
    {
      key: `section-${index}`,
      badge: type,
      title,
    },
    createElement(GenericSection, section),
  );
}

export function renderMethodSection(section, index) {
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
