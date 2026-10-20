import { Platform } from 'react-native';

// Roomie brand palette
export const Brand = {
  navy: '#111827',
  navyMid: '#1F2937',
  indigo: '#6366F1',
  indigoDark: '#4F46E5',
  lavender: '#E0E7FF',
  lavenderText: '#4338CA',
  peach: '#FED7AA',
  peachText: '#C2410C',
  mint: '#D1FAE5',
  mintText: '#065F46',
  coral: '#FCA5A5',
  coralText: '#991B1B',
  butter: '#FEF08A',
  butterText: '#854D0E',
} as const;

export const Colors = {
  light: {
    text: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    background: '#F2F2F7',
    card: '#FFFFFF',
    cardBorder: '#E5E7EB',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    tabBar: Brand.navy,
    tabBarActive: '#FFFFFF',
    tabBarInactive: 'rgba(255,255,255,0.45)',
    accent: Brand.indigo,
    accentLight: Brand.lavender,
    separatorColor: 'rgba(0,0,0,0.08)',
    shadow: 'rgba(0,0,0,0.06)',
  },
  dark: {
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',
    background: '#111827',
    card: '#1F2937',
    cardBorder: '#374151',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    tabBar: '#0A0F1A',
    tabBarActive: '#FFFFFF',
    tabBarInactive: 'rgba(255,255,255,0.45)',
    accent: '#818CF8',
    accentLight: '#312E81',
    separatorColor: 'rgba(255,255,255,0.08)',
    shadow: 'rgba(0,0,0,0.3)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;
export type ColorScheme = 'light' | 'dark';
// Widened so components can accept either color scheme without literal-type mismatches
export type ThemeColors = { [K in ThemeColor]: string };

// Same faces as the web app: Inter for UI, Playfair Display 700 for titles.
// Custom fonts ignore fontWeight on native, so each weight is its own family.
export const F = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  heavy: 'Inter_800ExtraBold',
  display: 'PlayfairDisplay_700Bold',
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
