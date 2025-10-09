type RawEnv = {
  ENABLE_LOGGER?: string;
  PROD?: boolean;
};

const readEnv = (): RawEnv => {
  try {
    return ((import.meta as unknown as { env?: RawEnv }).env) ?? {};
  } catch (error) {
    return {};
  }
};

interface LogPayload {
  message: string;
  stack: string | null;
  url: string;
  userAgent: string;
  timestamp: string;
}

const { ENABLE_LOGGER: enableLoggerFlag, PROD: isProdEnv } = readEnv();

const shouldLog = isProdEnv === true && enableLoggerFlag === 'true';

const endpoint = '/.netlify/functions/log-error';

const sendPayload = (payload: LogPayload): void => {
  if (!shouldLog || typeof navigator === 'undefined') {
    return;
  }

  try {
    const body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      const queued = navigator.sendBeacon(endpoint, blob);
      if (queued) {
        return;
      }
    }

    void fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body
    });
  } catch (error) {
    // Swallow logging failures to avoid cascading errors
  }
};

const buildPayload = (message: string, stack: string | null): LogPayload => ({
  message,
  stack,
  url: window.location.href,
  userAgent: navigator.userAgent,
  timestamp: new Date().toISOString()
});

let isInitialized = false;

const initialize = (): void => {
  if (isInitialized || !shouldLog || typeof window === 'undefined') {
    return;
  }

  isInitialized = true;

  const previousOnError = window.onerror;
  const previousOnUnhandledRejection = window.onunhandledrejection;

  window.onerror = function (...args) {
    if (typeof previousOnError === 'function') {
      previousOnError.apply(this, args);
    }

    const [message, , , , error] = args;
    const stack = error instanceof Error ? error.stack ?? null : null;
    const normalizedMessage = typeof message === 'string' ? message : 'Unknown error';
    sendPayload(buildPayload(normalizedMessage, stack));
    return false;
  };

  window.onunhandledrejection = function (event) {
    if (typeof previousOnUnhandledRejection === 'function') {
      previousOnUnhandledRejection.call(this, event);
    }

    const reason = event.reason;
    if (reason instanceof Error) {
      sendPayload(buildPayload(reason.message, reason.stack ?? null));
      return;
    }

    const message = typeof reason === 'string' ? reason : 'Unhandled rejection';
    sendPayload(buildPayload(message, null));
  };
};

export const initializeLogger = initialize;
