import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface VisualEditorSyncContextValue {
  contentVersion: number;
}

const VisualEditorSyncContext = createContext<VisualEditorSyncContextValue | undefined>(undefined);

const STACKBIT_EVENT_NAME = 'stackbitObjectsChanged';

export const VisualEditorSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [contentVersion, setContentVersion] = useState<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStackbitObjectsChanged: EventListener = () => {
      setContentVersion((previous) => previous + 1);
    };

    window.addEventListener(STACKBIT_EVENT_NAME, handleStackbitObjectsChanged);

    return () => {
      window.removeEventListener(STACKBIT_EVENT_NAME, handleStackbitObjectsChanged);
    };
  }, []);

  const value = useMemo<VisualEditorSyncContextValue>(() => ({ contentVersion }), [contentVersion]);

  return <VisualEditorSyncContext.Provider value={value}>{children}</VisualEditorSyncContext.Provider>;
};

export const useVisualEditorSync = (): VisualEditorSyncContextValue => {
  const context = useContext(VisualEditorSyncContext);

  if (!context) {
    throw new Error('useVisualEditorSync must be used within a VisualEditorSyncProvider');
  }

  return context;
};
