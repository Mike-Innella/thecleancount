import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IconButton, Text } from 'react-native-paper';

import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { getAffirmationForDayNumber, getLocalCalendarDayNumber } from '../content/affirmations';
import { RootStackParamList } from '../navigation/types';
import { useAppData } from '../state/AppDataContext';
import { TimeDisplayPreference } from '../types/appTypes';
import { AppTheme, useAppTheme } from '../theme';
import { diffFromStart } from '../utils/time';

const AMBIENT_EASING = Easing.inOut(Easing.sin);
const TOAST_DURATION_MS = 2200;

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

const pluralize = (count: number, singular: string, plural = `${singular}s`): string =>
  count === 1 ? singular : plural;

const buildTimeDisplay = (
  diff: ReturnType<typeof diffFromStart>,
  preference: TimeDisplayPreference,
): { primaryValue: number; primaryLabel: string; secondaryLine: string } => {
  if (preference === 'weeks') {
    return {
      primaryValue: diff.weeks,
      primaryLabel: `${pluralize(diff.weeks, 'week')} clean`,
      secondaryLine: `${diff.totalDays} ${pluralize(diff.totalDays, 'day')} • ${diff.totalHours} ${pluralize(diff.totalHours, 'hour')}`,
    };
  }

  if (preference === 'hours') {
    return {
      primaryValue: diff.totalHours,
      primaryLabel: `${pluralize(diff.totalHours, 'hour')} clean`,
      secondaryLine: `${diff.totalDays} ${pluralize(diff.totalDays, 'day')} • ${diff.weeks}w ${diff.remainingDays}d`,
    };
  }

  if (preference === 'months') {
    return {
      primaryValue: diff.monthsApprox,
      primaryLabel: 'months clean (approx)',
      secondaryLine: `${diff.totalDays} ${pluralize(diff.totalDays, 'day')} • ${diff.weeks}w ${diff.remainingDays}d`,
    };
  }

  return {
    primaryValue: diff.totalDays,
    primaryLabel: `${pluralize(diff.totalDays, 'day')} clean`,
    secondaryLine: `${diff.weeks}w ${diff.remainingDays}d • ${diff.totalHours} ${pluralize(diff.totalHours, 'hour')}`,
  };
};

export function HomeScreen({ navigation, route }: HomeScreenProps) {
  const { appData } = useAppData();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [now, setNow] = useState(new Date());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { width, height } = useWindowDimensions();
  const isCompactLayout = width > height || height < 700;

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const incomingToast = route.params?.toastMessage;
    if (!incomingToast) {
      return;
    }

    setToastMessage(incomingToast);
    navigation.setParams({ toastMessage: undefined });
  }, [navigation, route.params?.toastMessage]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeout = setTimeout(() => {
      setToastMessage(null);
    }, TOAST_DURATION_MS);

    return () => clearTimeout(timeout);
  }, [toastMessage]);

  const diff = useMemo(() => diffFromStart(appData.cleanStartISO, now), [appData.cleanStartISO, now]);

  const timeDisplayPreference = appData.settings.timeDisplayPreference ?? 'days';
  const timeDisplay = useMemo(() => buildTimeDisplay(diff, timeDisplayPreference), [diff, timeDisplayPreference]);

  const [displayValue, setDisplayValue] = useState(timeDisplay.primaryValue);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const ambientTopDrift = useRef(new Animated.Value(0)).current;
  const ambientBottomDrift = useRef(new Animated.Value(0)).current;
  const ambientTopPulse = useRef(new Animated.Value(0)).current;
  const ambientBottomPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (timeDisplay.primaryValue === displayValue) {
      return;
    }

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setDisplayValue(timeDisplay.primaryValue);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
  }, [displayValue, fadeAnim, timeDisplay.primaryValue]);

  useEffect(() => {
    const topLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ambientTopDrift, {
          toValue: 1,
          duration: 14000,
          easing: AMBIENT_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(ambientTopDrift, {
          toValue: 0,
          duration: 14000,
          easing: AMBIENT_EASING,
          useNativeDriver: true,
        }),
      ]),
    );

    const bottomLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ambientBottomDrift, {
          toValue: 1,
          duration: 17000,
          easing: AMBIENT_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(ambientBottomDrift, {
          toValue: 0,
          duration: 17000,
          easing: AMBIENT_EASING,
          useNativeDriver: true,
        }),
      ]),
    );

    const topPulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ambientTopPulse, {
          toValue: 1,
          duration: 22000,
          easing: AMBIENT_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(ambientTopPulse, {
          toValue: 0,
          duration: 22000,
          easing: AMBIENT_EASING,
          useNativeDriver: true,
        }),
      ]),
    );

    const bottomPulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ambientBottomPulse, {
          toValue: 1,
          duration: 26000,
          easing: AMBIENT_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(ambientBottomPulse, {
          toValue: 0,
          duration: 26000,
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

  const translateY = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 0],
  });

  const topLine = appData.displayName ? `Hi ${appData.displayName}` : 'The Clean Count';
  const supportiveAffirmation = useMemo(() => {
    const localDayNumber = getLocalCalendarDayNumber(now);
    return getAffirmationForDayNumber(localDayNumber);
  }, [now]);
  const hardDayEnabled = appData.settings.hardDayModeEnabled;
  const numberSize = useMemo(() => {
    const baseSize = width < 380 ? (hardDayEnabled ? 78 : 88) : hardDayEnabled ? 90 : 102;
    const digits = String(timeDisplay.primaryValue).length;
    if (digits >= 4) {
      return Math.max(56, baseSize - 20);
    }
    if (digits >= 3) {
      return Math.max(64, baseSize - 10);
    }
    return baseSize;
  }, [hardDayEnabled, timeDisplay.primaryValue, width]);

  const ambientTopDriftStyle = {
    transform: [
      {
        translateX: ambientTopDrift.interpolate({
          inputRange: [0, 1],
          outputRange: [-12, 12],
        }),
      },
      {
        translateY: ambientTopDrift.interpolate({
          inputRange: [0, 1],
          outputRange: [-8, 8],
        }),
      },
      {
        scale: ambientTopDrift.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.015],
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
      outputRange: [0.52, 0.68],
    }),
  };
  const ambientBottomDriftStyle = {
    transform: [
      {
        translateX: ambientBottomDrift.interpolate({
          inputRange: [0, 1],
          outputRange: [11, -11],
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
          outputRange: [1, 1.015],
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
      outputRange: [0.48, 0.65],
    }),
  };

  return (
    <Screen style={styles.screen}>
      <Animated.View pointerEvents="none" style={[styles.ambientTopHalo, ambientTopDriftStyle]} />
      <Animated.View pointerEvents="none" style={[styles.ambientTop, ambientTopDriftStyle]} />
      <Animated.View pointerEvents="none" style={[styles.ambientBottomHalo, ambientBottomDriftStyle]} />
      <Animated.View pointerEvents="none" style={[styles.ambientBottom, ambientBottomDriftStyle]} />
      <BlurView
        pointerEvents="none"
        style={styles.ambientDiffusion}
        intensity={58}
        tint={theme.colors.bg === '#F3F6FB' ? 'light' : 'dark'}
        experimentalBlurMethod="dimezisBlurView"
      />

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            minHeight: Math.max(height - theme.spacing.s32, 0),
          },
        ]}
      >
        <View style={styles.topRow}>
          <Text style={styles.topLine}>{topLine}</Text>
          <IconButton
            icon="cog-outline"
            size={20}
            mode="contained-tonal"
            containerColor={theme.colors.bgSoft}
            iconColor={theme.colors.textPrimary}
            onPress={() => navigation.navigate('Settings')}
            style={styles.settingsButton}
          />
        </View>

        <View style={[styles.centerWrap, isCompactLayout && styles.centerWrapCompact]}>
          <View style={[styles.heroCard, hardDayEnabled && styles.heroCardHardDay]}>
            <Text style={styles.kicker}>Current count</Text>

            <Animated.Text
              style={[
                styles.bigNumber,
                {
                  fontSize: numberSize,
                  opacity: hardDayEnabled ? 0.78 : fadeAnim,
                  transform: [{ translateY }],
                },
              ]}
            >
              {displayValue}
            </Animated.Text>
            <Text style={[styles.primaryLabel, hardDayEnabled && styles.primaryLabelSoft]}>{timeDisplay.primaryLabel}</Text>

            <View style={styles.metricDivider} />
            <Text style={styles.secondaryLine}>{timeDisplay.secondaryLine}</Text>

            <View style={styles.supportiveWrap}>
              <View style={styles.supportiveDot} />
              <Text style={styles.supportiveLine}>{supportiveAffirmation}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {toastMessage ? (
        <View pointerEvents="none" style={styles.toastWrap}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}

      <IconButton
        icon="pencil-outline"
        size={20}
        mode="contained-tonal"
        containerColor={theme.colors.bgSoft}
        iconColor={theme.colors.textPrimary}
        onPress={() => navigation.navigate('CheckIn')}
        style={[styles.checkInButton, toastMessage ? styles.bottomButtonRaised : null]}
      />
      <IconButton
        icon="note-multiple-outline"
        size={20}
        mode="contained-tonal"
        containerColor={theme.colors.bgSoft}
        iconColor={theme.colors.textPrimary}
        onPress={() => navigation.navigate('Notes')}
        style={[styles.notesButton, toastMessage ? styles.bottomButtonRaised : null]}
      />
    </Screen>
  );
}

const createStyles = (theme: AppTheme) => {
  const isLightMode = theme.colors.bg === '#F3F6FB';

  return StyleSheet.create({
    screen: {
      overflow: 'hidden',
    },
    scrollContent: {
      flexGrow: 1,
    },
    ambientDiffusion: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isLightMode ? 'rgba(255, 255, 255, 0.18)' : 'rgba(9, 14, 24, 0.2)',
    },
    ambientTop: {
      position: 'absolute',
      top: -500,
      alignSelf: 'center',
      left: -200,
      width: 640,
      height: 640,
      borderRadius: 320,
      backgroundColor: 'rgba(86, 132, 255, 0.28)',
      shadowColor: '#4F7BFF',
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.18,
      shadowRadius: 96,
      elevation: 0,
    },
    ambientTopHalo: {
      position: 'absolute',
      top: -600,
      alignSelf: 'center',
      left: -290,
      width: 820,
      height: 820,
      borderRadius: 410,
      backgroundColor: 'rgba(70, 110, 220, 0.16)',
      shadowColor: '#446BCB',
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.14,
      shadowRadius: 102,
    },
    ambientBottom: {
      position: 'absolute',
      bottom: -430,
      right: -220,
      width: 540,
      height: 540,
      borderRadius: 270,
      backgroundColor: 'rgba(64, 199, 166, 0.25)',
      shadowColor: '#3BAF93',
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.16,
      shadowRadius: 92,
      elevation: 0,
    },
    ambientBottomHalo: {
      position: 'absolute',
      bottom: -540,
      right: -340,
      width: 700,
      height: 700,
      borderRadius: 350,
      backgroundColor: 'rgba(51, 160, 137, 0.14)',
      shadowColor: '#2E8F78',
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.12,
      shadowRadius: 98,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    topLine: {
      color: theme.colors.textSubtle,
      fontSize: 13,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    settingsButton: {
      margin: 0,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    centerWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: theme.spacing.s32,
    },
    centerWrapCompact: {
      flexGrow: 0,
      justifyContent: 'flex-start',
      paddingTop: theme.spacing.s16,
      paddingBottom: theme.spacing.s16,
    },
    heroCard: {
      width: '100%',
      maxWidth: 380,
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      borderRadius: 30,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      paddingTop: theme.spacing.s28,
      paddingBottom: theme.spacing.s28,
      paddingHorizontal: theme.spacing.s24,
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 16,
      },
      shadowOpacity: isLightMode ? 0.08 : 0.34,
      shadowRadius: 28,
      elevation: 8,
    },
    heroCardHardDay: {
      paddingTop: theme.spacing.s24,
      paddingBottom: theme.spacing.s24,
      borderColor: isLightMode ? '#9FB5DB' : '#2A3E63',
    },
    kicker: {
      color: theme.colors.textSubtle,
      ...theme.typography.label,
      marginBottom: theme.spacing.s12,
    },
    bigNumber: {
      color: theme.colors.textPrimary,
      ...theme.typography.display,
      lineHeight: 106,
    },
    primaryLabel: {
      color: theme.colors.textPrimary,
      fontSize: 22,
      fontWeight: '500',
      marginTop: 2,
      letterSpacing: 0.2,
    },
    primaryLabelSoft: {
      color: theme.colors.textMuted,
      fontSize: 20,
    },
    metricDivider: {
      width: '100%',
      height: 1,
      marginTop: theme.spacing.s20,
      marginBottom: theme.spacing.s16,
      backgroundColor: theme.colors.divider,
    },
    secondaryLine: {
      color: theme.colors.textMuted,
      ...theme.typography.body,
    },
    supportiveWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.s20,
    },
    supportiveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#52D6B7',
      marginRight: 8,
    },
    supportiveLine: {
      color: theme.colors.textMuted,
      fontSize: 13,
      letterSpacing: 0.2,
    },
    toastWrap: {
      position: 'absolute',
      left: theme.spacing.s20,
      right: theme.spacing.s20,
      bottom: theme.spacing.s20,
      paddingVertical: theme.spacing.s12,
      paddingHorizontal: theme.spacing.s16,
      borderRadius: 14,
      backgroundColor: isLightMode ? 'rgba(245, 248, 255, 0.97)' : 'rgba(15, 27, 43, 0.95)',
      borderWidth: 1,
      borderColor: isLightMode ? '#BFD0E9' : '#2E4A6F',
    },
    toastText: {
      color: theme.colors.textPrimary,
      textAlign: 'center',
      ...theme.typography.body,
    },
    checkInButton: {
      position: 'absolute',
      left: theme.spacing.s20,
      bottom: theme.spacing.s20,
      margin: 0,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    notesButton: {
      position: 'absolute',
      right: theme.spacing.s20,
      bottom: theme.spacing.s20,
      margin: 0,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    bottomButtonRaised: {
      bottom: theme.spacing.s40 + 42,
    },
  });
};
