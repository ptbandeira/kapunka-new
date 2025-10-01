import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FileSystemContentSource } from '@stackbit/cms-git';

const metadataPath = resolve(process.cwd(), 'metadata.json');
const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));

const localizedPageRoutes = [
  { slug: 'home', urlPath: '/' },
  { slug: 'about', urlPath: '/about' },
  { slug: 'clinics', urlPath: '/for-clinics' },
  { slug: 'contact', urlPath: '/contact' },
  { slug: 'learn', urlPath: '/learn' },
  { slug: 'story', urlPath: '/story' },
  { slug: 'training', urlPath: '/training' },
  { slug: 'videos', urlPath: '/videos' },
  { slug: 'test', urlPath: '/test' },
  { slug: 'method', urlPath: '/method' },
];

const supportedLocales = ['en', 'pt', 'es'];

const pageModelExtensions = [
  ...localizedPageRoutes.flatMap(({ slug, urlPath }) =>
    supportedLocales.map((locale) => ({
      name: locale === 'en' ? slug : `${slug}_${locale}`,
      type: 'page',
      urlPath,
    })),
  ),
  {
    name: 'shop',
    type: 'page',
    urlPath: '/shop',
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

const sectionModelNames = [
  'imageTextHalf',
  'imageGrid',
  'mediaCopy',
  'mediaShowcase',
  'featureGrid',
  'productGrid',
  'videoGallery',
  'trainingList',
  'banner',
  'newsletterSignup',
  'testimonials',
  'communityCarousel',
  'timeline',
  'facts',
  'bullets',
  'specialties',
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
    name: 'HeroCta',
    type: 'object',
    label: 'Hero CTA',
    fields: [
      {
        name: 'label',
        type: 'string',
        label: 'Label',
      },
      {
        name: 'href',
        type: 'string',
        label: 'Link',
        required: false,
      },
    ],
  },
  {
    name: 'HeroCtas',
    type: 'object',
    label: 'Hero CTAs',
    fields: [
      {
        name: 'ctaPrimary',
        type: 'model',
        label: 'Primary CTA',
        models: ['HeroCta'],
        required: false,
      },
      {
        name: 'ctaSecondary',
        type: 'model',
        label: 'Secondary CTA',
        models: ['HeroCta'],
        required: false,
      },
    ],
  },
  {
    name: 'HeroAlignment',
    type: 'object',
    label: 'Hero Alignment',
    fields: [
      {
        name: 'heroAlignX',
        type: 'enum',
        label: 'Horizontal Alignment',
        options: [
          { label: 'Left', value: 'left' },
          { label: 'Center', value: 'center' },
          { label: 'Right', value: 'right' },
        ],
        required: false,
      },
      {
        name: 'heroAlignY',
        type: 'enum',
        label: 'Vertical Alignment',
        options: [
          { label: 'Top', value: 'top' },
          { label: 'Middle', value: 'middle' },
          { label: 'Bottom', value: 'bottom' },
        ],
        required: false,
      },
      {
        name: 'heroTextPosition',
        type: 'enum',
        label: 'Text Placement',
        options: [
          { label: 'Overlay', value: 'overlay' },
          { label: 'Below', value: 'below' },
        ],
        required: false,
      },
      {
        name: 'heroTextAnchor',
        type: 'enum',
        label: 'Text Anchor',
        options: [
          { label: 'Top Left', value: 'top-left' },
          { label: 'Top Center', value: 'top-center' },
          { label: 'Top Right', value: 'top-right' },
          { label: 'Middle Left', value: 'middle-left' },
          { label: 'Middle Center', value: 'middle-center' },
          { label: 'Middle Right', value: 'middle-right' },
          { label: 'Bottom Left', value: 'bottom-left' },
          { label: 'Bottom Center', value: 'bottom-center' },
          { label: 'Bottom Right', value: 'bottom-right' },
        ],
        required: false,
      },
      {
        name: 'heroOverlay',
        type: 'string',
        label: 'Overlay (custom value)',
        required: false,
      },
      {
        name: 'heroLayoutHint',
        type: 'enum',
        label: 'Layout Hint',
        options: [
          { label: 'Full Background', value: 'image-full' },
          { label: 'Image Left', value: 'image-left' },
          { label: 'Image Right', value: 'image-right' },
          { label: 'Legacy Background', value: 'bg' },
          { label: 'Legacy Background (Image)', value: 'bgImage' },
          { label: 'Legacy Side-by-Side', value: 'side-by-side' },
          { label: 'Legacy Text Over Media', value: 'text-over-media' },
        ],
        required: false,
      },
    ],
  },
  {
    name: 'HeroImages',
    type: 'object',
    label: 'Hero Images',
    fields: [
      {
        name: 'heroImageLeft',
        type: 'image',
        label: 'Hero Image Left',
        required: false,
      },
      {
        name: 'heroImageLeftRef',
        type: 'string',
        label: 'Hero Image Left Path',
        required: false,
      },
      {
        name: 'heroImageRight',
        type: 'image',
        label: 'Hero Image Right',
        required: false,
      },
      {
        name: 'heroImageRightRef',
        type: 'string',
        label: 'Hero Image Right Path',
        required: false,
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
    file: 'content/site.json',
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
    name: 'imageTextHalf',
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
        required: false,
      },
      {
        name: 'imageRef',
        type: 'string',
        label: 'Image Path',
        required: false,
      },
    ],
  },
  {
    name: 'MediaCopyOverlay',
    type: 'object',
    label: 'Media Copy Overlay Settings',
    fields: [
      {
        name: 'columnStart',
        type: 'number',
        label: 'Column Start',
        required: false,
      },
      {
        name: 'columnSpan',
        type: 'number',
        label: 'Column Span',
        required: false,
      },
      {
        name: 'rowStart',
        type: 'number',
        label: 'Row Start',
        required: false,
      },
      {
        name: 'rowSpan',
        type: 'number',
        label: 'Row Span',
        required: false,
      },
      {
        name: 'textAlign',
        type: 'enum',
        label: 'Text Alignment',
        options: [
          { label: 'Left', value: 'left' },
          { label: 'Center', value: 'center' },
          { label: 'Right', value: 'right' },
        ],
        required: false,
      },
      {
        name: 'verticalAlign',
        type: 'enum',
        label: 'Vertical Alignment',
        options: [
          { label: 'Start', value: 'start' },
          { label: 'Center', value: 'center' },
          { label: 'End', value: 'end' },
        ],
        required: false,
      },
      {
        name: 'theme',
        type: 'enum',
        label: 'Text Theme',
        options: [
          { label: 'Light', value: 'light' },
          { label: 'Dark', value: 'dark' },
        ],
        required: false,
      },
      {
        name: 'background',
        type: 'enum',
        label: 'Background Style',
        options: [
          { label: 'None', value: 'none' },
          { label: 'Light Scrim', value: 'scrim-light' },
          { label: 'Dark Scrim', value: 'scrim-dark' },
          { label: 'Panel', value: 'panel' },
        ],
        required: false,
      },
      {
        name: 'cardWidth',
        type: 'enum',
        label: 'Card Width',
        options: [
          { label: 'Compact', value: 'sm' },
          { label: 'Balanced', value: 'md' },
          { label: 'Wide', value: 'lg' },
        ],
        required: false,
      },
    ],
  },
  {
    name: 'mediaCopy',
    type: 'object',
    label: 'Media + Copy Section',
    fields: [
      {
        name: 'title',
        type: 'string',
        label: 'Title',
        required: false,
      },
      {
        name: 'body',
        type: 'markdown',
        label: 'Body',
        required: false,
      },
      {
        name: 'image',
        type: 'image',
        label: 'Image Upload',
        required: false,
      },
      {
        name: 'imageRef',
        type: 'string',
        label: 'Image Path',
        required: false,
      },
      {
        name: 'imageAlt',
        type: 'string',
        label: 'Image Alt Text',
        required: false,
      },
      {
        name: 'layout',
        type: 'enum',
        label: 'Layout',
        options: [
          { label: 'Image Right', value: 'image-right' },
          { label: 'Image Left', value: 'image-left' },
          { label: 'Overlay', value: 'overlay' },
        ],
        required: false,
      },
      {
        name: 'columns',
        type: 'number',
        label: 'Columns',
        required: false,
      },
      {
        name: 'overlay',
        type: 'model',
        label: 'Overlay Settings',
        models: ['MediaCopyOverlay'],
        required: false,
      },
    ],
  },
  {
    name: 'MediaShowcaseItem',
    type: 'object',
    label: 'Media Showcase Item',
    fields: [
      {
        name: 'eyebrow',
        type: 'string',
        label: 'Eyebrow',
        required: false,
      },
      {
        name: 'title',
        type: 'string',
        label: 'Title',
        required: false,
      },
      {
        name: 'body',
        type: 'text',
        label: 'Body',
        required: false,
      },
      {
        name: 'image',
        type: 'image',
        label: 'Image Upload',
        required: false,
      },
      {
        name: 'imageRef',
        type: 'string',
        label: 'Image Path',
        required: false,
      },
      {
        name: 'imageAlt',
        type: 'string',
        label: 'Image Alt Text',
        required: false,
      },
      {
        name: 'ctaLabel',
        type: 'string',
        label: 'CTA Label',
        required: false,
      },
      {
        name: 'ctaHref',
        type: 'string',
        label: 'CTA URL',
        required: false,
      },
    ],
  },
  {
    name: 'mediaShowcase',
    type: 'object',
    label: 'Media Showcase Section',
    fields: [
      {
        name: 'title',
        type: 'string',
        label: 'Title',
        required: false,
      },
      {
        name: 'items',
        type: 'list',
        label: 'Items',
        items: {
          type: 'model',
          models: ['MediaShowcaseItem'],
        },
      },
    ],
  },
  {
    name: 'FeatureGridItem',
    type: 'object',
    label: 'Feature Grid Item',
    fields: [
      {
        name: 'label',
        type: 'string',
        label: 'Label',
        required: false,
      },
      {
        name: 'description',
        type: 'markdown',
        label: 'Description',
        required: false,
      },
      {
        name: 'icon',
        type: 'image',
        label: 'Icon',
        required: false,
      },
    ],
  },
  {
    name: 'featureGrid',
    type: 'object',
    label: 'Feature Grid Section',
    fields: [
      {
        name: 'title',
        type: 'string',
        label: 'Title',
        required: false,
      },
      {
        name: 'columns',
        type: 'number',
        label: 'Columns',
        required: false,
      },
      {
        name: 'items',
        type: 'list',
        label: 'Items',
        items: {
          type: 'model',
          models: ['FeatureGridItem'],
        },
      },
    ],
  },
  {
    name: 'ProductGridProduct',
    type: 'object',
    label: 'Product Grid Item',
    fields: [
      {
        name: 'id',
        type: 'string',
        label: 'Product ID',
      },
    ],
  },
  {
    name: 'productGrid',
    type: 'object',
    label: 'Product Grid Section',
    fields: [
      {
        name: 'title',
        type: 'string',
        label: 'Title',
        required: false,
      },
      {
        name: 'columns',
        type: 'number',
        label: 'Columns',
        required: false,
      },
      {
        name: 'products',
        type: 'list',
        label: 'Products',
        items: {
          type: 'model',
          models: ['ProductGridProduct'],
        },
      },
    ],
  },
  {
    name: 'VideoGalleryEntry',
    type: 'object',
    label: 'Video Gallery Entry',
    fields: [
      {
        name: 'title',
        type: 'string',
        label: 'Title',
        required: false,
      },
      {
        name: 'description',
        type: 'text',
        label: 'Description',
        required: false,
      },
      {
        name: 'videoUrl',
        type: 'string',
        label: 'Video URL',
        required: false,
      },
      {
        name: 'thumbnail',
        type: 'image',
        label: 'Thumbnail',
        required: false,
      },
    ],
  },
  {
    name: 'videoGallery',
    type: 'object',
    label: 'Video Gallery Section',
    fields: [
      {
        name: 'title',
        type: 'string',
        label: 'Title',
        required: false,
      },
      {
        name: 'description',
        type: 'text',
        label: 'Description',
        required: false,
      },
      {
        name: 'entries',
        type: 'list',
        label: 'Entries',
        items: {
          type: 'model',
          models: ['VideoGalleryEntry'],
        },
      },
    ],
  },
  {
    name: 'TrainingListEntry',
    type: 'object',
    label: 'Training List Entry',
    fields: [
      {
        name: 'courseTitle',
        type: 'string',
        label: 'Course Title',
        required: false,
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
        label: 'Link URL',
        required: false,
      },
    ],
  },
  {
    name: 'trainingList',
    type: 'object',
    label: 'Training List Section',
    fields: [
      {
        name: 'title',
        type: 'string',
        label: 'Title',
        required: false,
      },
      {
        name: 'description',
        type: 'text',
        label: 'Description',
        required: false,
      },
      {
        name: 'entries',
        type: 'list',
        label: 'Entries',
        items: {
          type: 'model',
          models: ['TrainingListEntry'],
        },
      },
    ],
  },
  {
    name: 'banner',
    type: 'object',
    label: 'Banner Section',
    fields: [
      {
        name: 'text',
        type: 'string',
        label: 'Text',
        required: false,
      },
      {
        name: 'cta',
        type: 'string',
        label: 'CTA Label',
        required: false,
      },
      {
        name: 'url',
        type: 'string',
        label: 'CTA URL',
        required: false,
      },
      {
        name: 'style',
        type: 'string',
        label: 'Style Variant',
        required: false,
      },
    ],
  },
  {
    name: 'newsletterSignup',
    type: 'object',
    label: 'Newsletter Signup Section',
    fields: [
      {
        name: 'title',
        type: 'string',
        label: 'Title',
        required: false,
      },
      {
        name: 'subtitle',
        type: 'text',
        label: 'Subtitle',
        required: false,
      },
      {
        name: 'placeholder',
        type: 'string',
        label: 'Email Placeholder',
        required: false,
      },
      {
        name: 'ctaLabel',
        type: 'string',
        label: 'CTA Label',
        required: false,
      },
      {
        name: 'confirmation',
        type: 'text',
        label: 'Confirmation Message',
        required: false,
      },
      {
        name: 'background',
        type: 'enum',
        label: 'Background Variant',
        options: [
          { label: 'Light', value: 'light' },
          { label: 'Beige', value: 'beige' },
          { label: 'Dark', value: 'dark' },
        ],
        required: false,
      },
      {
        name: 'alignment',
        type: 'enum',
        label: 'Alignment',
        options: [
          { label: 'Center', value: 'center' },
          { label: 'Left', value: 'left' },
        ],
        required: false,
      },
    ],
  },
  {
    name: 'TestimonialQuote',
    type: 'object',
    label: 'Testimonial Quote',
    fields: [
      {
        name: 'text',
        type: 'markdown',
        label: 'Quote',
        required: false,
      },
      {
        name: 'author',
        type: 'string',
        label: 'Author',
        required: false,
      },
      {
        name: 'role',
        type: 'string',
        label: 'Role',
        required: false,
      },
    ],
  },
  {
    name: 'testimonials',
    type: 'object',
    label: 'Testimonials Section',
    fields: [
      {
        name: 'title',
        type: 'string',
        label: 'Title',
        required: false,
      },
      {
        name: 'quotes',
        type: 'list',
        label: 'Quotes',
        items: {
          type: 'model',
          models: ['TestimonialQuote'],
        },
      },
    ],
  },
  {
    name: 'CommunityCarouselSlide',
    type: 'object',
    label: 'Community Carousel Slide',
    fields: [
      {
        name: 'image',
        type: 'image',
        label: 'Image Upload',
        required: false,
      },
      {
        name: 'imageRef',
        type: 'string',
        label: 'Image Path',
        required: false,
      },
      {
        name: 'alt',
        type: 'string',
        label: 'Alt Text',
        required: false,
      },
      {
        name: 'quote',
        type: 'markdown',
        label: 'Quote',
        required: false,
      },
      {
        name: 'name',
        type: 'string',
        label: 'Name',
        required: false,
      },
      {
        name: 'role',
        type: 'string',
        label: 'Role or Context',
        required: false,
      },
    ],
  },
  {
    name: 'communityCarousel',
    type: 'object',
    label: 'Community Carousel Section',
    fields: [
      {
        name: 'title',
        type: 'string',
        label: 'Title',
        required: false,
      },
      {
        name: 'slides',
        type: 'list',
        label: 'Slides',
        items: {
          type: 'model',
          models: ['CommunityCarouselSlide'],
        },
      },
      {
        name: 'slideDuration',
        type: 'number',
        label: 'Slide Duration (ms)',
        required: false,
      },
      {
        name: 'quoteDuration',
        type: 'number',
        label: 'Quote Duration (ms)',
        required: false,
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
    name: 'imageGrid',
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
    name: 'timeline',
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
    name: 'facts',
    type: 'object',
    label: 'Facts Section',
    fields: [
      {
        name: 'title',
        type: 'string',
        label: 'Title',
        required: false,
      },
      {
        name: 'text',
        type: 'text',
        label: 'Text',
        required: false,
      },
    ],
  },
  {
    name: 'bullets',
    type: 'object',
    label: 'Bullets Section',
    fields: [
      {
        name: 'title',
        type: 'string',
        label: 'Title',
        required: false,
      },
      {
        name: 'items',
        type: 'list',
        label: 'Items',
        items: {
          type: 'string',
        },
      },
    ],
  },
  {
    name: 'SpecialtyItem',
    type: 'object',
    label: 'Specialty Item',
    fields: [
      {
        name: 'title',
        type: 'string',
        label: 'Title',
        required: false,
      },
      {
        name: 'bullets',
        type: 'list',
        label: 'Bullets',
        items: {
          type: 'string',
        },
      },
    ],
  },
  {
    name: 'specialties',
    type: 'object',
    label: 'Specialties Section',
    fields: [
      {
        name: 'title',
        type: 'string',
        label: 'Title',
        required: false,
      },
      {
        name: 'items',
        type: 'list',
        label: 'Specialties',
        items: {
          type: 'model',
          models: ['SpecialtyItem'],
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
        type: 'model',
        models: ['LocalizedStringList'],
        label: 'Tags',
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
    file: 'content/articles/index.json',
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
    file: 'content/courses.json',
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
    file: 'content/products/index.json',
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
    file: 'content/reviews/index.json',
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
    file: 'content/partners.json',
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
    name: 'DoctorCollection',
    type: 'data',
    file: 'content/doctors.json',
    label: 'Doctor Collection',
    filePath: 'content/doctors.json',
    fields: [
      {
        name: 'doctors',
        type: 'list',
        label: 'Doctors',
        items: {
          type: 'object',
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
              name: 'imageUrl',
              type: 'image',
              label: 'Image',
            },
          ],
        },
      },
    ],
  },
  {
    name: 'TrainingCollection',
    type: 'data',
    file: 'content/training.json',
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
    name: 'ShopContent',
    type: 'data',
    file: 'content/shop.json',
    label: 'Shop Content',
    filePath: 'content/shop.json',
    fields: [
      {
        name: 'categories',
        type: 'list',
        label: 'Categories',
        items: {
          type: 'object',
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
              name: 'intro',
              type: 'model',
              models: ['LocalizedText'],
              label: 'Intro',
            },
            {
              name: 'productIds',
              type: 'list',
              label: 'Product IDs',
              items: {
                type: 'string',
              },
            },
            {
              name: 'links',
              type: 'list',
              label: 'Links',
              items: {
                type: 'object',
                fields: [
                  {
                    name: 'id',
                    type: 'string',
                    label: 'ID',
                  },
                  {
                    name: 'type',
                    type: 'string',
                    label: 'Type',
                  },
                  {
                    name: 'url',
                    type: 'string',
                    label: 'URL',
                  },
                  {
                    name: 'label',
                    type: 'model',
                    models: ['LocalizedString'],
                    label: 'Label',
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  },
  {
    name: 'VideoCollection',
    type: 'data',
    file: 'content/videos.json',
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
    file: 'content/policies.json',
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
  {
    name: 'TestPage',
    type: 'page',
    label: 'Test Page',
    filePath: 'content/pages/{lang}/test.json',
    urlPath: '/test',
    fields: [
      {
        type: 'string',
        name: 'title',
        label: 'Title',
      },
    ],
  },
  {
    name: 'HomePage',
    type: 'page',
    label: 'Home Page',
    filePath: 'content/pages/{lang}/home.json',
    urlPath: '/',
    match: 'content/pages/**/home.json',
    fields: [
      {
        name: 'heroHeadline',
        type: 'string',
        label: 'Hero Headline',
        required: false,
      },
      {
        name: 'heroSubheadline',
        type: 'text',
        label: 'Hero Subheadline',
        required: false,
      },
      {
        name: 'heroCtas',
        type: 'model',
        label: 'Hero CTAs',
        models: ['HeroCtas'],
        required: false,
      },
      {
        name: 'heroAlignment',
        type: 'model',
        label: 'Hero Alignment',
        models: ['HeroAlignment'],
        required: false,
      },
      {
        name: 'heroImages',
        type: 'model',
        label: 'Hero Images',
        models: ['HeroImages'],
        required: false,
      },
      {
        name: 'sections',
        type: 'list',
        label: 'Sections',
        items: {
          type: 'model',
          models: sectionModelNames,
        },
      },
    ],
  },
  {
    name: 'AboutPage',
    type: 'page',
    label: 'About Page',
    filePath: 'content/pages/{lang}/about.json',
    urlPath: '/about',
    match: 'content/pages/**/about.json',
    fields: [
      {
        name: 'sections',
        type: 'list',
        label: 'Sections',
        items: {
          type: 'model',
          models: sectionModelNames,
        },
      },
    ],
  },
  {
    name: 'ClinicsPage',
    type: 'page',
    label: 'Clinics Page',
    filePath: 'content/pages/{lang}/clinics.json',
    urlPath: '/for-clinics',
    match: 'content/pages/**/clinics.json',
    fields: [
      {
        name: 'sections',
        type: 'list',
        label: 'Sections',
        items: {
          type: 'model',
          models: sectionModelNames,
        },
      },
    ],
  },
  {
    name: 'ContactPage',
    type: 'page',
    label: 'Contact Page',
    filePath: 'content/pages/{lang}/contact.json',
    urlPath: '/contact',
    match: 'content/pages/**/contact.json',
    fields: [
      {
        name: 'sections',
        type: 'list',
        label: 'Sections',
        items: {
          type: 'model',
          models: sectionModelNames,
        },
      },
    ],
  },
  {
    name: 'LearnPage',
    type: 'page',
    label: 'Learn Page',
    filePath: 'content/pages/{lang}/learn.json',
    urlPath: '/learn',
    match: 'content/pages/**/learn.json',
    fields: [
      {
        name: 'sections',
        type: 'list',
        label: 'Sections',
        items: {
          type: 'model',
          models: sectionModelNames,
        },
      },
    ],
  },
  {
    name: 'MethodPage',
    type: 'page',
    label: 'Method Page',
    filePath: 'content/pages/{lang}/method.json',
    urlPath: '/method',
    match: 'content/pages/**/method.json',
    fields: [
      {
        name: 'sections',
        type: 'list',
        label: 'Sections',
        items: {
          type: 'model',
          models: sectionModelNames,
        },
      },
    ],
  },
  {
    name: 'StoryPage',
    type: 'page',
    label: 'Story Page',
    filePath: 'content/pages/{lang}/story.json',
    urlPath: '/story',
    match: 'content/pages/**/story.json',
    fields: [
      {
        name: 'sections',
        type: 'list',
        label: 'Sections',
        items: {
          type: 'model',
          models: sectionModelNames,
        },
      },
    ],
  },
  {
    name: 'TrainingPage',
    type: 'page',
    label: 'Training Page',
    filePath: 'content/pages/{lang}/training.json',
    urlPath: '/training',
    match: 'content/pages/**/training.json',
    fields: [
      {
        name: 'sections',
        type: 'list',
        label: 'Sections',
        items: {
          type: 'model',
          models: sectionModelNames,
        },
      },
    ],
  },
  {
    name: 'VideosPage',
    type: 'page',
    label: 'Videos Page',
    filePath: 'content/pages/{lang}/videos.json',
    urlPath: '/videos',
    match: 'content/pages/**/videos.json',
    fields: [
      {
        name: 'sections',
        type: 'list',
        label: 'Sections',
        items: {
          type: 'model',
          models: sectionModelNames,
        },
      },
    ],
  },
  {
    name: 'ShopPage',
    type: 'page',
    label: 'Shop Page',
    filePath: 'content/pages/{lang}/shop.json',
    urlPath: '/shop',
    match: 'content/pages/**/shop.json',
    fields: [
      {
        name: 'sections',
        type: 'list',
        label: 'Sections',
        items: {
          type: 'model',
          models: sectionModelNames,
        },
      },
    ],
  },
  {
    name: 'PolicyPage',
    type: 'page',
    label: 'Policy Page',
    filePath: 'content/pages/{lang}/policy.json',
    urlPath: '/policy/{type}',
    match: 'content/pages/**/policy.json',
    fields: [
      {
        name: 'sections',
        type: 'list',
        label: 'Sections',
        items: {
          type: 'model',
          models: sectionModelNames,
        },
      },
    ],
  },
];

const normalizeModelForContentSource = (model) => {
  const normalized = { ...model };

  if (
    typeof normalized.filePath === 'string' &&
    !normalized.file &&
    !/[{*}]/.test(normalized.filePath)
  ) {
    normalized.file = normalized.filePath;
  }

  return normalized;
};

const mergedModels = [...metadata.models];
const metadataModelNames = new Set(metadata.models.map((model) => model.name));

for (const customModel of customModels) {
  if (!metadataModelNames.has(customModel.name)) {
    mergedModels.push(customModel);
  }
}

const allModels = mergedModels.map(normalizeModelForContentSource);

const contentSource = new FileSystemContentSource({
  rootPath: process.cwd(),
  contentDirs: ['content'],
  models: allModels,
  assetsConfig: {
    referenceType: 'static',
    staticDir: 'content',
    publicPath: '/content',
    uploadDir: 'uploads',
  },
});

const getSourceTaggedModels = () => {
  const srcType = contentSource.getContentSourceType();
  const srcProjectId = contentSource.getProjectId();
  return allModels.map((model) => ({ ...model, srcType, srcProjectId }));
};

/** @type {import('@stackbit/types').StackbitConfig} */
const config = {
  stackbitVersion: '~0.6.0',
  contentSources: [contentSource],
  modelExtensions: pageModelExtensions,
  mapModels: ({ models }) => {
    const taggedModels = getSourceTaggedModels();
    const existingForSource = new Set(
      models
        .filter((model) => model.srcType === contentSource.getContentSourceType() && model.srcProjectId === contentSource.getProjectId())
        .map((model) => model.name)
    );
    const additional = taggedModels.filter((model) => !existingForSource.has(model.name));
    return [...models, ...additional];
  },
};

export default config;
