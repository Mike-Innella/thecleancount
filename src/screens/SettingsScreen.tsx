import { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ActivityIndicator, Button, Dialog, Divider, Portal, Switch, Text } from 'react-native-paper';

import { Card } from '../components/Card';
import {
  DEFAULT_DAILY_REMINDER_HOUR,
  DEFAULT_DAILY_REMINDER_MINUTE,
  isDailyReminderSupported,
} from '../notifications/dailyReminder';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { theme } from '../theme';
import { AppState } from '../types';

type SettingsScreenProps = {
  state: AppState | null;
  onReset: () => Promise<void>;
  onEditCleanDate: (cleanStartISO: string) => Promise<void>;
  onSetDailyReminderEnabled: (enabled: boolean) => Promise<boolean>;
  onSetDailyReminderTime: (hour: number, minute: number) => Promise<boolean>;
};

const formatDate = (iso: string): string => {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

const normalizeDateToLocalNoonISO = (value: Date): string => {
  const localNoon = new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12, 0, 0, 0);
  return localNoon.toISOString();
};

const getReminderHour = (state: AppState | null): number =>
  typeof state?.dailyReminderHour === 'number' ? state.dailyReminderHour : DEFAULT_DAILY_REMINDER_HOUR;
const getReminderMinute = (state: AppState | null): number =>
  typeof state?.dailyReminderMinute === 'number' ? state.dailyReminderMinute : DEFAULT_DAILY_REMINDER_MINUTE;
const buildTimeDate = (hour: number, minute: number): Date => {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
};
const formatTime = (hour: number, minute: number): string =>
  new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(buildTimeDate(hour, minute));

export function SettingsScreen({
  state,
  onReset,
  onEditCleanDate,
  onSetDailyReminderEnabled,
  onSetDailyReminderTime,
}: SettingsScreenProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingReminder, setIsUpdatingReminder] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [showEditPicker, setShowEditPicker] = useState(false);
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [draftDate, setDraftDate] = useState(() => (state ? new Date(state.cleanStartISO) : new Date()));
  const [draftReminderTime, setDraftReminderTime] = useState(() =>
    buildTimeDate(getReminderHour(state), getReminderMinute(state)),
  );

  const cleanDateLabel = useMemo(() => {
    if (!state) {
      return 'Not set';
    }
    return formatDate(state.cleanStartISO);
  }, [state]);
  const reminderHour = getReminderHour(state);
  const reminderMinute = getReminderMinute(state);
  const reminderTimeLabel = useMemo(() => formatTime(reminderHour, reminderMinute), [reminderHour, reminderMinute]);
  const isBusy = isSaving || isUpdatingReminder || isResetting;
  const reminderSupported = isDailyReminderSupported();

  const handleOpenEditor = () => {
    if (!state) {
      return;
    }

    setDraftDate(new Date(state.cleanStartISO));
    setShowEditPicker(true);
  };

  const handleSaveDate = async () => {
    if (!state) {
      return;
    }

    try {
      setIsSaving(true);
      await onEditCleanDate(normalizeDateToLocalNoonISO(draftDate));
      setShowEditPicker(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (!selectedDate) {
      if (Platform.OS === 'android') {
        setShowEditPicker(false);
      }
      return;
    }

    if (Platform.OS === 'android') {
      setShowEditPicker(false);
      void (async () => {
        try {
          setIsSaving(true);
          await onEditCleanDate(normalizeDateToLocalNoonISO(selectedDate));
        } finally {
          setIsSaving(false);
        }
      })();
      return;
    }

    if (event.type === 'set') {
      setDraftDate(selectedDate);
    }
  };

  const handleToggleDailyReminder = async (enabled: boolean) => {
    if (!state || isUpdatingReminder) {
      return;
    }
    if (!reminderSupported) {
      setNotificationMessage('Daily reminders require a development build on Android. Expo Go does not support this.');
      return;
    }

    try {
      setIsUpdatingReminder(true);
      setNotificationMessage(null);
      const isEnabled = await onSetDailyReminderEnabled(enabled);
      if (enabled && !isEnabled) {
        setNotificationMessage('Notification permission is off. Enable it in system settings to receive reminders.');
      }
    } finally {
      setIsUpdatingReminder(false);
    }
  };

  const handleOpenReminderTimePicker = () => {
    if (!reminderSupported) {
      setNotificationMessage('Daily reminders require a development build on Android. Expo Go does not support this.');
      return;
    }
    setDraftReminderTime(buildTimeDate(reminderHour, reminderMinute));
    setShowReminderTimePicker(true);
  };

  const handleSaveReminderTime = async (selectedTime: Date) => {
    if (!state) {
      return;
    }

    const nextHour = selectedTime.getHours();
    const nextMinute = selectedTime.getMinutes();

    try {
      setIsUpdatingReminder(true);
      setNotificationMessage(null);
      const isReminderEnabled = await onSetDailyReminderTime(nextHour, nextMinute);
      if (state.dailyReminderEnabled && !isReminderEnabled) {
        setNotificationMessage('Notification permission is off. Enable it in system settings to receive reminders.');
      }
    } finally {
      setIsUpdatingReminder(false);
    }
  };

  const handleReminderTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (!selectedDate) {
      if (Platform.OS === 'android') {
        setShowReminderTimePicker(false);
      }
      return;
    }

    if (Platform.OS === 'android') {
      setShowReminderTimePicker(false);
      void handleSaveReminderTime(selectedDate);
      return;
    }

    if (event.type === 'set') {
      setDraftReminderTime(selectedDate);
    }
  };

  const handleResetConfirmed = async () => {
    if (isResetting) {
      return;
    }

    try {
      setIsResetting(true);
      await onReset();
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Profile
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{state?.displayName ? state.displayName : 'Not set'}</Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Clean date</Text>
            <View style={styles.valueRow}>
              <Text style={styles.value}>{cleanDateLabel}</Text>
              {isSaving ? <ActivityIndicator size={14} color={theme.colors.textMuted} style={styles.inlineSpinner} /> : null}
            </View>
          </View>

          <PrimaryButton
            title="Edit clean date"
            onPress={handleOpenEditor}
            style={styles.buttonGap}
            loading={isSaving && !showEditPicker}
            disabled={!state || isBusy}
          />

          <Divider style={styles.divider} />

          <View style={styles.notificationRow}>
            <View style={styles.notificationTextWrap}>
              <Text style={styles.label}>Daily reminder</Text>
              <Text style={styles.notificationMeta}>
                {`${reminderTimeLabel}: your updated day count and a gentle affirmation`}
              </Text>
              {!reminderSupported ? (
                <Text style={styles.notificationWarning}>
                  Daily reminders need a development build. Expo Go on Android does not support this module.
                </Text>
              ) : null}
              {notificationMessage ? <Text style={styles.notificationWarning}>{notificationMessage}</Text> : null}
            </View>
            <Switch
              value={Boolean(state?.dailyReminderEnabled)}
              onValueChange={(value) => {
                void handleToggleDailyReminder(value);
              }}
              disabled={!state || isBusy || !reminderSupported}
            />
            {isUpdatingReminder ? <ActivityIndicator size={14} color={theme.colors.textMuted} style={styles.switchSpinner} /> : null}
          </View>
          <Button
            mode="outlined"
            onPress={handleOpenReminderTimePicker}
            style={styles.timeButton}
            textColor={theme.colors.textPrimary}
            disabled={!state || isBusy || !reminderSupported}
            loading={isUpdatingReminder}
          >
            {`Change reminder time (${reminderTimeLabel})`}
          </Button>

          <Button
            mode="outlined"
            onPress={() => setShowResetDialog(true)}
            style={styles.resetButton}
            textColor={theme.colors.textMuted}
            disabled={isBusy}
          >
            Reset clean date...
          </Button>

          {showEditPicker && (
            <View style={styles.editorWrap}>
              <DateTimePicker
                value={draftDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={handleChangeDate}
                textColor={theme.colors.textPrimary}
              />

              {Platform.OS === 'ios' && (
                <View style={styles.editorActions}>
                  <Button mode="text" onPress={() => setShowEditPicker(false)} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => {
                      void handleSaveDate();
                    }}
                    loading={isSaving}
                    disabled={isSaving}
                  >
                    Save date
                  </Button>
                </View>
              )}
            </View>
          )}

          {showReminderTimePicker && (
            <View style={styles.editorWrap}>
              <DateTimePicker
                value={draftReminderTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleReminderTimeChange}
                textColor={theme.colors.textPrimary}
              />

              {Platform.OS === 'ios' && (
                <View style={styles.editorActions}>
                  <Button mode="text" onPress={() => setShowReminderTimePicker(false)} disabled={isUpdatingReminder}>
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => {
                      setShowReminderTimePicker(false);
                      void handleSaveReminderTime(draftReminderTime);
                    }}
                    loading={isUpdatingReminder}
                    disabled={isUpdatingReminder}
                  >
                    Save time
                  </Button>
                </View>
              )}
            </View>
          )}
        </Card>
      </ScrollView>

      <Portal>
        <Dialog visible={showResetDialog} onDismiss={() => (!isResetting ? setShowResetDialog(false) : undefined)}>
          <Dialog.Title>Reset clean date?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Resetting doesn&apos;t erase progress. It just starts a new count.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowResetDialog(false)} disabled={isResetting}>
              Cancel
            </Button>
            <Button
              onPress={() => {
                void handleResetConfirmed();
              }}
              loading={isResetting}
              disabled={isResetting}
            >
              Reset
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.s20,
    paddingTop: theme.spacing.s16,
    paddingBottom: theme.spacing.s24,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.s16,
  },
  infoRow: {
    marginBottom: theme.spacing.s16,
  },
  notificationRow: {
    marginTop: theme.spacing.s8,
    marginBottom: theme.spacing.s16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: theme.spacing.s16,
  },
  notificationTextWrap: {
    flex: 1,
  },
  notificationMeta: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
    marginTop: 4,
  },
  notificationWarning: {
    color: '#E9B07A',
    ...theme.typography.body,
    marginTop: theme.spacing.s8,
  },
  divider: {
    backgroundColor: theme.colors.divider,
    marginBottom: theme.spacing.s16,
  },
  label: {
    color: theme.colors.textMuted,
    ...theme.typography.label,
    marginBottom: 4,
  },
  value: {
    color: theme.colors.textPrimary,
    fontSize: 16,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineSpinner: {
    marginLeft: theme.spacing.s8,
  },
  buttonGap: {
    marginTop: theme.spacing.s12,
  },
  resetButton: {
    marginTop: theme.spacing.s12,
    borderColor: theme.colors.inputBorder,
  },
  timeButton: {
    marginTop: 0,
    borderColor: theme.colors.inputBorder,
  },
  switchSpinner: {
    marginLeft: theme.spacing.s8,
  },
  editorWrap: {
    marginTop: theme.spacing.s16,
    borderRadius: theme.radius.input,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    backgroundColor: theme.colors.inputBg,
    padding: theme.spacing.s12,
  },
  editorActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.s8,
    columnGap: theme.spacing.s12,
  },
});
