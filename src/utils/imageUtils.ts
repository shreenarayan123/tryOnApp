import {Image} from 'react-native';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';

const stripFileScheme = (uri: string) => uri.replace(/^file:\/\//, '');

export const validateImageUri = (uri: string | null | undefined) => {
  if (!uri) {
    return false;
  }

  return /^file:|^content:|^https?:/.test(uri);
};

export const getFileSizeKb = async (uri: string) => {
  try {
    const stats = await RNFS.stat(stripFileScheme(uri));
    return Math.max(0, Math.round(Number(stats.size) / 1024));
  } catch {
    return 0;
  }
};

export const fileToBase64 = async (uri: string) => {
  return RNFS.readFile(stripFileScheme(uri), 'base64');
};

export const getImageDimensions = (uri: string) => {
  return new Promise<{width: number; height: number}>((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({width, height}),
      reject,
    );
  });
};

export const compressImage = async (
  uri: string,
  options: {maxWidth: number; quality: number},
) => {
  const dimensions = await getImageDimensions(uri);
  const scale = Math.min(1, options.maxWidth / Math.max(1, dimensions.width));
  const targetWidth = Math.max(1, Math.round(dimensions.width * scale));
  const targetHeight = Math.max(1, Math.round(dimensions.height * scale));

  const resized = await ImageResizer.createResizedImage(
    uri,
    targetWidth,
    targetHeight,
    'JPEG',
    Math.round(options.quality * 100),
    0,
    undefined,
    false,
    {mode: 'contain', onlyScaleDown: true},
  );

  return {
    uri: resized.uri,
    width: resized.width,
    height: resized.height,
    sizeKb: await getFileSizeKb(resized.uri),
  };
};
