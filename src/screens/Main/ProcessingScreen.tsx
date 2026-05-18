import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTryOn} from '../../hooks/useTryOn';
import {useAds} from '../../hooks/useAds';
import {useUserStore} from '../../store/useUserStore';
import {CameraStackParamList} from '../../types';
import {COLORS} from '../../constants/colors';
import {triggerImpact} from '../../utils/haptics';

type Props = NativeStackScreenProps<CameraStackParamList, 'Processing'>;

const Sparkle = ({delay, top, left}: {delay: number; top: number; left: number}) => {
  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withRepeat(
      withTiming(1, {duration: 1800 + delay, easing: Easing.inOut(Easing.quad)}),
      -1,
      false,
    );
  }, [delay, offset]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateY: -12 * offset.value}],
    opacity: 0.3 + offset.value * 0.7,
  }));

  return <Animated.View style={[styles.sparkle, {top, left}, animatedStyle]} />;
};

const ProcessingScreen = ({navigation, route}: Props) => {
  const isPro = useUserStore(state => state.isPro);
  const {startTryOn, status, resultUrl, error} = useTryOn();
  const {loadInterstitial, showInterstitial, isAdLoaded} = useAds();
  const garmentImagePath = route.params.garmentImagePath;
  const [progress, setProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startedAd = useRef(false);
  const startedTryOn = useRef(false);

  useEffect(() => {
    loadInterstitial();
  }, [loadInterstitial]);

  useEffect(() => {
    if (!isPro && isAdLoaded && !startedAd.current) {
      startedAd.current = true;
      setTimeout(() => showInterstitial(), 900);
    }
  }, [isAdLoaded, isPro, showInterstitial]);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const seconds = Math.floor((Date.now() - start) / 1000);
      setElapsedSeconds(seconds);
      setProgress(value => {
        if (status === 'done') {
          return Math.min(100, value + 12);
        }

        if (value < 70) {
          return Math.min(70, value + 2.5);
        }

        return value;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (startedTryOn.current) {
      return;
    }

    startedTryOn.current = true;
    let mounted = true;
    (async () => {
      try {
        triggerImpact('medium');
        await startTryOn(garmentImagePath);
      } catch (cause) {
        if (!mounted) {
          return;
        }

        const message = cause instanceof Error ? cause.message : 'Try-on failed.';
        Alert.alert('Try-on failed', message, [
          {
            text: 'Back to camera',
            onPress: () => navigation.popToTop(),
          },
        ]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [garmentImagePath, navigation, startTryOn]);

  useEffect(() => {
    if (resultUrl) {
      setProgress(100);
      const timer = setTimeout(() => {
        navigation.replace('Result', {
          resultImagePath: resultUrl,
          garmentImagePath,
        });
      }, 350);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [garmentImagePath, navigation, resultUrl]);

  useEffect(() => {
    if (error) {
      setProgress(0);
    }
  }, [error]);

  const statusText = useMemo(() => {
    if (elapsedSeconds < 2) {
      return 'Analyzing your outfit...';
    }
    if (elapsedSeconds < 5) {
      return 'Mapping to your avatar...';
    }
    if (elapsedSeconds < 8) {
      return 'Applying colors and textures...';
    }
    return 'Almost there...';
  }, [elapsedSeconds]);

  return (
    <View style={styles.container}>
      <View style={styles.topHalf}>
        {isPro ? (
          <View style={styles.processingVisual}>
            <MaterialCommunityIcons name="crown-outline" size={54} color={COLORS.warning} />
            <Text style={styles.processingVisualText}>Priority processing unlocked</Text>
          </View>
        ) : (
          <View style={styles.processingVisual}>
            <MaterialCommunityIcons name="timer-sand" size={54} color={COLORS.accent} />
            <Text style={styles.processingVisualText}>Sponsored processing slot</Text>
            <Text style={styles.processingVisualSubtext}>Ad may appear briefly while we work.</Text>
          </View>
        )}
        <Sparkle delay={0} top={40} left={42} />
        <Sparkle delay={180} top={120} left={260} />
        <Sparkle delay={320} top={170} left={120} />
        <Sparkle delay={520} top={250} left={220} />
      </View>

      <View style={styles.bottomHalf}>
        <View style={styles.progressOuter}>
          <View style={[styles.progressInner, {width: `${progress}%`}]} />
        </View>
        <Text style={styles.statusText}>{statusText}</Text>
        <Text style={styles.helperText}>Usually takes 5–10 seconds</Text>

        <View style={styles.statusRow}>
          <ActivityIndicator color={COLORS.accent} />
          <Text style={styles.processingState}>{status === 'done' ? 'Wrapping up...' : 'Processing...'}</Text>
        </View>

        <Pressable onPress={() => navigation.popToTop()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topHalf: {
    flex: 1,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  processingVisual: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
  processingVisualText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  processingVisualSubtext: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  sparkle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  bottomHalf: {
    padding: 20,
    gap: 12,
    backgroundColor: COLORS.background,
  },
  progressOuter: {
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.08)',
    overflow: 'hidden',
  },
  progressInner: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.accent,
  },
  statusText: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  helperText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  processingState: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 10,
  },
});

export default ProcessingScreen;
