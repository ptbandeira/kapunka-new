type RawEnv = {
  ENABLE_LOGGER?: string;
  PROD?: boolean;
};

interface LogPayload {
  message: string;
  stack: string | null;
  url: string;
  userAgent: string;
  timestamp: string;
}

const LOG_ENDPOINT = '/.netlify/functions/log-error';

const readEnv = (): RawEnv => {
  try {
    return ((import.meta as unknown as { env?: RawEnv }).env) ?? {};
  } catch (error) {
    return {};
  }
};

const sendPayload = (payload: LogPayload): void => {
  try {
    if (typeof navigator === 'undefined') {
      return;
    }

    const body = JSON.stringify(payload);

    if (typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      const sent = navigator.sendBeacon(LOG_ENDPOINT, blob);
      if (sent) {
        return;
      }
    }

    if (typeof fetch === 'function') {
      void fetch(LOG_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body
      });
    }
  } catch (error) {
    // Intentionally swallow logging errors
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

export const initLogger = (): void => {
  if (isInitialized) {
    return;
  }

  try {
    const env = readEnv();
    const isProd = env.PROD === true;
    const isEnabled = env.ENABLE_LOGGER === 'true';

    if (!isProd || !isEnabled || typeof window === 'undefined') {
      return;
    }

    isInitialized = true;

    const previousOnError = window.onerror;
    const previousOnUnhandledRejection = window.onunhandledrejection;

    window.onerror = function (
      message: string | Event,
      source?: string,
      lineno?: number,
      colno?: number,
      error?: Error
    ): boolean {
      if (typeof previousOnError === 'function') {
        try {
          previousOnError.call(this, message, source, lineno, colno, error);
        } catch (handlerError) {
          // Ignore previous handler failures
        }
      }

      try {
        const normalizedMessage =
          typeof message === 'string'
            ? message
            : error instanceof Error
              ? error.message
              : 'Unknown error';
        const stack = error instanceof Error ? error.stack ?? null : null;
        sendPayload(buildPayload(normalizedMessage, stack));
      } catch (handlerError) {
        // Swallow logger errors to avoid cascading failures
      }

      return false;
    };

    window.onunhandledrejection = function (event: PromiseRejectionEvent): void {
      if (typeof previousOnUnhandledRejection === 'function') {
        try {
          previousOnUnhandledRejection.call(this, event);
        } catch (handlerError) {
          // Ignore previous handler failures
        }
      }

      try {
        const reason = event?.reason;
        if (reason instanceof Error) {
          sendPayload(buildPayload(reason.message, reason.stack ?? null));
          return;
        }

        const message = typeof reason === 'string' ? reason : 'Unhandled rejection';
        sendPayload(buildPayload(message, null));
      } catch (handlerError) {
        // Swallow logger errors to avoid cascading failures
      }
    };
  } catch (error) {
    // Swallow initialization errors to avoid impacting the app
  }
};
