import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { SiteSettings } from '../types';
import defaultSettings from '@/content/site.json';
import { fetchVisualEditorJson } from '../utils/fetchVisualEditorJson';
import { useVisualEditorSync } from './VisualEditorSyncContext';

type SiteSettingsContextValue = {
  settings: SiteSettings;
  isLoading: boolean;
};

const SiteSettingsContext = createContext<SiteSettingsContextValue | undefined>(undefined);

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings as SiteSettings);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { contentVersion } = useVisualEditorSync();

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const data = await fetchVisualEditorJson<SiteSettings>('/content/site.json');
        if (!isMounted) {
          return;
        }
        setSettings(data);
      } catch (error) {
        console.error('Failed to load site settings', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSettings().catch((error) => {
      console.error('Unhandled error while loading site settings', error);
    });

    return () => {
      isMounted = false;
    };
  }, [contentVersion]);

  const value = useMemo(() => ({ settings, isLoading }), [settings, isLoading]);

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
};

export const useSiteSettings = (): SiteSettingsContextValue => {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
};
