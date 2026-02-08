import 'react-native-gesture-handler';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const INSTALL_SPLASH_SEEN_KEY = '@cleanCount/installSplashSeenV1';
const LAUNCH_SPLASH_DURATION_MS = 1200;
const INSTALL_SPLASH_DURATION_MS = 2800;
type SplashPhase = 'install' | 'launch' | null;

function AppShell() {
  const { appData, setAppData, isReady } = useAppData();
  const colorScheme = useColorScheme();
  const [splashPhase, setSplashPhase] = useState<SplashPhase>(null);
  const [isSplashVisible, setIsSplashVisible] = useState(false);
  const [isSplashMounted, setIsSplashMounted] = useState(false);
  const [minimumSplashElapsed, setMinimumSplashElapsed] = useState(false);
  const [nextSplashPhase, setNextSplashPhase] = useState<SplashPhase>(null);

  const resolvedMode = resolveThemeMode(appData.settings.themePreference, colorScheme);
  const appTheme = useMemo(() => getAppTheme(resolvedMode), [resolvedMode]);
  const paperTheme = useMemo(() => buildPaperTheme(appTheme, resolvedMode), [appTheme, resolvedMode]);
  const navigationTheme = useMemo(() => buildNavigationTheme(appTheme, resolvedMode), [appTheme, resolvedMode]);

  const startSplash = useCallback((phase: Exclude<SplashPhase, null>) => {
    setSplashPhase(phase);
    setNextSplashPhase(null);
    setMinimumSplashElapsed(false);
    setIsSplashMounted(true);
    setIsSplashVisible(true);
  }, []);

  useEffect(() => {
    void configureNotificationsAsync();
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const prepareSplash = async () => {
      try {
        const seenInstallSplash = await AsyncStorage.getItem(INSTALL_SPLASH_SEEN_KEY);
        if (isCancelled) {
          return;
        }

        if (seenInstallSplash === '1') {
          startSplash('launch');
          return;
        }

        startSplash('install');
        void AsyncStorage.setItem(INSTALL_SPLASH_SEEN_KEY, '1');
      } catch {
        if (!isCancelled) {
          startSplash('launch');
        }
      }
    };

    void prepareSplash();

    return () => {
      isCancelled = true;
    };
  }, [startSplash]);

  useEffect(() => {
    if (!isSplashMounted || !splashPhase) {
      return;
    }

    const durationMs = splashPhase === 'install' ? INSTALL_SPLASH_DURATION_MS : LAUNCH_SPLASH_DURATION_MS;
    const timeoutId = setTimeout(() => {
      setMinimumSplashElapsed(true);
    }, durationMs);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isSplashMounted, splashPhase]);

  useEffect(() => {
    if (!isSplashMounted || !splashPhase || !isSplashVisible || !minimumSplashElapsed) {
      return;
    }

    if (splashPhase === 'install') {
      setNextSplashPhase('launch');
      setIsSplashVisible(false);
      return;
    }

    if (isReady) {
      setNextSplashPhase(null);
      setIsSplashVisible(false);
    }
  }, [isReady, isSplashMounted, isSplashVisible, minimumSplashElapsed, splashPhase]);

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
            key={splashPhase ?? 'launch'}
            variant={splashPhase === 'install' ? 'install' : 'launch'}
            visible={isSplashVisible}
            onExited={() => {
              if (nextSplashPhase === 'launch') {
                startSplash('launch');
                return;
              }

              setIsSplashMounted(false);
              setSplashPhase(null);
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
