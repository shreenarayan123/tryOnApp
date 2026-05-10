import {MMKV} from 'react-native-mmkv';

export const storage = new MMKV({id: 'trysnap-storage'});

export const mmkvStorageAdapter = {
  getItem: (key: string) => storage.getString(key) ?? null,
  setItem: (key: string, value: string) => {
    storage.set(key, value);
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
};

export const storageService = {
  getString(key: string) {
    return storage.getString(key) ?? null;
  },
  setString(key: string, value: string) {
    storage.set(key, value);
  },
  getBoolean(key: string) {
    return storage.getBoolean(key) ?? null;
  },
  setBoolean(key: string, value: boolean) {
    storage.set(key, value);
  },
  getNumber(key: string) {
    return storage.getNumber(key) ?? null;
  },
  setNumber(key: string, value: number) {
    storage.set(key, value);
  },
  getJSON<T>(key: string, fallback: T): T {
    const value = storage.getString(key);
    if (!value) {
      return fallback;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  },
  setJSON(key: string, value: unknown) {
    storage.set(key, JSON.stringify(value));
  },
  remove(key: string) {
    storage.delete(key);
  },
  clearAll() {
    storage.clearAll();
  },
};
