import type { Language, PageSection } from '../types';
import { fetchVisualEditorMarkdown, type VisualEditorContentSource } from './fetchVisualEditorMarkdown';
import { loadUnifiedPage } from './unifiedPageLoader';
import { loadPage } from '../src/lib/content';

interface ClinicsPageData {
  metaTitle?: string;
  metaDescription?: string;
  hero?: Record<string, unknown>;
  heroHeadline?: string;
  heroTitle?: string;
  heroSubheadline?: string;
  heroSubtitle?: string;
  heroEyebrow?: string;
  heroCtas?: {
    ctaPrimary?: unknown;
    ctaSecondary?: unknown;
  };
  heroPrimaryCta?: unknown;
  heroCtaPrimary?: unknown;
  heroSecondaryCta?: unknown;
  heroCtaSecondary?: unknown;
  ctaTitle?: string;
  ctaSubtitle?: string;
  ctaButton?: string;
  sections?: PageSection[];
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

