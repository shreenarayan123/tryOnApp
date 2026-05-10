import React, {useMemo, useState} from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import FastImage from 'react-native-fast-image';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import {COLORS} from '../../constants/colors';
import {FONT_SIZES, FONTS} from '../../constants/fonts';
import {storageService} from '../../services/storageService';
import {useUserStore} from '../../store/useUserStore';
import {OnboardingStackParamList, RootStackParamList} from '../../types';
import {permissionsService} from '../../services/permissionsService';
import {triggerImpact, triggerNotification} from '../../utils/haptics';
type Props = NativeStackScreenProps<OnboardingStackParamList, 'AvatarSetup'> & {
  route: any;
};

const AvatarSetupScreen = ({navigation, route}: Props) => {
  const avatarPhotoPath = useUserStore(state => state.avatarPhotoPath);
  const setAvatarPhoto = useUserStore(state => state.setAvatarPhoto);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(avatarPhotoPath);
  const [saving, setSaving] = useState(false);

  const canContinue = useMemo(() => Boolean(selectedPhoto), [selectedPhoto]);

  const pickPhoto = async (source: 'camera' | 'gallery') => {
    const response =
      source === 'camera'
        ? await launchCamera({mediaType: 'photo', saveToPhotos: false, quality: 0.9})
        : await launchImageLibrary({mediaType: 'photo', quality: 0.9});

    const uri = response.assets?.[0]?.uri ?? null;
    if (uri) {
      setSelectedPhoto(uri);
      triggerImpact('medium');
    }
  };

  const handleSave = async () => {
    if (!selectedPhoto) {
      return;
    }

    setSaving(true);
    try {
      storageService.setString('avatar_photo_path', selectedPhoto);
      setAvatarPhoto(selectedPhoto);
      triggerNotification('success');
      if (route.params?.fromSettings) {
        navigation.goBack();
        return;
      }
      navigation.navigate('Permissions');
    } catch (error) {
      Alert.alert('Unable to save photo', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Setup Your Avatar</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.illustrationWrap}>
        <View style={styles.phoneFrame}>
          <View style={styles.phoneScreen}>
            <MaterialCommunityIcons name="account" size={56} color={COLORS.textSecondary} />
            <View style={styles.checkBadge}>
              <MaterialCommunityIcons name="check" size={18} color={COLORS.textPrimary} />
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.title}>Upload Your Photo Once</Text>
      <Text style={styles.subtitle}>
        We use this to show how outfits look on your body. Your photo stays on your device only — never uploaded to any server.
      </Text>

      <Card style={styles.tipCard}>
        <Text style={styles.tipTitle}>For best results:</Text>
        {[
          'Full body photo — head to toe',
          'Stand straight, arms slightly away from body',
          'Good lighting, plain background',
          'Wear fitted clothes (not a baggy hoodie)',
        ].map(item => (
          <View key={item} style={styles.tipRow}>
            <MaterialCommunityIcons name="check-circle" size={18} color={COLORS.success} />
            <Text style={styles.tipText}>{item}</Text>
          </View>
        ))}
      </Card>

      <View style={styles.uploadBox}>
        {selectedPhoto ? (
          <>
            <FastImage source={{uri: selectedPhoto}} style={styles.previewImage} resizeMode={FastImage.resizeMode.cover} />
            <View style={styles.previewBadge}>
              <MaterialCommunityIcons name="check-circle" size={28} color={COLORS.success} />
            </View>
            <Text style={styles.changeText}>Change Photo</Text>
          </>
        ) : (
          <>
            <MaterialCommunityIcons name="camera-plus-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.uploadText}>Tap to upload photo</Text>
          </>
        )}
      </View>

      <View style={styles.rowButtons}>
        <View style={styles.flexButton}>
          <Button title="Take Photo" variant="ghost" onPress={() => pickPhoto('camera')} />
        </View>
        <View style={styles.flexButton}>
          <Button title="Choose from Gallery" variant="ghost" onPress={() => pickPhoto('gallery')} />
        </View>
      </View>

      <Button title="Save & Continue" disabled={!canContinue} loading={saving} onPress={handleSave} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.medium,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 26,
  },
  illustrationWrap: {
    alignItems: 'center',
    marginTop: 8,
  },
  phoneFrame: {
    width: 124,
    height: 208,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: COLORS.surface,
    padding: 10,
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontFamily: FONTS.bold,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  tipCard: {
    gap: 12,
  },
  tipTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tipText: {
    color: COLORS.textSecondary,
    flex: 1,
    fontSize: FONT_SIZES.sm,
  },
  uploadBox: {
    width: '100%',
    height: 300,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  uploadText: {
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
  },
  previewBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  changeText: {
    position: 'absolute',
    bottom: 14,
    color: COLORS.textPrimary,
    fontWeight: '700',
    backgroundColor: 'rgba(15,15,15,0.45)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  rowButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  flexButton: {
    flex: 1,
  },
});

export default AvatarSetupScreen;
