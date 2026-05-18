import React, {useEffect, useMemo, useState} from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  Share as NativeShare,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import FastImage from 'react-native-fast-image';
import Share from 'react-native-share';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import RNFS from 'react-native-fs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Button from '../../components/common/Button';
import ShareButton from '../../components/result/ShareButton';
import AdBanner from '../../components/common/AdBanner';
import {COLORS} from '../../constants/colors';
import {useUserStore} from '../../store/useUserStore';
import {CameraStackParamList} from '../../types';
import {triggerImpact} from '../../utils/haptics';
import {useNavigation} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<CameraStackParamList, 'Result'>;

const ResultScreen = ({navigation, route}: Props) => {
  const isPro = useUserStore(state => state.isPro);
  const [reaction, setReaction] = useState<'liked' | 'disliked' | null>(null);
  const [saving, setSaving] = useState(false);
  const reveal = useSharedValue(0);
  const {resultImagePath, garmentImagePath} = route.params;

  useEffect(() => {
    reveal.value = withTiming(1, {duration: 520});
  }, [reveal]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{translateY: 18 * (1 - reveal.value)}],
  }));

  const rootText = useMemo(() => {
    return reaction === 'liked'
      ? 'Love the fit'
      : reaction === 'disliked'
        ? 'Noted'
        : 'How does it feel?';
  }, [reaction]);

  const downloadToLocal = async () => {
    if (resultImagePath.startsWith('file://')) {
      return resultImagePath;
    }

    if (resultImagePath.startsWith('http')) {
      const destination = `${RNFS.CachesDirectoryPath}/trysnap-result-${Date.now()}.jpg`;
      await RNFS.downloadFile({fromUrl: resultImagePath, toFile: destination}).promise;
      return `file://${destination}`;
    }

    return resultImagePath;
  };

  const saveToGallery = async () => {
    setSaving(true);
    try {
      const localUri = await downloadToLocal();
      await CameraRoll.saveAsset(localUri.replace('file://', ''), {type: 'photo'} as any);
      Alert.alert('Saved', 'Your look was saved to the gallery.');
    } catch {
      Alert.alert('Save failed', 'Could not save to gallery right now.');
    } finally {
      setSaving(false);
    }
  };

  const shareResult = async () => {
    try {
      await Share.open({url: resultImagePath});
    } catch {
      // Native share cancelled or failed; do nothing.
    }
  };

  const setReactionAndBuzz = (value: 'liked' | 'disliked') => {
    setReaction(value);
    triggerImpact('light');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.popToTop()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Your Look</Text>
        <Pressable onPress={shareResult} hitSlop={12}>
          <MaterialCommunityIcons name="share-variant-outline" size={24} color={COLORS.textPrimary} />
        </Pressable>
      </View>

      <Animated.View style={[styles.previewWrap, animatedStyle]} entering={FadeInUp.duration(400)}>
        <View style={styles.phoneFrame}>
          <FastImage source={{uri: resultImagePath}} style={styles.previewImage} resizeMode={FastImage.resizeMode.cover} />
        </View>
      </Animated.View>

      <Text style={styles.reactionPrompt}>{rootText}</Text>
      <View style={styles.reactionRow}>
        <Pressable
          onPress={() => setReactionAndBuzz('liked')}
          style={[styles.reactionButton, reaction === 'liked' && styles.reactionLiked]}>
          <Text style={styles.reactionEmoji}>💚</Text>
          <Text style={styles.reactionText}>Looks great!</Text>
        </Pressable>
        <Pressable
          onPress={() => setReactionAndBuzz('disliked')}
          style={[styles.reactionButton, reaction === 'disliked' && styles.reactionDisliked]}>
          <Text style={styles.reactionEmoji}>❌</Text>
          <Text style={styles.reactionText}>Not for me</Text>
        </Pressable>
      </View>

      <View style={styles.actions}>
        <Button title="Save to Gallery" onPress={saveToGallery} loading={saving} />
        <View style={styles.rowActions}>
          <View style={styles.rowActionFlex}>
            <ShareButton title="Share" onPress={shareResult} />
          </View>
          <View style={styles.rowActionFlex}>
            <Button title="Try Another" variant="ghost" onPress={() => navigation.popToTop()} />
          </View>
        </View>
      </View>

      <AdBanner visible={!isPro} />

      <Pressable onPress={() => navigation.getParent()?.navigate('HistoryTab' as never)}>
        <Text style={styles.historyLink}>Try-on History</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 18,
    paddingBottom: 22,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  previewWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  phoneFrame: {
    width: '100%',
    height: Dimensions.get('window').height * 0.7,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.12)',
    backgroundColor: COLORS.surface,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 12},
    elevation: 10,
  },
  previewImage: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceLight,
  },
  reactionPrompt: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 13,
  },
  reactionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  reactionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15,23,42,0.08)',
  },
  reactionLiked: {
    backgroundColor: 'rgba(34,197,94,0.16)',
    borderColor: 'rgba(34,197,94,0.35)',
  },
  reactionDisliked: {
    backgroundColor: 'rgba(15,23,42,0.04)',
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  actions: {
    gap: 12,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rowActionFlex: {
    flex: 1,
  },
  historyLink: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontWeight: '600',
    paddingVertical: 4,
  },
});

export default ResultScreen;
