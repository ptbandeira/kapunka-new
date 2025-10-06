import type { Language } from '../types';
import { fetchVisualEditorMarkdown, type VisualEditorContentSource } from './fetchVisualEditorMarkdown';
import { loadUnifiedPage } from './unifiedPageLoader';
import { loadPage } from '../src/lib/content';

export interface LearnPageCategory {
  id: string;
  label: string;
}

export interface LearnPageData {
  metaTitle?: string;
  metaDescription?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  categories?: LearnPageCategory[];
  sections?: unknown[];
}

export interface LearnPageContentResult {
  data: LearnPageData;
  locale: Language;
  source: VisualEditorContentSource;
}

export const loadLearnPageContent = async (
  language: Language,
): Promise<LearnPageContentResult | null> => {
  const unified = await loadUnifiedPage<LearnPageData>('learn', language);
  if (unified) {
    return unified;
  }

  try {
    const result = await loadPage({
      slug: 'learn',
      locale: language,
      loader: async ({ locale: currentLocale }) => fetchVisualEditorMarkdown<LearnPageData>(
        `/content/pages/${currentLocale}/learn.md`,
        { cache: 'no-store' },
      ),
    });

    return {
      data: result.data,
      locale: result.localeUsed,
      source: result.source,
    };
  } catch (error) {
    console.warn('Learn page content fetch failed', error);
  }

  return null;
};

