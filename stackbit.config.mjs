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

/** @type {import('@stackbit/types').StackbitConfig} */
const config = {
  stackbitVersion: '~0.6.0',
  contentSources: [contentSource],
  mapModels: ({ models }) => {
    const srcType = contentSource.getContentSourceType();
    const srcProjectId = contentSource.getProjectId();
    const additional = metadata.models
      .filter(model => !models.some(existing => existing.name === model.name))
      .map(model => ({ ...model, srcType, srcProjectId }));
    return [...models, ...additional];
  },
  modelExtensions: pageModels,
};

export default config;
