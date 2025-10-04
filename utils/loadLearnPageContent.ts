import type { Language } from '../types';
import { fetchVisualEditorMarkdown, type VisualEditorContentSource } from './fetchVisualEditorMarkdown';
import { loadUnifiedPage } from './unifiedPageLoader';

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

  const locales: Language[] = language === 'en' ? ['en'] : [language, 'en'];

  for (const locale of locales) {
    try {
      const { data, source } = await fetchVisualEditorMarkdown<LearnPageData>(
        `/content/pages/${locale}/learn.md`,
        { cache: 'no-store' },
      );
      return {
        data,
        locale,
        source,
      };
    } catch (error) {
      console.warn('Learn page content fetch failed', locale, error);
    }
  }

  return null;
};

