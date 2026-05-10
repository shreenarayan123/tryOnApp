import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {BannerAd, BannerAdSize, TestIds} from 'react-native-google-mobile-ads';
import {CONFIG} from '../../constants/config';

interface AdBannerProps {
  visible?: boolean;
}

const AdBanner = ({visible = true}: AdBannerProps) => {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const timer = setInterval(() => {
      setRefreshKey(value => value + 1);
    }, 30000);

    return () => clearInterval(timer);
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        key={refreshKey}
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
