import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Button } from 'react-native-paper';

import { theme } from '../theme';

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({ title, onPress, disabled = false, loading = false, style }: PrimaryButtonProps) {
  return (
    <Button
      mode="contained"
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      buttonColor={disabled ? '#2B3550' : theme.colors.button}
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

const styles = StyleSheet.create({
  button: {
    width: '100%',
    borderRadius: theme.radius.button,
    borderWidth: 1,
    borderColor: '#7AAEFF44',
    shadowColor: '#1F4EA0',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.28,
    shadowRadius: 16,
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
