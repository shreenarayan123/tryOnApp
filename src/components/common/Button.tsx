import React from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {COLORS} from '../../constants/colors';
import {FONTS} from '../../constants/fonts';

interface ButtonProps {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'ghost' | 'danger';
}

const Button = ({
  title,
  onPress,
  disabled,
  loading,
  variant = 'primary',
}: ButtonProps) => {
  const content = (
    <View
      style={[
        styles.base,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && styles.danger,
        disabled && styles.disabled,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? COLORS.textPrimary : COLORS.accent} />
      ) : (
        <Text
          style={[
            styles.title,
            variant === 'ghost' && styles.ghostTitle,
            variant === 'danger' && styles.dangerTitle,
          ]}>
          {title}
        </Text>
      )}
    </View>
  );

  if (variant === 'primary') {
    return (
      <Pressable disabled={disabled || loading} onPress={onPress} style={styles.shadow}>
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={[styles.base, disabled && styles.disabled]}>
          {loading ? (
            <ActivityIndicator color={COLORS.textPrimary} />
          ) : (
            <Text style={styles.title}>{title}</Text>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable disabled={disabled || loading} onPress={onPress} style={styles.shadow}>
      {content}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  shadow: {
    width: '100%',
  },
  base: {
    minHeight: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    backgroundColor: COLORS.surfaceLight,
  },
  title: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.medium,
    fontSize: 16,
  },
  ghost: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  ghostTitle: {
    color: COLORS.textPrimary,
  },
  danger: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  dangerTitle: {
    color: '#FCA5A5',
  },
  disabled: {
    opacity: 0.45,
  },
});

export default Button;
