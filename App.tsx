import 'react-native-gesture-handler';

import { useEffect, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';

import {
  configureNotificationsAsync,
  DEFAULT_DAILY_REMINDER_HOUR,
  DEFAULT_DAILY_REMINDER_MINUTE,
  syncDailyReminderNotificationsAsync,
} from './src/notifications/dailyReminder';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AppDataProvider, useAppData } from './src/state/AppDataContext';
import { buildNavigationTheme, buildPaperTheme, getAppTheme, resolveThemeMode } from './src/theme';

function AppShell() {
  const { appData } = useAppData();
  const colorScheme = useColorScheme();

  const resolvedMode = resolveThemeMode(appData.settings.themePreference, colorScheme);
  const appTheme = useMemo(() => getAppTheme(resolvedMode), [resolvedMode]);
  const paperTheme = useMemo(() => buildPaperTheme(appTheme, resolvedMode), [appTheme, resolvedMode]);
  const navigationTheme = useMemo(() => buildNavigationTheme(appTheme, resolvedMode), [appTheme, resolvedMode]);

  useEffect(() => {
    void configureNotificationsAsync();
  }, []);

  useEffect(() => {
    if (!appData.settings.dailyReminderEnabled) {
      return;
    }

    void syncDailyReminderNotificationsAsync({
      enabled: true,
      cleanStartISO: appData.cleanStartISO,
      displayName: appData.displayName,
      reminderHour: appData.settings.dailyReminderHour ?? DEFAULT_DAILY_REMINDER_HOUR,
      reminderMinute: appData.settings.dailyReminderMinute ?? DEFAULT_DAILY_REMINDER_MINUTE,
    });
  }, [
    appData.cleanStartISO,
    appData.displayName,
    appData.settings.dailyReminderEnabled,
    appData.settings.dailyReminderHour,
    appData.settings.dailyReminderMinute,
  ]);

  return (
    <PaperProvider theme={paperTheme}>
      <View
        style={{
          flex: 1,
          backgroundColor: appTheme.colors.bg,
        }}
      >
        <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
        <NavigationContainer theme={navigationTheme}>
          <RootNavigator />
        </NavigationContainer>
      </View>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <AppDataProvider>
      <AppShell />
    </AppDataProvider>
  );
}
