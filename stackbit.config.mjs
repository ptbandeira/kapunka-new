import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FileSystemContentSource } from '@stackbit/cms-git';

const metadataPath = resolve(process.cwd(), 'metadata.json');
const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));

const contentSource = new FileSystemContentSource({
  rootPath: process.cwd(),
  contentDirs: ['content'],
  models: metadata.models,
});

const pageModels = [
  {
    name: 'shop',
    type: 'page',
    urlPath: '/shop',
  },
  {
    name: 'method',
    type: 'page',
    urlPath: '/method',
  },
  {
    name: 'products',
    type: 'page',
    urlPath: '/product/{id}',
  },
  {
    name: 'articles',
    type: 'page',
    urlPath: '/learn/{slug}',
  },
  {
    name: 'videos',
    type: 'page',
    urlPath: '/videos',
  },
  {
    name: 'training',
    type: 'page',
    urlPath: '/training',
  },
  {
    name: 'policies',
    type: 'page',
    urlPath: '/policy/{id}',
  },
  {
    name: 'courses',
    type: 'page',
    urlPath: '/academy',
  },
];

const customModels = [
  {
    name: 'Link',
    type: 'object',
    label: 'Link',
    fields: [
      {
        name: 'label',
        type: 'string',
        label: 'Label',
      },
      {
        name: 'url',
        type: 'string',
        label: 'URL',
      },
    ],
  },
  {
    name: 'Header',
    type: 'object',
    label: 'Header',
    fields: [
      {
        name: 'navLinks',
        type: 'list',
        label: 'Navigation Links',
        items: {
          type: 'model',
          models: ['Link'],
        },
      },
    ],
  },
  {
    name: 'Footer',
    type: 'object',
    label: 'Footer',
    fields: [
      {
        name: 'navLinks',
        type: 'list',
        label: 'Navigation Links',
        items: {
          type: 'model',
          models: ['Link'],
        },
      },
      {
        name: 'socialLinks',
        type: 'list',
        label: 'Social Links',
        items: {
          type: 'model',
          models: ['Link'],
        },
      },
    ],
  },
  {
    name: 'SiteConfig',
    type: 'data',
    label: 'Site Config',
    filePath: 'content/site.json',
    fields: [
      {
        name: 'header',
        type: 'model',
        models: ['Header'],
        label: 'Header',
      },
      {
        name: 'footer',
        type: 'model',
        models: ['Footer'],
        label: 'Footer',
      },
    ],
  },
  {
    name: 'ImageTextHalfSection',
    type: 'object',
    label: 'Image + Text Half Section',
    fields: [
      {
        name: 'title',
        type: 'string',
        label: 'Heading',
      },
      {
        name: 'subtitle',
        type: 'string',
        label: 'Subheading',
      },
      {
        name: 'text',
        type: 'markdown',
        label: 'Body',
      },
      {
        name: 'button',
        type: 'model',
        label: 'Button',
        models: ['Link'],
      },
      {
        name: 'image',
        type: 'image',
        label: 'Image',
      },
    ],
  },
  {
    name: 'CommunityCarouselSection',
    type: 'object',
    label: 'Community Carousel Section',
    fields: [
      {
        name: 'title',
        type: 'string',
        label: 'Heading',
      },
      {
        name: 'subtitle',
        type: 'string',
        label: 'Subheading',
      },
      {
        name: 'slides',
        type: 'list',
        label: 'Reviews',
        items: {
          type: 'model',
          models: ['Review'],
        },
      },
      {
        name: 'slideDuration',
        type: 'number',
        label: 'Slide Duration (ms)',
      },
      {
        name: 'quoteDuration',
        type: 'number',
        label: 'Quote Duration (ms)',
      },
    ],
  },
  {
    name: 'ImageGridItem',
    type: 'object',
    label: 'Image Grid Item',
    fields: [
      {
        name: 'image',
        type: 'image',
        label: 'Image',
      },
      {
        name: 'title',
        type: 'string',
        label: 'Title',
      },
      {
        name: 'subtitle',
        type: 'string',
        label: 'Text',
      },
    ],
  },
  {
    name: 'ImageGridSection',
    type: 'object',
    label: 'Image Grid Section',
    fields: [
      {
        name: 'heading',
        type: 'string',
        label: 'Heading',
      },
      {
        name: 'subheading',
        type: 'string',
        label: 'Subheading',
      },
      {
        name: 'items',
        type: 'list',
        label: 'Items',
        items: {
          type: 'model',
          models: ['ImageGridItem'],
        },
      },
    ],
  },
  {
    name: 'TimelineEvent',
    type: 'object',
    label: 'Timeline Event',
    fields: [
      {
        name: 'year',
        type: 'string',
        label: 'Date',
      },
      {
        name: 'title',
        type: 'string',
        label: 'Title',
      },
      {
        name: 'description',
        type: 'markdown',
        label: 'Description',
      },
      {
        name: 'image',
        type: 'image',
        label: 'Image',
      },
    ],
  },
  {
    name: 'TimelineSection',
    type: 'object',
    label: 'Timeline Section',
    fields: [
      {
        name: 'title',
        type: 'string',
        label: 'Heading',
      },
      {
        name: 'entries',
        type: 'list',
        label: 'Events',
        items: {
          type: 'model',
          models: ['TimelineEvent'],
        },
      },
    ],
  },
];

/** @type {import('@stackbit/types').StackbitConfig} */
const config = {
  stackbitVersion: '~0.6.0',
  contentSources: [contentSource],
  mapModels: ({ models }) => {
    const srcType = contentSource.getContentSourceType();
    const srcProjectId = contentSource.getProjectId();
    const existing = new Set(models.map(model => model.name));

    const fromMetadata = metadata.models
      .filter(model => !existing.has(model.name))
      .map(model => ({ ...model, srcType, srcProjectId }));
    fromMetadata.forEach(model => existing.add(model.name));

    const fromCustom = customModels
      .filter(model => !existing.has(model.name))
      .map(model => ({ ...model, srcType, srcProjectId }));

    return [...models, ...fromMetadata, ...fromCustom];
  },
  modelExtensions: pageModels,
};

export default config;
