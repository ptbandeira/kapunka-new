export type VisualEditorWindow = Window & {
  NETLIFY_VISUAL_EDITOR?: unknown;
  __NETLIFY_VISUAL_EDITOR__?: unknown;
  STACKBIT_PREVIEW?: unknown;
  __STACKBIT_PREVIEW__?: unknown;
  Stackbit?: {
    visualEditor?: unknown;
    editor?: unknown;
  } | null;
};

const VISUAL_EDITOR_QUERY_FLAGS = ['stackbit', 'visual-editor', 'visualEditor'];

export const isVisualEditorRuntime = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const globalWindow = window as VisualEditorWindow;

  if (
    globalWindow.NETLIFY_VISUAL_EDITOR ||
    globalWindow.__NETLIFY_VISUAL_EDITOR__ ||
    globalWindow.STACKBIT_PREVIEW ||
    globalWindow.__STACKBIT_PREVIEW__
  ) {
    return true;
  }

  const stackbit = globalWindow.Stackbit;
  if (stackbit && typeof stackbit === 'object') {
    if ('visualEditor' in stackbit && stackbit.visualEditor) {
      return true;
    }
    if ('editor' in stackbit && stackbit.editor) {
      return true;
    }
  }

  const searchParams = new URLSearchParams(globalWindow.location?.search ?? '');
  for (const flag of VISUAL_EDITOR_QUERY_FLAGS) {
    if (searchParams.has(flag)) {
      return true;
    }
  }

  if (searchParams.get('editor') === 'visual') {
    return true;
  }

  return false;
};
