import mobileAds, {
  AdEventType,
  InterstitialAd,
} from 'react-native-google-mobile-ads';
import {CONFIG} from '../constants/config';

export interface AdServiceState {
  interstitialLoaded: boolean;
  interstitialShowing: boolean;
  lastShownTimestamp: number | null;
}

type Listener = (state: AdServiceState) => void;

class AdService {
  private state: AdServiceState = {
    interstitialLoaded: false,
    interstitialShowing: false,
    lastShownTimestamp: null,
  };

  private listeners = new Set<Listener>();
  private interstitial: InterstitialAd | null = null;
  private unsubscribe: Array<() => void> = [];

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener({...this.state}));
  }

  getState() {
    return {...this.state};
  }

  private resetInterstitial() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe());
    this.unsubscribe = [];
    this.interstitial = null;
    this.state.interstitialLoaded = false;
    this.state.interstitialShowing = false;
    this.notify();
  }

  async loadInterstitial() {
    if (this.state.interstitialLoaded || this.state.interstitialShowing) {
      return;
    }

    try {
      await mobileAds().initialize();
      this.resetInterstitial();
      this.interstitial = InterstitialAd.createForAdRequest(
        CONFIG.ADMOB_IDS.INTERSTITIAL,
      );

      this.unsubscribe = [
        this.interstitial.addAdEventListener(AdEventType.LOADED, () => {
          this.state.interstitialLoaded = true;
          this.notify();
        }),
        this.interstitial.addAdEventListener(AdEventType.OPENED, () => {
          this.state.interstitialShowing = true;
          this.notify();
        }),
        this.interstitial.addAdEventListener(AdEventType.CLOSED, () => {
          this.state.interstitialLoaded = false;
          this.state.interstitialShowing = false;
          this.state.lastShownTimestamp = Date.now();
          this.notify();
          this.resetInterstitial();
        }),
        this.interstitial.addAdEventListener(AdEventType.ERROR, () => {
          this.resetInterstitial();
        }),
      ];

      this.interstitial.load();
    } catch {
      this.resetInterstitial();
    }
  }

  showInterstitial() {
    if (!this.interstitial || !this.state.interstitialLoaded) {
      return false;
    }

    this.state.interstitialShowing = true;
    this.state.lastShownTimestamp = Date.now();
    this.notify();
    this.interstitial.show();
    return true;
  }
}

export const adService = new AdService();
