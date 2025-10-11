import { createElement } from 'react';
import { 
  getEntryValue, 
  asArray, 
  getLocalizedString, 
  getLocalizedList 
} from './utils.js';

import { 
  stateManager 
} from './state-manager.js';

import {
  PreviewLayout,
  Hero,
  SectionCard,
  renderHomeSection,
  renderMethodSection,
} from './preview-utils.js';

export function HomePreview({ entry }) {
  stateManager.noteEntryLocale(entry);

  const heroHeadline = getEntryValue(entry, ['data', 'heroHeadline'], 'Add a hero headline');
  const heroSubheadline = getEntryValue(entry, ['data', 'heroSubheadline'], 'Add a supporting statement');
  const heroCtas = getEntryValue(entry, ['data', 'heroCtas'], {});
  const heroAlignment = getEntryValue(entry, ['data', 'heroAlignment'], null);
  const sections = asArray(getEntryValue(entry, ['data', 'sections'], []));

  return createElement(
    PreviewLayout,
    null,
    createElement(Hero, {
      badge: 'Home hero',
      headline: heroHeadline,
      subheadline: heroSubheadline,
      ctas: heroCtas,
      alignment: heroAlignment,
    }),
    createElement(
      'section',
      { className: 'space-y-6' },
      createElement('h2', { className: 'text-2xl font-semibold text-stone-900' }, 'Page Sections'),
      sections.length > 0
        ? createElement('div', { className: 'cms-preview-grid md:grid-cols-2' },
            sections.map((section, index) => renderHomeSection(section, index)))
        : createElement('p', { className: 'cms-preview-muted text-center py-8' },
            'Add sections to preview the homepage layout.'),
    ),
  );
}

export function ContactPreview({ entry }) {
  stateManager.noteEntryLocale(entry);

  const heroTitle = getEntryValue(entry, ['data', 'heroTitle'], 'Contact page');
  const heroSubtitle = getEntryValue(entry, ['data', 'heroSubtitle'], 'Add contact details and supporting content.');
  const email = getEntryValue(entry, ['data', 'email'], '');
  const phone = getEntryValue(entry, ['data', 'phone'], '');
  const address = getEntryValue(entry, ['data', 'address'], '');
  const sections = asArray(getEntryValue(entry, ['data', 'sections'], []));

  const details = [
    email && { label: 'Email', value: email },
    phone && { label: 'Phone', value: phone },
    address && { label: 'Address', value: address },
  ].filter(Boolean);

  return createElement(
    PreviewLayout,
    null,
    createElement(Hero, {
      badge: 'Contact hero',
      headline: heroTitle,
      subheadline: heroSubtitle,
    }),
    createElement(
      'section',
      { className: 'cms-preview-card p-8 space-y-6' },
      createElement('h2', { className: 'text-2xl font-semibold text-stone-900' }, 'Contact Details'),
      details.length > 0
        ? createElement('div', { className: 'grid gap-4 md:grid-cols-2' },
            details.map(({ label, value }, idx) => createElement('div', { key: `detail-${idx}`, className: 'space-y-1' },
              createElement('dt', { className: 'text-xs font-semibold uppercase tracking-wide text-stone-500' }, label),
              createElement('dd', { className: 'text-base text-stone-900' }, value),
            )))
        : createElement('p', { className: 'cms-preview-muted text-center py-4' }, 'Add contact information.'),
    ),
    sections.length > 0 && createElement(
      'section',
      { className: 'space-y-6' },
      createElement('h2', { className: 'text-2xl font-semibold text-stone-900' }, 'Supporting Sections'),
      createElement('div', { className: 'cms-preview-grid md:grid-cols-2' },
        sections.map((section, index) => renderHomeSection(section, index)),
      ),
    ),
  );
}

export function MethodPreview({ entry }) {
  stateManager.noteEntryLocale(entry);

  const heroTitle = getEntryValue(entry, ['data', 'heroTitle'], 'Method page');
  const heroSubtitle = getEntryValue(entry, ['data', 'heroSubtitle'], 'Share how the method works.');
  const clinicalNotes = asArray(getEntryValue(entry, ['data', 'clinicalNotes'], []));
  const sections = asArray(getEntryValue(entry, ['data', 'sections'], []));

  const clinicalColumns = clinicalNotes.map((note, index) => createElement('div', { key: 'note-' + index, className: 'space-y-3 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm' },
    createElement('h3', { className: 'text-lg font-semibold text-stone-900' }, note.title || 'Clinical note ' + (index + 1)),
    Array.isArray(note.bullets) && note.bullets.length > 0
      ? createElement('ul', { className: 'cms-preview-list text-sm text-stone-600 leading-relaxed' },
          note.bullets.map((bullet, idx) => createElement('li', { key: 'bullet-' + index + '-' + idx, className: 'relative pl-4 before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-stone-400' }, bullet)))
      : createElement('p', { className: 'cms-preview-muted text-sm' }, 'Add supporting bullet points.'),
  ));

  return createElement(
    PreviewLayout,
    null,
    createElement(Hero, {
      badge: 'Method hero',
      headline: heroTitle,
      subheadline: heroSubtitle,
    }),
    clinicalColumns.length > 0 ? createElement('section', { className: 'space-y-4' },
      createElement('h2', { className: 'text-2xl font-semibold text-stone-900' }, 'Clinical notes'),
      createElement('div', { className: 'grid gap-4 md:grid-cols-2' }, clinicalColumns),
    ) : null,
    sections.length > 0
      ? createElement('section', { className: 'space-y-6' },
          createElement('h2', { className: 'text-2xl font-semibold text-stone-900' }, 'Method sections'),
          createElement('div', { className: 'cms-preview-grid md:grid-cols-2' },
            sections.map((section, index) => renderMethodSection(section, index))),
        )
      : createElement('p', { className: 'cms-preview-muted text-center py-8' },
          'Add method sections such as facts, bullet grids, or specialties.'),
  );
}

export function ProductPreview({ entry }) {
  const items = asArray(getEntryValue(entry, ['data', 'items'], []));

  return createElement(
    PreviewLayout,
    null,
    createElement(
      'section',
      { className: 'cms-preview-card p-8 space-y-6' },
      createElement('div', { className: 'cms-preview-badge bg-stone-900/10 text-stone-800' }, 'Product catalog'),
      items.length > 0
        ? createElement('div', { className: 'space-y-4' },
            items.map((product, index) => {
              const name = getLocalizedString(product?.name, 'Product ' + (index + 1));
              const tagline = getLocalizedString(product?.tagline, '');
              const badges = getLocalizedList(product?.badges);

              return createElement(
                'article',
                { key: 'product-' + (product?.id || index), className: 'rounded-2xl border border-stone-200 bg-white p-5 space-y-3' },
                createElement('div', { className: 'flex items-start justify-between gap-3' },
                  createElement('div', { className: 'space-y-1' },
                    createElement('h3', { className: 'text-lg font-semibold text-stone-900' }, name),
                    tagline && createElement('p', { className: 'text-sm text-stone-600' }, tagline),
                  ),
                  createElement('span', { className: 'cms-preview-pill bg-stone-100' }, product?.id || 'ID pending'),
                ),
                badges.length > 0 && createElement('div', { className: 'flex flex-wrap gap-2' },
                  badges.map((badge, idx) => createElement('span', { key: 'badge-' + idx, className: 'cms-preview-pill bg-stone-100' }, badge)),
                ),
              );
            }))
        : createElement('p', { className: 'cms-preview-muted text-sm' },
            'Add products to preview catalog summaries here.'),
    ),
  );
}

export function PagePreview({ entry }) {
  const heroTitle = getEntryValue(entry, ['data', 'heroTitle'], 'Page preview');
  const heroSubtitle = getEntryValue(entry, ['data', 'heroSubtitle'], 'Configure page sections below.');
  const sections = asArray(getEntryValue(entry, ['data', 'sections'], []));

  return createElement(
    PreviewLayout,
    null,
    createElement(Hero, {
      badge: 'Page hero',
      headline: heroTitle,
      subheadline: heroSubtitle,
    }),
    sections.length > 0
      ? createElement('section', { className: 'space-y-6' },
          createElement('h2', { className: 'text-2xl font-semibold text-stone-900' }, 'Page Sections'),
          createElement('div', { className: 'cms-preview-grid md:grid-cols-2' },
            sections.map((section, index) => renderHomeSection(section, index)),
          ),
        )
      : createElement('p', { className: 'cms-preview-muted text-center py-8' },
          'Add sections to build your page.'),
  );
}
