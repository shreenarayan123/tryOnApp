import React, {useMemo, useState} from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {WebView} from 'react-native-webview';
import FastImage from 'react-native-fast-image';
import Card from '../../components/common/Card';
import {COLORS} from '../../constants/colors';
import {CONFIG} from '../../constants/config';
import {storageService} from '../../services/storageService';
import {useHistoryStore} from '../../store/useHistoryStore';
import {useUserStore} from '../../store/useUserStore';
import {MainTabParamList} from '../../types';

type Props = NativeStackScreenProps<MainTabParamList, 'SettingsTab'>;

const row = (
  icon: string,
  title: string,
  subtitle: string,
  onPress: () => void,
  rightNode?: React.ReactNode,
  danger?: boolean,
) => (
  <Pressable onPress={onPress} style={styles.row}>
    <View style={styles.rowIcon}>
      <MaterialCommunityIcons
        name={icon as never}
        size={22}
        color={danger ? '#FCA5A5' : COLORS.textPrimary}
      />
    </View>
    <View style={{flex: 1}}>
      <Text style={[styles.rowTitle, danger && styles.dangerText]}>{title}</Text>
      <Text style={styles.rowSubtitle}>{subtitle}</Text>
    </View>
    {rightNode}
  </Pressable>
);

const SettingsScreen = ({navigation}: Props) => {
  const avatarPhotoPath = useUserStore(state => state.avatarPhotoPath);
  const isPro = useUserStore(state => state.isPro);
  const clearAvatarPhoto = useUserStore(state => state.clearAvatarPhoto);
  const clearHistory = useHistoryStore(state => state.clearAll);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [privacyFailed, setPrivacyFailed] = useState(false);

  const rootNavigation = navigation.getParent() as any;

  const openAvatarSetup = () => {
    rootNavigation?.navigate('AvatarSetupModal', {fromSettings: true});
  };

  const openPro = () => {
    navigation.getParent()?.navigate('ProModal' as never);
  };

  const shareApp = async () => {
    await Share.share({
      message: 'TrySnap - virtual try-on for Indian shoppers. https://trysnap.in/download',
    });
  };

  const resetAvatar = () => {
    void storageService.remove('avatar_photo_path');
    clearAvatarPhoto();
    setHowItWorksOpen(false);
    openAvatarSetup();
  };

  const versionText = useMemo(() => 'v1.0.0', []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.heroCard}>
        <MaterialCommunityIcons name="palette-swatch-outline" size={24} color={COLORS.accent} />
        <View style={{flex: 1}}>
          <Text style={styles.heroTitle}>TrySnap</Text>
          <Text style={styles.heroSubtitle}>Light, crisp, and built for shopping-floor try-ons.</Text>
        </View>
      </View>

      <Card style={styles.section}>
        <Text style={styles.sectionLabel}>Account</Text>
        <Pressable onPress={openAvatarSetup} style={styles.avatarRow}>
          {avatarPhotoPath ? (
            <View style={styles.avatarThumbWrap}>
              <FastImage source={{uri: avatarPhotoPath}} style={styles.avatarThumb} resizeMode={FastImage.resizeMode.cover} />
            </View>
          ) : (
            <View style={styles.avatarThumbEmpty}>
              <MaterialCommunityIcons name="account" size={22} color={COLORS.textSecondary} />
            </View>
          )}
          <View style={{flex: 1}}>
            <Text style={styles.rowTitle}>Your Avatar</Text>
            <Text style={styles.rowSubtitle}>Update the body photo used for try-ons</Text>
          </View>
          <Text style={styles.changeLink}>Change</Text>
        </Pressable>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionLabel}>Subscription</Text>
        {isPro
          ? row(
              'crown',
              'Pro Member ✓',
              'Download photos • Change Avatar • Unlimited try-ons',
              () => {},
              <MaterialCommunityIcons name="check-circle" color={COLORS.success} size={18} />,
            )
          : row(
              'crown-outline',
              'Go Pro — ₹999 Lifetime',
              'Remove ads • Unlimited try-ons • Download photos • Change Avatar',
              openPro,
            )}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionLabel}>App</Text>
        {row('share-variant-outline', 'Share TrySnap', 'Invite a friend to download the app', shareApp)}
        <View style={styles.divider} />
        {row('shield-search-outline', 'Privacy Policy', 'Read how your data is handled', () => setPrivacyOpen(true))}
        <View style={styles.divider} />
        {row('help-circle-outline', 'How it Works', 'Short overview of the try-on flow', () => setHowItWorksOpen(true))}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionLabel}>Danger</Text>
        {row('trash-can-outline', 'Clear History', 'Remove all saved try-on results', () => clearHistory(), undefined, true)}
        <View style={styles.divider} />
        {row('account-remove-outline', 'Reset Avatar', 'Choose a new body photo', resetAvatar, undefined, true)}
      </Card>

      <Text style={styles.version}>{versionText}</Text>

      <Modal visible={privacyOpen} animationType="slide" onRequestClose={() => setPrivacyOpen(false)}>
        <View style={styles.modalShell}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setPrivacyOpen(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Privacy Policy</Text>
            <View style={{width: 40}} />
          </View>
          {privacyFailed ? (
            <ScrollView contentContainerStyle={styles.privacyFallback}>
              <Text style={styles.privacyFallbackTitle}>Privacy Policy</Text>
              <Text style={styles.privacyFallbackText}>
                We keep your avatar photo and try-on history on your device. Photos are uploaded only to generate try-on results and are not sold or shared for advertising.
              </Text>
              <Text style={styles.privacyFallbackText}>
                If the website cannot load, please check your connection and try again later.
              </Text>
            </ScrollView>
          ) : (
            <WebView
              style={styles.webView}
              source={{uri: CONFIG.PRIVACY_POLICY_URL}}
              originWhitelist={['*']}
              startInLoadingState
              onError={() => setPrivacyFailed(true)}
            />
          )}
        </View>
      </Modal>

      <Modal transparent visible={howItWorksOpen} animationType="fade" onRequestClose={() => setHowItWorksOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.infoModal}>
            <Text style={styles.infoTitle}>How TrySnap Works</Text>
            <Text style={styles.infoText}>
              Upload your body photo once, snap any outfit in a store, and TrySnap will map that garment onto your avatar in seconds.
            </Text>
            <Text style={styles.infoText}>
              Results are stored locally on your device and can be saved or shared instantly.
            </Text>
            <Pressable onPress={() => setHowItWorksOpen(false)} style={styles.infoButton}>
              <Text style={styles.infoButtonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 18,
    paddingBottom: 16,
    gap: 14,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 2,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(252,3,111,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(252,3,111,0.16)',
  },
  heroTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  section: {
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.96)',
  },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarThumbWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.08)',
  },
  avatarThumb: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceLight,
  },
  avatarThumbEmpty: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeLink: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLight,
  },
  rowTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  rowSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },
  dangerText: {
    color: '#FCA5A5',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(15,23,42,0.08)',
  },
  version: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  modalHeader: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(15,23,42,0.08)',
    backgroundColor: COLORS.surface,
  },
  modalShell: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  webView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  privacyFallback: {
    padding: 20,
    gap: 12,
  },
  privacyFallbackTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  privacyFallbackText: {
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  modalClose: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  infoModal: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15,23,42,0.08)',
  },
  infoTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  infoText: {
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  infoButton: {
    marginTop: 8,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLight,
  },
  infoButtonText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
});

export default SettingsScreen;
