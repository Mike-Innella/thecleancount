import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAppData } from '../state/AppDataContext';
import { HomeScreen } from '../screens/HomeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { CheckInScreen } from '../screens/CheckInScreen';
import { NotesScreen } from '../screens/NotesScreen';
import { TrustScreen } from '../screens/TrustScreen';
import { ResetScreen } from '../screens/ResetScreen';
import { RootStackParamList } from './types';
import { useAppTheme } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isReady } = useAppData();
  const theme = useAppTheme();

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="small" color={theme.colors.textMuted} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        contentStyle: { backgroundColor: theme.colors.bg },
        headerStyle: { backgroundColor: theme.colors.bg },
        headerTintColor: theme.colors.textPrimary,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
        }}
      />
      <Stack.Screen
        name="CheckIn"
        component={CheckInScreen}
        options={{
          title: 'Check-in',
        }}
      />
      <Stack.Screen
        name="Notes"
        component={NotesScreen}
        options={{
          title: 'Past notes',
        }}
      />
      <Stack.Screen
        name="Trust"
        component={TrustScreen}
        options={{
          title: 'Trust & Privacy',
        }}
      />
      <Stack.Screen
        name="Reset"
        component={ResetScreen}
        options={{
          title: 'Start again',
        }}
      />
    </Stack.Navigator>
  );
}
