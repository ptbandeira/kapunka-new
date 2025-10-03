import type { ReactNode } from 'react';

export type Language = 'en' | 'pt' | 'es';

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

export interface SeoSettings {
    defaultTitle?: LocalizedText;
    defaultDescription?: LocalizedText;
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

export interface Review {
    id: string;
    text: Translatable;
    author: Translatable;
    role: Translatable;
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

export interface Doctor {
    id: string;
    name: string;
    imageUrl: string;
}

export interface Partner {
    id: string;
    name: string;
    logoUrl: string;
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
    label: string;
    url: string;
    icon: string;
}

export interface SiteSettings {
    brand?: {
        name: string;
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
        storyAlt?: string;
        sourcingAlt?: string;
    };
    clinics?: {
        ctaLink?: string;
    };
    footer?: {
        legalName?: string;
        socialLinks?: SocialLink[];
    };
    seo?: SeoSettings;
    featureFlags?: {
        videos?: boolean;
        training?: boolean;
    };
}

export interface TimelineEntry {
  year: string;
  title: string;
  description: string;
  image?: string;
}

export interface TimelineSectionContent {
  type: 'timeline';
  title?: string;
  entries: TimelineEntry[];
}

export interface ImageTextHalfSectionContent {
  type: 'imageTextHalf';
  image?: string;
  title?: string;
  text?: string;
}

export interface ImageGridItem {
  image?: string;
  title?: string;
  subtitle?: string;
}

export interface ImageGridSectionContent {
  type: 'imageGrid';
  items: ImageGridItem[];
}

export interface CommunityCarouselSlide {
  image?: string;
  alt?: string;
  quote?: string;
  name?: string;
  role?: string;
}

export interface CommunityCarouselSectionContent {
  type: 'communityCarousel';
  title?: string;
  slides?: CommunityCarouselSlide[];
  slideDuration?: number;
  quoteDuration?: number;
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

export interface VideoGallerySectionContent {
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

export interface TrainingListSectionContent {
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

export interface ProductTabsSectionContent {
  type: 'productTabs';
  tabs: ProductTab[];
  initialActiveTab?: string;
}

export type PageSection =
  | TimelineSectionContent
  | ImageTextHalfSectionContent
  | ImageGridSectionContent
  | CommunityCarouselSectionContent
  | VideoGallerySectionContent
  | TrainingListSectionContent
  | ProductTabsSectionContent;

export interface PageContent {
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
