import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {HistoryState, TryOnResult} from '../types';

export const useHistoryStore = create<HistoryState>()(
  persist(
    set => ({
      results: [],
      addResult: (result: TryOnResult) =>
        set(state => ({results: [result, ...state.results]})),
      removeResult: (id: string) =>
        set(state => ({results: state.results.filter(result => result.id !== id)})),
      clearAll: () => set({results: []}),
    }),
    {
      name: 'trysnap-history-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
