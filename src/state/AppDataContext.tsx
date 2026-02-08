import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { loadAppData, getDefaultAppData, saveAppData } from '../storage/storage';
import { AppData } from '../types/appTypes';

type AppDataContextValue = {
  appData: AppData;
  setAppData: (updater: (prev: AppData) => AppData) => void;
  persistAppData: () => Promise<void>;
  isReady: boolean;
};

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

type AppDataProviderProps = {
  children: ReactNode;
};

const AUTOSAVE_DEBOUNCE_MS = 300;

export function AppDataProvider({ children }: AppDataProviderProps) {
  const [appData, setAppDataState] = useState<AppData>(() => getDefaultAppData());
  const [isReady, setIsReady] = useState(false);
  const latestAppDataRef = useRef(appData);

  useEffect(() => {
    latestAppDataRef.current = appData;
  }, [appData]);

  useEffect(() => {
    let isMounted = true;

    const boot = async () => {
      const loaded = await loadAppData();
      const next = loaded ?? getDefaultAppData();

      if (!isMounted) {
        return;
      }

      latestAppDataRef.current = next;
      setAppDataState(next);
      setIsReady(true);

      if (!loaded) {
        await saveAppData(next);
      }
    };

    void boot();

    return () => {
      isMounted = false;
    };
  }, []);

  const setAppData = useCallback((updater: (prev: AppData) => AppData) => {
    setAppDataState((prev) => {
      const next = updater(prev);
      latestAppDataRef.current = next;
      return next;
    });
  }, []);

  const persistAppData = useCallback(async () => {
    await saveAppData(latestAppDataRef.current);
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void saveAppData(appData);
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [appData, isReady]);

  const value = useMemo(
    () => ({
      appData,
      setAppData,
      persistAppData,
      isReady,
    }),
    [appData, isReady, persistAppData, setAppData],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used inside AppDataProvider');
  }
  return context;
}
