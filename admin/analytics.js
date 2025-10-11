import { getEntrySlug } from './utils.js';

export class CmsAnalytics {
  constructor() {
    this.ANALYTICS_ENDPOINT = '/.netlify/functions/cms-analytics';
    this.isEnabled = typeof window !== 'undefined' && window.CMS_ANALYTICS_ENABLED === true;
  }

  track(eventType, data = {}) {
    if (!this.isEnabled) {
      return;
    }

    this.sendEvent({
      eventType,
      data,
      source: 'decap-admin',
      timestamp: new Date().toISOString(),
    });
  }

  registerCmsListeners(CMSInstance) {
    if (!this.isEnabled || !CMSInstance) {
      return;
    }

    const analyticsEvents = [
      { name: 'preSave', event: 'entry:preSave' },
      { name: 'postSave', event: 'entry:postSave' },
      { name: 'preDelete', event: 'entry:preDelete' },
      { name: 'postDelete', event: 'entry:postDelete' },
      { name: 'postPublish', event: 'entry:postPublish' },
      { name: 'postUnpublish', event: 'entry:postUnpublish' },
    ];

    analyticsEvents.forEach(({ name, event }) => {
      try {
        CMSInstance.registerEventListener({
          name,
          handler: (payload = {}) => {
            const meta = this.extractEventMetadata(payload);
            this.track(event, meta);
          },
        });
      } catch (listenerError) {
        console.warn(`[cms-analytics] Failed to register ${name} listener`, listenerError);
      }
    });
  }

  attachWindowErrorHandlers() {
    if (!this.isEnabled || typeof window === 'undefined') {
      return;
    }

    window.addEventListener('error', (event) => {
      const error = event.error || event.message || event;
      this.track('cms:error', {
        type: 'window:error',
        message: error?.message || (typeof error === 'string' ? error : 'Unknown error'),
        stack: error?.stack,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      this.track('cms:error', {
        type: 'window:unhandledrejection',
        message: reason?.message || (typeof reason === 'string' ? reason : 'Unhandled rejection'),
        stack: reason?.stack,
        context: {},
      });
    });
  }

  sendEvent(payload) {
    try {
      const body = JSON.stringify(payload);

      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([body], { type: 'application/json' });
        const sent = navigator.sendBeacon(this.ANALYTICS_ENDPOINT, blob);
        if (sent) {
          return;
        }
      }

      if (typeof fetch === 'function') {
        void fetch(this.ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });
      }
    } catch (error) {
      console.warn('[cms-analytics] Failed to send analytics event', error);
    }
  }

  extractEntryMetadata(entry) {
    if (!entry) {
      return {};
    }

    const slug = getEntrySlug(entry);
    const path = typeof entry.get === 'function' ? entry.get('path') : entry.path;
    return { slug, path };
  }

  extractEventMetadata(event) {
    const collection = event?.collection || event?.collectionName || event?.data?.collectionName || event?.data?.collection;
    const entry = event?.entry || event?.data?.entry;
    const metadata = this.extractEntryMetadata(entry);
    return {
      collection: typeof collection === 'string' ? collection : collection?.get?.('name') || collection?.name || 'unknown',
      ...metadata,
    };
  }
}

export const cmsAnalytics = new CmsAnalytics();
