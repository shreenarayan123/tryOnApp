import {Platform} from 'react-native';
import {
  PERMISSIONS,
  RESULTS,
  checkMultiple,
  requestMultiple,
} from 'react-native-permissions';

const storagePermission =
  Platform.OS === 'android' && Number(Platform.Version) >= 33
    ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
    : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

const permissions = [PERMISSIONS.ANDROID.CAMERA, storagePermission].filter(
  Boolean,
) as string[];

export const permissionsService = {
  async check() {
    const status = await checkMultiple(permissions as never);
    const result = status as Record<string, string>;
    return {
      camera: result[PERMISSIONS.ANDROID.CAMERA] === RESULTS.GRANTED,
      storage: result[storagePermission] === RESULTS.GRANTED,
    };
  },
  async request() {
    const status = await requestMultiple(permissions as never);
    const result = status as Record<string, string>;
    return {
      camera: result[PERMISSIONS.ANDROID.CAMERA] === RESULTS.GRANTED,
      storage: result[storagePermission] === RESULTS.GRANTED,
    };
  },
};
