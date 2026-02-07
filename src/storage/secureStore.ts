import * as SecureStore from 'expo-secure-store';

import { AppState } from '../types';

export const STORE_KEY = 'clean_count_state_v1';
let secureStoreAvailable: boolean | null = null;

const isAppState = (value: unknown): value is AppState => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<AppState>;

  const hasRequiredStrings =
    typeof candidate.cleanStartISO === 'string' &&
    typeof candidate.createdAtISO === 'string' &&
    typeof candidate.updatedAtISO === 'string';

  const hasOptionalName =
    typeof candidate.displayName === 'undefined' || typeof candidate.displayName === 'string';
  const hasOptionalReminderFlag =
    typeof candidate.dailyReminderEnabled === 'undefined' || typeof candidate.dailyReminderEnabled === 'boolean';
  const hasOptionalReminderHour =
    typeof candidate.dailyReminderHour === 'undefined' ||
    (Number.isInteger(candidate.dailyReminderHour) &&
      candidate.dailyReminderHour >= 0 &&
      candidate.dailyReminderHour <= 23);
  const hasOptionalReminderMinute =
    typeof candidate.dailyReminderMinute === 'undefined' ||
    (Number.isInteger(candidate.dailyReminderMinute) &&
      candidate.dailyReminderMinute >= 0 &&
      candidate.dailyReminderMinute <= 59);

  return hasRequiredStrings && hasOptionalName && hasOptionalReminderFlag && hasOptionalReminderHour && hasOptionalReminderMinute;
};

async function canUseSecureStore(): Promise<boolean> {
  if (secureStoreAvailable !== null) {
    return secureStoreAvailable;
  }

  try {
    secureStoreAvailable = await SecureStore.isAvailableAsync();
    return secureStoreAvailable;
  } catch {
    secureStoreAvailable = false;
    return false;
  }
}

export async function loadState(): Promise<AppState | null> {
  if (!(await canUseSecureStore())) {
    return null;
  }

  let raw: string | null = null;
  try {
    raw = await SecureStore.getItemAsync(STORE_KEY);
  } catch {
    return null;
  }

  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isAppState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveState(state: AppState): Promise<void> {
  if (!(await canUseSecureStore())) {
    return;
  }

  try {
    await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(state));
  } catch {
    // Web preview can run without a native secure storage implementation.
  }
}

export async function clearState(): Promise<void> {
  if (!(await canUseSecureStore())) {
    return;
  }

  try {
    await SecureStore.deleteItemAsync(STORE_KEY);
  } catch {
    // Ignore unsupported-platform errors in preview contexts.
  }
}
