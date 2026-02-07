import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { theme } from '../theme';

type LabeledInputProps = {
  label: string;
  value: string;
  placeholder?: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  editable?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
};

export function LabeledInput({
  label,
  value,
  placeholder,
  onChangeText,
  onPress,
  editable = true,
  keyboardType,
  autoCapitalize = 'words',
}: LabeledInputProps) {
  const isPressable = typeof onPress === 'function';

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      {isPressable ? (
        <Pressable style={({ pressed }) => [styles.inputShell, pressed && styles.inputPressed]} onPress={onPress}>
          <Text style={styles.valueText}>{value || placeholder || ''}</Text>
        </Pressable>
      ) : (
        <TextInput
          style={styles.inputShell}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.placeholder}
          editable={editable}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          selectionColor={theme.colors.textPrimary}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: theme.spacing.s16,
  },
  label: {
    color: theme.colors.textMuted,
    ...theme.typography.label,
    marginBottom: theme.spacing.s8,
  },
  inputShell: {
    minHeight: 52,
    borderRadius: theme.radius.input,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    backgroundColor: theme.colors.inputBg,
    color: theme.colors.textPrimary,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.s12,
    ...theme.typography.input,
  },
  valueText: {
    color: theme.colors.textPrimary,
    ...theme.typography.input,
  },
  inputPressed: {
    opacity: 0.92,
  },
});
