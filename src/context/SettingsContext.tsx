import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { loadAllowSameLotScan, saveAllowSameLotScan } from '../storage';

type SettingsContextValue = {
  allowSameLotScan: boolean;
  ready: boolean;
  setAllowSameLotScan: (value: boolean) => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [allowSameLotScan, setAllowSameLotScanState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadAllowSameLotScan()
      .then((value) => {
        if (!cancelled) {
          setAllowSameLotScanState(value);
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

  const setAllowSameLotScan = useCallback(async (value: boolean) => {
    setAllowSameLotScanState(value);
    await saveAllowSameLotScan(value);
  }, []);

  const value = useMemo(
    () => ({
      allowSameLotScan,
      ready,
      setAllowSameLotScan,
    }),
    [allowSameLotScan, ready, setAllowSameLotScan],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('useSettings must be used inside SettingsProvider');
  }

  return context;
}
