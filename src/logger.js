const ENDPOINT = '/.netlify/functions/log-error';

const isEnabled = (() => {
  try {
    return (
      typeof process !== 'undefined' &&
      process != null &&
      typeof process === 'object' &&
      process.env != null &&
      process.env.ENABLE_LOGGER === 'true'
    );
  } catch (error) {
    return false;
  }
})();

let initialized = false;

function send(payload) {
  try {
    if (!payload || typeof payload !== 'object') {
      return;
    }

    const body = JSON.stringify(payload);
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(ENDPOINT, blob);
      return;
    }

    if (typeof fetch === 'function') {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true
      }).catch(() => {
        // Swallow network errors to avoid cascading failures.
      });
    }
  } catch (error) {
    // Never throw while logging.
  }
}

function buildPayloadFromError(error, fallbackMessage) {
  const message = (() => {
    if (typeof fallbackMessage === 'string' && fallbackMessage.length > 0) {
      return fallbackMessage;
    }
    if (error && typeof error.message === 'string' && error.message.length > 0) {
      return error.message;
    }
    if (error && typeof error === 'string' && error.length > 0) {
      return error;
    }
    return 'Unknown error';
  })();

  const stack = (() => {
    if (error && typeof error.stack === 'string' && error.stack.length > 0) {
      return error.stack;
    }
    if (error && typeof error === 'string') {
      return error;
    }
    return undefined;
  })();

  return {
    message,
    stack,
    url: typeof location !== 'undefined' ? location.href : 'unknown',
    userAgent: typeof navigator !== 'undefined' && navigator.userAgent ? navigator.userAgent : 'unknown',
    timestamp: new Date().toISOString()
  };
}

function handleWindowError(message, source, lineno, colno, error) {
  try {
    const payload = buildPayloadFromError(error, message);
    send(payload);
  } catch (logError) {
    // Suppress all logging errors.
  }

  return false;
}

function handleUnhandledRejection(event) {
  try {
    const reason = event && 'reason' in event ? event.reason : undefined;
    const payload = buildPayloadFromError(reason, 'Unhandled promise rejection');
    send(payload);
  } catch (logError) {
    // Suppress all logging errors.
  }
}

export function init() {
  if (initialized || typeof window === 'undefined' || !isEnabled) {
    return;
  }

  initialized = true;

  const previousOnError = window.onerror;
  window.onerror = function onError(message, source, lineno, colno, error) {
    handleWindowError(message, source, lineno, colno, error);

    if (typeof previousOnError === 'function') {
      return previousOnError.apply(this, arguments);
    }

    return false;
  };

  const previousOnUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = function onUnhandledRejection(event) {
    handleUnhandledRejection(event);

    if (typeof previousOnUnhandledRejection === 'function') {
      return previousOnUnhandledRejection.apply(this, arguments);
    }

    return true;
  };
}
