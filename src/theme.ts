import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, Theme as NavigationTheme } from '@react-navigation/native';
import { MD3DarkTheme, MD3LightTheme, MD3Theme } from 'react-native-paper';

import { useAppData } from './state/AppDataContext';
import { ThemePreference } from './types/appTypes';

const displayFamily = 'AvenirNext-DemiBold';
const bodyFamily = 'AvenirNext-Regular';

type AppColors = {
  bg: string;
  bgSoft: string;
  card: string;
  cardBorder: string;
  cardGlow: string;
  textPrimary: string;
  textMuted: string;
  textSubtle: string;
  inputBg: string;
  inputBorder: string;
  placeholder: string;
  button: string;
  buttonPressed: string;
  buttonText: string;
  focusRing: string;
  divider: string;
};

export type ResolvedThemeMode = 'light' | 'dark';

export type AppTheme = {
  colors: AppColors;
  spacing: {
    s8: number;
    s12: number;
    s16: number;
    s20: number;
    s24: number;
    s28: number;
    s32: number;
    s40: number;
  };
  radius: {
    card: number;
    input: number;
    button: number;
  };
  typography: {
    h1: {
      fontFamily: string;
      fontSize: number;
      fontWeight: '700';
      letterSpacing: number;
    };
    display: {
      fontFamily: string;
      fontSize: number;
      fontWeight: '700';
      letterSpacing: number;
    };
    body: {
      fontFamily: string;
      fontSize: number;
      fontWeight: '400';
      lineHeight: number;
    };
    label: {
      fontFamily: string;
      fontSize: number;
      fontWeight: '600';
      letterSpacing: number;
    };
    input: {
      fontFamily: string;
      fontSize: number;
      fontWeight: '500';
    };
    button: {
      fontFamily: string;
      fontSize: number;
      fontWeight: '700';
      letterSpacing: number;
    };
  };
};

const darkColors: AppColors = {
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
};

const lightColors: AppColors = {
  bg: '#F3F6FB',
  bgSoft: '#E6EDF8',
  card: '#FFFFFF',
  cardBorder: '#D1DDF0',
  cardGlow: '#4D83E8',
  textPrimary: '#0E1B2F',
  textMuted: '#5D6F8A',
  textSubtle: '#6E829F',
  inputBg: '#FFFFFF',
  inputBorder: '#C5D4EA',
  placeholder: '#8395AF',
  button: '#3B82F6',
  buttonPressed: '#2D6DDD',
  buttonText: '#FFFFFF',
  focusRing: '#4E8AF2',
  divider: '#D5E1F1',
};

const spacing = {
  s8: 8,
  s12: 12,
  s16: 16,
  s20: 20,
  s24: 24,
  s28: 28,
  s32: 32,
  s40: 40,
};

const radius = {
  card: 24,
  input: 14,
  button: 16,
};

const typography = {
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
};

export const resolveThemeMode = (
  preference: ThemePreference | undefined,
  colorScheme: ReturnType<typeof useColorScheme>,
): ResolvedThemeMode => {
  if (preference === 'light') {
    return 'light';
  }

  if (preference === 'dark') {
    return 'dark';
  }

  return colorScheme === 'light' ? 'light' : 'dark';
};

export const getAppTheme = (mode: ResolvedThemeMode): AppTheme => ({
  colors: mode === 'light' ? lightColors : darkColors,
  spacing,
  radius,
  typography,
});

export const buildPaperTheme = (appTheme: AppTheme, mode: ResolvedThemeMode): MD3Theme => {
  const base = mode === 'light' ? MD3LightTheme : MD3DarkTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: appTheme.colors.button,
      onPrimary: appTheme.colors.buttonText,
      primaryContainer: mode === 'light' ? '#D8E7FF' : '#223250',
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
};

export const buildNavigationTheme = (appTheme: AppTheme, mode: ResolvedThemeMode): NavigationTheme => {
  const base = mode === 'light' ? DefaultTheme : DarkTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: appTheme.colors.button,
      background: appTheme.colors.bg,
      card: appTheme.colors.bg,
      text: appTheme.colors.textPrimary,
      border: appTheme.colors.divider,
      notification: appTheme.colors.button,
    },
  };
};

export function useAppTheme(): AppTheme {
  const { appData } = useAppData();
  const colorScheme = useColorScheme();

  const mode = resolveThemeMode(appData.settings.themePreference, colorScheme);
  return useMemo(() => getAppTheme(mode), [mode]);
}

// Backward-compatible default for any non-migrated static imports.
export const theme = getAppTheme('dark');
export const paperTheme = buildPaperTheme(theme, 'dark');
