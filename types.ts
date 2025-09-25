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

export interface Policy {
    id: string;
    title: Translatable;
    content: Translatable;
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

export type PageSection = TimelineSectionContent;

export interface PageContent {
  sections: PageSection[];
  type?: string;
}
