export type CheckInState = 'steady' | 'worn' | 'struggling';
export type TimeDisplayPreference = 'days' | 'weeks' | 'hours' | 'months';
export type ThemePreference = 'system' | 'light' | 'dark';

export type DailyCheckIn = {
  dateISO: string;
  state: CheckInState;
  note?: string;
};

export type UserSettings = {
  timeDisplayPreference?: TimeDisplayPreference;
  themePreference?: ThemePreference;
  dailyReminderEnabled?: boolean;
  dailyReminderHour?: number;
  dailyReminderMinute?: number;
};

export type AppData = {
  cleanStartISO: string;
  displayName?: string;
  checkIns: DailyCheckIn[];
  settings: UserSettings;
  history?: {
    archivedCleanStartISO: string;
    archivedAtISO: string;
  }[];
};
