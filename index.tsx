
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './contexts/AppContext';
import { ensureVisualEditorAnnotations } from './utils/visualEditorAnnotations';
import { getStackbitAttributes } from './utils/stackbitBindings';

type ReactWithPatchedCreateElement = typeof React & {
  __sbCreateElementPatched?: boolean;
};

const reactNamespace = React as ReactWithPatchedCreateElement;

if (!reactNamespace.__sbCreateElementPatched) {
  const originalCreateElement = React.createElement;

  const patchedCreateElement: typeof React.createElement = (type, props, ...children) => {
    if (props && typeof props === 'object') {
      const fieldPath = (props as Record<string, unknown>)['data-nlv-field-path'];
      if (typeof fieldPath === 'string' && fieldPath.trim().length > 0) {
        const annotations = getStackbitAttributes(fieldPath);
        if (annotations['data-sb-field-path'] || annotations['data-sb-object-id']) {
          const existingFieldPath = (props as Record<string, unknown>)['data-sb-field-path'];
          const existingObjectId = (props as Record<string, unknown>)['data-sb-object-id'];

          if (!existingFieldPath || !existingObjectId) {
            const nextProps: Record<string, unknown> = { ...props };

            if (!existingFieldPath && annotations['data-sb-field-path']) {
              nextProps['data-sb-field-path'] = annotations['data-sb-field-path'];
            }

            if (!existingObjectId && annotations['data-sb-object-id']) {
              nextProps['data-sb-object-id'] = annotations['data-sb-object-id'];
            }

            return originalCreateElement(type, nextProps, ...children);
          }
        }
      }
    }

    return originalCreateElement(type, props, ...children);
  };

  (React as unknown as { createElement: typeof React.createElement }).createElement = patchedCreateElement;
  reactNamespace.__sbCreateElementPatched = true;
}

ensureVisualEditorAnnotations();

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
