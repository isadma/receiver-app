import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_LOCALE, type Locale } from './i18n/translations';

export const DEFAULT_API_URL = 'https://receiver.meredow.com/api';
const LEGACY_LOCAL_API_URL = 'http://127.0.0.1:8000/api';
const API_URL_KEY = 'receiver.apiBaseUrl';
const SHOP_KEY = 'receiver.selectedShop';
const LOCALE_KEY = 'receiver.locale';
const ALLOW_SAME_LOT_KEY = 'receiver.allowSameLotScan';
const LAST_BOX_KEY = 'receiver.lastBoxByShop';

export function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

export async function loadApiBaseUrl(): Promise<string> {
  const stored = await AsyncStorage.getItem(API_URL_KEY);
  if (!stored) {
    return DEFAULT_API_URL;
  }

  const normalized = normalizeBaseUrl(stored);
  if (!normalized || normalized === LEGACY_LOCAL_API_URL) {
    return DEFAULT_API_URL;
  }

  return normalized;
}

export async function saveApiBaseUrl(value: string): Promise<string> {
  const next = normalizeBaseUrl(value) || DEFAULT_API_URL;
  await AsyncStorage.setItem(API_URL_KEY, next);
  return next;
}

export async function loadSelectedShop(): Promise<string | null> {
  return AsyncStorage.getItem(SHOP_KEY);
}

export async function saveSelectedShop(slug: string): Promise<void> {
  await AsyncStorage.setItem(SHOP_KEY, slug);
}

export async function loadLocale(): Promise<Locale> {
  const stored = await AsyncStorage.getItem(LOCALE_KEY);
  if (stored === 'en' || stored === 'ru') {
    return stored;
  }

  return DEFAULT_LOCALE;
}

export async function saveLocale(locale: Locale): Promise<void> {
  await AsyncStorage.setItem(LOCALE_KEY, locale);
}

export async function loadAllowSameLotScan(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(ALLOW_SAME_LOT_KEY);
  return stored === '1';
}

export async function saveAllowSameLotScan(value: boolean): Promise<void> {
  await AsyncStorage.setItem(ALLOW_SAME_LOT_KEY, value ? '1' : '0');
}

export async function loadLastBoxes(): Promise<Record<string, string>> {
  const stored = await AsyncStorage.getItem(LAST_BOX_KEY);
  if (!stored) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    );
  } catch {
    return {};
  }
}

export async function saveLastBox(shopSlug: string, box: string): Promise<void> {
  const current = await loadLastBoxes();
  current[shopSlug] = box;
  await AsyncStorage.setItem(LAST_BOX_KEY, JSON.stringify(current));
}

export async function clearLastBox(shopSlug: string): Promise<void> {
  const current = await loadLastBoxes();
  delete current[shopSlug];
  await AsyncStorage.setItem(LAST_BOX_KEY, JSON.stringify(current));
}
