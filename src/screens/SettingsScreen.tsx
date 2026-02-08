import { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View, useColorScheme } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Button, Switch, Text, TextInput } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { RootStackParamList } from '../navigation/types';
import {
  DEFAULT_DAILY_REMINDER_HOUR,
  DEFAULT_DAILY_REMINDER_MINUTE,
  isDailyReminderSupported,
  syncDailyReminderNotificationsAsync,
} from '../notifications/dailyReminder';
import { useAppData } from '../state/AppDataContext';
import { ThemePreference, TimeDisplayPreference } from '../types/appTypes';
import { AppTheme, resolveThemeMode, useAppTheme } from '../theme';

type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;

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

const TIME_DISPLAY_OPTIONS: Array<{ value: TimeDisplayPreference; label: string; description: string }> = [
  { value: 'days', label: 'Days', description: 'Best for a simple daily view.' },
  { value: 'weeks', label: 'Weeks', description: 'Good for medium-range progress.' },
  { value: 'hours', label: 'Hours', description: 'Most detailed time format.' },
  { value: 'months', label: 'Months (approx)', description: 'High-level long-term view.' },
];

const APPEARANCE_OPTIONS: Array<{ value: ThemePreference; label: string; description: string }> = [
  { value: 'system', label: 'System', description: 'Matches your device setting.' },
  { value: 'light', label: 'Light', description: 'Uses the light color palette.' },
  { value: 'dark', label: 'Dark', description: 'Uses the dark color palette.' },
];

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { appData, setAppData } = useAppData();
  const colorScheme = useColorScheme();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [draftName, setDraftName] = useState(appData.displayName ?? '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingDate, setIsSavingDate] = useState(false);
  const [isUpdatingReminder, setIsUpdatingReminder] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);
  const [draftDate, setDraftDate] = useState(() => new Date(appData.cleanStartISO));
  const [draftReminderTime, setDraftReminderTime] = useState(() =>
    buildTimeDate(
      appData.settings.dailyReminderHour ?? DEFAULT_DAILY_REMINDER_HOUR,
      appData.settings.dailyReminderMinute ?? DEFAULT_DAILY_REMINDER_MINUTE,
    ),
  );

  const cleanDateLabel = useMemo(() => formatDate(appData.cleanStartISO), [appData.cleanStartISO]);
  const currentName = useMemo(() => appData.displayName?.trim() ?? '', [appData.displayName]);
  const selectedTimePreference = appData.settings.timeDisplayPreference ?? 'days';
  const selectedThemePreference = appData.settings.themePreference ?? 'system';
  const reminderHour = appData.settings.dailyReminderHour ?? DEFAULT_DAILY_REMINDER_HOUR;
  const reminderMinute = appData.settings.dailyReminderMinute ?? DEFAULT_DAILY_REMINDER_MINUTE;
  const reminderTimeLabel = useMemo(() => formatTime(reminderHour, reminderMinute), [reminderHour, reminderMinute]);
  const reminderSupported = isDailyReminderSupported();
  const resolvedThemeMode = resolveThemeMode(selectedThemePreference, colorScheme);
  const hasNameChanges = draftName.trim() !== currentName;

  useEffect(() => {
    setDraftName(appData.displayName ?? '');
  }, [appData.displayName]);

  const handleOpenDatePicker = () => {
    setDraftDate(new Date(appData.cleanStartISO));
    setShowDatePicker(true);
  };

  const saveDate = async (selectedDate: Date) => {
    setIsSavingDate(true);
    setAppData((prev) => ({
      ...prev,
      cleanStartISO: normalizeDateToLocalNoonISO(selectedDate),
    }));
    setIsSavingDate(false);
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (!selectedDate) {
      if (Platform.OS === 'android') {
        setShowDatePicker(false);
      }
      return;
    }

    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      void saveDate(selectedDate);
      return;
    }

    if (event.type === 'set') {
      setDraftDate(selectedDate);
    }
  };

  const handleSaveName = async () => {
    if (isSavingName) {
      return;
    }

    setIsSavingName(true);
    const nextName = draftName.trim();
    setAppData((prev) => ({
      ...prev,
      displayName: nextName || undefined,
    }));
    setIsSavingName(false);
  };

  const handleToggleDailyReminder = async (enabled: boolean) => {
    if (isUpdatingReminder) {
      return;
    }
    if (!reminderSupported) {
      setNotificationMessage('Daily reminders require a development build on Android. Expo Go does not support this.');
      return;
    }

    setIsUpdatingReminder(true);
    setNotificationMessage(null);
    try {
      const synced = await syncDailyReminderNotificationsAsync({
        enabled,
        cleanStartISO: appData.cleanStartISO,
        displayName: appData.displayName,
        reminderHour,
        reminderMinute,
      });
      const shouldEnable = enabled && synced;

      setAppData((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          dailyReminderEnabled: shouldEnable,
        },
      }));

      if (enabled && !shouldEnable) {
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
    const nextHour = selectedTime.getHours();
    const nextMinute = selectedTime.getMinutes();

    setIsUpdatingReminder(true);
    setNotificationMessage(null);
    try {
      let shouldStayEnabled = Boolean(appData.settings.dailyReminderEnabled);

      if (shouldStayEnabled) {
        shouldStayEnabled = await syncDailyReminderNotificationsAsync({
          enabled: true,
          cleanStartISO: appData.cleanStartISO,
          displayName: appData.displayName,
          reminderHour: nextHour,
          reminderMinute: nextMinute,
        });
      }

      setAppData((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          dailyReminderEnabled: shouldStayEnabled,
          dailyReminderHour: nextHour,
          dailyReminderMinute: nextMinute,
        },
      }));

      if (appData.settings.dailyReminderEnabled && !shouldStayEnabled) {
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

  return (
    <Screen padded={false}>
      <View pointerEvents="none" style={styles.backgroundVeil} />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.profileCard}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Start time
          </Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            mode="outlined"
            value={draftName}
            onChangeText={setDraftName}
            placeholder="Add a name (optional)"
            placeholderTextColor={theme.colors.placeholder}
            style={styles.nameInput}
            outlineStyle={styles.nameInputOutline}
            textColor={theme.colors.textPrimary}
            autoCapitalize="words"
            maxLength={40}
          />

          <Button
            mode="outlined"
            onPress={() => {
              void handleSaveName();
            }}
            style={styles.nameButton}
            disabled={!hasNameChanges || isSavingName}
            loading={isSavingName}
          >
            Save name
          </Button>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Clean start date</Text>
            <Text style={styles.value}>{cleanDateLabel}</Text>
          </View>

          <Button
            mode="contained"
            onPress={handleOpenDatePicker}
            style={styles.primaryButton}
            loading={isSavingDate}
            disabled={isSavingDate}
          >
            Edit start date
          </Button>

          {showDatePicker ? (
            <View style={styles.editorWrap}>
              <DateTimePicker
                value={draftDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={handleDateChange}
                textColor={theme.colors.textPrimary}
              />

              {Platform.OS === 'ios' ? (
                <View style={styles.editorActions}>
                  <Button mode="text" onPress={() => setShowDatePicker(false)} disabled={isSavingDate}>
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => {
                      setShowDatePicker(false);
                      void saveDate(draftDate);
                    }}
                    loading={isSavingDate}
                    disabled={isSavingDate}
                  >
                    Save
                  </Button>
                </View>
              ) : null}
            </View>
          ) : null}
        </Card>

        <Card style={styles.cardGap}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Appearance
          </Text>
          <Text style={styles.hint}>Choose light, dark, or follow your device preference.</Text>

          <View style={styles.optionStack}>
            {APPEARANCE_OPTIONS.map((option) => {
              const selected = selectedThemePreference === option.value;
              return (
                <View key={option.value} style={styles.optionItem}>
                  <Button
                    mode={selected ? 'contained' : 'outlined'}
                    onPress={() => {
                      setAppData((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          themePreference: option.value,
                        },
                      }));
                    }}
                    style={styles.optionButton}
                    textColor={selected ? theme.colors.buttonText : theme.colors.textPrimary}
                  >
                    {option.label}
                  </Button>
                  <Text style={styles.optionHint}>{option.description}</Text>
                </View>
              );
            })}
          </View>

          <Text style={styles.resolvedHint}>{`Currently using ${resolvedThemeMode} mode.`}</Text>
        </Card>

        <Card style={styles.cardGap}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Daily reminder
          </Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <Text style={styles.label}>Reminder enabled</Text>
              <Text style={styles.hint}>{`Current time: ${reminderTimeLabel}`}</Text>
              {!reminderSupported ? (
                <Text style={styles.warningText}>
                  Daily reminders need a development build. Expo Go on Android does not support this module.
                </Text>
              ) : null}
              {notificationMessage ? <Text style={styles.warningText}>{notificationMessage}</Text> : null}
            </View>
            <Switch
              value={Boolean(appData.settings.dailyReminderEnabled)}
              onValueChange={(value) => {
                void handleToggleDailyReminder(value);
              }}
              disabled={isUpdatingReminder || !reminderSupported}
            />
          </View>

          <Button
            mode="outlined"
            onPress={handleOpenReminderTimePicker}
            style={styles.actionButton}
            disabled={isUpdatingReminder || !reminderSupported}
          >
            {`Change reminder time (${reminderTimeLabel})`}
          </Button>

          {showReminderTimePicker ? (
            <View style={styles.editorWrap}>
              <DateTimePicker
                value={draftReminderTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleReminderTimeChange}
                textColor={theme.colors.textPrimary}
              />

              {Platform.OS === 'ios' ? (
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
              ) : null}
            </View>
          ) : null}
        </Card>

        <Card style={styles.cardGap}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Hard Day preferences
          </Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <Text style={styles.label}>Hard Day Mode</Text>
              <Text style={styles.hint}>Simplifies the app for rough days.</Text>
            </View>
            <Switch
              value={appData.settings.hardDayModeEnabled}
              onValueChange={(value) => {
                setAppData((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    hardDayModeEnabled: value,
                  },
                }));
              }}
            />
          </View>

          <View style={styles.preferenceDivider} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <Text style={styles.label}>Auto-suggest Hard Day Mode</Text>
              <Text style={styles.hint}>Shows a gentle suggestion when check-ins indicate a rough day.</Text>
            </View>
            <Switch
              value={appData.settings.hardDayModeAutoSuggest}
              onValueChange={(value) => {
                setAppData((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    hardDayModeAutoSuggest: value,
                  },
                }));
              }}
            />
          </View>
        </Card>

        <Card style={styles.cardGap}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Time display preferences
          </Text>
          <Text style={styles.hint}>Choose how your clean time appears on Home.</Text>

          <View style={styles.optionStack}>
            {TIME_DISPLAY_OPTIONS.map((option) => {
              const selected = selectedTimePreference === option.value;
              return (
                <View key={option.value} style={styles.optionItem}>
                  <Button
                    mode={selected ? 'contained' : 'outlined'}
                    onPress={() => {
                      setAppData((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          timeDisplayPreference: option.value,
                        },
                      }));
                    }}
                    style={styles.optionButton}
                    textColor={selected ? theme.colors.buttonText : theme.colors.textPrimary}
                  >
                    {option.label}
                  </Button>
                  <Text style={styles.optionHint}>{option.description}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        <Card style={styles.cardGap}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            More
          </Text>

          <Button mode="outlined" onPress={() => navigation.navigate('Trust')} style={styles.actionButton}>
            Trust & Privacy
          </Button>
          <Button mode="outlined" onPress={() => navigation.navigate('Reset')} style={styles.actionButton}>
            Start again
          </Button>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    backgroundVeil: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.bg === '#F3F6FB' ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.22)',
    },
    container: {
      paddingHorizontal: theme.spacing.s20,
      paddingTop: theme.spacing.s16,
      paddingBottom: theme.spacing.s24,
    },
    profileCard: {
      position: 'relative',
      zIndex: 2,
      elevation: 12,
    },
    cardGap: {
      marginTop: theme.spacing.s16,
    },
    sectionTitle: {
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.s16,
    },
    infoRow: {
      marginBottom: theme.spacing.s16,
      marginTop: theme.spacing.s16,
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
    primaryButton: {
      borderColor: 'transparent',
    },
    nameInput: {
      backgroundColor: theme.colors.inputBg,
    },
    nameInputOutline: {
      borderColor: theme.colors.inputBorder,
    },
    nameButton: {
      marginTop: theme.spacing.s12,
      borderColor: theme.colors.inputBorder,
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
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      columnGap: theme.spacing.s16,
    },
    toggleTextWrap: {
      flex: 1,
    },
    hint: {
      color: theme.colors.textMuted,
      ...theme.typography.body,
      marginTop: 2,
    },
    preferenceDivider: {
      height: 1,
      marginVertical: theme.spacing.s16,
      backgroundColor: theme.colors.divider,
    },
    actionButton: {
      marginTop: theme.spacing.s12,
      borderColor: theme.colors.inputBorder,
    },
    optionStack: {
      marginTop: theme.spacing.s12,
      rowGap: theme.spacing.s12,
    },
    optionItem: {
      rowGap: 4,
    },
    optionButton: {
      alignSelf: 'flex-start',
      borderColor: theme.colors.inputBorder,
    },
    optionHint: {
      color: theme.colors.textMuted,
      ...theme.typography.body,
    },
    resolvedHint: {
      marginTop: theme.spacing.s12,
      color: theme.colors.textSubtle,
      ...theme.typography.body,
    },
    warningText: {
      color: '#C9874C',
      ...theme.typography.body,
      marginTop: theme.spacing.s8,
    },
  });
