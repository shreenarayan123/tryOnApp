import {useCallback} from 'react';
import {Alert} from 'react-native';
import {useUserStore} from '../store/useUserStore';

export const usePro = () => {
  const isPro = useUserStore(state => state.isPro);
  const setIsPro = useUserStore(state => state.setIsPro);
  const canTryOn = useUserStore(state => state.canTryOn);

  const promptUpgradeComingSoon = useCallback(() => {
    Alert.alert('Coming soon', 'Payments are not wired in this MVP yet.');
  }, []);

  const activateTestPro = useCallback(() => {
    setIsPro(true);
  }, [setIsPro]);

  return {
    isPro,
    canTryOn,
    promptUpgradeComingSoon,
    activateTestPro,
  };
};
