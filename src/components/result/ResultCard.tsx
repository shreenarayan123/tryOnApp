import React from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import FastImage from 'react-native-fast-image';
import {COLORS} from '../../constants/colors';

interface ResultCardProps {
  imageUri: string;
  timestampLabel: string;
  onPress?: () => void;
  onLongPress?: () => void;
}

const ResultCard = ({imageUri, timestampLabel, onPress, onLongPress}: ResultCardProps) => {
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={styles.card}>
      <FastImage source={{uri: imageUri}} style={styles.image} resizeMode={FastImage.resizeMode.cover} />
      <Text style={styles.timestamp} numberOfLines={1}>
        {timestampLabel}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
  },
  image: {
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
  },
  timestamp: {
    marginTop: 8,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
});

export default ResultCard;
