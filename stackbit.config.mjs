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
  {
    name: 'LocalizedString',
    type: 'object',
    label: 'Localized String',
    fields: [
      {
        name: 'en',
        type: 'string',
        label: 'English',
      },
      {
        name: 'pt',
        type: 'string',
        label: 'Portuguese',
      },
      {
        name: 'es',
        type: 'string',
        label: 'Spanish',
      },
    ],
  },
  {
    name: 'LocalizedText',
    type: 'object',
    label: 'Localized Text',
    fields: [
      {
        name: 'en',
        type: 'text',
        label: 'English',
      },
      {
        name: 'pt',
        type: 'text',
        label: 'Portuguese',
      },
      {
        name: 'es',
        type: 'text',
        label: 'Spanish',
      },
    ],
  },
  {
    name: 'LocalizedMarkdown',
    type: 'object',
    label: 'Localized Markdown',
    fields: [
      {
        name: 'en',
        type: 'markdown',
        label: 'English',
      },
      {
        name: 'pt',
        type: 'markdown',
        label: 'Portuguese',
      },
      {
        name: 'es',
        type: 'markdown',
        label: 'Spanish',
      },
    ],
  },
  {
    name: 'LocalizedStringList',
    type: 'object',
    label: 'Localized String List',
    fields: [
      {
        name: 'en',
        type: 'list',
        label: 'English',
        items: {
          type: 'string',
        },
      },
      {
        name: 'pt',
        type: 'list',
        label: 'Portuguese',
        items: {
          type: 'string',
        },
      },
      {
        name: 'es',
        type: 'list',
        label: 'Spanish',
        items: {
          type: 'string',
        },
      },
    ],
  },
  {
    name: 'Article',
    type: 'object',
    label: 'Article',
    fields: [
      {
        name: 'id',
        type: 'string',
        label: 'ID',
      },
      {
        name: 'slug',
        type: 'string',
        label: 'Slug',
      },
      {
        name: 'title',
        type: 'model',
        models: ['LocalizedString'],
        label: 'Title',
      },
      {
        name: 'preview',
        type: 'model',
        models: ['LocalizedText'],
        label: 'Excerpt',
      },
      {
        name: 'content',
        type: 'model',
        models: ['LocalizedMarkdown'],
        label: 'Content',
      },
      {
        name: 'author',
        type: 'model',
        models: ['LocalizedString'],
        label: 'Author',
        required: false,
      },
      {
        name: 'date',
        type: 'date',
        label: 'Date',
        required: false,
      },
      {
        name: 'imageUrl',
        type: 'image',
        label: 'Image',
      },
      {
        name: 'category',
        type: 'string',
        label: 'Category',
      },
      {
        name: 'relatedProductId',
        type: 'string',
        label: 'Related Product ID',
        required: false,
      },
      {
        name: 'relatedProductIds',
        type: 'list',
        label: 'Related Product IDs',
        items: {
          type: 'string',
        },
        required: false,
      },
    ],
  },
  {
    name: 'Course',
    type: 'object',
    label: 'Course',
    fields: [
      {
        name: 'id',
        type: 'string',
        label: 'ID',
      },
      {
        name: 'title',
        type: 'model',
        models: ['LocalizedString'],
        label: 'Title',
      },
      {
        name: 'description',
        type: 'model',
        models: ['LocalizedText'],
        label: 'Description',
        required: false,
      },
      {
        name: 'duration',
        type: 'string',
        label: 'Duration',
        required: false,
      },
      {
        name: 'imageUrl',
        type: 'image',
        label: 'Image',
      },
      {
        name: 'price',
        type: 'number',
        label: 'Price',
        required: false,
      },
      {
        name: 'enrollLink',
        type: 'string',
        label: 'Enroll Link',
        required: false,
      },
    ],
  },
  {
    name: 'ProductSize',
    type: 'object',
    label: 'Product Size',
    fields: [
      {
        name: 'id',
        type: 'string',
        label: 'ID',
      },
      {
        name: 'size',
        type: 'number',
        label: 'Size (ml)',
      },
      {
        name: 'price',
        type: 'number',
        label: 'Price',
      },
    ],
  },
  {
    name: 'Product',
    type: 'object',
    label: 'Product',
    fields: [
      {
        name: 'id',
        type: 'string',
        label: 'ID',
      },
      {
        name: 'sku',
        type: 'string',
        label: 'SKU',
        required: false,
      },
      {
        name: 'name',
        type: 'model',
        models: ['LocalizedString'],
        label: 'Name',
      },
      {
        name: 'titleAddition',
        type: 'model',
        models: ['LocalizedString'],
        label: 'Title Addition',
        required: false,
      },
      {
        name: 'tagline',
        type: 'model',
        models: ['LocalizedString'],
        label: 'Tagline',
        required: false,
      },
      {
        name: 'description',
        type: 'model',
        models: ['LocalizedMarkdown'],
        label: 'Description',
        required: false,
      },
      {
        name: 'imageUrl',
        type: 'image',
        label: 'Image',
      },
      {
        name: 'sizes',
        type: 'list',
        label: 'Sizes',
        items: {
          type: 'model',
          models: ['ProductSize'],
        },
      },
      {
        name: 'badges',
        type: 'model',
        models: ['LocalizedStringList'],
        label: 'Badges',
        required: false,
      },
      {
        name: 'benefits',
        type: 'model',
        models: ['LocalizedStringList'],
        label: 'Benefits',
        required: false,
      },
      {
        name: 'ingredients',
        type: 'model',
        models: ['LocalizedText'],
        label: 'Ingredients',
        required: false,
      },
      {
        name: 'howToUse',
        type: 'model',
        models: ['LocalizedMarkdown'],
        label: 'How To Use',
        required: false,
      },
      {
        name: 'originStory',
        type: 'model',
        models: ['LocalizedMarkdown'],
        label: 'Origin Story',
        required: false,
      },
      {
        name: 'scientificEvidence',
        type: 'model',
        models: ['LocalizedMarkdown'],
        label: 'Scientific Evidence',
        required: false,
      },
      {
        name: 'multiUseTips',
        type: 'model',
        models: ['LocalizedStringList'],
        label: 'Multi-use Tips',
        required: false,
      },
      {
        name: 'goodToKnow',
        type: 'model',
        models: ['LocalizedStringList'],
        label: 'Good To Know',
        required: false,
      },
      {
        name: 'labTestedNote',
        type: 'model',
        models: ['LocalizedText'],
        label: 'Lab Tested Note',
        required: false,
      },
      {
        name: 'knowledge',
        type: 'model',
        models: ['LocalizedMarkdown'],
        label: 'Knowledge',
        required: false,
      },
      {
        name: 'faqs',
        type: 'list',
        label: 'FAQs',
        items: {
          type: 'object',
          fields: [
            {
              name: 'question',
              type: 'model',
              models: ['LocalizedString'],
              label: 'Question',
            },
            {
              name: 'answer',
              type: 'model',
              models: ['LocalizedMarkdown'],
              label: 'Answer',
            },
          ],
        },
        required: false,
      },
      {
        name: 'tags',
        type: 'list',
        label: 'Tags',
        items: {
          type: 'string',
        },
        required: false,
      },
    ],
  },
  {
    name: 'Review',
    type: 'object',
    label: 'Review',
    fields: [
      {
        name: 'id',
        type: 'string',
        label: 'ID',
        required: false,
      },
      {
        name: 'author',
        type: 'model',
        models: ['LocalizedString'],
        label: 'Author',
      },
      {
        name: 'avatar',
        type: 'image',
        label: 'Avatar',
        required: false,
      },
      {
        name: 'role',
        type: 'model',
        models: ['LocalizedString'],
        label: 'Role',
        required: false,
      },
      {
        name: 'text',
        type: 'model',
        models: ['LocalizedText'],
        label: 'Text',
      },
    ],
  },
  {
    name: 'Partner',
    type: 'object',
    label: 'Partner',
    fields: [
      {
        name: 'id',
        type: 'string',
        label: 'ID',
      },
      {
        name: 'name',
        type: 'string',
        label: 'Name',
      },
      {
        name: 'logoUrl',
        type: 'image',
        label: 'Logo',
      },
      {
        name: 'url',
        type: 'string',
        label: 'URL',
        required: false,
      },
    ],
  },
  {
    name: 'TrainingItem',
    type: 'object',
    label: 'Training Item',
    fields: [
      {
        name: 'courseTitle',
        type: 'string',
        label: 'Course Title',
      },
      {
        name: 'courseSummary',
        type: 'text',
        label: 'Summary',
        required: false,
      },
      {
        name: 'linkUrl',
        type: 'string',
        label: 'URL',
        required: false,
      },
      {
        name: 'title',
        type: 'string',
        label: 'Alternate Title',
        required: false,
      },
      {
        name: 'location',
        type: 'string',
        label: 'Location',
        required: false,
      },
      {
        name: 'date',
        type: 'string',
        label: 'Date',
        required: false,
      },
      {
        name: 'url',
        type: 'string',
        label: 'Alternate URL',
        required: false,
      },
    ],
  },
  {
    name: 'Video',
    type: 'object',
    label: 'Video',
    fields: [
      {
        name: 'title',
        type: 'string',
        label: 'Title',
      },
      {
        name: 'description',
        type: 'text',
        label: 'Description',
        required: false,
      },
      {
        name: 'thumbnail',
        type: 'image',
        label: 'Thumbnail',
        required: false,
      },
      {
        name: 'videoUrl',
        type: 'string',
        label: 'Video URL',
        required: false,
      },
      {
        name: 'videoId',
        type: 'string',
        label: 'Video ID',
        required: false,
      },
    ],
  },
  {
    name: 'PolicySection',
    type: 'object',
    label: 'Policy Section',
    fields: [
      {
        name: 'id',
        type: 'string',
        label: 'ID',
      },
      {
        name: 'title',
        type: 'model',
        models: ['LocalizedString'],
        label: 'Title',
      },
      {
        name: 'body',
        type: 'model',
        models: ['LocalizedMarkdown'],
        label: 'Body',
      },
    ],
  },
  {
    name: 'Policy',
    type: 'object',
    label: 'Policy',
    fields: [
      {
        name: 'id',
        type: 'string',
        label: 'ID',
      },
      {
        name: 'title',
        type: 'model',
        models: ['LocalizedString'],
        label: 'Title',
      },
      {
        name: 'content',
        type: 'model',
        models: ['LocalizedMarkdown'],
        label: 'Content',
        required: false,
      },
      {
        name: 'sections',
        type: 'list',
        label: 'Sections',
        items: {
          type: 'model',
          models: ['PolicySection'],
        },
        required: false,
      },
    ],
  },
  {
    name: 'ArticleCollection',
    type: 'data',
    label: 'Article Collection',
    filePath: 'content/articles/index.json',
    fields: [
      {
        name: 'items',
        type: 'list',
        label: 'Articles',
        items: {
          type: 'model',
          models: ['Article'],
        },
      },
      {
        name: 'type',
        type: 'string',
        label: 'Type',
        required: false,
      },
    ],
  },
  {
    name: 'CourseCollection',
    type: 'data',
    label: 'Course Collection',
    filePath: 'content/courses.json',
    fields: [
      {
        name: 'courses',
        type: 'list',
        label: 'Courses',
        items: {
          type: 'model',
          models: ['Course'],
        },
      },
      {
        name: 'type',
        type: 'string',
        label: 'Type',
        required: false,
      },
    ],
  },
  {
    name: 'ProductCollection',
    type: 'data',
    label: 'Product Collection',
    filePath: 'content/products/index.json',
    fields: [
      {
        name: 'items',
        type: 'list',
        label: 'Products',
        items: {
          type: 'model',
          models: ['Product'],
        },
      },
      {
        name: 'type',
        type: 'string',
        label: 'Type',
        required: false,
      },
    ],
  },
  {
    name: 'ReviewCollection',
    type: 'data',
    label: 'Review Collection',
    filePath: 'content/reviews/index.json',
    fields: [
      {
        name: 'items',
        type: 'list',
        label: 'Reviews',
        items: {
          type: 'model',
          models: ['Review'],
        },
      },
      {
        name: 'type',
        type: 'string',
        label: 'Type',
        required: false,
      },
    ],
  },
  {
    name: 'PartnerCollection',
    type: 'data',
    label: 'Partner Collection',
    filePath: 'content/partners.json',
    fields: [
      {
        name: 'partners',
        type: 'list',
        label: 'Partners',
        items: {
          type: 'model',
          models: ['Partner'],
        },
      },
      {
        name: 'type',
        type: 'string',
        label: 'Type',
        required: false,
      },
    ],
  },
  {
    name: 'TrainingCollection',
    type: 'data',
    label: 'Training Collection',
    filePath: 'content/training.json',
    fields: [
      {
        name: 'trainings',
        type: 'list',
        label: 'Trainings',
        items: {
          type: 'model',
          models: ['TrainingItem'],
        },
      },
    ],
  },
  {
    name: 'VideoCollection',
    type: 'data',
    label: 'Video Collection',
    filePath: 'content/videos.json',
    fields: [
      {
        name: 'videos',
        type: 'list',
        label: 'Videos',
        items: {
          type: 'model',
          models: ['Video'],
        },
      },
    ],
  },
  {
    name: 'PolicyCollection',
    type: 'data',
    label: 'Policy Collection',
    filePath: 'content/policies.json',
    fields: [
      {
        name: 'items',
        type: 'list',
        label: 'Policies',
        items: {
          type: 'model',
          models: ['Policy'],
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
