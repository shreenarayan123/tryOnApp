import {Platform} from 'react-native';
import HapticFeedback from 'react-native-haptic-feedback';

const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

const fire = (method: keyof typeof HapticFeedback) => {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    (HapticFeedback as any)[method](options as any);
  } catch {
    // Ignore haptic failures on devices that do not support them.
  }
};

export const haptics = {
  capture: () => fire('trigger' as never),
  light: () => fire('trigger' as never),
  success: () => fire('trigger' as never),
  warning: () => fire('trigger' as never),
};

export const triggerImpact = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if (Platform.OS !== 'android') {
    return;
  }

  const map = {
    light: 'impactLight',
    medium: 'impactMedium',
    heavy: 'impactHeavy',
  } as const;

  try {
    (HapticFeedback as any).trigger(map[type], options as any);
  } catch {
    // No-op.
  }
};

export const triggerNotification = (type: 'success' | 'warning' | 'error') => {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    const mapped =
      type === 'success'
        ? 'notificationSuccess'
        : type === 'warning'
          ? 'notificationWarning'
          : 'notificationError';
    (HapticFeedback as any).trigger(mapped, options as any);
  } catch {
    // No-op.
  }
};
