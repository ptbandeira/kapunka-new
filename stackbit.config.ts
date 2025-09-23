import type { StackbitConfig } from '@stackbit/types';

const pageModels: { name: string; type: 'page'; urlPath: string }[] = [
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

const config = {
  stackbitVersion: '~0.6.0',
  modelExtensions: pageModels,
} satisfies StackbitConfig;

export default config;
