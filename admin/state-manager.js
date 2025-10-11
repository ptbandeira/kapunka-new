import { CMS_STORAGE_KEYS, EDIT_MODES, SUPPORTED_LOCALES, DEFAULT_LOCALE } from './config-modules.js';
import { getLocaleFromPath } from './utils.js';

class StateManager {
  constructor() {
    this.state = {
      localeMode: this.loadStoredLocaleMode(),
      editMode: this.loadStoredEditMode(),
      latestEntryLocale: null,
      refreshScheduled: false,
      pendingLocaleApply: false,
      pendingEditApply: false,
    };

    this.subscribers = new Set();
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  notify() {
    this.subscribers.forEach(callback => callback(this.state));
  }

  loadStoredLocaleMode() {
    try {
      const stored = window.localStorage.getItem(CMS_STORAGE_KEYS.LOCALE_MODE);
      if (stored && (stored === 'all' || SUPPORTED_LOCALES.includes(stored))) {
        return stored;
      }
    } catch (error) {
      console.warn('Unable to read locale mode from storage', error);
    }
    return 'all';
  }

  persistLocaleMode(mode) {
    try {
      window.localStorage.setItem(CMS_STORAGE_KEYS.LOCALE_MODE, mode);
    } catch (error) {
      console.warn('Unable to persist locale mode', error);
    }
  }

  loadStoredEditMode() {
    try {
      const stored = window.localStorage.getItem(CMS_STORAGE_KEYS.EDIT_MODE);
      if (stored && Object.values(EDIT_MODES).includes(stored)) {
        return stored;
      }
    } catch (error) {
      console.warn('Unable to read edit mode from storage', error);
    }
    return EDIT_MODES.BEGINNER;
  }

  persistEditMode(mode) {
    try {
      window.localStorage.setItem(CMS_STORAGE_KEYS.EDIT_MODE, mode);
    } catch (error) {
      console.warn('Unable to persist edit mode', error);
    }
  }

  setLocaleMode(mode) {
    if (mode !== 'all' && !SUPPORTED_LOCALES.includes(mode)) {
      return;
    }

    if (this.state.localeMode === mode) {
      return;
    }

    this.state.localeMode = mode;
    this.persistLocaleMode(mode);
    this.scheduleLocaleApply();
    this.scheduleRefresh();
  }

  setEditMode(mode) {
    if (!Object.values(EDIT_MODES).includes(mode) || this.state.editMode === mode) {
      return;
    }

    this.state.editMode = mode;
    this.persistEditMode(mode);
    this.scheduleEditApply();
    this.scheduleRefresh();
  }

  noteEntryLocale(entry) {
    if (!entry || typeof entry.get !== 'function') {
      return;
    }

    const path = entry.get('path');
    const localeFromPath = getLocaleFromPath(path);
    if (localeFromPath) {
      this.state.latestEntryLocale = localeFromPath;
      this.notify();
    }
  }

  scheduleRefresh() {
    if (this.state.refreshScheduled) {
      return;
    }

    this.state.refreshScheduled = true;
    window.requestAnimationFrame(() => {
      this.state.refreshScheduled = false;
      this.notify();
    });
  }

  scheduleLocaleApply() {
    if (this.state.pendingLocaleApply) {
      return;
    }

    this.state.pendingLocaleApply = true;
    window.requestAnimationFrame(() => {
      this.state.pendingLocaleApply = false;
      this.applyLocaleMode();
    });
  }

  scheduleEditApply() {
    if (this.state.pendingEditApply) {
      return;
    }

    this.state.pendingEditApply = true;
    window.requestAnimationFrame(() => {
      this.state.pendingEditApply = false;
      this.applyEditMode();
    });
  }

  applyLocaleMode() {
    const mode = this.state.localeMode;
    const tablists = document.querySelectorAll('[role="tablist"]');

    tablists.forEach((tablist) => {
      const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
      const localeTabs = tabs
        .map((tab) => ({ tab, locale: this.getLocaleFromTabElement(tab) }))
        .filter((item) => Boolean(item.locale));

      if (!localeTabs.length) {
        return;
      }

      localeTabs.forEach(({ tab, locale }) => {
        const panelId = tab.getAttribute('aria-controls');
        const panel = panelId ? document.getElementById(panelId) : null;

        if (mode !== 'all' && locale !== mode) {
          tab.style.display = 'none';
          if (panel) {
            panel.style.display = 'none';
          }
        } else {
          tab.style.display = '';
          if (panel) {
            panel.style.display = '';
          }
        }
      });

      if (mode !== 'all') {
        const currentTab = localeTabs.find(({ tab }) => tab.getAttribute('aria-selected') === 'true' && tab.style.display !== 'none');
        if (!currentTab) {
          const fallback = localeTabs.find(({ locale }) => locale === mode) || localeTabs[0];
          if (fallback) {
            fallback.tab.click();
          }
        }
      }
    });
  }

  applyEditMode() {
    const mode = this.state.editMode;
    document.body.classList.toggle('cms-mode-advanced', mode === EDIT_MODES.ADVANCED);
    document.body.classList.toggle('cms-mode-beginner', mode === EDIT_MODES.BEGINNER);

    document.querySelectorAll('[data-edit-mode]').forEach((button) => {
      const buttonMode = button.dataset.editMode;
      const isActive = buttonMode === mode;
      button.style.background = isActive ? '#1f2933' : '#ffffff';
      button.style.color = isActive ? '#f0f4f8' : '#1f2933';
      button.style.cursor = isActive ? 'default' : 'pointer';
    });
  }

  getLocaleFromTabElement(tab) {
    if (!tab || !tab.textContent) {
      return null;
    }

    const label = tab.textContent.trim().toLowerCase();
    return SUPPORTED_LOCALES.find((locale) => {
      const full = (LOCALE_LABELS[locale] || '').toLowerCase();
      const shortLabel = (LOCALE_SHORT_LABELS[locale] || '').toLowerCase();
      return label.includes(full) || label === shortLabel;
    }) || null;
  }

  getActivePreviewLocale() {
    const info = parseHashInfo();
    if (info && info.locale && isSupportedLocale(info.locale)) {
      return info.locale;
    }

    if (isSupportedLocale(this.state.latestEntryLocale)) {
      return this.state.latestEntryLocale;
    }

    return DEFAULT_LOCALE;
  }
}

export const stateManager = new StateManager();
