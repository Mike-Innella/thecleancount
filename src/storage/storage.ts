import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppData, CheckInState, ThemePreference, TimeDisplayPreference } from '../types/appTypes';
import { STORAGE_KEY } from './storageKeys';
import { DEFAULT_DAILY_REMINDER_HOUR, DEFAULT_DAILY_REMINDER_MINUTE } from '../notifications/dailyReminder';
import { loadState as loadLegacySecureState } from './secureStore';

const VALID_CHECK_IN_STATES: CheckInState[] = ['steady', 'worn', 'struggling'];
const VALID_TIME_DISPLAY_PREFERENCES: TimeDisplayPreference[] = ['days', 'weeks', 'hours', 'months'];
const VALID_THEME_PREFERENCES: ThemePreference[] = ['system', 'light', 'dark'];
const isValidReminderHour = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 23;
const isValidReminderMinute = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 59;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isValidISO = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(new Date(value).getTime());

const normalizeDisplayName = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const parseCheckIns = (value: unknown): AppData['checkIns'] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((checkIn) => {
    if (!isRecord(checkIn)) {
      return [];
    }
    if (!isValidISO(checkIn.dateISO)) {
      return [];
    }
    if (typeof checkIn.state !== 'string' || !VALID_CHECK_IN_STATES.includes(checkIn.state as CheckInState)) {
      return [];
    }
    if (typeof checkIn.note !== 'undefined' && typeof checkIn.note !== 'string') {
      return [];
    }

    return [
      {
        dateISO: checkIn.dateISO,
        state: checkIn.state as CheckInState,
        note: checkIn.note,
      },
    ];
  });
};

const parseHistory = (value: unknown): NonNullable<AppData['history']> => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }
    if (!isValidISO(entry.archivedCleanStartISO) || !isValidISO(entry.archivedAtISO)) {
      return [];
    }

    return [
      {
        archivedCleanStartISO: entry.archivedCleanStartISO,
        archivedAtISO: entry.archivedAtISO,
      },
    ];
  });
};

const parseAppData = (value: unknown): AppData | null => {
  if (!isRecord(value)) {
    return null;
  }

  const defaults = getDefaultAppData();
  const settings = isRecord(value.settings) ? value.settings : {};

  const cleanStartISO = isValidISO(value.cleanStartISO) ? value.cleanStartISO : null;
  if (!cleanStartISO) {
    return null;
  }

  const hardDayModeEnabled =
    typeof settings.hardDayModeEnabled === 'boolean'
      ? settings.hardDayModeEnabled
      : defaults.settings.hardDayModeEnabled;
  const hardDayModeAutoSuggest =
    typeof settings.hardDayModeAutoSuggest === 'boolean'
      ? settings.hardDayModeAutoSuggest
      : defaults.settings.hardDayModeAutoSuggest;
  const timeDisplayPreference = VALID_TIME_DISPLAY_PREFERENCES.includes(
    settings.timeDisplayPreference as TimeDisplayPreference,
  )
    ? (settings.timeDisplayPreference as TimeDisplayPreference)
    : defaults.settings.timeDisplayPreference;
  const themePreference = VALID_THEME_PREFERENCES.includes(settings.themePreference as ThemePreference)
    ? (settings.themePreference as ThemePreference)
    : defaults.settings.themePreference;

  const dailyReminderEnabledCandidate =
    typeof settings.dailyReminderEnabled === 'boolean'
      ? settings.dailyReminderEnabled
      : typeof value.dailyReminderEnabled === 'boolean'
        ? value.dailyReminderEnabled
        : undefined;
  const dailyReminderHourCandidate = isValidReminderHour(settings.dailyReminderHour)
    ? settings.dailyReminderHour
    : isValidReminderHour(value.dailyReminderHour)
      ? value.dailyReminderHour
      : undefined;
  const dailyReminderMinuteCandidate = isValidReminderMinute(settings.dailyReminderMinute)
    ? settings.dailyReminderMinute
    : isValidReminderMinute(value.dailyReminderMinute)
      ? value.dailyReminderMinute
      : undefined;

  return {
    cleanStartISO,
    displayName: normalizeDisplayName(value.displayName),
    checkIns: parseCheckIns(value.checkIns),
    settings: {
      hardDayModeEnabled,
      hardDayModeAutoSuggest,
      timeDisplayPreference,
      themePreference,
      dailyReminderEnabled: dailyReminderEnabledCandidate ?? defaults.settings.dailyReminderEnabled,
      dailyReminderHour: dailyReminderHourCandidate ?? DEFAULT_DAILY_REMINDER_HOUR,
      dailyReminderMinute: dailyReminderMinuteCandidate ?? DEFAULT_DAILY_REMINDER_MINUTE,
      lastHardDaySuggestAt: isValidISO(settings.lastHardDaySuggestAt) ? settings.lastHardDaySuggestAt : undefined,
    },
    history: parseHistory(value.history),
  };
};

const loadLegacyAppData = async (): Promise<AppData | null> => {
  const legacy = await loadLegacySecureState();
  if (!legacy) {
    return null;
  }

  return parseAppData({
    ...legacy,
    checkIns: [],
    history: [],
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
      return loadLegacyAppData();
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      const normalized = parseAppData(parsed);
      if (normalized) {
        return normalized;
      }
    } catch {
      // Continue with legacy fallback below.
    }

    return loadLegacyAppData();
  } catch {
    return loadLegacyAppData();
  }
}

export async function saveAppData(data: AppData): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Keep failures silent to prevent UI crashes.
  }
}
