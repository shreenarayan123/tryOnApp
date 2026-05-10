export const CONFIG = {
  API_BASE_URL: 'https://api.trysnap.in',
  FREE_DAILY_LIMIT: 5,
  MAX_IMAGE_SIZE_KB: 500,
  PROCESSING_TIMEOUT_MS: 30000,
  ADMOB_IDS: {
    INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
    BANNER: 'ca-app-pub-3940256099942544/6300978111',
    REWARDED: 'ca-app-pub-3940256099942544/5224354917',
  },
  PRO_PRICE_INR: 999,
  FOUNDING_SPOTS_REMAINING: 347,
  PRIVACY_POLICY_URL: 'https://trysnap.in/privacy',
  APP_STORE_URL: 'https://play.google.com/store/apps/details?id=in.trysnap.app',
  SUPPORT_EMAIL: 'support@trysnap.in',
} as const;

export const MOCK_BACKEND_ENABLED = true;
