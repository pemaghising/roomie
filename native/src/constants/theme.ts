// v2 tokens live in @/ui/tokens. F is the old Inter/Playfair map, kept only until the
// last old-kit screen is rebuilt (Task 10), then this file goes.
export * from '@/ui/tokens';

export const F = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  heavy: 'Inter_800ExtraBold',
  display: 'PlayfairDisplay_700Bold',
} as const;
