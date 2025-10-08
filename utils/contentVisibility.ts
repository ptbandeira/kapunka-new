import type { VisibilityFlag } from '../types';

const isVisible = <T extends VisibilityFlag>(
  candidate: T | null | undefined,
): candidate is T => Boolean(candidate) && candidate.visible !== false;

export const filterVisible = <T extends VisibilityFlag>(
  items: (T | null | undefined)[] | null | undefined,
): T[] => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter(isVisible);
};
