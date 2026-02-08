import 'react-native-gesture-handler';

import { useEffect, useMemo, useState } from 'react';
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
import { LaunchSplash } from './src/components/LaunchSplash';

const LAUNCH_SPLASH_DURATION_MS = 2800;

function AppShell() {
  const { appData, setAppData, isReady } = useAppData();
  const colorScheme = useColorScheme();
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [isSplashMounted, setIsSplashMounted] = useState(true);
  const [minimumSplashElapsed, setMinimumSplashElapsed] = useState(false);

  const resolvedMode = resolveThemeMode(appData.settings.themePreference, colorScheme);
  const appTheme = useMemo(() => getAppTheme(resolvedMode), [resolvedMode]);
  const paperTheme = useMemo(() => buildPaperTheme(appTheme, resolvedMode), [appTheme, resolvedMode]);
  const navigationTheme = useMemo(() => buildNavigationTheme(appTheme, resolvedMode), [appTheme, resolvedMode]);

  useEffect(() => {
    void configureNotificationsAsync();
  }, []);

  useEffect(() => {
    if (!isSplashMounted) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setMinimumSplashElapsed(true);
    }, LAUNCH_SPLASH_DURATION_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isSplashMounted]);

  useEffect(() => {
    if (!isSplashMounted || !isSplashVisible || !minimumSplashElapsed) {
      return;
    }

    if (isReady) {
      setIsSplashVisible(false);
    }
  }, [isReady, isSplashMounted, isSplashVisible, minimumSplashElapsed]);

  useEffect(() => {
    if (!appData.settings.dailyReminderEnabled) {
      return;
    }

    let isCancelled = false;
    const sync = async () => {
      const synced = await syncDailyReminderNotificationsAsync({
        enabled: true,
        cleanStartISO: appData.cleanStartISO,
        displayName: appData.displayName,
        reminderHour: appData.settings.dailyReminderHour ?? DEFAULT_DAILY_REMINDER_HOUR,
        reminderMinute: appData.settings.dailyReminderMinute ?? DEFAULT_DAILY_REMINDER_MINUTE,
      });

      if (!synced && !isCancelled) {
        setAppData((prev) =>
          prev.settings.dailyReminderEnabled
            ? {
                ...prev,
                settings: {
                  ...prev.settings,
                  dailyReminderEnabled: false,
                },
              }
            : prev,
        );
      }
    };

    void sync();

    return () => {
      isCancelled = true;
    };
  }, [
    appData.cleanStartISO,
    appData.displayName,
    appData.settings.dailyReminderEnabled,
    appData.settings.dailyReminderHour,
    appData.settings.dailyReminderMinute,
    setAppData,
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
        {isSplashMounted ? (
          <LaunchSplash
            visible={isSplashVisible}
            onExited={() => {
              setIsSplashMounted(false);
            }}
          />
        ) : null}
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
