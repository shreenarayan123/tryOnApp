export type TryOnStatus = 'idle' | 'compressing' | 'uploading' | 'processing' | 'done' | 'error';

export interface TryOnResult {
  id: string;
  resultImagePath: string;
  garmentImagePath: string;
  timestamp: number;
  reaction: 'liked' | 'disliked' | null;
}

export interface UserState {
  avatarPhotoPath: string | null;
  isPro: boolean;
  dailyTryOnCount: number;
  lastTryOnDate: string;
  setAvatarPhoto: (path: string) => void;
  clearAvatarPhoto: () => void;
  setIsPro: (val: boolean) => void;
  incrementTryOnCount: () => void;
  resetDailyCountIfNewDay: () => void;
  canTryOn: () => boolean;
}

export interface HistoryState {
  results: TryOnResult[];
  addResult: (result: TryOnResult) => void;
  removeResult: (id: string) => void;
  clearAll: () => void;
}

export interface AdState {
  interstitialLoaded: boolean;
  interstitialShowing: boolean;
  lastShownTimestamp: number | null;
  setInterstitialLoaded: (value: boolean) => void;
  setInterstitialShowing: (value: boolean) => void;
  markAdShown: () => void;
  resetSession: () => void;
}

export type OnboardingStackParamList = {
  Welcome: undefined;
  AvatarSetup: undefined;
  Permissions: undefined;
};

export type CameraStackParamList = {
  Camera: undefined;
  Processing: {garmentImagePath: string};
  Result: {resultImagePath: string; garmentImagePath: string};
};

export type MainTabParamList = {
  CameraTab: undefined;
  HistoryTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  AvatarSetupModal: {fromSettings?: boolean} | undefined;
  ProModal: undefined;
};
