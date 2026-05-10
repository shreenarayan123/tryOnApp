import {useEffect, useState} from 'react';
import {adService, AdServiceState} from '../services/adService';
import {useUserStore} from '../store/useUserStore';

export const useAds = () => {
  const isPro = useUserStore(state => state.isPro);
  const [state, setState] = useState<AdServiceState>(adService.getState());

  useEffect(() => adService.subscribe(setState), []);

  const loadInterstitial = async () => {
    if (isPro) {
      return;
    }

    await adService.loadInterstitial();
  };

  const showInterstitial = () => {
    if (isPro) {
      return false;
    }

    return adService.showInterstitial();
  };

  return {
    loadInterstitial,
    showInterstitial,
    isAdLoaded: state.interstitialLoaded,
    isAdShowing: state.interstitialShowing,
    lastShownTimestamp: state.lastShownTimestamp,
  };
};
