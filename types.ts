import type { ReactNode } from 'react';

export type Language = 'en' | 'pt' | 'es';

export interface VisibilityFlag {
  visible?: boolean;
}

export type Translatable = {
  en: string;
  pt: string;
  es: string;
};

export type TranslatableArray = {
  en: string[];
  pt: string[];
  es: string[];
};

export type LocalizedText = string | Partial<Record<Language, string>>;
export type LocalizedValue<T> = T | Partial<Record<Language, T>>;
export type LocalizedNumber = LocalizedValue<number>;

export interface FocalPoint {
  x?: number | null;
  y?: number | null;
}

export interface SeoSettings {
    defaultTitle?: LocalizedText;
    defaultDescription?: LocalizedText;
    favicon?: string;
}

export interface ProductSize {
  id: string;
  size: number;
  price: number;
}

export interface ProductKnowledge {
  whatItIs: Translatable;
  howItWorks: Translatable;
  whoItsFor: Translatable;
  scientificBacking: Translatable;
  culturalContext: Translatable;
}

export interface ProductFaq {
  question: Translatable;
  answer: Translatable;
}

export interface ArticleFaq {
  question: Translatable;
  answer: Translatable;
}

export interface ProductGoodToKnow {
  title: Translatable;
  items: TranslatableArray;
}

export interface Product {
  id: string;
  name: Translatable;
  titleAddition?: Translatable;
  tagline: Translatable;
  description?: Translatable;
  bundleIncludes?: TranslatableArray;
  imageUrl: string;
  sizes: ProductSize[];
  badges: TranslatableArray;
  benefits: TranslatableArray;
  howToUse: Translatable;
  ingredients: Translatable;
  labTestedNote: Translatable;
  knowledge: ProductKnowledge;
  originStory?: Translatable;
  scientificEvidence?: Translatable;
  multiUseTips?: TranslatableArray;
  faqs: ProductFaq[];
  goodToKnow?: ProductGoodToKnow;
}

export interface CartItem {
  productId: string;
  sizeId: string;
  quantity: number;
}

export interface Article {
    id: string;
    slug: string;
    title: Translatable;
    preview: Translatable;
    content: Translatable;
    category: string;
    imageUrl: string;
    relatedProductId?: string;
    relatedProductIds?: string[];
    faqs?: ArticleFaq[];
}

export interface Course {
    id: string;
    title: Translatable;
    imageUrl: string;
    price: number;
    enrollLink: string;
}

export interface PolicySection {
    id: string;
    title: Translatable;
    body: Translatable;
}

export interface Policy {
    id: string;
    title: Translatable;
    content?: Translatable;
    sections?: PolicySection[];
    metaTitle?: Translatable;
    metaDescription?: Translatable;
}

export interface ShopCategoryLink {
    id: string;
    type: 'product' | 'article' | 'clinics';
    url: string;
    label: Translatable;
}

export interface ShopCategory {
    id: string;
    title: Translatable;
    intro: Translatable;
    productIds: string[];
    links: ShopCategoryLink[];
}

export interface ShopContent {
    categories: ShopCategory[];
}

export interface SocialLink {
    id: string;
    label: LocalizedText;
    url: string;
    icon: string;
}

export interface SiteSettings {
    brand?: {
        name: LocalizedText;
    };
    home?: {
        heroImage: string;
        featuredProductIds?: string[];
    };
    contact?: {
        email: string;
        phone: string;
        whatsapp: string;
    };
    about?: {
        storyImage?: string;
        sourcingImage?: string;
        storyAlt?: LocalizedText;
        sourcingAlt?: LocalizedText;
    };
    clinics?: {
        ctaLink?: string;
    };
    footer?: {
        legalName?: LocalizedText;
        socialLinks?: SocialLink[];
    };
    seo?: SeoSettings;
}

export interface TimelineEntry {
  year: string;
  title: string;
  description: string;
  image?: string;
  imageFocal?: FocalPoint;
}

export interface TimelineSectionContent extends VisibilityFlag {
  type: 'timeline';
  title?: string;
  entries: TimelineEntry[];
}

export interface MediaCopyOverlaySettings {
  columnStart?: LocalizedNumber;
  columnSpan?: LocalizedNumber;
  rowStart?: LocalizedNumber;
  rowSpan?: LocalizedNumber;
  textAlign?: LocalizedValue<'left' | 'center' | 'right'>;
  verticalAlign?: LocalizedValue<'start' | 'center' | 'end'>;
  theme?: LocalizedValue<'light' | 'dark'>;
  background?: LocalizedValue<'none' | 'scrim-light' | 'scrim-dark' | 'panel'>;
  cardWidth?: LocalizedValue<'sm' | 'md' | 'lg'>;
}

export interface MediaCopyContentBlock {
  heading?: LocalizedText;
  body?: LocalizedText;
  image?: {
    src?: string | null;
    alt?: LocalizedText;
    focal?: FocalPoint | null;
  };
}

export interface MediaCopySectionContent extends VisibilityFlag {
  type: 'mediaCopy';
  title?: LocalizedText;
  body?: LocalizedText;
  image?: string | { src?: string | null; focal?: FocalPoint | null };
  imageAlt?: LocalizedText;
  layout?: LocalizedValue<'image-left' | 'image-right' | 'overlay'>;
  columns?: LocalizedNumber;
  overlay?: MediaCopyOverlaySettings;
  content?: MediaCopyContentBlock;
}

export interface HeroSimpleSectionContent extends VisibilityFlag {
  type: 'heroSimple';
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  titleFieldPath?: string;
  subtitleFieldPath?: string;
  eyebrowFieldPath?: string;
  fieldPathOverride?: string;
}

export interface ImageTextHalfSectionContent extends VisibilityFlag {
  type: 'imageTextHalf';
  image?: string;
  imageFocal?: FocalPoint | null;
  title?: string;
  text?: string;
  imageAlt?: string;
}

export interface ImageGridItem {
  image?: string;
  title?: string;
  subtitle?: string;
  alt?: string;
  imageFocal?: FocalPoint | null;
}

export interface ImageGridSectionContent extends VisibilityFlag {
  type: 'imageGrid';
  items: ImageGridItem[];
}

export interface CommunityCarouselSlide {
  image?: string;
  alt?: string;
  quote?: string;
  name?: string;
  role?: string;
  imageFocal?: FocalPoint | null;
}

export interface CommunityCarouselSectionContent extends VisibilityFlag {
  type: 'communityCarousel';
  title?: string;
  slides?: CommunityCarouselSlide[];
  slideDuration?: number;
  quoteDuration?: number;
}

export interface MediaShowcaseItemContent {
  eyebrow?: LocalizedText;
  title?: LocalizedText;
  body?: LocalizedText;
  description?: LocalizedText;
  label?: LocalizedText;
  image?: string;
  imageAlt?: LocalizedText;
  imageFocal?: FocalPoint | null;
  ctaLabel?: LocalizedText;
  ctaHref?: LocalizedText;
}

export interface MediaShowcaseSectionContent extends VisibilityFlag {
  type: 'mediaShowcase';
  title?: LocalizedText;
  items?: MediaShowcaseItemContent[];
}

export interface FeatureGridItemContent {
  label?: LocalizedText;
  description?: LocalizedText;
  icon?: string;
}

export interface FeatureGridSectionContent extends VisibilityFlag {
  type: 'featureGrid';
  title?: LocalizedText;
  columns?: LocalizedNumber;
  items?: FeatureGridItemContent[];
}

export interface ProductGridProductReference {
  id?: LocalizedText;
}

export interface ProductGridHighlightItem {
  eyebrow?: LocalizedText;
  title?: LocalizedText;
  label?: LocalizedText;
  description?: LocalizedText;
  body?: LocalizedText;
  image?: string;
  imageAlt?: LocalizedText;
  ctaLabel?: LocalizedText;
  ctaHref?: LocalizedText;
}

export interface ProductGridSectionContent extends VisibilityFlag {
  type: 'productGrid';
  title?: LocalizedText;
  columns?: LocalizedNumber;
  products?: ProductGridProductReference[];
  items?: ProductGridHighlightItem[];
}

export interface BannerSectionContent extends VisibilityFlag {
  type: 'banner';
  text?: LocalizedText;
  cta?: LocalizedText;
  url?: LocalizedText;
  style?: LocalizedText;
}

export interface NewsletterSignupSectionContent extends VisibilityFlag {
  type: 'newsletterSignup';
  title?: LocalizedText;
  subtitle?: LocalizedText;
  placeholder?: LocalizedText;
  ctaLabel?: LocalizedText;
  confirmation?: LocalizedText;
  background?: LocalizedValue<'light' | 'beige' | 'dark'>;
  alignment?: LocalizedValue<'left' | 'center'>;
}

export interface TestimonialQuoteContent {
  text?: LocalizedText;
  author?: LocalizedText;
  role?: LocalizedText;
}

export interface TestimonialsSectionContent extends VisibilityFlag {
  type: 'testimonials';
  title?: LocalizedText;
  quotes?: TestimonialQuoteContent[];
}

export interface FactsSectionContent extends VisibilityFlag {
  type: 'facts';
  title?: LocalizedText;
  text?: LocalizedText;
}

export interface BulletsSectionContent extends VisibilityFlag {
  type: 'bullets';
  title?: LocalizedText;
  items?: LocalizedText[];
}

export interface SpecialtyItemContent {
  title?: LocalizedText;
  bullets?: LocalizedText[];
}

export interface SpecialtiesSectionContent extends VisibilityFlag {
  type: 'specialties';
  title?: LocalizedText;
  items?: SpecialtyItemContent[];
}

export interface ClinicsBlockContent {
  clinicsTitle?: string;
  clinicsBody?: string;
  clinicsCtaLabel?: string;
  clinicsCtaHref?: string;
  clinicsImage?: string;
}

export interface ValuePropItem {
  title?: string;
  subtitle?: string;
  iconName?: string;
}

export interface GalleryRowItem {
  image?: string;
  alt?: string;
  caption?: string;
}

export interface GalleryRowContent {
  layout?: 'half' | 'thirds' | 'quarters';
  items?: GalleryRowItem[];
}

export interface TestimonialContent {
  quote?: string;
  author?: string;
  role?: string;
  avatar?: string;
  testimonialRef?: string;
}

export interface MiniHighlightContent {
  title?: string;
  body?: string;
  image?: string;
}

export interface MethodMiniContent {
  title?: string;
  bullets?: string[];
  ctaLabel?: string;
  ctaHref?: string;
}

export interface VideoEntry {
  title?: string;
  description?: string;
  videoUrl?: string;
  thumbnail?: string;
}

export interface VideoGallerySectionContent extends VisibilityFlag {
  type: 'videoGallery';
  title?: string;
  description?: string;
  entries?: VideoEntry[];
}

export interface TrainingEntry {
  courseTitle?: string;
  courseSummary?: string;
  linkUrl?: string;
}

export interface TrainingListSectionContent extends VisibilityFlag {
  type: 'trainingList';
  title?: string;
  description?: string;
  entries?: TrainingEntry[];
}

export interface ProductTab {
  id: string;
  label: string;
  labelFieldPath?: string;
  content: ReactNode | (() => ReactNode);
}

export interface ProductTabsSectionContent extends VisibilityFlag {
  type: 'productTabs';
  tabs: ProductTab[];
  initialActiveTab?: string;
}

export type PageSection =
  | HeroSimpleSectionContent
  | TimelineSectionContent
  | MediaCopySectionContent
  | ImageTextHalfSectionContent
  | ImageGridSectionContent
  | CommunityCarouselSectionContent
  | MediaShowcaseSectionContent
  | FeatureGridSectionContent
  | ProductGridSectionContent
  | VideoGallerySectionContent
  | TrainingListSectionContent
  | ProductTabsSectionContent
  | BannerSectionContent
  | NewsletterSignupSectionContent
  | TestimonialsSectionContent
  | FactsSectionContent
  | BulletsSectionContent
  | SpecialtiesSectionContent;

export interface PageContent extends VisibilityFlag {
  sections: PageSection[];
  type?: string;
  metaTitle?: string;
  metaDescription?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
  heroPrimaryCta?: string;
  heroSecondaryCta?: string;
  heroCtaPrimary?: unknown;
  heroCtaSecondary?: unknown;
  ctaPrimary?: unknown;
  ctaSecondary?: unknown;
  heroOverlay?: string;
  heroImageLeft?: string;
  heroImageRight?: string;
  heroLayoutHint?: 'image-left' | 'image-right' | 'image-full';
  heroAlignX?: 'left' | 'center' | 'right';
  heroAlignY?: 'top' | 'middle' | 'bottom';
  heroTextPosition?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'middle-left'
    | 'middle-center'
    | 'middle-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
  brandIntro?: {
    title?: string;
    text?: string;
  };
  clinicsBlock?: ClinicsBlockContent;
  valueProps?: ValuePropItem[];
  bestsellersIntro?: string;
  galleryRows?: GalleryRowContent[];
  testimonials?: TestimonialContent[];
  newsletterPitch?: string;
  brandMini?: MiniHighlightContent;
  methodMini?: MethodMiniContent;
  founderMini?: MiniHighlightContent;
}

export interface VideoLibraryContent {
  videos?: VideoEntry[];
}

export interface TrainingCatalogContent {
  trainings?: TrainingEntry[];
}
