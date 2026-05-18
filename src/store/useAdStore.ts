import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AdState} from '../types';

export const useAdStore = create<AdState>()(
  persist(
    set => ({
      interstitialLoaded: false,
      interstitialShowing: false,
      lastShownTimestamp: null,
      setInterstitialLoaded: value => set({interstitialLoaded: value}),
      setInterstitialShowing: value => set({interstitialShowing: value}),
      markAdShown: () =>
        set({interstitialShowing: false, lastShownTimestamp: Date.now()}),
      resetSession: () =>
        set({interstitialLoaded: false, interstitialShowing: false}),
    }),
    {
      name: 'trysnap-ad-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
