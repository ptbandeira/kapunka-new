import type { Language } from '../types';
import { loadLocalizedMarkdown, toVisualEditorObjectId } from './localizedContent';

interface ModuleContent {
  title?: string;
  duration?: string;
  description?: string;
  learningOutcomes?: string[];
}

interface PricingContent {
  tuition?: string;
  paymentOptions?: string[];
}

interface ModalitiesContent {
  onlineHours?: string;
  practicalSessions?: string;
}

interface CallToAction {
  label?: string;
  url?: string;
}

export interface TrainingProgramContent {
  metaTitle?: string;
  metaDescription?: string;
  headline?: string;
  subheadline?: string;
  objectives?: string[];
  modules?: ModuleContent[];
  modalities?: ModalitiesContent;
  pricing?: PricingContent;
  callToActions?: CallToAction[];
}

export interface TrainingProgramContentResult {
  data: TrainingProgramContent;
  locale: Language;
  filePath: string;
}

const TRAINING_PROGRAM_BASE_PATH = '/content/pages/training/index.md';
const TRAINING_PROGRAM_DOCUMENT_TYPE = 'TrainingProgramPage';

export const getTrainingProgramObjectId = (filePath?: string): string => (
  toVisualEditorObjectId(
    TRAINING_PROGRAM_DOCUMENT_TYPE,
    filePath ?? TRAINING_PROGRAM_BASE_PATH,
  )
);

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';

const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === 'string');

const isModuleContent = (value: unknown): value is ModuleContent => {
  if (!isRecord(value)) {
    return false;
  }

  const { title, duration, description, learningOutcomes } = value;

  return (
    (title === undefined || typeof title === 'string')
    && (duration === undefined || typeof duration === 'string')
    && (description === undefined || typeof description === 'string')
    && (learningOutcomes === undefined || isStringArray(learningOutcomes))
  );
};

const isPricingContent = (value: unknown): value is PricingContent => {
  if (!isRecord(value)) {
    return false;
  }

  const { tuition, paymentOptions } = value;

  return (
    (tuition === undefined || typeof tuition === 'string')
    && (paymentOptions === undefined || isStringArray(paymentOptions))
  );
};

const isModalitiesContent = (value: unknown): value is ModalitiesContent => {
  if (!isRecord(value)) {
    return false;
  }

  const { onlineHours, practicalSessions } = value;

  return (
    (onlineHours === undefined || typeof onlineHours === 'string')
    && (practicalSessions === undefined || typeof practicalSessions === 'string')
  );
};

const isCallToAction = (value: unknown): value is CallToAction => {
  if (!isRecord(value)) {
    return false;
  }

  const { label, url } = value;

  return (
    (label === undefined || typeof label === 'string')
    && (url === undefined || typeof url === 'string')
  );
};

const isTrainingProgramContent = (value: unknown): value is TrainingProgramContent => {
  if (!isRecord(value)) {
    return false;
  }

  const {
    objectives,
    modules,
    modalities,
    pricing,
    callToActions,
    headline,
    subheadline,
    metaTitle,
    metaDescription,
  } = value;

  if (objectives !== undefined && !isStringArray(objectives)) {
    return false;
  }

  if (modules !== undefined) {
    if (!Array.isArray(modules) || !modules.every(isModuleContent)) {
      return false;
    }
  }

  if (modalities !== undefined && !isModalitiesContent(modalities)) {
    return false;
  }

  if (pricing !== undefined && !isPricingContent(pricing)) {
    return false;
  }

  if (callToActions !== undefined) {
    if (!Array.isArray(callToActions) || !callToActions.every(isCallToAction)) {
      return false;
    }
  }

  return (
    (headline === undefined || typeof headline === 'string')
    && (subheadline === undefined || typeof subheadline === 'string')
    && (metaTitle === undefined || typeof metaTitle === 'string')
    && (metaDescription === undefined || typeof metaDescription === 'string')
  );
};

export const fetchTrainingProgramContent = async (
  language: Language,
): Promise<TrainingProgramContentResult | null> => {
  try {
    const result = await loadLocalizedMarkdown<TrainingProgramContent>({
      slug: 'training-program',
      locale: language,
      basePath: TRAINING_PROGRAM_BASE_PATH,
      validate: isTrainingProgramContent,
    });

    return {
      data: result.data,
      locale: result.locale,
      filePath: result.filePath,
    };
  } catch (error) {
    console.warn('Training program content fetch failed', error);
  }

  return null;
};
