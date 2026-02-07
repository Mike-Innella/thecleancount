import 'react-native-gesture-handler';

import { StatusBar } from 'expo-status-bar';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';

import { RootNavigator } from './src/navigation/RootNavigator';
import { paperTheme, theme } from './src/theme';

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: theme.colors.button,
    background: theme.colors.bg,
    card: theme.colors.bg,
    text: theme.colors.textPrimary,
    border: theme.colors.divider,
    notification: theme.colors.button,
  },
};

export default function App() {
  return (
    <PaperProvider theme={paperTheme}>
      <StatusBar style="light" />
      <NavigationContainer theme={navigationTheme}>
        <RootNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}
