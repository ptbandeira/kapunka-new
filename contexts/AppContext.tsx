
import React from 'react';
import { CartProvider } from './CartContext';
import { LanguageProvider } from './LanguageContext';
import { UIProvider } from './UIContext';
import { SiteSettingsProvider } from './SiteSettingsContext';
import { VisualEditorSyncProvider } from './VisualEditorSyncContext';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <VisualEditorSyncProvider>
      <SiteSettingsProvider>
        <LanguageProvider>
          <CartProvider>
            <UIProvider>{children}</UIProvider>
          </CartProvider>
        </LanguageProvider>
      </SiteSettingsProvider>
    </VisualEditorSyncProvider>
  );
};
