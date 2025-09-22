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

export interface ProductSize {
  id: string;
  size: number;
  price: number;
}

export interface Product {
  id: string;
  name: Translatable;
  tagline: Translatable;
  imageUrl: string;
  sizes: ProductSize[];
  badges: TranslatableArray;
  benefits: TranslatableArray;
  howToUse: Translatable;
  ingredients: Translatable;
  labTestedNote: Translatable;
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
