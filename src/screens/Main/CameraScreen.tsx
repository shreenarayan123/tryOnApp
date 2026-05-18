import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Camera, useCameraDevice, useCameraPermission} from 'react-native-vision-camera';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {launchImageLibrary} from 'react-native-image-picker';
import CaptureButton from '../../components/camera/CaptureButton';
import CameraOverlay from '../../components/camera/CameraOverlay';
import Button from '../../components/common/Button';
import {COLORS} from '../../constants/colors';
import {CONFIG} from '../../constants/config';
import {useUserStore} from '../../store/useUserStore';
import {CameraStackParamList, MainTabParamList} from '../../types';
import {triggerImpact} from '../../utils/haptics';

type Props = NativeStackScreenProps<CameraStackParamList, 'Camera'>;

const INSTRUCTIONS = [
  'Point at outfit on rack',
  'Include full outfit in frame',
  'Works on mannequins too',
];

const CameraScreen = ({navigation}: Props) => {
  const cameraRef = useRef<any>(null);
  const device = useCameraDevice('back');
  const {hasPermission, requestPermission} = useCameraPermission();
  const isPro = useUserStore(state => state.isPro);
  const dailyTryOnCount = useUserStore(state => state.dailyTryOnCount);
  const resetDailyCountIfNewDay = useUserStore(state => state.resetDailyCountIfNewDay);
  const canTryOn = useUserStore(state => state.canTryOn);
  const [instructionIndex, setInstructionIndex] = useState(0);
  const [flashOn, setFlashOn] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  useEffect(() => {
    resetDailyCountIfNewDay();
  }, [resetDailyCountIfNewDay]);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    const timer = setInterval(() => {
      setInstructionIndex(value => (value + 1) % INSTRUCTIONS.length);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const progressWidth = useMemo(() => {
    return Math.min(100, (dailyTryOnCount / CONFIG.FREE_DAILY_LIMIT) * 100);
  }, [dailyTryOnCount]);

  const navigateToTryOn = (imagePath: string) => {
    if (!canTryOn()) {
      setShowLimitModal(true);
      return;
    }

    navigation.navigate('Processing', {garmentImagePath: imagePath});
  };

  const capturePhoto = async () => {
    try {
      triggerImpact('heavy');
      const photo = await cameraRef.current?.takePhoto({flash: flashOn ? 'on' : 'off'});
      if (photo?.path) {
        navigateToTryOn(`file://${photo.path}`);
      }
    } catch {
      Alert.alert('Capture failed', 'Please try again.');
    }
  };

  const pickFromGallery = async () => {
    const response = await launchImageLibrary({mediaType: 'photo', quality: 0.9});
    const uri = response.assets?.[0]?.uri;
    if (uri) {
      navigateToTryOn(uri);
    }
  };

  const rootNavigation = navigation.getParent()?.getParent();
  const tabNavigation = navigation.getParent();

  const openSettings = () => tabNavigation?.navigate('SettingsTab' as never);
  const openHistory = () => tabNavigation?.navigate('HistoryTab' as never);
  const openPro = () => {
    setShowLimitModal(false);
    rootNavigation?.navigate('ProModal' as never);
  };

  return (
    <View style={styles.container}>
      {device && hasPermission ? (
        <Camera ref={cameraRef} style={StyleSheet.absoluteFill} device={device} isActive />
      ) : (
        <View style={styles.fallback}>
          <MaterialCommunityIcons name="camera-off" size={44} color={COLORS.textSecondary} />
          <Text style={styles.fallbackText}>
            {hasPermission ? 'No camera device available' : 'Camera permission needed'}
          </Text>
        </View>
      )}

      <View style={styles.topBar}>
        <Pressable onPress={openSettings} hitSlop={12}>
          <MaterialCommunityIcons name="menu" size={28} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.brand}>TrySnap</Text>
        <Pressable onPress={openHistory} hitSlop={12}>
          <MaterialCommunityIcons name="history" size={26} color={COLORS.textPrimary} />
        </Pressable>
      </View>

      <CameraOverlay instruction={INSTRUCTIONS[instructionIndex]} />

      <View style={styles.bottomPanel}>
        {!isPro ? (
          <View style={styles.counterCard}>
            <View style={styles.counterRow}>
              <Text style={styles.counterText}>
                {dailyTryOnCount} / {CONFIG.FREE_DAILY_LIMIT} try-ons used today
              </Text>
              <Text style={styles.counterTextMuted}>Free tier</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, {width: `${progressWidth}%` as any}]} />
            </View>
          </View>
        ) : null}

        <View style={styles.actionsRow}>
          <Pressable onPress={pickFromGallery} style={styles.iconButton} hitSlop={8}>
            <MaterialCommunityIcons name="image-outline" size={26} color={COLORS.textPrimary} />
          </Pressable>

          <CaptureButton onPress={capturePhoto} />

          <Pressable onPress={() => setFlashOn(value => !value)} style={styles.iconButton} hitSlop={8}>
            <MaterialCommunityIcons
              name={flashOn ? 'flash' : 'flash-off'}
              size={26}
              color={flashOn ? COLORS.warning : COLORS.textPrimary}
            />
          </Pressable>
        </View>
      </View>

      <Modal transparent visible={showLimitModal} animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Daily limit reached 👗</Text>
            <Text style={styles.modalBody}>
              You&apos;ve used your {CONFIG.FREE_DAILY_LIMIT} free try-ons for today. Come back tomorrow or go Pro for unlimited try-ons.
            </Text>
            <Button title={`Get Pro — ₹${CONFIG.PRO_PRICE_INR} Lifetime`} onPress={openPro} />
            <Button title="Come back tomorrow" variant="ghost" onPress={() => setShowLimitModal(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    gap: 12,
  },
  fallbackText: {
    color: COLORS.textSecondary,
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 22 : 30,
    left: 18,
    right: 18,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  bottomPanel: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 14,
    gap: 18,
  },
  counterCard: {
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15,23,42,0.08)',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  counterText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  counterTextMuted: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.accent,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15,23,42,0.08)',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.28)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(15,23,42,0.08)',
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  modalBody: {
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

export default CameraScreen;
