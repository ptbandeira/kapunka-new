
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as ReactJsxRuntime from 'react/jsx-runtime';
import * as ReactJsxDevRuntime from 'react/jsx-dev-runtime';
import App from './App';
import { AppProvider } from './contexts/AppContext';
import { ensureVisualEditorAnnotations } from './utils/visualEditorAnnotations';
import { getStackbitAttributes, prepareStackbitMetadata } from './utils/stackbitBindings';
import { isVisualEditorRuntime } from './utils/visualEditorRuntime';

type ReactWithPatchedCreateElement = typeof React & {
  __sbCreateElementPatched?: boolean;
};

const reactNamespace = React as ReactWithPatchedCreateElement;

type VisualEditorProps = {
  'data-nlv-field-path'?: unknown;
  'data-sb-field-path'?: unknown;
  'data-sb-object-id'?: unknown;
};

const applyVisualEditorAnnotationsToProps = <T extends VisualEditorProps | null | undefined>(
  props: T,
): T => {
  if (!props || typeof props !== 'object') {
    return props;
  }

  const fieldPath = props['data-nlv-field-path'];
  if (typeof fieldPath !== 'string' || fieldPath.trim().length === 0) {
    return props;
  }

  const annotations = getStackbitAttributes(fieldPath);
  if (!annotations['data-sb-field-path'] && !annotations['data-sb-object-id']) {
    return props;
  }

  const existingFieldPath = props['data-sb-field-path'];
  const existingObjectId = props['data-sb-object-id'];

  if (existingFieldPath && existingObjectId) {
    return props;
  }

  const nextProps: Record<string, unknown> = { ...(props as Record<string, unknown>) };

  if (!existingFieldPath && annotations['data-sb-field-path']) {
    nextProps['data-sb-field-path'] = annotations['data-sb-field-path'];
  }

  if (!existingObjectId && annotations['data-sb-object-id']) {
    nextProps['data-sb-object-id'] = annotations['data-sb-object-id'];
  }

  return nextProps as T;
};

type JsxRuntimeModule =
  | (typeof ReactJsxRuntime & { __sbPatched?: boolean })
  | (typeof ReactJsxDevRuntime & { __sbPatched?: boolean });

const patchJsxRuntime = (runtime: JsxRuntimeModule): void => {
  if (!runtime || runtime.__sbPatched) {
    return;
  }

  const originalJsx = (runtime as typeof ReactJsxRuntime).jsx;
  if (typeof originalJsx === 'function') {
    (runtime as typeof ReactJsxRuntime).jsx = ((type, props, key) =>
      originalJsx(type, applyVisualEditorAnnotationsToProps(props), key)) as typeof originalJsx;
  }

  const originalJsxs = (runtime as typeof ReactJsxRuntime).jsxs;
  if (typeof originalJsxs === 'function') {
    (runtime as typeof ReactJsxRuntime).jsxs = ((type, props, key) =>
      originalJsxs(type, applyVisualEditorAnnotationsToProps(props), key)) as typeof originalJsxs;
  }

  const originalJsxDEV = (runtime as typeof ReactJsxDevRuntime).jsxDEV;
  if (typeof originalJsxDEV === 'function') {
    (runtime as typeof ReactJsxDevRuntime).jsxDEV = ((type, props, key, isStaticChildren, source, self) =>
      originalJsxDEV(type, applyVisualEditorAnnotationsToProps(props), key, isStaticChildren, source, self)) as typeof originalJsxDEV;
  }

  runtime.__sbPatched = true;
};

const visualEditorEnabled = isVisualEditorRuntime();

if (visualEditorEnabled && !reactNamespace.__sbCreateElementPatched) {
  const originalCreateElement = React.createElement;

  const patchedCreateElement: typeof React.createElement = (type, props, ...children) => {
    const nextProps = applyVisualEditorAnnotationsToProps(props as VisualEditorProps | null | undefined);
    return originalCreateElement(type, nextProps, ...children);
  };

  (React as unknown as { createElement: typeof React.createElement }).createElement = patchedCreateElement;
  reactNamespace.__sbCreateElementPatched = true;
}

if (visualEditorEnabled) {
  patchJsxRuntime(ReactJsxRuntime as JsxRuntimeModule);
  patchJsxRuntime(ReactJsxDevRuntime as JsxRuntimeModule);
  prepareStackbitMetadata();
  ensureVisualEditorAnnotations();
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
