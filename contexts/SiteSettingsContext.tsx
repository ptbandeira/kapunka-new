import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { SiteSettings } from '../types';
import defaultSettings from '@/content/site.json';

type SiteSettingsContextValue = {
  settings: SiteSettings;
  isLoading: boolean;
};

const SiteSettingsContext = createContext<SiteSettingsContextValue | undefined>(undefined);

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings as SiteSettings);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('/content/site.json')
      .then((res) => res.json())
      .then((data: SiteSettings) => {
        setSettings(data);
      })
      .catch((error) => {
        console.error('Failed to load site settings', error);
      })
      .finally(() => setIsLoading(false));
  }, []);

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
