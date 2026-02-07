import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, View, useWindowDimensions } from 'react-native';
import { IconButton, Text } from 'react-native-paper';

import { Screen } from '../components/Screen';
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

    topLoop.start();
    bottomLoop.start();

    return () => {
      topLoop.stop();
      bottomLoop.stop();
    };
  }, [ambientBottomDrift, ambientTopDrift]);

  const translateY = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 0],
  });

  const topLine = state?.displayName ? `Hi ${state.displayName}` : 'The Clean Count';
  const numberSize = width < 380 ? 88 : 102;
  const ambientTopDriftStyle = {
    transform: [
      {
        translateX: ambientTopDrift.interpolate({
          inputRange: [0, 1],
          outputRange: [-7, 7],
        }),
      },
      {
        translateY: ambientTopDrift.interpolate({
          inputRange: [0, 1],
          outputRange: [-5, 5],
        }),
      },
      {
        scale: ambientTopDrift.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.025],
        }),
      },
    ],
  };
  const ambientBottomDriftStyle = {
    transform: [
      {
        translateX: ambientBottomDrift.interpolate({
          inputRange: [0, 1],
          outputRange: [6, -6],
        }),
      },
      {
        translateY: ambientBottomDrift.interpolate({
          inputRange: [0, 1],
          outputRange: [5, -5],
        }),
      },
      {
        scale: ambientBottomDrift.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.02],
        }),
      },
    ],
  };

  return (
    <Screen style={styles.screen}>
      <Animated.View pointerEvents="none" style={[styles.ambientTopHalo, ambientTopDriftStyle]} />
      <Animated.View pointerEvents="none" style={[styles.ambientTop, ambientTopDriftStyle]} />
      <Animated.View pointerEvents="none" style={[styles.ambientBottomHalo, ambientBottomDriftStyle]} />
      <Animated.View pointerEvents="none" style={[styles.ambientBottom, ambientBottomDriftStyle]} />

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
            <Text style={styles.supportiveLine}>One steady day at a time.</Text>
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
  ambientTop: {
    position: 'absolute',
    top: -220,
    alignSelf: 'center',
    width: 540,
    height: 540,
    borderRadius: 270,
    backgroundColor: theme.colors.cardGlow,
    opacity: 0.022,
    borderWidth: 1,
    borderColor: '#CFE0FF1A',
    shadowColor: '#BFD8FF',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.14,
    shadowRadius: 42,
    elevation: 6,
  },
  ambientTopHalo: {
    position: 'absolute',
    top: -270,
    alignSelf: 'center',
    width: 640,
    height: 640,
    borderRadius: 320,
    backgroundColor: '#9CC4FF',
    opacity: 0.008,
    shadowColor: '#CDE2FF',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.14,
    shadowRadius: 56,
  },
  ambientBottom: {
    position: 'absolute',
    bottom: -250,
    right: -120,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: '#52D6B7',
    opacity: 0.02,
    borderWidth: 1,
    borderColor: '#CEFFF51A',
    shadowColor: '#BFFFF1',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.13,
    shadowRadius: 36,
    elevation: 4,
  },
  ambientBottomHalo: {
    position: 'absolute',
    bottom: -300,
    right: -165,
    width: 520,
    height: 520,
    borderRadius: 260,
    backgroundColor: '#7BF0DA',
    opacity: 0.007,
    shadowColor: '#C8FFF5',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.12,
    shadowRadius: 48,
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
