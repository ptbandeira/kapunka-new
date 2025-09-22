
import React from 'react';
import { CartProvider } from './CartContext';
import { LanguageProvider } from './LanguageContext';
import { UIProvider } from './UIContext';
import { SiteSettingsProvider } from './SiteSettingsContext';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SiteSettingsProvider>
      <LanguageProvider>
        <CartProvider>
          <UIProvider>{children}</UIProvider>
        </CartProvider>
      </LanguageProvider>
    </SiteSettingsProvider>
  );
};
