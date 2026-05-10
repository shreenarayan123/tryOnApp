import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {COLORS} from '../../constants/colors';

interface CaptureButtonProps {
  onPress: () => void;
}

const CaptureButton = ({onPress}: CaptureButtonProps) => {
  return (
    <Pressable onPress={onPress} style={styles.outer}>
      <View style={styles.ring}>
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.inner}>
          <MaterialCommunityIcons name="camera" size={28} color={COLORS.textPrimary} />
        </LinearGradient>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  outer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CaptureButton;
