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
