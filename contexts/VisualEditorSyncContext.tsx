import React, { createContext, useContext, useMemo } from 'react';

interface VisualEditorSyncContextValue {
  contentVersion: number;
}

const VisualEditorSyncContext = createContext<VisualEditorSyncContextValue | undefined>(undefined);

export const VisualEditorSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useMemo<VisualEditorSyncContextValue>(() => ({ contentVersion: 0 }), []);

  return <VisualEditorSyncContext.Provider value={value}>{children}</VisualEditorSyncContext.Provider>;
};

export const useVisualEditorSync = (): VisualEditorSyncContextValue => {
  const context = useContext(VisualEditorSyncContext);

  if (!context) {
    throw new Error('useVisualEditorSync must be used within a VisualEditorSyncProvider');
  }

  return context;
};
