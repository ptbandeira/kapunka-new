import type { LocalizedText, Language } from './types';

export type HomeSectionCtaStyle = 'primary' | 'secondary' | 'link';

export interface HomeSectionCta {
  label?: LocalizedText;
  url?: string;
  style?: HomeSectionCtaStyle;
}

export interface HomeHeroSection {
  type: 'hero';
  headline?: LocalizedText;
  subtext?: LocalizedText;
  background_image?: string | null;
  cta?: HomeSectionCta;
}

export interface HomeShowcaseSection {
  type: 'showcase';
  eyebrow?: LocalizedText;
  headline?: LocalizedText;
  text_content?: LocalizedText;
  media_gallery?: string[];
}

export interface HomeContactBannerSection {
  type: 'contact_banner';
  headline?: LocalizedText;
  cta?: HomeSectionCta;
}

export type HomeBuilderSection =
  | HomeHeroSection
  | HomeShowcaseSection
  | HomeContactBannerSection;

export type HomeSectionType = HomeBuilderSection['type'];

export type SectionWithMeta<TSection extends HomeBuilderSection> = TSection & {
  language: Language;
  fieldPath: string;
  index: number;
};
