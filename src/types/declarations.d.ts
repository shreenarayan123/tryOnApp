declare module 'react-native-reanimated' {
  import * as React from 'react';
  import {ViewStyle} from 'react-native';

  export const Easing: any;
  export const FadeInUp: any;
  export function useSharedValue<T>(value: T): {value: T};
  export function useAnimatedStyle<T extends ViewStyle>(factory: () => T): T;
  export function withRepeat(animation: any, iterations: number, reverse?: boolean): any;
  export function withTiming(value: any, config?: any): any;
  const Reanimated: any;
  export default Reanimated;
}

declare module 'react-native-vector-icons/MaterialCommunityIcons' {
  import * as React from 'react';
  const Icon: React.ComponentType<any>;
  export default Icon;
}

declare module 'react-native-mmkv' {
  export class MMKV {
    constructor(options?: {id?: string});
    getString(key: string): string | undefined;
    getBoolean(key: string): boolean | undefined;
    getNumber(key: string): number | undefined;
    set(key: string, value: string | boolean | number): void;
    delete(key: string): void;
    clearAll(): void;
  }
}