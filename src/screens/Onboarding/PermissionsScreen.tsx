import React, {useEffect, useState} from 'react';
import {Alert, Pressable, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import {COLORS} from '../../constants/colors';
import {FONT_SIZES, FONTS} from '../../constants/fonts';
import {permissionsService} from '../../services/permissionsService';
import {storageService} from '../../services/storageService';
import {OnboardingStackParamList} from '../../types';
import {triggerNotification} from '../../utils/haptics';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Permissions'>;

const PermissionRow = ({
  icon,
  title,
  description,
  granted,
}: {
  icon: string;
  title: string;
  description: string;
  granted: boolean;
}) => (
  <View style={styles.permissionRow}>
    <View style={styles.permissionIcon}>
      <MaterialCommunityIcons name={icon as never} size={24} color={COLORS.textPrimary} />
    </View>
    <View style={{flex: 1}}>
      <Text style={styles.permissionTitle}>{title}</Text>
      <Text style={styles.permissionDescription}>{description}</Text>
    </View>
    <View style={styles.statusPill}>
      <MaterialCommunityIcons
        name={granted ? 'check-circle' : 'alert-circle-outline'}
        size={16}
        color={granted ? COLORS.success : COLORS.warning}
      />
      <Text style={[styles.statusText, {color: granted ? COLORS.success : COLORS.warning}]}> 
        {granted ? 'Granted' : 'Not Granted'}
      </Text>
    </View>
  </View>
);

const PermissionsScreen = ({navigation}: Props) => {
  const [cameraGranted, setCameraGranted] = useState(false);
  const [storageGranted, setStorageGranted] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    permissionsService.check().then(result => {
      setCameraGranted(result.camera);
      setStorageGranted(result.storage);
    });
  }, []);

  const handleGrant = async () => {
    setRequesting(true);
    try {
      const result = await permissionsService.request();
      setCameraGranted(result.camera);
      setStorageGranted(result.storage);
      if (result.camera && result.storage) {
        storageService.setBoolean('onboarding_complete', true);
        setSuccess(true);
        triggerNotification('success');
        setTimeout(() => {
          navigation.getParent()?.navigate('Main' as never);
        }, 700);
      } else {
        Alert.alert('Permissions needed', 'Camera and storage access are required to continue.');
      }
    } catch {
      Alert.alert('Permission error', 'Please enable the permissions manually in settings.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <MaterialCommunityIcons name="shield-check" size={66} color={COLORS.accent} />
        <Text style={styles.title}>Quick Permissions</Text>
        <Text style={styles.subtitle}>TrySnap needs these to work properly</Text>
      </View>

      <Card style={styles.card}>
        <PermissionRow
          icon="camera"
          title="Camera Access"
          description="To snap photos of outfits in stores"
          granted={cameraGranted}
        />
        <View style={styles.divider} />
        <PermissionRow
          icon="image-multiple"
          title="Photo Storage"
          description="To save your try-on results"
          granted={storageGranted}
        />
      </Card>

      <Button
        title={success ? 'Permissions Granted' : 'Grant Permissions'}
        loading={requesting}
        disabled={success}
        onPress={handleGrant}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 24,
    justifyContent: 'center',
    gap: 22,
  },
  centerContent: {
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontFamily: FONTS.bold,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
  },
  card: {
    gap: 14,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  permissionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  permissionDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});

export default PermissionsScreen;
