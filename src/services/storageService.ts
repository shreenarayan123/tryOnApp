import AsyncStorage from '@react-native-async-storage/async-storage';

export const storageService = {
  async getString(key: string) {
    return AsyncStorage.getItem(key);
  },
  async setString(key: string, value: string) {
    await AsyncStorage.setItem(key, value);
  },
  async getBoolean(key: string) {
    const value = await AsyncStorage.getItem(key);
    if (value === null) {
      return null;
    }

    return value === 'true';
  },
  async setBoolean(key: string, value: boolean) {
    await AsyncStorage.setItem(key, String(value));
  },
  async getNumber(key: string) {
    const value = await AsyncStorage.getItem(key);
    if (value === null) {
      return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  },
  async setNumber(key: string, value: number) {
    await AsyncStorage.setItem(key, String(value));
  },
  async getJSON<T>(key: string, fallback: T): Promise<T> {
    const value = await AsyncStorage.getItem(key);
    if (!value) {
      return fallback;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  },
  async setJSON(key: string, value: unknown) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async remove(key: string) {
    await AsyncStorage.removeItem(key);
  },
  async clearAll() {
    await AsyncStorage.clear();
  },
};
