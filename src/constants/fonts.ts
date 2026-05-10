import {Platform} from 'react-native';

export const FONTS = {
  regular: Platform.select({android: 'sans-serif', ios: 'System', default: 'System'}),
  medium: Platform.select({android: 'sans-serif-medium', ios: 'System', default: 'System'}),
  bold: Platform.select({android: 'sans-serif-condensed', ios: 'System', default: 'System'}),
  mono: Platform.select({android: 'monospace', ios: 'Courier', default: 'Courier'}),
} as const;

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;
