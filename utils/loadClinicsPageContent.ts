import type { Language } from '../types';
import { fetchVisualEditorMarkdown, type VisualEditorContentSource } from './fetchVisualEditorMarkdown';
import { loadUnifiedPage } from './unifiedPageLoader';
import { loadPage } from '../src/lib/content';

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
  ctaTitle?: string;
  ctaSubtitle?: string;
  ctaButton?: string;
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

  try {
    const result = await loadPage({
      slug: 'clinics',
      locale: language,
      loader: async ({ locale: currentLocale }) => fetchVisualEditorMarkdown<ClinicsPageData>(
        `/content/pages/${currentLocale}/clinics.md`,
        { cache: 'no-store' },
      ),
    });

    return {
      data: result.data,
      locale: result.localeUsed,
      source: result.source,
    };
  } catch (error) {
    console.warn('Clinics page content fetch failed', error);
  }

  return null;
};

