import React from 'react';
import {StyleSheet, View} from 'react-native';
import {BannerAd, BannerAdSize, TestIds} from 'react-native-google-mobile-ads';
import {CONFIG} from '../../constants/config';

interface AdBannerProps {
  visible?: boolean;
}

const AdBanner = ({visible = true}: AdBannerProps) => {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={CONFIG.ADMOB_IDS.BANNER || TestIds.BANNER}
        size={BannerAdSize.BANNER}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    overflow: 'hidden',
  },
});

export default AdBanner;
