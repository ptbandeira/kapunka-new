import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const locales = {
  en: 'English',
  pt: 'Portuguese',
  es: 'Spanish',
};

const pageDefinitions = [
  { slug: 'about', label: 'About' },
  { slug: 'clinics', label: 'Clinics' },
  { slug: 'contact', label: 'Contact' },
  { slug: 'learn', label: 'Learn' },
  { slug: 'story', label: 'Story' },
  { slug: 'training', label: 'Training' },
  { slug: 'videos', label: 'Videos' },
  { slug: 'test', label: 'Test' },
];

const toSentenceCase = (value) =>
  value
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

const genericCtaFields = [
  {
    name: 'label',
    label: 'Label',
    type: 'string',
    required: false,
  },
  {
    name: 'href',
    label: 'URL',
    type: 'string',
    required: false,
  },
];

const genericSectionFields = [
  { name: 'type', label: 'Section Type', type: 'string', required: false },
  { name: 'title', label: 'Title', type: 'string', required: false },
  { name: 'subtitle', label: 'Subtitle', type: 'string', required: false },
  { name: 'headline', label: 'Headline', type: 'string', required: false },
  { name: 'eyebrow', label: 'Eyebrow', type: 'string', required: false },
  { name: 'description', label: 'Description', type: 'text', required: false },
  { name: 'text', label: 'Text', type: 'text', required: false },
  { name: 'body', label: 'Body', type: 'text', required: false },
  { name: 'quote', label: 'Quote', type: 'markdown', required: false },
  { name: 'name', label: 'Name', type: 'string', required: false },
  { name: 'role', label: 'Role', type: 'string', required: false },
  { name: 'year', label: 'Year', type: 'string', required: false },
  { name: 'ctaLabel', label: 'CTA Label', type: 'string', required: false },
  { name: 'ctaHref', label: 'CTA URL', type: 'string', required: false },
  { name: 'linkUrl', label: 'Link URL', type: 'string', required: false },
  { name: 'background', label: 'Background Variant', type: 'string', required: false },
  { name: 'theme', label: 'Theme', type: 'string', required: false },
  { name: 'layout', label: 'Layout', type: 'string', required: false },
  { name: 'image', label: 'Image Upload', type: 'image', required: false },
  { name: 'imageRef', label: 'Image Path', type: 'string', required: false },
  { name: 'imageAlt', label: 'Image Alt Text', type: 'string', required: false },
  { name: 'videoUrl', label: 'Video URL', type: 'string', required: false },
  { name: 'thumbnail', label: 'Thumbnail Image', type: 'image', required: false },
  { name: 'thumbnailRef', label: 'Thumbnail Path', type: 'string', required: false },
  {
    name: 'cta',
    label: 'CTA',
    type: 'object',
    required: false,
    fields: genericCtaFields,
  },
  {
    name: 'ctaPrimary',
    label: 'Primary CTA',
    type: 'object',
    required: false,
    fields: genericCtaFields,
  },
  {
    name: 'ctaSecondary',
    label: 'Secondary CTA',
    type: 'object',
    required: false,
    fields: genericCtaFields,
  },
  {
    name: 'button',
    label: 'Button',
    type: 'object',
    required: false,
    fields: genericCtaFields,
  },
  {
    name: 'buttonSecondary',
    label: 'Secondary Button',
    type: 'object',
    required: false,
    fields: genericCtaFields,
  },
  {
    name: 'items',
    label: 'Items',
    type: 'list',
    required: false,
    items: {
      type: 'object',
      required: false,
    },
  },
  {
    name: 'entries',
    label: 'Entries',
    type: 'list',
    required: false,
    items: {
      type: 'object',
      required: false,
    },
  },
  {
    name: 'quotes',
    label: 'Quotes',
    type: 'list',
    required: false,
    items: {
      type: 'object',
      required: false,
    },
  },
  {
    name: 'cards',
    label: 'Cards',
    type: 'list',
    required: false,
    items: {
      type: 'object',
      required: false,
    },
  },
];

const buildPageFields = () => [
  { name: 'type', label: 'Type', type: 'string', required: false },
  { name: 'metaTitle', label: 'Meta Title', type: 'string', required: false },
  { name: 'metaDescription', label: 'Meta Description', type: 'text', required: false },
  { name: 'heroEyebrow', label: 'Hero Eyebrow', type: 'string', required: false },
  { name: 'heroTitle', label: 'Hero Title', type: 'string', required: false },
  { name: 'heroSubtitle', label: 'Hero Subtitle', type: 'text', required: false },
  { name: 'heroImage', label: 'Hero Image', type: 'image', required: false },
  { name: 'heroImageRef', label: 'Hero Image Path', type: 'string', required: false },
  {
    name: 'heroCtas',
    label: 'Hero CTAs',
    type: 'object',
    required: false,
    fields: [
      {
        name: 'ctaPrimary',
        label: 'Primary CTA',
        type: 'object',
        required: false,
        fields: genericCtaFields,
      },
      {
        name: 'ctaSecondary',
        label: 'Secondary CTA',
        type: 'object',
        required: false,
        fields: genericCtaFields,
      },
    ],
  },
  {
    name: 'sections',
    label: 'Sections',
    type: 'list',
    items: {
      type: 'object',
      fields: genericSectionFields,
    },
  },
];

const metadataPath = path.resolve(process.cwd(), 'metadata.json');
const rawMetadata = readFileSync(metadataPath, 'utf8');
const metadata = JSON.parse(rawMetadata);

if (!Array.isArray(metadata.models)) {
  throw new Error('metadata.json does not contain a "models" array.');
}

const existingNames = new Set(metadata.models.map((model) => model.name));
let additions = 0;

for (const { slug, label } of pageDefinitions) {
  for (const [locale, languageLabel] of Object.entries(locales)) {
    const name = locale === 'en' ? slug : `${slug}_${locale}`;
    if (existingNames.has(name)) {
      continue;
    }

    const model = {
      name,
      label: `${toSentenceCase(label)} Page (${languageLabel})`,
      type: 'data',
      singleInstance: true,
      filePath: `content/pages/${locale}/${slug}.json`,
      fields: buildPageFields(),
    };

    metadata.models.push(model);
    existingNames.add(name);
    additions += 1;
  }
}

if (additions > 0) {
  writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  console.log(`[syncMetadataPages] Added ${additions} page models to metadata.json.`);
} else {
  console.log('[syncMetadataPages] No missing page models found.');
}
