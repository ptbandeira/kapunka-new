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

const baseSectionFields = [
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
];

const nestedListDescriptors = [
  { name: 'items', label: 'Items' },
  { name: 'entries', label: 'Entries' },
  { name: 'quotes', label: 'Quotes' },
  { name: 'cards', label: 'Cards' },
];

const createNestedSectionFields = () => structuredClone(baseSectionFields);

const genericSectionFields = [
  ...structuredClone(baseSectionFields),
  ...nestedListDescriptors.map(({ name, label }) => ({
    name,
    label,
    type: 'list',
    required: false,
    items: {
      type: 'object',
      fields: createNestedSectionFields(),
    },
  })),
];

const nestedListNames = new Set(nestedListDescriptors.map(({ name }) => name));

const nestedSectionFieldsTemplate = createNestedSectionFields();
const nestedSectionFieldsTemplateJSON = JSON.stringify(nestedSectionFieldsTemplate);
const createNestedSectionFieldsTemplate = () => structuredClone(nestedSectionFieldsTemplate);

const sectionsFieldsTemplate = structuredClone(genericSectionFields);
const sectionsFieldsTemplateJSON = JSON.stringify(sectionsFieldsTemplate);
const createSectionsFields = () => structuredClone(sectionsFieldsTemplate);

const sanitiseFields = (fields) => {
  let updated = false;
  for (const field of fields) {
    if (sanitiseField(field)) {
      updated = true;
    }
  }
  return updated;
};

const sanitiseField = (field) => {
  let updated = false;

  if (field.type === 'object' && Array.isArray(field.fields)) {
    if (sanitiseFields(field.fields)) {
      updated = true;
    }
  }

  if (field.type === 'list' && field.items && typeof field.items === 'object') {
    if ('required' in field.items) {
      delete field.items.required;
      updated = true;
    }

    if (field.name === 'sections') {
      const currentFields = field.items.fields;
      const currentJson = currentFields ? JSON.stringify(currentFields) : undefined;
      if (currentJson !== sectionsFieldsTemplateJSON) {
        field.items.fields = createSectionsFields();
        updated = true;
      }

      if (Array.isArray(field.items.fields) && sanitiseFields(field.items.fields)) {
        updated = true;
      }
    } else if (nestedListNames.has(field.name)) {
      const currentFields = field.items.fields;
      const currentJson = currentFields ? JSON.stringify(currentFields) : undefined;
      if (currentJson !== nestedSectionFieldsTemplateJSON) {
        field.items.fields = createNestedSectionFieldsTemplate();
        updated = true;
      }

      if (Array.isArray(field.items.fields) && sanitiseFields(field.items.fields)) {
        updated = true;
      }
    } else if (Array.isArray(field.items.fields) && sanitiseFields(field.items.fields)) {
      updated = true;
    }
  }

  return updated;
};

const sanitiseModels = (models) => {
  let updated = false;
  for (const model of models) {
    if (Array.isArray(model.fields) && sanitiseFields(model.fields)) {
      updated = true;
    }
  }
  return updated;
};

const buildPageFields = () => [
  { name: 'type', label: 'Type', type: 'string', required: false },
  { name: 'metaTitle', label: 'Meta Title', type: 'string', required: false },
  { name: 'metaDescription', label: 'Meta Description', type: 'text', required: false },
  { name: 'heroEyebrow', label: 'Hero Eyebrow', type: 'string', required: false },
  { name: 'heroTitle', label: 'Hero Title', type: 'string', required: false },
  { name: 'heroSubtitle', label: 'Hero Subtitle', type: 'text', required: false },
  { name: 'heroImage', label: 'Hero Image', type: 'image', required: false },
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
      fields: createSectionsFields(),
    },
  },
];

const metadataPath = path.resolve(process.cwd(), 'metadata.json');
const rawMetadata = readFileSync(metadataPath, 'utf8');
const metadata = JSON.parse(rawMetadata);

if (!Array.isArray(metadata.models)) {
  throw new Error('metadata.json does not contain a "models" array.');
}

const sanitisedExistingModels = sanitiseModels(metadata.models);

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

if (additions > 0 || sanitisedExistingModels) {
  writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);

  const operations = [];
  if (additions > 0) {
    operations.push(`added ${additions} page model${additions === 1 ? '' : 's'}`);
  }
  if (sanitisedExistingModels) {
    operations.push('updated existing model definitions');
  }

  console.log(`[syncMetadataPages] ${operations.join(' and ')}.`);
} else {
  console.log('[syncMetadataPages] No changes required.');
}
