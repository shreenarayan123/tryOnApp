import React, {useEffect} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {COLORS} from '../../constants/colors';

interface CameraOverlayProps {
  instruction: string;
}

const Corner = ({style}: {style: object}) => <View style={[styles.corner, style]} />;

const CameraOverlay = ({instruction}: CameraOverlayProps) => {
  const pulse = useSharedValue(0.85);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, {duration: 1800, easing: Easing.inOut(Easing.quad)}),
      -1,
      true,
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: pulse.value}],
    opacity: 0.72 + pulse.value * 0.22,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.frame, animatedStyle]}>
        <Corner style={styles.topLeft} />
        <Corner style={styles.topRight} />
        <Corner style={styles.bottomLeft} />
        <Corner style={styles.bottomRight} />
      </Animated.View>
      <View style={styles.instructionPill}>
        <Text style={styles.instruction}>{instruction}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: '82%',
    height: '54%',
    borderRadius: 24,
  },
  corner: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderColor: 'rgba(15,23,42,0.72)',
    borderWidth: 2,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  instructionPill: {
    position: 'absolute',
    bottom: 26,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15,23,42,0.08)',
  },
  instruction: {
    color: COLORS.textPrimary,
    fontSize: 13,
    textAlign: 'center',
  },
});

export default CameraOverlay;
