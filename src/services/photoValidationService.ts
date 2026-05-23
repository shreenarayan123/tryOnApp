import axios from 'axios';
import {CONFIG} from '../constants/config';
import {compressImage, fileToBase64} from '../utils/imageUtils';

export type PhotoValidationResult = {
  valid: boolean;
  reason?: string;
  issues: Array<'half_body' | 'blurry' | 'bad_lighting' | 'no_person' | 'multiple_persons'>;
  poseWarning: boolean;
  poseMessage: string;
  code?: string;
};

export const validateAvatarPhoto = async (imagePath: string) => {
  const compressed = await compressImage(imagePath, {maxWidth: 1280, quality: 0.9});
  const imageBase64 = await fileToBase64(compressed.uri);

  try {
    const response = await axios.post(`${CONFIG.API_BASE_URL}/api/validate-photo`, {
      imageBase64,
    });

    return response.data?.data as PhotoValidationResult;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const response = error.response?.data;
      if (error.response?.status === 400 && response?.success === false) {
        return {
          valid: false,
          reason: response.error ?? 'The photo is not suitable for try-ons.',
          issues: Array.isArray(response.details?.issues) ? response.details.issues : [],
          poseWarning: Boolean(response.details?.poseWarning),
          poseMessage: response.details?.poseMessage ?? '',
          code: response.code,
        } as PhotoValidationResult;
      }
    }

    throw error;
  }
};