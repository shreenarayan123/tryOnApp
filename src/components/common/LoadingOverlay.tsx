import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {COLORS} from '../../constants/colors';

interface LoadingOverlayProps {
  label?: string;
}

const LoadingOverlay = ({label = 'Loading...'}: LoadingOverlayProps) => {
  return (
    <View style={styles.container} pointerEvents="none">
      <ActivityIndicator color={COLORS.accent} size="large" />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248,250,252,0.86)',
  },
  text: {
    color: COLORS.textSecondary,
    marginTop: 12,
  },
});

export default LoadingOverlay;
