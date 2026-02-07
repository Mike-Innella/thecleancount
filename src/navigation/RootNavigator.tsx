import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { theme } from '../theme';
import { AppState } from '../types';
import { clearState, loadState, saveState } from '../storage/secureStore';
import { HomeScreen } from '../screens/HomeScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import {
  configureNotificationsAsync,
  DEFAULT_DAILY_REMINDER_HOUR,
  DEFAULT_DAILY_REMINDER_MINUTE,
  syncDailyReminderNotificationsAsync,
} from '../notifications/dailyReminder';

type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

type StartPayload = {
  cleanStartISO: string;
  displayName?: string;
};

const getReminderHour = (state: AppState | null): number =>
  typeof state?.dailyReminderHour === 'number' ? state.dailyReminderHour : DEFAULT_DAILY_REMINDER_HOUR;
const getReminderMinute = (state: AppState | null): number =>
  typeof state?.dailyReminderMinute === 'number' ? state.dailyReminderMinute : DEFAULT_DAILY_REMINDER_MINUTE;

export function RootNavigator() {
  const [state, setState] = useState<AppState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasSyncedNotificationsOnBoot = useRef(false);

  useEffect(() => {
    void configureNotificationsAsync();
  }, []);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        const loadedState = await loadState();
        if (mounted) {
          setState(loadedState);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void boot();

    return () => {
      mounted = false;
    };
  }, []);

  const handleStartTracking = useCallback(async ({ cleanStartISO, displayName }: StartPayload) => {
    const nowISO = new Date().toISOString();
    const normalizedName = displayName?.trim();
    const nextState: AppState = {
      cleanStartISO,
      displayName: normalizedName ? normalizedName : undefined,
      dailyReminderEnabled: false,
      dailyReminderHour: DEFAULT_DAILY_REMINDER_HOUR,
      dailyReminderMinute: DEFAULT_DAILY_REMINDER_MINUTE,
      createdAtISO: nowISO,
      updatedAtISO: nowISO,
    };

    await saveState(nextState);
    setState(nextState);
  }, []);

  const handleResetState = useCallback(async () => {
    await syncDailyReminderNotificationsAsync({
      enabled: false,
      cleanStartISO: new Date().toISOString(),
    });
    await clearState();
    setState(null);
  }, []);

  const handleEditCleanDate = useCallback(
    async (cleanStartISO: string) => {
      if (!state) {
        return;
      }

      const nextState: AppState = {
        ...state,
        cleanStartISO,
        updatedAtISO: new Date().toISOString(),
      };

      await saveState(nextState);
      setState(nextState);

      if (nextState.dailyReminderEnabled) {
        await syncDailyReminderNotificationsAsync({
          enabled: true,
          cleanStartISO: nextState.cleanStartISO,
          displayName: nextState.displayName,
          reminderHour: getReminderHour(nextState),
          reminderMinute: getReminderMinute(nextState),
        });
      }
    },
    [state],
  );

  const handleSetDailyReminderEnabled = useCallback(
    async (enabled: boolean): Promise<boolean> => {
      if (!state) {
        return false;
      }

      const synced = await syncDailyReminderNotificationsAsync({
        enabled,
        cleanStartISO: state.cleanStartISO,
        displayName: state.displayName,
        reminderHour: getReminderHour(state),
        reminderMinute: getReminderMinute(state),
      });
      const shouldEnable = enabled && synced;

      const nextState: AppState = {
        ...state,
        dailyReminderEnabled: shouldEnable,
        updatedAtISO: new Date().toISOString(),
      };

      await saveState(nextState);
      setState(nextState);

      return shouldEnable;
    },
    [state],
  );

  const handleSetDailyReminderTime = useCallback(
    async (hour: number, minute: number): Promise<boolean> => {
      if (!state) {
        return false;
      }

      let shouldStayEnabled = Boolean(state.dailyReminderEnabled);
      if (shouldStayEnabled) {
        shouldStayEnabled = await syncDailyReminderNotificationsAsync({
          enabled: true,
          cleanStartISO: state.cleanStartISO,
          displayName: state.displayName,
          reminderHour: hour,
          reminderMinute: minute,
        });
      }

      const nextState: AppState = {
        ...state,
        dailyReminderEnabled: shouldStayEnabled,
        dailyReminderHour: hour,
        dailyReminderMinute: minute,
        updatedAtISO: new Date().toISOString(),
      };

      await saveState(nextState);
      setState(nextState);

      return shouldStayEnabled;
    },
    [state],
  );

  useEffect(() => {
    if (isLoading || hasSyncedNotificationsOnBoot.current) {
      return;
    }
    hasSyncedNotificationsOnBoot.current = true;
    if (!state?.dailyReminderEnabled) {
      return;
    }

    void syncDailyReminderNotificationsAsync({
      enabled: true,
      cleanStartISO: state.cleanStartISO,
      displayName: state.displayName,
      reminderHour: getReminderHour(state),
      reminderMinute: getReminderMinute(state),
    });
  }, [isLoading, state]);

  const navigatorKey = useMemo(() => (state ? 'home' : 'onboarding'), [state]);

  if (isLoading) {
    return (
      <View style={styles.loaderScreen}>
        <ActivityIndicator size="small" color={theme.colors.textMuted} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      key={navigatorKey}
      initialRouteName={state ? 'Home' : 'Onboarding'}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      <Stack.Screen name="Onboarding">
        {({ navigation }) => (
          <OnboardingScreen
            onSubmit={async (payload) => {
              await handleStartTracking(payload);
              navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Home">
        {({ navigation }) => <HomeScreen state={state} onOpenSettings={() => navigation.navigate('Settings')} />}
      </Stack.Screen>

      <Stack.Screen
        name="Settings"
        options={{
          headerShown: true,
          presentation: 'modal',
          title: 'Settings',
          headerStyle: { backgroundColor: theme.colors.bg },
          headerTintColor: theme.colors.textPrimary,
          headerShadowVisible: false,
        }}
      >
        {({ navigation }) => (
          <SettingsScreen
            state={state}
            onReset={async () => {
              await handleResetState();
              navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
            }}
            onEditCleanDate={handleEditCleanDate}
            onSetDailyReminderEnabled={handleSetDailyReminderEnabled}
            onSetDailyReminderTime={handleSetDailyReminderTime}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loaderScreen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
