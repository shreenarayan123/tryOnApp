import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {COLORS} from '../../constants/colors';

interface ShareButtonProps {
  title: string;
  onPress: () => void;
}

const ShareButton = ({title, onPress}: ShareButtonProps) => {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <MaterialCommunityIcons name="share-variant-outline" size={18} color={COLORS.textPrimary} />
      <Text style={styles.title}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15,23,42,0.08)',
  },
  title: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
});

export default ShareButton;
