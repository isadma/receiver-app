import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_API_URL, loadApiBaseUrl, saveApiBaseUrl } from '../storage';

type ApiContextValue = {
  baseUrl: string;
  ready: boolean;
  setBaseUrl: (value: string) => Promise<void>;
};

const ApiContext = createContext<ApiContextValue | null>(null);

export function ApiProvider({ children }: { children: ReactNode }) {
  const [baseUrl, setBaseUrlState] = useState(DEFAULT_API_URL);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadApiBaseUrl()
      .then((url) => {
        if (!cancelled) {
          setBaseUrlState(url);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setBaseUrl = useCallback(async (value: string) => {
    const next = await saveApiBaseUrl(value);
    setBaseUrlState(next);
  }, []);

  const value = useMemo(
    () => ({
      baseUrl,
      ready,
      setBaseUrl,
    }),
    [baseUrl, ready, setBaseUrl],
  );

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

export function useApi(): ApiContextValue {
  const context = useContext(ApiContext);

  if (!context) {
    throw new Error('useApi must be used inside ApiProvider');
  }

  return context;
}
