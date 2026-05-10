import {useState} from 'react';
import {tryOnService} from '../services/tryOnService';
import {useHistoryStore} from '../store/useHistoryStore';
import {useUserStore} from '../store/useUserStore';
import {TryOnServiceError} from '../services/tryOnService';
import {TryOnStatus} from '../types';

export const useTryOn = () => {
  const avatarPhotoPath = useUserStore(state => state.avatarPhotoPath);
  const incrementTryOnCount = useUserStore(state => state.incrementTryOnCount);
  const addResult = useHistoryStore(state => state.addResult);

  const [status, setStatus] = useState<TryOnStatus>('idle');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startTryOn = async (garmentImagePath: string) => {
    if (!avatarPhotoPath) {
      throw new TryOnServiceError('Avatar photo is missing.', 'INVALID_RESPONSE');
    }

    setError(null);
    setResultUrl(null);
    setStatus('compressing');

    try {
      setStatus('uploading');
      const response = await tryOnService.processTryOn({
        avatarPath: avatarPhotoPath,
        garmentPath: garmentImagePath,
      });

      setStatus('processing');
      setResultUrl(response.resultUrl);
      addResult({
        id: `${Date.now()}`,
        resultImagePath: response.resultUrl,
        garmentImagePath,
        timestamp: Date.now(),
        reaction: null,
      });
      incrementTryOnCount();
      setStatus('done');
      return response.resultUrl;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Try-on failed.';
      setStatus('error');
      setError(message);
      throw cause;
    }
  };

  return {
    startTryOn,
    status,
    resultUrl,
    error,
  };
};
