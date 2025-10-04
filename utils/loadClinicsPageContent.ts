import type { Language } from '../types';
import { fetchVisualEditorMarkdown, type VisualEditorContentSource } from './fetchVisualEditorMarkdown';
import { loadUnifiedPage } from './unifiedPageLoader';

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
  source: VisualEditorContentSource;
}

export const loadClinicsPageContent = async (
  language: Language,
): Promise<ClinicsPageContentResult | null> => {
  const unified = await loadUnifiedPage<ClinicsPageData>('clinics', language);
  if (unified) {
    return unified;
  }

  const locales: Language[] = language === 'en' ? ['en'] : [language, 'en'];

  for (const locale of locales) {
    try {
      const { data, source } = await fetchVisualEditorMarkdown<ClinicsPageData>(
        `/content/pages/${locale}/clinics.md`,
        { cache: 'no-store' },
      );
      return {
        data,
        locale,
        source,
      };
    } catch (error) {
      console.warn('Clinics page content fetch failed', locale, error);
    }
  }

  return null;
};

