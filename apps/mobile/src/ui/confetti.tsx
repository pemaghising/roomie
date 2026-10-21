import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, type SharedValue, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

// the confetti in frames 13 / J4: roof violet, orchid, chimney peach, leaf green, lilac and sun
const COLORS = ['#7A5FD6', '#BE72CE', '#F39A80', '#6DBE4B', '#C5ACFB', '#F7C948', '#FFB48A', '#8FD3F4'];
const TOTAL = 3600; // ms until the last piece has left the screen

type Shape = 'paper' | 'ribbon' | 'dot';
interface Bit {
  x: number; startY: number; endY: number; delay: number; dur: number;
  sway: number; swayHz: number; phase: number; spin: number; flipHz: number;
  w: number; h: number; color: string; shape: Shape;
}

function Piece({ b, t }: { b: Bit; t: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const ms = t.value * TOTAL;
    const k = Math.min(1, Math.max(0, (ms - b.delay) / b.dur));
    const fall = k * k * (3 - 2 * k) * 0.35 + k * 0.65; // gentle start, then a steady drift down
    return {
      opacity: k <= 0 ? 0 : k > 0.9 ? (1 - k) / 0.1 : 1,
      transform: [
        { translateX: b.x + Math.sin(b.phase + k * b.swayHz * 6.283) * b.sway },
        { translateY: b.startY + (b.endY - b.startY) * fall },
        { rotate: `${b.spin * k}deg` },
        // paper flips as it flutters, so it catches the light
        { scaleY: b.shape === 'dot' ? 1 : Math.cos(b.phase + k * b.flipHz * 6.283) },
      ],
    };
  });
  return <Animated.View style={[styles.bit, { width: b.w, height: b.h, borderRadius: b.shape === 'dot' ? b.w / 2 : b.shape === 'ribbon' ? 2 : 1.5, backgroundColor: b.color }, style]} />;
}

/** Confetti that rains across the whole screen from above the top edge. Plays once on mount; no springs. */
export function Confetti({ count = 120 }: { count?: number }) {
  const { width, height } = useWindowDimensions();
  const t = useSharedValue(0);
  const bits = useMemo<Bit[]>(() => Array.from({ length: count }, () => {
    const r = Math.random();
    const shape: Shape = r < 0.6 ? 'paper' : r < 0.85 ? 'ribbon' : 'dot';
    const size = 7 + Math.random() * 6;
    const dur = 1900 + Math.random() * 1300;
    return {
      x: Math.random() * width,
      startY: -30 - Math.random() * height * 0.35,
      endY: height + 40,
      delay: Math.random() * (TOTAL - dur - 100),
      dur,
      sway: 8 + Math.random() * 26,
      swayHz: 0.6 + Math.random() * 1.2,
      phase: Math.random() * 6.283,
      spin: (Math.random() - 0.5) * 720,
      flipHz: 1 + Math.random() * 2.5,
      w: shape === 'ribbon' ? 4 : size,
      h: shape === 'ribbon' ? size * 2 : shape === 'dot' ? size : size * 1.4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape,
    };
  }), [count, width, height]);
  useEffect(() => { t.value = withTiming(1, { duration: TOTAL, easing: Easing.linear }); }, [t]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {bits.map((b, i) => <Piece key={i} b={b} t={t} />)}
    </View>
  );
}

const styles = StyleSheet.create({ bit: { position: 'absolute', left: 0, top: 0 } });
