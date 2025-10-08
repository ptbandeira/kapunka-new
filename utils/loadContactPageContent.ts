import type { Language, PageSection } from '../types';
import { fetchVisualEditorMarkdown, type VisualEditorContentSource } from './fetchVisualEditorMarkdown';
import { loadUnifiedPage } from './unifiedPageLoader';
import { loadPage } from '../src/lib/content';

interface ContactPageData {
  metaTitle?: string;
  metaDescription?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  mapEmbedUrl?: string;
  sections?: PageSection[];
}

export interface ContactPageContentResult {
  data: ContactPageData;
  locale: Language;
  source: VisualEditorContentSource;
}

export const loadContactPageContent = async (
  language: Language,
): Promise<ContactPageContentResult | null> => {
  const unified = await loadUnifiedPage<ContactPageData>('contact', language);
  if (unified) {
    return unified;
  }

  try {
    const result = await loadPage({
      slug: 'contact',
      locale: language,
      loader: async ({ locale: currentLocale }) => fetchVisualEditorMarkdown<ContactPageData>(
        `/content/pages/${currentLocale}/contact.md`,
        { cache: 'no-store' },
      ),
    });

    return {
      data: result.data,
      locale: result.localeUsed,
      source: result.source,
    };
  } catch (error) {
    console.warn('Contact page content fetch failed', error);
  }

  return null;
};
