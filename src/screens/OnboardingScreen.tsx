import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Modal, Portal, Text, TextInput, TouchableRipple } from 'react-native-paper';

import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../theme';

const AMBIENT_EASING = Easing.inOut(Easing.sin);

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
  const { height, width } = useWindowDimensions();
  const isSmallHeight = height < 700;
  const isLandscape = width > height;
  const shouldTopAlignContent = isSmallHeight || isLandscape;

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  const [showIOSPickerModal, setShowIOSPickerModal] = useState(false);
  const [iosDraftDate, setIosDraftDate] = useState<Date>(new Date());

  const entryAnim = useRef(new Animated.Value(0)).current;
  const ambientTopDrift = useRef(new Animated.Value(0)).current;
  const ambientBottomDrift = useRef(new Animated.Value(0)).current;
  const ambientTopPulse = useRef(new Animated.Value(0)).current;
  const ambientBottomPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entryAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [entryAnim]);

  useEffect(() => {
    const topLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ambientTopDrift, {
          toValue: 1,
          duration: 18000,
          easing: AMBIENT_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(ambientTopDrift, {
          toValue: 0,
          duration: 18000,
          easing: AMBIENT_EASING,
          useNativeDriver: true,
        }),
      ]),
    );

    const bottomLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ambientBottomDrift, {
          toValue: 1,
          duration: 22000,
          easing: AMBIENT_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(ambientBottomDrift, {
          toValue: 0,
          duration: 22000,
          easing: AMBIENT_EASING,
          useNativeDriver: true,
        }),
      ]),
    );

    const topPulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ambientTopPulse, {
          toValue: 1,
          duration: 26000,
          easing: AMBIENT_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(ambientTopPulse, {
          toValue: 0,
          duration: 26000,
          easing: AMBIENT_EASING,
          useNativeDriver: true,
        }),
      ]),
    );

    const bottomPulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ambientBottomPulse, {
          toValue: 1,
          duration: 30000,
          easing: AMBIENT_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(ambientBottomPulse, {
          toValue: 0,
          duration: 30000,
          easing: AMBIENT_EASING,
          useNativeDriver: true,
        }),
      ]),
    );

    topLoop.start();
    bottomLoop.start();
    topPulseLoop.start();
    bottomPulseLoop.start();

    return () => {
      topLoop.stop();
      bottomLoop.stop();
      topPulseLoop.stop();
      bottomPulseLoop.stop();
    };
  }, [ambientBottomDrift, ambientBottomPulse, ambientTopDrift, ambientTopPulse]);

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
  const topBias = shouldTopAlignContent ? theme.spacing.s16 : Math.round(height * 0.08);
  const ambientTopDriftStyle = {
    transform: [
      {
        translateX: ambientTopDrift.interpolate({
          inputRange: [0, 1],
          outputRange: [-10, 10],
        }),
      },
      {
        translateY: ambientTopDrift.interpolate({
          inputRange: [0, 1],
          outputRange: [-9, 9],
        }),
      },
      {
        scale: ambientTopDrift.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.014],
        }),
      },
      {
        scale: ambientTopPulse.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.03],
        }),
      },
    ],
    opacity: ambientTopPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 0.66],
    }),
  };
  const ambientBottomDriftStyle = {
    transform: [
      {
        translateX: ambientBottomDrift.interpolate({
          inputRange: [0, 1],
          outputRange: [10, -10],
        }),
      },
      {
        translateY: ambientBottomDrift.interpolate({
          inputRange: [0, 1],
          outputRange: [8, -8],
        }),
      },
      {
        scale: ambientBottomDrift.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.014],
        }),
      },
      {
        scale: ambientBottomPulse.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.03],
        }),
      },
    ],
    opacity: ambientBottomPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.46, 0.62],
    }),
  };
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'bottom', 'left']}>
      <Animated.View pointerEvents="none" style={[styles.ambientTopHalo, ambientTopDriftStyle]} />
      <Animated.View pointerEvents="none" style={[styles.ambientTop, ambientTopDriftStyle]} />
      <Animated.View pointerEvents="none" style={[styles.ambientBottomHalo, ambientBottomDriftStyle]} />
      <Animated.View pointerEvents="none" style={[styles.ambientBottom, ambientBottomDriftStyle]} />
      <BlurView
        pointerEvents="none"
        style={styles.ambientDiffusion}
        intensity={58}
        tint="dark"
        experimentalBlurMethod="dimezisBlurView"
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flexOne}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          bounces={false}
          contentContainerStyle={[
            styles.scrollContent,
            shouldTopAlignContent && styles.scrollContentTopAligned,
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
  ambientTop: {
    position: 'absolute',
    top: -320,
    alignSelf: 'center',
    left: -120,
    width: 560,
    height: 560,
    borderRadius: 280,
    backgroundColor: 'rgba(86, 132, 255, 0.28)',
    shadowColor: '#4F7BFF',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.16,
    shadowRadius: 90,
  },
  ambientTopHalo: {
    position: 'absolute',
    top: -430,
    alignSelf: 'center',
    left: -180,
    width: 700,
    height: 700,
    borderRadius: 350,
    backgroundColor: 'rgba(70, 110, 220, 0.14)',
    shadowColor: '#446BCB',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.13,
    shadowRadius: 98,
  },
  ambientBottom: {
    position: 'absolute',
    bottom: -300,
    right: -170,
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: 'rgba(64, 199, 166, 0.22)',
    shadowColor: '#3BAF93',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.15,
    shadowRadius: 86,
  },
  ambientBottomHalo: {
    position: 'absolute',
    bottom: -420,
    right: -280,
    width: 640,
    height: 640,
    borderRadius: 320,
    backgroundColor: 'rgba(51, 160, 137, 0.12)',
    shadowColor: '#2E8F78',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.12,
    shadowRadius: 96,
  },
  ambientDiffusion: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 14, 24, 0.2)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.s16,
    paddingBottom: theme.spacing.s24,
  },
  scrollContentTopAligned: {
    justifyContent: 'flex-start',
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
