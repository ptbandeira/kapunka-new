const VISUAL_EDITOR_QUERY_PATTERN = /(?:^|[?#&])(visual-editor|visualEditor|ve)=1(?:&|$)/i;

let cachedRuntimeDetection: boolean | null = null;

const hasStackbitBridge = (scope: unknown): boolean => {
  if (!scope || typeof scope !== 'object') {
    return false;
  }

  return 'Stackbit' in scope || 'NetlifyStackbit' in scope || 'NetlifyVisualEditor' in scope;
};

export const isVisualEditorRuntime = (): boolean => {
  if (cachedRuntimeDetection !== null) {
    return cachedRuntimeDetection;
  }

  if (typeof window === 'undefined') {
    cachedRuntimeDetection = false;
    return cachedRuntimeDetection;
  }

  if (import.meta.env.DEV) {
    cachedRuntimeDetection = true;
    return cachedRuntimeDetection;
  }

  const globalScope = window as typeof window & {
    NETLIFY_VISUAL_EDITOR?: unknown;
    NETLIFY_STACKBIT_PREVIEW?: unknown;
  };

  if (globalScope.NETLIFY_VISUAL_EDITOR === true) {
    cachedRuntimeDetection = true;
    return cachedRuntimeDetection;
  }

  if (globalScope.NETLIFY_STACKBIT_PREVIEW === true) {
    cachedRuntimeDetection = true;
    return cachedRuntimeDetection;
  }

  if (hasStackbitBridge(globalScope) || hasStackbitBridge((window as typeof window & { parent?: unknown }).parent)) {
    cachedRuntimeDetection = true;
    return cachedRuntimeDetection;
  }

  const { search, hash } = window.location;
  if (VISUAL_EDITOR_QUERY_PATTERN.test(search) || VISUAL_EDITOR_QUERY_PATTERN.test(hash)) {
    cachedRuntimeDetection = true;
    return cachedRuntimeDetection;
  }

  cachedRuntimeDetection = false;
  return cachedRuntimeDetection;
};

const ensureTrailingSlash = (prefix: string): string => (prefix.endsWith('/') ? prefix : `${prefix}/`);

const EDITOR_MIRROR_PREFIXES = [
  '/.netlify/visual-editor/content/',
  '/visual-editor/content/',
  '/site/content/',
];

const PUBLIC_MIRROR_PREFIXES = [
  '/visual-editor/content/',
  '/site/content/',
];

export const getVisualEditorMirrorPrefixes = (): string[] => {
  const prefixes = isVisualEditorRuntime() ? EDITOR_MIRROR_PREFIXES : PUBLIC_MIRROR_PREFIXES;
  const normalized = prefixes.map(ensureTrailingSlash);
  return Array.from(new Set(normalized));
};
