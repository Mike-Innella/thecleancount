import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppData, CheckInState, ThemePreference, TimeDisplayPreference } from '../types/appTypes';
import { STORAGE_KEY } from './storageKeys';
import { DEFAULT_DAILY_REMINDER_HOUR, DEFAULT_DAILY_REMINDER_MINUTE } from '../notifications/dailyReminder';

const VALID_CHECK_IN_STATES: CheckInState[] = ['steady', 'worn', 'struggling'];
const VALID_TIME_DISPLAY_PREFERENCES: TimeDisplayPreference[] = ['days', 'weeks', 'hours', 'months'];
const VALID_THEME_PREFERENCES: ThemePreference[] = ['system', 'light', 'dark'];
const isValidReminderHour = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 23;
const isValidReminderMinute = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 59;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const isStringArray = (values: unknown[]): values is string[] => values.every((value) => typeof value === 'string');

const isAppData = (value: unknown): value is AppData => {
  if (!isRecord(value)) {
    return false;
  }

  if (typeof value.cleanStartISO !== 'string' || !Array.isArray(value.checkIns)) {
    return false;
  }

  if (typeof value.displayName !== 'undefined' && typeof value.displayName !== 'string') {
    return false;
  }

  if (!isRecord(value.settings)) {
    return false;
  }

  if (
    typeof value.settings.hardDayModeEnabled !== 'boolean' ||
    typeof value.settings.hardDayModeAutoSuggest !== 'boolean' ||
    (typeof value.settings.timeDisplayPreference !== 'undefined' &&
      (typeof value.settings.timeDisplayPreference !== 'string' ||
        !VALID_TIME_DISPLAY_PREFERENCES.includes(value.settings.timeDisplayPreference as TimeDisplayPreference))) ||
    (typeof value.settings.themePreference !== 'undefined' &&
      (typeof value.settings.themePreference !== 'string' ||
        !VALID_THEME_PREFERENCES.includes(value.settings.themePreference as ThemePreference))) ||
    (typeof value.settings.dailyReminderEnabled !== 'undefined' &&
      typeof value.settings.dailyReminderEnabled !== 'boolean') ||
    (typeof value.settings.dailyReminderHour !== 'undefined' && !isValidReminderHour(value.settings.dailyReminderHour)) ||
    (typeof value.settings.dailyReminderMinute !== 'undefined' &&
      !isValidReminderMinute(value.settings.dailyReminderMinute)) ||
    (typeof value.settings.lastHardDaySuggestAt !== 'undefined' && typeof value.settings.lastHardDaySuggestAt !== 'string')
  ) {
    return false;
  }

  const areCheckInsValid = value.checkIns.every((checkIn) => {
    if (!isRecord(checkIn)) {
      return false;
    }

    const validBase =
      typeof checkIn.dateISO === 'string' &&
      typeof checkIn.state === 'string' &&
      VALID_CHECK_IN_STATES.includes(checkIn.state as CheckInState);
    const validNote = typeof checkIn.note === 'undefined' || typeof checkIn.note === 'string';

    return validBase && validNote;
  });

  if (!areCheckInsValid) {
    return false;
  }

  if (typeof value.history === 'undefined') {
    return true;
  }

  if (!Array.isArray(value.history)) {
    return false;
  }

  return value.history.every((item) => {
    if (!isRecord(item)) {
      return false;
    }
    return isStringArray([item.archivedCleanStartISO, item.archivedAtISO]);
  });
};

export function getDefaultAppData(): AppData {
  return {
    cleanStartISO: new Date().toISOString(),
    checkIns: [],
    settings: {
      hardDayModeEnabled: false,
      hardDayModeAutoSuggest: true,
      timeDisplayPreference: 'days',
      themePreference: 'system',
      dailyReminderEnabled: false,
      dailyReminderHour: DEFAULT_DAILY_REMINDER_HOUR,
      dailyReminderMinute: DEFAULT_DAILY_REMINDER_MINUTE,
    },
    history: [],
  };
}

export async function loadAppData(): Promise<AppData | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isAppData(parsed)) {
      return null;
    }

    return {
      ...parsed,
      settings: {
        ...parsed.settings,
        timeDisplayPreference: parsed.settings.timeDisplayPreference ?? 'days',
        themePreference: parsed.settings.themePreference ?? 'system',
        dailyReminderEnabled: parsed.settings.dailyReminderEnabled ?? false,
        dailyReminderHour: parsed.settings.dailyReminderHour ?? DEFAULT_DAILY_REMINDER_HOUR,
        dailyReminderMinute: parsed.settings.dailyReminderMinute ?? DEFAULT_DAILY_REMINDER_MINUTE,
      },
    };
  } catch {
    return null;
  }
}

export async function saveAppData(data: AppData): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Keep failures silent to prevent UI crashes.
  }
}
