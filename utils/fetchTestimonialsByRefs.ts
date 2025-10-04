import type { TestimonialEntry } from '../types';
import { fetchVisualEditorJson } from './fetchVisualEditorJson';

const normalizeRef = (ref: string): string => {
  if (ref.startsWith('/')) {
    return ref;
  }

  return `/${ref}`;
};

const isTestimonialEntry = (value: unknown): value is TestimonialEntry => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const entry = value as Record<string, unknown>;
  const quote = entry.quote;
  const name = entry.name;
  const title = entry.title;
  const avatar = entry.avatar;
  const language = entry.language;

  const quoteIsValid = typeof quote === 'string' && quote.trim().length > 0;
  const nameIsValid = typeof name === 'string' || typeof name === 'undefined';
  const titleIsValid = typeof title === 'string' || typeof title === 'undefined';
  const avatarIsValid = typeof avatar === 'string' || typeof avatar === 'undefined' || avatar === null;
  const languageIsValid =
    typeof language === 'string'
    || typeof language === 'undefined'
    || language === null;

  return quoteIsValid && nameIsValid && titleIsValid && avatarIsValid && languageIsValid;
};

export const fetchTestimonialsByRefs = async (
  refs: string[],
): Promise<Record<string, TestimonialEntry>> => {
  const uniqueRefs = Array.from(
    new Set(
      refs
        .filter((ref): ref is string => typeof ref === 'string')
        .map((ref) => ref.trim())
        .filter((ref) => ref.length > 0),
    ),
  );

  if (uniqueRefs.length === 0) {
    return {};
  }

  const entries = await Promise.all(
    uniqueRefs.map(async (ref) => {
      const normalizedRef = normalizeRef(ref);

      try {
        const data = await fetchVisualEditorJson<unknown>(normalizedRef);
        if (isTestimonialEntry(data)) {
          return [ref, data] as const;
        }

        console.warn('Ignoring testimonial with unexpected shape', ref, data);
      } catch (error) {
        console.warn('Failed to load testimonial entry', ref, error);
      }

      return null;
    }),
  );

  const validEntries = entries.filter((entry): entry is readonly [string, TestimonialEntry] => Array.isArray(entry));

  return Object.fromEntries(validEntries);
};
