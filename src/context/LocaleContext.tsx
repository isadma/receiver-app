import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_LOCALE,
  translations,
  type Locale,
  type TranslationKey,
} from '../i18n/translations';
import { loadLocale, saveLocale } from '../storage';

type Vars = Record<string, string | number>;

type LocaleContextValue = {
  locale: Locale;
  ready: boolean;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: TranslationKey, vars?: Vars) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function interpolate(template: string, vars?: Vars): string {
  if (!vars) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (full, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : full,
  );
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadLocale()
      .then((next) => {
        if (!cancelled) {
          setLocaleState(next);
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

  const setLocale = useCallback(async (next: Locale) => {
    setLocaleState(next);
    await saveLocale(next);
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Vars) => {
      return interpolate(translations[locale][key], vars);
    },
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      ready,
      setLocale,
      t,
    }),
    [locale, ready, setLocale, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error('useLocale must be used inside LocaleProvider');
  }

  return context;
}
