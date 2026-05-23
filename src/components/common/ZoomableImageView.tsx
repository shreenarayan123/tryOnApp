import React from 'react';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import FastImage from 'react-native-fast-image';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';

interface ZoomableImageViewProps {
  imageUri: string;
  containerStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ViewStyle>;
}

const clamp = (value: number, min: number, max: number) => {
  'worklet';
  return Math.min(Math.max(value, min), max);
};

const ZoomableImageView = ({imageUri, containerStyle, imageStyle}: ZoomableImageViewProps) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const resetTransform = () => {
    scale.value = withTiming(1, {duration: 220});
    translateX.value = withTiming(0, {duration: 220});
    translateY.value = withTiming(0, {duration: 220});
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate(event => {
      scale.value = clamp(savedScale.value * event.scale, 1, 4);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1) {
        runOnJS(resetTransform)();
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate(event => {
      if (scale.value <= 1) {
        return;
      }

      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      if (scale.value <= 1) {
        return;
      }

      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(resetTransform)();
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture, doubleTapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {translateX: translateX.value},
      {translateY: translateY.value},
      {scale: scale.value},
    ],
  }));

  return (
    <View style={[styles.container, containerStyle]}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.imageWrap, animatedStyle, imageStyle]}>
          <FastImage source={{uri: imageUri}} style={styles.image} resizeMode={FastImage.resizeMode.contain} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  imageWrap: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default ZoomableImageView;