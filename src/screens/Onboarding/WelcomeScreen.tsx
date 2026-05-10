import React, {useEffect} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Button from '../../components/common/Button';
import {COLORS} from '../../constants/colors';
import {FONT_SIZES, FONTS} from '../../constants/fonts';
import {OnboardingStackParamList} from '../../types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Welcome'>;

const WelcomeScreen = ({navigation}: Props) => {
  const pulse = useSharedValue(0.9);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.06, {duration: 1800, easing: Easing.inOut(Easing.quad)}),
      -1,
      true,
    );
  }, [pulse]);

  const illustrationStyle = useAnimatedStyle(() => ({
    transform: [{scale: pulse.value}],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.topArea}>
        <Animated.View style={[styles.illustrationWrap, illustrationStyle]}>
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            style={styles.illustration}>
            <MaterialCommunityIcons name="hanger" size={84} color={COLORS.textPrimary} />
          </LinearGradient>
        </Animated.View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>TrySnap</Text>
        <Text style={styles.tagline}>Try any outfit. In seconds.</Text>
      </View>

      <View style={styles.footer}>
        <Button title="Get Started — It's Free" onPress={() => navigation.navigate('AvatarSetup')} />
        <Text style={styles.note}>No account needed  •  Works offline  •  Android only</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 44,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  topArea: {
    flex: 0.45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationWrap: {
    width: 210,
    height: 210,
    borderRadius: 105,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  illustration: {
    flex: 1,
    borderRadius: 95,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accent,
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
  content: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  tagline: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
  },
  footer: {
    gap: 12,
  },
  note: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
});

export default WelcomeScreen;
