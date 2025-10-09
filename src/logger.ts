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
  route: string;
  referrer: string;
  buildId: string;
}

const LOG_ENDPOINT = '/.netlify/functions/log-error';

const readEnv = (): RawEnv => {
  try {
    return ((import.meta as unknown as { env?: RawEnv }).env) ?? {};
  } catch (error) {
    return {};
  }
};

const DEDUPE_WINDOW_MS = 5000;

const dedupeCache: Map<string, number> = new Map();

const cleanupDedupeCache = (now: number): void => {
  try {
    dedupeCache.forEach((timestamp, key) => {
      if (now - timestamp > DEDUPE_WINDOW_MS) {
        dedupeCache.delete(key);
      }
    });
  } catch (error) {
    // Ignore cleanup failures
  }
};

const isDuplicatePayload = (payload: LogPayload): boolean => {
  try {
    const key = `${payload.message}::${payload.route}`;
    const now = Date.now();
    cleanupDedupeCache(now);
    const lastSeen = dedupeCache.get(key);
    if (typeof lastSeen === 'number' && now - lastSeen < DEDUPE_WINDOW_MS) {
      return true;
    }
    dedupeCache.set(key, now);
  } catch (error) {
    // Ignore dedupe failures to avoid blocking logging
  }
  return false;
};

const shouldDropPayload = (payload: LogPayload): boolean => {
  try {
    if (typeof window !== 'undefined') {
      try {
        if (window.location?.protocol === 'chrome-extension:') {
          return true;
        }
      } catch (error) {
        // Ignore window access errors
      }
    }

    const checks = [payload.message, payload.stack ?? ''];
    for (const value of checks) {
      if (typeof value === 'string' && value.length > 0) {
        const lowerValue = value.toLowerCase();
        if (lowerValue.includes('chrome-extension://') || lowerValue.includes('lastpass')) {
          return true;
        }
      }
    }
  } catch (error) {
    // Ignore filtering failures
  }

  return false;
};

const getUrl = (): string => {
  try {
    if (typeof window !== 'undefined' && typeof window.location?.href === 'string') {
      return window.location.href;
    }
  } catch (error) {
    // Ignore URL resolution failures
  }
  return '';
};

const getRoute = (): string => {
  try {
    if (typeof window !== 'undefined' && window.location) {
      const { pathname = '', search = '' } = window.location;
      return `${pathname ?? ''}${search ?? ''}`;
    }
  } catch (error) {
    // Ignore route resolution failures
  }
  return '';
};

const getReferrer = (): string => {
  try {
    if (typeof document !== 'undefined' && typeof document.referrer === 'string') {
      return document.referrer;
    }
  } catch (error) {
    // Ignore referrer resolution failures
  }
  return '';
};

const getUserAgent = (): string => {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.userAgent === 'string') {
      return navigator.userAgent;
    }
  } catch (error) {
    // Ignore user agent resolution failures
  }
  return '';
};

const getBuildId = (): string => {
  try {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    const commitSha = metaEnv?.VITE_COMMIT_SHA;
    if (typeof commitSha === 'string' && commitSha) {
      return commitSha;
    }
  } catch (error) {
    // Ignore import.meta access failures
  }

  try {
    if (typeof process !== 'undefined') {
      const commitSha = (process as unknown as { env?: Record<string, string | undefined> }).env?.COMMIT_SHA;
      if (typeof commitSha === 'string' && commitSha) {
        return commitSha;
      }
    }
  } catch (error) {
    // Ignore process access failures
  }

  return '';
};

const buildPayload = (message: string, stack: string | null): LogPayload => ({
  message,
  stack,
  url: getUrl(),
  userAgent: getUserAgent(),
  timestamp: new Date().toISOString(),
  route: getRoute(),
  referrer: getReferrer(),
  buildId: getBuildId()
});

const sendPayload = (payload: LogPayload): void => {
  try {
    if (shouldDropPayload(payload) || isDuplicatePayload(payload)) {
      return;
    }

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
