import React from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Button from '../../components/common/Button';
import {COLORS} from '../../constants/colors';
import {CONFIG} from '../../constants/config';
import {usePro} from '../../hooks/usePro';
import {triggerNotification} from '../../utils/haptics';
import {RootStackParamList} from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ProModal'>;

const features = [
  'Unlimited try-ons every day',
  'Zero ads — ever',
  'Priority AI processing (2x faster)',
  'Results saved forever',
  'Download photos to your gallery',
  'Change Avatar anytime',
  '360° view — coming soon',
  'Early access to new features',
];

const ProScreen = ({navigation}: Props) => {
  const {promptUpgradeComingSoon} = usePro();

  const handleUpgrade = () => {
    triggerNotification('success');
    Alert.alert('Coming Soon', 'Payment is not built into this MVP yet. We will notify you!');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.closeButton} hitSlop={12}>
        <MaterialCommunityIcons name="close" size={28} color={COLORS.textPrimary} />
      </Pressable>

      <View style={styles.hero}>
        <MaterialCommunityIcons name="crown" size={72} color={COLORS.warning} />
        <Text style={styles.title}>TrySnap Pro</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Founding Member Offer</Text>
        </View>
      </View>

      <View style={styles.featureList}>
        {features.map(feature => (
          <View key={feature} style={styles.featureRow}>
            <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.success} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <View style={styles.priceBlock}>
        <Text style={styles.strikePrice}>₹2,999</Text>
        <Text style={styles.bigPrice}>₹999</Text>
        <Text style={styles.priceNote}>One-time payment. No subscription. No renewal.</Text>
      </View>

      <Text style={styles.counter}>Only {CONFIG.FOUNDING_SPOTS_REMAINING} founding spots left</Text>

      <Button title="Get Lifetime Pro for ₹999" onPress={handleUpgrade} />
      <Button title="Maybe later" variant="ghost" onPress={() => navigation.goBack()} />

      <Text style={styles.footer}>Secured payment • Instant activation • Email us at {CONFIG.SUPPORT_EMAIL}</Text>
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
    paddingTop: 32,
    paddingBottom: 36,
    gap: 18,
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  hero: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 32,
    fontWeight: '800',
  },
  badge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  badgeText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  featureList: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    flex: 1,
  },
  priceBlock: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15,23,42,0.08)',
  },
  strikePrice: {
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
    fontSize: 18,
  },
  bigPrice: {
    color: COLORS.textPrimary,
    fontSize: 40,
    fontWeight: '900',
  },
  priceNote: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  counter: {
    color: COLORS.warning,
    textAlign: 'center',
    fontWeight: '700',
  },
  footer: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default ProScreen;
