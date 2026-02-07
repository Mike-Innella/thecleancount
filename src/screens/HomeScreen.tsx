import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, View, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { IconButton, Text } from 'react-native-paper';

import { Screen } from '../components/Screen';
import { getAffirmationForDayNumber, getLocalCalendarDayNumber } from '../content/affirmations';
import { theme } from '../theme';
import { AppState } from '../types';
import { diffFromStart } from '../utils/time';

type HomeScreenProps = {
  state: AppState | null;
  onOpenSettings: () => void;
};

export function HomeScreen({ state, onOpenSettings }: HomeScreenProps) {
  const [now, setNow] = useState(new Date());
  const { width } = useWindowDimensions();

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const diff = useMemo(() => {
    if (!state) {
      return diffFromStart(new Date().toISOString(), now);
    }

    return diffFromStart(state.cleanStartISO, now);
  }, [state, now]);

  const [displayDays, setDisplayDays] = useState(diff.totalDays);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const ambientTopDrift = useRef(new Animated.Value(0)).current;
  const ambientBottomDrift = useRef(new Animated.Value(0)).current;
  const ambientTopPulse = useRef(new Animated.Value(0)).current;
  const ambientBottomPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (diff.totalDays === displayDays) {
      return;
    }

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setDisplayDays(diff.totalDays);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
  }, [diff.totalDays, displayDays, fadeAnim]);

  useEffect(() => {
    const topLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ambientTopDrift, {
          toValue: 1,
          duration: 14000,
          useNativeDriver: true,
        }),
        Animated.timing(ambientTopDrift, {
          toValue: 0,
          duration: 14000,
          useNativeDriver: true,
        }),
      ]),
    );

    const bottomLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ambientBottomDrift, {
          toValue: 1,
          duration: 17000,
          useNativeDriver: true,
        }),
        Animated.timing(ambientBottomDrift, {
          toValue: 0,
          duration: 17000,
          useNativeDriver: true,
        }),
      ]),
    );

    const topPulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ambientTopPulse, {
          toValue: 1,
          duration: 22000,
          useNativeDriver: true,
        }),
        Animated.timing(ambientTopPulse, {
          toValue: 0,
          duration: 22000,
          useNativeDriver: true,
        }),
      ]),
    );

    const bottomPulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ambientBottomPulse, {
          toValue: 1,
          duration: 26000,
          useNativeDriver: true,
        }),
        Animated.timing(ambientBottomPulse, {
          toValue: 0,
          duration: 26000,
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

  const topLine = state?.displayName ? `Hi ${state.displayName}` : 'The Clean Count';
  const supportiveAffirmation = useMemo(() => {
    const localDayNumber = getLocalCalendarDayNumber(now);
    return getAffirmationForDayNumber(localDayNumber);
  }, [now]);
  const numberSize = width < 380 ? 88 : 102;
  const ambientTopDriftStyle = {
    transform: [
      {
        translateX: ambientTopDrift.interpolate({
          inputRange: [0, 1],
          outputRange: [-3, 3],
        }),
      },
      {
        translateY: ambientTopDrift.interpolate({
          inputRange: [0, 1],
          outputRange: [-2, 2],
        }),
      },
      {
        scale: ambientTopDrift.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.008],
        }),
      },
      {
        scale: ambientTopPulse.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.012],
        }),
      },
    ],
    opacity: ambientTopPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.985, 1],
    }),
  };
  const ambientBottomDriftStyle = {
    transform: [
      {
        translateX: ambientBottomDrift.interpolate({
          inputRange: [0, 1],
          outputRange: [3, -3],
        }),
      },
      {
        translateY: ambientBottomDrift.interpolate({
          inputRange: [0, 1],
          outputRange: [2, -2],
        }),
      },
      {
        scale: ambientBottomDrift.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.008],
        }),
      },
      {
        scale: ambientBottomPulse.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.012],
        }),
      },
    ],
    opacity: ambientBottomPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.985, 1],
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
        tint="dark"
        experimentalBlurMethod="dimezisBlurView"
      />

      <View style={styles.topRow}>
        <Text style={styles.topLine}>{topLine}</Text>
        <IconButton
          icon="cog-outline"
          size={20}
          mode="contained-tonal"
          containerColor={theme.colors.bgSoft}
          iconColor={theme.colors.textPrimary}
          onPress={onOpenSettings}
          style={styles.settingsButton}
        />
      </View>

      <View style={styles.centerWrap}>
        <View style={styles.heroCard}>
          <Text style={styles.kicker}>Current streak</Text>

          <Animated.Text
            style={[styles.bigNumber, { fontSize: numberSize, opacity: fadeAnim, transform: [{ translateY }] }]}
          >
            {displayDays}
          </Animated.Text>
          <Text style={styles.primaryLabel}>days clean</Text>

          <View style={styles.metricDivider} />
          <Text style={styles.secondaryLine}>{`${diff.weeks}w ${diff.remainingDays}d • ${diff.totalHours} hours`}</Text>

          <View style={styles.supportiveWrap}>
            <View style={styles.supportiveDot} />
            <Text style={styles.supportiveLine}>{supportiveAffirmation}</Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    overflow: 'hidden',
  },
  ambientDiffusion: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 14, 24, 0.28)',
  },
  ambientTop: {
    position: 'absolute',
    top: -600,
    alignSelf: 'center',
    left: -260,
    width: 700,
    height: 700,
    borderRadius: 350,
    backgroundColor: '#1C2B46',
    opacity: 0.0012,
    shadowColor: '#2A3B59',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.065,
    shadowRadius: 84,
    elevation: 0,
  },
  ambientTopHalo: {
    position: 'absolute',
    top: -690,
    alignSelf: 'center',
    left: -320,
    width: 860,
    height: 860,
    borderRadius: 430,
    backgroundColor: '#223552',
    opacity: 0.0008,
    shadowColor: '#324867',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.05,
    shadowRadius: 92,
  },
  ambientBottom: {
    position: 'absolute',
    bottom: -560,
    right: -320,
    width: 560,
    height: 560,
    borderRadius: 280,
    backgroundColor: '#1B3A37',
    opacity: 0.0011,
    shadowColor: '#2D504C',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.06,
    shadowRadius: 80,
    elevation: 0,
  },
  ambientBottomHalo: {
    position: 'absolute',
    bottom: -680,
    right: -420,
    width: 760,
    height: 760,
    borderRadius: 380,
    backgroundColor: '#21433F',
    opacity: 0.0007,
    shadowColor: '#335A55',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.046,
    shadowRadius: 88,
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
    shadowOpacity: 0.34,
    shadowRadius: 28,
    elevation: 8,
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
});
