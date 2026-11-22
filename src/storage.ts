import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEFAULT_API_URL = 'http://127.0.0.1:8000/api';
const API_URL_KEY = 'receiver.apiBaseUrl';
const SHOP_KEY = 'receiver.selectedShop';

export function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

export async function loadApiBaseUrl(): Promise<string> {
  const stored = await AsyncStorage.getItem(API_URL_KEY);
  if (!stored) {
    return DEFAULT_API_URL;
  }

  return normalizeBaseUrl(stored) || DEFAULT_API_URL;
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
