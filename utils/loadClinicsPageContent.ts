import type { Language } from '../types';

export interface ClinicsPageData {
  metaTitle?: string;
  metaDescription?: string;
  headerTitle?: string;
  headerSubtitle?: string;
  section1Title?: string;
  section1Text1?: string;
  section1Text2?: string;
  intro?: {
    title?: string;
    text1?: string;
    text2?: string;
  };
  protocolSection?: unknown;
  referencesSection?: unknown;
  keywordSection?: unknown;
  faqSection?: unknown;
  doctorsTitle?: string;
  ctaTitle?: string;
  ctaSubtitle?: string;
  ctaButton?: string;
  partnersTitle?: string;
  sections?: unknown[];
}

export interface ClinicsPageContentResult {
  data: ClinicsPageData;
  locale: Language;
  source: 'site' | 'content';
}

const buildCandidates = (language: Language): Array<{
  url: string;
  locale: Language;
  source: 'site' | 'content';
}> => {
  const locales: Language[] = language === 'en' ? ['en'] : [language, 'en'];
  const candidates: Array<{ url: string; locale: Language; source: 'site' | 'content' }> = [];

  for (const locale of locales) {
    candidates.push({
      url: `/site/content/${locale}/pages/clinics.json`,
      locale,
      source: 'site',
    });
    candidates.push({
      url: `/content/pages/${locale}/clinics.json`,
      locale,
      source: 'content',
    });
  }

  return candidates;
};

export const loadClinicsPageContent = async (
  language: Language,
): Promise<ClinicsPageContentResult | null> => {
  const candidates = buildCandidates(language);

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate.url);
      if (!response.ok) {
        continue;
      }

      const data = (await response.json()) as ClinicsPageData;
      return {
        data,
        locale: candidate.locale,
        source: candidate.source,
      };
    } catch (error) {
      console.warn('Clinics page content fetch failed', candidate.url, error);
    }
  }

  return null;
};

