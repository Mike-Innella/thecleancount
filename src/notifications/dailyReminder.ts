import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { diffFromStart } from '../utils/time';

const DAILY_REMINDER_CHANNEL_ID = 'daily-clean-reminders';
const DAILY_REMINDER_KIND = 'daily-clean-reminder';
const DAYS_TO_SCHEDULE = 365;

export const DEFAULT_DAILY_REMINDER_HOUR = 9;
export const DEFAULT_DAILY_REMINDER_MINUTE = 0;

const GENTLE_AFFIRMATIONS = [
  'Breathe. You are doing enough for today.',
  'Small steady steps still move you forward.',
  'Your calm effort is creating real change.',
  'You are allowed to go gently and keep going.',
  'Today counts, even if it feels quiet.',
  'You are building trust with yourself.',
  'One choice at a time is more than enough.',
  'You are safe to keep this simple.',
  'A gentle pace is still progress.',
  'You are meeting this day with strength.',
];

let configured = false;
let sessionAffirmations = [...GENTLE_AFFIRMATIONS];
let notificationsModule: typeof import('expo-notifications') | null = null;

const isExpoGoRuntime =
  Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';

export const isDailyReminderSupported = (): boolean => Platform.OS !== 'web' && !isExpoGoRuntime;

const getNotificationsModule = async (): Promise<typeof import('expo-notifications') | null> => {
  if (!isDailyReminderSupported()) {
    return null;
  }

  if (!notificationsModule) {
    notificationsModule = await import('expo-notifications');
  }

  return notificationsModule;
};

const isValidReminderHour = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 23;
const isValidReminderMinute = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 59;

const normalizeReminderTime = (hour?: number, minute?: number) => {
  const safeHour = isValidReminderHour(hour) ? hour : DEFAULT_DAILY_REMINDER_HOUR;
  const safeMinute = isValidReminderMinute(minute) ? minute : DEFAULT_DAILY_REMINDER_MINUTE;
  return {
    hour: safeHour,
    minute: safeMinute,
  };
};

const shuffleAffirmationsForSession = () => {
  const shuffled = [...GENTLE_AFFIRMATIONS];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  sessionAffirmations = shuffled;
};

const getNextReminderBase = (from: Date, hour: number, minute: number): Date => {
  const next = new Date(from);
  next.setHours(hour, minute, 0, 0);
  if (next <= from) {
    next.setDate(next.getDate() + 1);
  }
  return next;
};

const getAffirmation = (dayCount: number): string => {
  if (sessionAffirmations.length === 0) {
    return 'One steady day at a time.';
  }
  return sessionAffirmations[dayCount % sessionAffirmations.length];
};

const buildReminderContent = (cleanStartISO: string, triggerDate: Date, displayName?: string) => {
  const dayCount = diffFromStart(cleanStartISO, triggerDate).totalDays;
  const safeDayCount = Math.max(0, dayCount);
  const title = safeDayCount === 1 ? '1 day clean' : `${safeDayCount} days clean`;
  const affirmation = getAffirmation(safeDayCount);
  const body = displayName ? `${affirmation} Keep going, ${displayName}.` : affirmation;

  return {
    title,
    body,
    dayCount: safeDayCount,
  };
};

export async function configureNotificationsAsync(): Promise<void> {
  if (configured) {
    return;
  }

  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return;
  }

  shuffleAffirmationsForSession();

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(DAILY_REMINDER_CHANNEL_ID, {
      name: 'Daily reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180],
      lightColor: '#4A90FF',
    });
  }

  configured = true;
}

export async function ensureNotificationsPermissionAsync(): Promise<boolean> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return false;
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function cancelDailyReminderNotificationsAsync(): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return;
  }

  const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
  const reminderRequests = allScheduled.filter(
    (request) => request.content.data && request.content.data.kind === DAILY_REMINDER_KIND,
  );

  await Promise.all(
    reminderRequests.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
  );
}

type SyncDailyReminderOptions = {
  enabled: boolean;
  cleanStartISO: string;
  displayName?: string;
  reminderHour?: number;
  reminderMinute?: number;
};

export async function syncDailyReminderNotificationsAsync({
  enabled,
  cleanStartISO,
  displayName,
  reminderHour,
  reminderMinute,
}: SyncDailyReminderOptions): Promise<boolean> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return false;
  }

  await configureNotificationsAsync();
  await cancelDailyReminderNotificationsAsync();

  if (!enabled) {
    return true;
  }

  const hasPermission = await ensureNotificationsPermissionAsync();
  if (!hasPermission) {
    return false;
  }

  const reminderTime = normalizeReminderTime(reminderHour, reminderMinute);
  const now = new Date();
  const base = getNextReminderBase(now, reminderTime.hour, reminderTime.minute);
  const scheduleJobs: Array<Promise<string>> = [];

  for (let offset = 0; offset < DAYS_TO_SCHEDULE; offset += 1) {
    const trigger = new Date(base);
    trigger.setDate(base.getDate() + offset);

    const content = buildReminderContent(cleanStartISO, trigger, displayName);
    scheduleJobs.push(
      Notifications.scheduleNotificationAsync({
        content: {
          title: content.title,
          body: content.body,
          data: {
            kind: DAILY_REMINDER_KIND,
            dayCount: content.dayCount,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: trigger,
          channelId: Platform.OS === 'android' ? DAILY_REMINDER_CHANNEL_ID : undefined,
        },
      }),
    );
  }

  await Promise.all(scheduleJobs);
  return true;
}
