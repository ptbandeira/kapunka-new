import type { Language } from '../types';
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
  source: 'site' | 'content';
}

const buildLegacyCandidates = (language: Language): Array<{
  url: string;
  locale: Language;
  source: 'site' | 'content';
}> => {
  const locales: Language[] = language === 'en' ? ['en'] : [language, 'en'];
  const candidates: Array<{ url: string; locale: Language; source: 'site' | 'content' }> = [];

  for (const locale of locales) {
    candidates.push({
      url: `/site/content/${locale}/pages/learn.json`,
      locale,
      source: 'site',
    });
    candidates.push({
      url: `/content/pages/${locale}/learn.json`,
      locale,
      source: 'content',
    });
  }

  return candidates;
};

export const loadLearnPageContent = async (
  language: Language,
): Promise<LearnPageContentResult | null> => {
  const unified = await loadUnifiedPage<LearnPageData>('learn', language);
  if (unified) {
    return unified;
  }

  const candidates = buildLegacyCandidates(language);

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate.url);
      if (!response.ok) {
        continue;
      }

      const data = (await response.json()) as LearnPageData;
      return {
        data,
        locale: candidate.locale,
        source: candidate.source,
      };
    } catch (error) {
      console.warn('Learn page content fetch failed', candidate.url, error);
    }
  }

  return null;
};

