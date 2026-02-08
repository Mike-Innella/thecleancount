import { useMemo } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Button } from 'react-native-paper';

import { AppTheme, useAppTheme } from '../theme';

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({ title, onPress, disabled = false, loading = false, style }: PrimaryButtonProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Button
      mode="contained"
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      buttonColor={disabled ? theme.colors.inputBorder : theme.colors.button}
      textColor={disabled ? theme.colors.textMuted : theme.colors.buttonText}
      style={[styles.button, style]}
      contentStyle={styles.content}
      labelStyle={styles.label}
      theme={{
        roundness: theme.radius.button,
      }}
    >
      {title}
    </Button>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    button: {
      width: '100%',
      borderRadius: theme.radius.button,
      borderWidth: 1,
      borderColor: `${theme.colors.button}66`,
      shadowColor: theme.colors.button,
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.2,
      shadowRadius: 14,
      elevation: 4,
    },
    content: {
      minHeight: 52,
    },
    label: {
      ...theme.typography.button,
      letterSpacing: 0,
    },
  });
