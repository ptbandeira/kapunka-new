import { getStackbitBinding } from './stackbitBindings';

const annotateElement = (element: Element): void => {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  const fieldPath = element.getAttribute('data-nlv-field-path');
  if (!fieldPath) {
    return;
  }

  const binding = getStackbitBinding(fieldPath);
  if (!binding) {
    return;
  }

  const { objectId, fieldPath: sbFieldPath } = binding;

  if (sbFieldPath && element.getAttribute('data-sb-field-path') !== sbFieldPath) {
    element.setAttribute('data-sb-field-path', sbFieldPath);
  }

  if (objectId && element.getAttribute('data-sb-object-id') !== objectId) {
    element.setAttribute('data-sb-object-id', objectId);
  }
};

const processNode = (node: Node): void => {
  if (node instanceof HTMLElement) {
    if (node.hasAttribute('data-nlv-field-path')) {
      annotateElement(node);
    }

    const descendants = node.querySelectorAll('[data-nlv-field-path]');
    descendants.forEach((descendant) => {
      annotateElement(descendant);
    });
  }
};

let disconnectObserver: (() => void) | undefined;
let isInitialized = false;

const connectObserver = (): void => {
  if (isInitialized || typeof document === 'undefined') {
    return;
  }

  const { body } = document;
  if (!body) {
    return;
  }

  processNode(body);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => processNode(node));
      } else if (mutation.type === 'attributes' && mutation.target instanceof HTMLElement) {
        annotateElement(mutation.target);
      }
    }
  });

  observer.observe(body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-nlv-field-path'],
  });

  disconnectObserver = () => {
    observer.disconnect();
    isInitialized = false;
    disconnectObserver = undefined;
  };

  isInitialized = true;
};

export const ensureVisualEditorAnnotations = (): void => {
  if (typeof document === 'undefined' || isInitialized) {
    return;
  }

  const start = () => {
    connectObserver();
  };

  if (document.readyState === 'loading') {
    const handleReady = () => {
      document.removeEventListener('DOMContentLoaded', handleReady);
      start();
    };

    document.addEventListener('DOMContentLoaded', handleReady);
  } else {
    start();
  }
};

export const initializeVisualEditorAnnotations = (): (() => void) | undefined => {
  ensureVisualEditorAnnotations();
  return disconnectObserver;
};

