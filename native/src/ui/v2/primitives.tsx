// Building materials every v2 component uses: text, glass, gradient strokes and the press behaviour.
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableProps, type StyleProp, type TextProps, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { haptic } from '../haptics';
import { usePress } from '../motion';
import { color, elevation, radius, type } from '../tokens';

export type TypeName = keyof typeof type;

/** Text in one of the 16 Figma text styles. */
export function Txt({ v = 'Body/Default', c = color.text.primary, style, ...rest }: TextProps & { v?: TypeName; c?: string }) {
  return <Text {...rest} style={[type[v], { color: c }, style]} />;
}

export const gradients = {
  outline: [color.accent.selectedStart, color.accent.selectedEnd] as const,
  add: [color.accent.addStart, color.accent.addMid, color.accent.addEnd] as const,
};

/**
 * Frosted surface from the Figma "Glass card" style: blur 24, 55–62 % lavender off-white, hairline, soft tinted lift.
 * `outline` swaps the hairline for the lilac→peach gradient stroke used for "mine" and focused states.
 */
export function Glass({ children, style, r = radius.card, fill = 0.55, outline = false, strokeWidth = 1.25, lift = true, pad }: {
  children?: ReactNode; style?: StyleProp<ViewStyle>; r?: number; fill?: number; outline?: boolean; strokeWidth?: number; lift?: boolean; pad?: number;
}) {
  const inner = (
    <View style={[styles.clip, { borderRadius: outline ? r - strokeWidth : r }]}>
      {/* an outlined card sits on the gradient, so it needs a solid base or the stroke tints the whole fill */}
      {outline ? <View style={[StyleSheet.absoluteFill, { backgroundColor: color.bg.surface }]} />
        : <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(252,251,255,${fill})` }]} />
      <View style={[styles.content, pad !== undefined && { padding: pad }]}>{children}</View>
    </View>
  );
  return (
    <View style={[lift && elevation.glass, { borderRadius: r }, style]}>
      {outline ? (
        <LinearGradient colors={gradients.outline} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: r, padding: strokeWidth }}>{inner}</LinearGradient>
      ) : (
        <View style={[styles.hairline, { borderRadius: r }]}>{inner}</View>
      )}
    </View>
  );
}

/** A circle or pill with the lilac→peach stroke and a flat fill inside (unchecked check, focused field). */
export function GradientRing({ size, width = 1.75, fill = color.bg.surface, children }: { size: number; width?: number; fill?: string; children?: ReactNode }) {
  return (
    <LinearGradient colors={gradients.outline} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: size, height: size, borderRadius: size / 2, padding: width }}>
      <View style={{ flex: 1, borderRadius: size / 2, backgroundColor: fill, alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </LinearGradient>
  );
}

const APressable = Animated.createAnimatedComponent(Pressable);

/** Every tappable surface: springs to 0.97 while pressed, optional haptic, 44 pt minimum target. */
export function Tap({ children, style, onPress, feel, hitSlop = 6, ...rest }: PressableProps & {
  children: ReactNode; style?: StyleProp<ViewStyle>; feel?: 'select' | 'complete' | 'none';
}) {
  const press = usePress();
  return (
    <APressable
      accessibilityRole="button"
      hitSlop={hitSlop}
      {...rest}
      onPressIn={(e) => { press.onPressIn(); rest.onPressIn?.(e); }}
      onPressOut={(e) => { press.onPressOut(); rest.onPressOut?.(e); }}
      onPress={(e) => { if (feel === 'select') haptic.select(); if (feel === 'complete') haptic.complete(); onPress?.(e); }}
      style={[press.style, style]}
    >
      {children}
    </APressable>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  content: {},
  hairline: { borderWidth: 1, borderColor: color.border.hairline, overflow: 'hidden' },
});
