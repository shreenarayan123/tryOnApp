import axios from 'axios';
import {CONFIG, MOCK_BACKEND_ENABLED} from '../constants/config';
import {compressImage, getFileSizeKb} from '../utils/imageUtils';

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

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const placeholderResultUrl =
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1080&q=80';

const buildFormData = async (avatarPath: string, garmentPath: string) => {
  console.log('[TrySnap] buildFormData start', { avatarPath, garmentPath });
  try {
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

    // Attach files directly to FormData instead of embedding base64 strings.
    // Embedding base64 in JS causes large memory allocations and can trigger OOMs
    // or binder transaction failures on Android. Using file URIs is streamed
    // by native networking and avoids loading the full base64 into JS memory.
    const formData = new FormData();
    formData.append('avatar', {
      uri: avatarCompressed.uri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    } as any);
    formData.append('garment', {
      uri: garmentCompressed.uri,
      type: 'image/jpeg',
      name: 'garment.jpg',
    } as any);

    console.log('[TrySnap] buildFormData done');
    return formData;
  } catch (err) {
    console.error('[TrySnap] buildFormData error', err);
    throw err;
  }
};

const postTryOn = async (
  request: TryOnServiceRequest,
  attempt = 0,
): Promise<TryOnServiceResponse> => {
  const startedAt = Date.now();
  if (MOCK_BACKEND_ENABLED) {
    await wait(6000);
    return {
      success: true,
      resultUrl: placeholderResultUrl,
      processingTime: Date.now() - startedAt,
    };
  }

  const formData = await buildFormData(request.avatarPath, request.garmentPath);

  try {
    console.log('[TrySnap] posting to backend', { url: `${CONFIG.API_BASE_URL}/api/tryon`, attempt });
    const response = await axios.post(`${CONFIG.API_BASE_URL}/api/tryon`, formData, {
      timeout: CONFIG.PROCESSING_TIMEOUT_MS,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('[TrySnap] backend response', { status: response.status, data: response.data });

    if (!response.data?.success || !response.data?.resultUrl) {
      console.error('[TrySnap] invalid response payload', response.data);
      throw new TryOnServiceError('Invalid response from try-on backend.', 'INVALID_RESPONSE');
    }

    return response.data as TryOnServiceResponse;
  } catch (error) {
    // Log full details for Axios errors to help debugging connectivity issues
    if (axios.isAxiosError(error)) {
      try {
        console.error('[TrySnap] axios error details', error.toJSON ? error.toJSON() : {
          message: error.message,
          code: (error as any).code,
          config: error.config,
        });
      } catch (logErr) {
        console.error('[TrySnap] failed to serialize axios error', logErr);
      }
    } else {
      console.error('[TrySnap] tryOnService non-axios error', error);
    }

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
