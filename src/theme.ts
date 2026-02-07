import { Platform } from 'react-native';
import { MD3DarkTheme, MD3Theme } from 'react-native-paper';

const displayFamily = Platform.select({
  ios: 'AvenirNext-DemiBold',
  android: 'sans-serif-medium',
  default: 'System',
});

const bodyFamily = Platform.select({
  ios: 'AvenirNext-Regular',
  android: 'sans-serif',
  default: 'System',
});

export const appTheme = {
  colors: {
    bg: '#050A14',
    bgSoft: '#0B1221',
    card: '#111A2B',
    cardBorder: '#1E2A44',
    cardGlow: '#71ABFF',
    textPrimary: '#F2F6FF',
    textMuted: '#9AA9C5',
    textSubtle: '#7482A1',
    inputBg: '#0D1627',
    inputBorder: '#223352',
    placeholder: '#687894',
    button: '#4A90FF',
    buttonPressed: '#3B7BDF',
    buttonText: '#FFFFFF',
    focusRing: '#78AEFF',
    divider: '#1B2941',
  },
  spacing: {
    s8: 8,
    s12: 12,
    s16: 16,
    s20: 20,
    s24: 24,
    s28: 28,
    s32: 32,
    s40: 40,
  },
  radius: {
    card: 24,
    input: 14,
    button: 16,
  },
  typography: {
    h1: {
      fontFamily: displayFamily,
      fontSize: 32,
      fontWeight: '700' as const,
      letterSpacing: 0.1,
    },
    display: {
      fontFamily: displayFamily,
      fontSize: 96,
      fontWeight: '700' as const,
      letterSpacing: 0.2,
    },
    body: {
      fontFamily: bodyFamily,
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    label: {
      fontFamily: bodyFamily,
      fontSize: 12,
      fontWeight: '600' as const,
      letterSpacing: 0.7,
    },
    input: {
      fontFamily: bodyFamily,
      fontSize: 15,
      fontWeight: '500' as const,
    },
    button: {
      fontFamily: displayFamily,
      fontSize: 16,
      fontWeight: '700' as const,
      letterSpacing: 0.2,
    },
  },
};

export const paperTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: appTheme.colors.button,
    onPrimary: appTheme.colors.buttonText,
    primaryContainer: '#223250',
    onPrimaryContainer: appTheme.colors.textPrimary,
    background: appTheme.colors.bg,
    surface: appTheme.colors.card,
    surfaceVariant: appTheme.colors.inputBg,
    onSurface: appTheme.colors.textPrimary,
    onSurfaceVariant: appTheme.colors.textMuted,
    outline: appTheme.colors.inputBorder,
    outlineVariant: appTheme.colors.divider,
    error: '#C96C7E',
    onError: '#FFFFFF',
  },
  roundness: appTheme.radius.input,
};

export const theme = appTheme;
