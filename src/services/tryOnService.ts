import axios from 'axios';
import {CONFIG, MOCK_BACKEND_ENABLED} from '../constants/config';
import {compressImage, fileToBase64, getFileSizeKb} from '../utils/imageUtils';

export interface TryOnServiceRequest {
  avatarPath: string;
  garmentPath: string;
}

export interface TryOnServiceResponse {
  success: true;
  resultUrl: string;
  processingTime: number;
}

export class TryOnServiceError extends Error {
  code: 'TIMEOUT' | 'NETWORK' | 'INVALID_RESPONSE' | 'UNKNOWN';

  constructor(message: string, code: TryOnServiceError['code']) {
    super(message);
    this.code = code;
  }
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const placeholderResultUrl =
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1080&q=80';

const buildFormData = async (avatarPath: string, garmentPath: string) => {
  const avatarCompressed = await compressImage(avatarPath, {
    maxWidth: 800,
    quality: 0.75,
  });
  const garmentCompressed = await compressImage(garmentPath, {
    maxWidth: 1024,
    quality: 0.85,
  });

  const avatarSize = await getFileSizeKb(avatarCompressed.uri);
  const garmentSize = await getFileSizeKb(garmentCompressed.uri);
  console.log('[TrySnap] avatar size kb:', avatarSize);
  console.log('[TrySnap] garment size kb:', garmentSize);

  const avatarBase64 = await fileToBase64(avatarCompressed.uri);
  const garmentBase64 = await fileToBase64(garmentCompressed.uri);

  const formData = new FormData();
  formData.append('avatar', {
    uri: avatarCompressed.uri,
    type: 'image/jpeg',
    name: 'avatar.jpg',
    data: avatarBase64,
  } as never);
  formData.append('garment', {
    uri: garmentCompressed.uri,
    type: 'image/jpeg',
    name: 'garment.jpg',
    data: garmentBase64,
  } as never);

  return formData;
};

const postTryOn = async (
  request: TryOnServiceRequest,
  attempt = 0,
): Promise<TryOnServiceResponse> => {
  const startedAt = Date.now();
  const formData = await buildFormData(request.avatarPath, request.garmentPath);

  if (__DEV__ || MOCK_BACKEND_ENABLED) {
    await wait(6000);
    return {
      success: true,
      resultUrl: placeholderResultUrl,
      processingTime: Date.now() - startedAt,
    };
  }

  try {
    const response = await axios.post(`${CONFIG.API_BASE_URL}/api/tryon`, formData, {
      timeout: CONFIG.PROCESSING_TIMEOUT_MS,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.data?.success || !response.data?.resultUrl) {
      throw new TryOnServiceError('Invalid response from try-on backend.', 'INVALID_RESPONSE');
    }

    return response.data as TryOnServiceResponse;
  } catch (error) {
    if (attempt < 1) {
      return postTryOn(request, attempt + 1);
    }

    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
      throw new TryOnServiceError('Try-on request timed out.', 'TIMEOUT');
    }

    if (axios.isAxiosError(error)) {
      throw new TryOnServiceError(error.message || 'Network error.', 'NETWORK');
    }

    if (error instanceof TryOnServiceError) {
      throw error;
    }

    throw new TryOnServiceError('Unknown try-on error.', 'UNKNOWN');
  }
};

export const tryOnService = {
  processTryOn: postTryOn,
};
