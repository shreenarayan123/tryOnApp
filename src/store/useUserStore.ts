import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {CONFIG} from '../constants/config';
import {mmkvStorageAdapter} from '../services/storageService';
import {UserState} from '../types';

const today = () => new Date().toISOString().slice(0, 10);

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      avatarPhotoPath: null,
      isPro: false,
      dailyTryOnCount: 0,
      lastTryOnDate: today(),
      setAvatarPhoto: path => set({avatarPhotoPath: path}),
      clearAvatarPhoto: () => set({avatarPhotoPath: null}),
      setIsPro: val => set({isPro: val}),
      incrementTryOnCount: () =>
        set(state => {
          const currentDay = today();
          if (state.lastTryOnDate !== currentDay) {
            return {dailyTryOnCount: 1, lastTryOnDate: currentDay};
          }

          return {
            dailyTryOnCount: state.dailyTryOnCount + 1,
            lastTryOnDate: currentDay,
          };
        }),
      resetDailyCountIfNewDay: () =>
        set(state => {
          const currentDay = today();
          if (state.lastTryOnDate === currentDay) {
            return state;
          }

          return {
            dailyTryOnCount: 0,
            lastTryOnDate: currentDay,
          };
        }),
      canTryOn: () => {
        const state = get();
        return state.isPro || state.dailyTryOnCount < CONFIG.FREE_DAILY_LIMIT;
      },
    }),
    {
      name: 'trysnap-user-store',
      storage: createJSONStorage(() => mmkvStorageAdapter),
    },
  ),
);
