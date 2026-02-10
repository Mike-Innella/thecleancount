import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { BlurView } from 'expo-blur';

import { AppTheme, useAppTheme } from '../theme';
import { ThreeRippleSurface } from './ThreeRippleSurface';

export const LAUNCH_SPLASH_EXIT_DURATION_MS = 560;

type LaunchSplashProps = {
  visible: boolean;
  onExited?: () => void;
};

export function LaunchSplash({ visible, onExited }: LaunchSplashProps) {
  const theme = useAppTheme();
  const isLightMode = theme.colors.bg === '#F3F6FB';
  const styles = useMemo(() => createStyles(theme, isLightMode), [isLightMode, theme]);

  const dropProgress = useRef(new Animated.Value(0)).current;
  const exitProgress = useRef(new Animated.Value(0)).current;
  const hasExitedRef = useRef(false);

  useEffect(() => {
    Animated.timing(dropProgress, {
      toValue: 1,
      duration: 980,
      easing: Easing.bezier(0.2, 0.85, 0.22, 1),
      useNativeDriver: true,
    }).start();
  }, [dropProgress]);

  useEffect(() => {
    if (visible || hasExitedRef.current) {
      return;
    }

    Animated.timing(exitProgress, {
      toValue: 1,
      duration: LAUNCH_SPLASH_EXIT_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      hasExitedRef.current = true;
      onExited?.();
    });
  }, [exitProgress, onExited, visible]);

  const overlayStyle = {
    opacity: exitProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    }),
    transform: [
      {
        scale: exitProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.03],
        }),
      },
    ],
  };

  const pebbleStyle = {
    opacity: dropProgress.interpolate({
      inputRange: [0, 0.12, 1],
      outputRange: [0, 1, 1],
    }),
    transform: [
      {
        translateY: dropProgress.interpolate({
          inputRange: [0, 0.84, 1],
          outputRange: [-92, 6, 0],
        }),
      },
      {
        scale: dropProgress.interpolate({
          inputRange: [0, 0.9, 1],
          outputRange: [0.7, 1.06, 1],
        }),
      },
    ],
  };

  const pebbleShadowStyle = {
    opacity: dropProgress.interpolate({
      inputRange: [0, 0.9, 1],
      outputRange: [0, 0.24, 0.18],
    }),
    transform: [
      {
        scaleX: dropProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 1],
        }),
      },
      {
        scaleY: dropProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.35, 1],
        }),
      },
    ],
  };

  return (
    <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="auto">
      <View style={styles.base} />
      <BlurView
        pointerEvents="none"
        style={styles.sceneBlurVeil}
        intensity={24}
        tint={isLightMode ? 'light' : 'dark'}
        experimentalBlurMethod="dimezisBlurView"
      />

      <View style={styles.centerWrap}>
        <View style={styles.rippleStage}>
          <ThreeRippleSurface isLightMode={isLightMode} />
        </View>
        <BlurView
          pointerEvents="none"
          style={styles.rippleBlur}
          intensity={16}
          tint={isLightMode ? 'light' : 'dark'}
          experimentalBlurMethod="dimezisBlurView"
        />

        <Animated.View pointerEvents="none" style={[styles.pebbleShadow, pebbleShadowStyle]} />
        <Animated.View pointerEvents="none" style={[styles.pebble, pebbleStyle]} />
      </View>

      <View style={styles.labelWrap}>
        <Text style={styles.title}>The Clean Count</Text>
        <Text style={styles.subtitle}>one moment at a time</Text>
      </View>
    </Animated.View>
  );
}

const createStyles = (theme: AppTheme, isLightMode: boolean) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 1000,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.bg,
    },
    base: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.bg === '#F3F6FB' ? '#EAF1FB' : '#061021',
    },
    centerWrap: {
      width: 280,
      height: 280,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rippleStage: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 140,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isLightMode ? 'rgba(56, 122, 219, 0.34)' : 'rgba(113, 185, 255, 0.32)',
    },
    rippleBlur: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 140,
      backgroundColor: isLightMode ? 'rgba(255, 255, 255, 0.14)' : 'rgba(6, 13, 24, 0.14)',
    },
    sceneBlurVeil: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isLightMode ? 'rgba(248, 252, 255, 0.1)' : 'rgba(5, 11, 22, 0.16)',
    },
    pebble: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.colors.bg === '#F3F6FB' ? '#4E6F99' : '#8BA6CC',
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.18,
      shadowRadius: 9,
      elevation: 4,
    },
    pebbleShadow: {
      position: 'absolute',
      width: 34,
      height: 12,
      borderRadius: 8,
      backgroundColor: '#000000',
      opacity: 0.18,
      transform: [{ translateY: 18 }],
    },
    labelWrap: {
      position: 'absolute',
      bottom: 78,
      alignItems: 'center',
    },
    title: {
      color: theme.colors.textPrimary,
      fontFamily: theme.typography.h1.fontFamily,
      fontSize: 28,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    subtitle: {
      marginTop: 8,
      color: theme.colors.textMuted,
      fontFamily: theme.typography.body.fontFamily,
      fontSize: 14,
      letterSpacing: 0.35,
      textTransform: 'lowercase',
    },
  });
