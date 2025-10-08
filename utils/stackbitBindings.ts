export type VisualEditorAttributes = {
  'data-nlv-field-path'?: string;
  'data-sb-field-path'?: string;
  'data-sb-object-id'?: string;
};

export const prepareStackbitMetadata = (): void => {
  // visual editor support removed; metadata loading no longer required
};

export const getStackbitBinding = (_fieldPath?: string | null): undefined => undefined;

export const getStackbitAttributes = (_fieldPath?: string | null): Record<string, never> => ({});

export const getStackbitObjectId = (_fieldPath?: string | null): undefined => undefined;

export const getVisualEditorAttributes = (_fieldPath?: string | null): VisualEditorAttributes => ({});

export const normalizeStackbitPathForTesting = (fieldPath?: string | null): string =>
  (typeof fieldPath === 'string' ? fieldPath : '');
