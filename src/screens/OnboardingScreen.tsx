import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Modal, Portal, Text, TextInput, TouchableRipple } from 'react-native-paper';

import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../theme';

type OnboardingSubmitPayload = {
  cleanStartISO: string;
  displayName?: string;
};

type OnboardingScreenProps = {
  onSubmit: (payload: OnboardingSubmitPayload) => Promise<void>;
};

const formatDate = (value: Date): string =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(value);

const normalizeDateToLocalNoonISO = (value: Date): string => {
  const localNoon = new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12, 0, 0, 0);
  return localNoon.toISOString();
};

export function OnboardingScreen({ onSubmit }: OnboardingScreenProps) {
  const { height } = useWindowDimensions();
  const isSmallHeight = height < 700;

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  const [showIOSPickerModal, setShowIOSPickerModal] = useState(false);
  const [iosDraftDate, setIosDraftDate] = useState<Date>(new Date());

  const entryAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entryAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [entryAnim]);

  const animatedCardStyle = useMemo(
    () => ({
      opacity: entryAnim,
      transform: [
        {
          translateY: entryAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [6, 0],
          }),
        },
      ],
    }),
    [entryAnim],
  );

  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      setShowAndroidPicker(true);
      return;
    }

    setIosDraftDate(selectedDate ?? new Date());
    setShowIOSPickerModal(true);
  };

  const handleAndroidDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowAndroidPicker(false);

    if (event.type === 'set' && date) {
      setSelectedDate(date);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate || isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      await onSubmit({
        cleanStartISO: normalizeDateToLocalNoonISO(selectedDate),
        displayName: displayName.trim() || undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isDateFocused = showAndroidPicker || showIOSPickerModal;
  const isButtonDisabled = !selectedDate || isSaving;
  const cardTopPadding = isSmallHeight ? 18 : 22;
  const topBias = isSmallHeight ? 24 : Math.round(height * 0.08);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'bottom', 'left']}>
      <View style={styles.glow} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flexOne}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          bounces={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              minHeight: height,
              paddingTop: topBias,
            },
          ]}
        >
          <Animated.View style={[styles.card, { paddingTop: cardTopPadding }, animatedCardStyle]}>
            <Text variant="headlineMedium" style={[styles.title, isSmallHeight && styles.titleSmall]}>
              Welcome
            </Text>
            <Text style={[styles.subtitle, isSmallHeight && styles.subtitleSmall]}>
              We&apos;re glad you&apos;re here. Let&apos;s start with your clean date.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Clean date</Text>
              <TouchableRipple
                borderless={false}
                onPress={openDatePicker}
                style={[styles.dateInput, isDateFocused && styles.inputFocused]}
              >
                <View style={styles.dateInputRow}>
                  <Text style={[styles.inputText, !selectedDate && styles.placeholderText]}>
                    {selectedDate ? formatDate(selectedDate) : 'Select a date'}
                  </Text>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </TouchableRipple>
            </View>

            <View style={styles.lastFieldGroup}>
              <Text style={styles.fieldLabel}>Name (optional)</Text>
              <TextInput
                mode="outlined"
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your name"
                placeholderTextColor={theme.colors.placeholder}
                keyboardAppearance="dark"
                autoCapitalize="words"
                autoCorrect={false}
                style={styles.nameInputShell}
                contentStyle={styles.nameInputContent}
                outlineStyle={styles.nameInputOutline}
                activeOutlineColor={theme.colors.focusRing}
                outlineColor={theme.colors.inputBorder}
                textColor={theme.colors.textPrimary}
                selectionColor={theme.colors.textPrimary}
                theme={{ colors: { background: theme.colors.inputBg } }}
              />
            </View>

            <PrimaryButton
              title="Start tracking"
              loading={isSaving}
              onPress={() => {
                void handleSubmit();
              }}
              disabled={isButtonDisabled}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {showAndroidPicker && (
        <DateTimePicker
          value={selectedDate ?? new Date()}
          mode="date"
          maximumDate={new Date()}
          display="default"
          onChange={handleAndroidDateChange}
        />
      )}

      <Portal>
        <Modal
          visible={showIOSPickerModal}
          onDismiss={() => setShowIOSPickerModal(false)}
          contentContainerStyle={styles.modalWrap}
          style={styles.modalRoot}
        >
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <DateTimePicker
              value={iosDraftDate}
              mode="date"
              maximumDate={new Date()}
              display="spinner"
              onChange={(_event, date) => {
                if (date) {
                  setIosDraftDate(date);
                }
              }}
              textColor={theme.colors.textPrimary}
            />
            <View style={styles.sheetActions}>
              <Button mode="text" onPress={() => setShowIOSPickerModal(false)} style={styles.sheetActionButton}>
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={() => {
                  setSelectedDate(iosDraftDate);
                  setShowIOSPickerModal(false);
                }}
                style={styles.sheetActionButton}
              >
                Done
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  flexOne: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    top: '20%',
    alignSelf: 'center',
    width: 520,
    height: 520,
    borderRadius: 260,
    opacity: 0.12,
    backgroundColor: '#2E6BFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.s16,
    paddingBottom: theme.spacing.s24,
  },
  card: {
    width: '92%',
    maxWidth: 360,
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: theme.radius.card,
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginTop: 0,
    marginBottom: theme.spacing.s8,
  },
  titleSmall: {
    fontSize: 26,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    textAlign: 'center',
    maxWidth: 300,
    alignSelf: 'center',
    marginBottom: 18,
  },
  subtitleSmall: {
    maxWidth: 280,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  lastFieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    ...theme.typography.label,
    color: theme.colors.textMuted,
    textTransform: 'none',
    marginBottom: 8,
  },
  dateInput: {
    height: 52,
    borderRadius: theme.radius.input,
    backgroundColor: theme.colors.inputBg,
    borderColor: theme.colors.inputBorder,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dateInputRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  inputFocused: {
    borderColor: theme.colors.focusRing,
  },
  inputText: {
    ...theme.typography.input,
    color: theme.colors.textPrimary,
  },
  placeholderText: {
    color: theme.colors.placeholder,
  },
  chevron: {
    color: theme.colors.textMuted,
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 18,
  },
  nameInputShell: {
    height: 52,
    backgroundColor: theme.colors.inputBg,
  },
  nameInputOutline: {
    borderRadius: theme.radius.input,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
  },
  nameInputContent: {
    ...theme.typography.input,
    color: theme.colors.textPrimary,
    paddingHorizontal: 14,
  },
  modalRoot: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalWrap: {
    marginHorizontal: 0,
  },
  modalSheet: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radius.card,
    borderTopRightRadius: theme.radius.card,
    borderTopWidth: 1,
    borderColor: theme.colors.cardBorder,
    paddingTop: theme.spacing.s12,
    paddingHorizontal: theme.spacing.s12,
    paddingBottom: theme.spacing.s20,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    backgroundColor: theme.colors.divider,
    marginBottom: theme.spacing.s8,
  },
  sheetActions: {
    flexDirection: 'row',
    columnGap: theme.spacing.s12,
    marginTop: theme.spacing.s12,
  },
  sheetActionButton: {
    flex: 1,
  },
});
