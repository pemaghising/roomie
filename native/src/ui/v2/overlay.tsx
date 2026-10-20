import { BlurView } from 'expo-blur';
import { Check as CheckIcon } from 'lucide-react-native';
import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { durations, motion, useReducedMotion } from '../motion';
import { color, elevation, radius } from '../tokens';
import { Tap, Txt } from './primitives';

/** v2/Snackbar (frame P1d): dark pill, message, and the action in a soft inner pill. */
export function Snackbar({ message, action, onAction }: { message: string; action?: string; onAction?: () => void }) {
  return (
    <View style={[styles.snack, elevation.sheet]} accessibilityLiveRegion="polite" accessibilityRole="alert">
      <Txt v="Body/Row" c={color.text.onAccent} style={{ flexShrink: 1 }}>{message}</Txt>
      {action && <Tap onPress={onAction} hitSlop={8}><View style={styles.snackAction}><Txt v="Body/Row" c="#C9BCFF">{action}</Txt></View></Tap>}
    </View>
  );
}

/** v2/Toast (frame H3): rounded dark card with a violet tick, a sentence, and Undo. */
export function Toast({ message, action, onAction }: { message: string; action?: string; onAction?: () => void }) {
  return (
    <View style={[styles.toast, elevation.sheet]} accessibilityLiveRegion="polite" accessibilityRole="alert">
      <View style={styles.tick}><CheckIcon size={14} color={color.text.onAccent} strokeWidth={3} /></View>
      <Txt v="Body/Default" c={color.text.onAccent} style={{ flex: 1 }}>{message}</Txt>
      {action && <Tap onPress={onAction} hitSlop={10}><Txt v="Body/Label" c="#C9BCFF">{action}</Txt></Tap>}
    </View>
  );
}

/**
 * Bottom sheet over a blurred scrim, as in the Figma sheets (radius 32, grabber, 42 bottom padding).
 * Springs up on mount; drag down or tap the scrim to dismiss.
 */
export function Sheet({ children, onClose, title, sub }: { children: ReactNode; onClose: () => void; title?: string; sub?: string }) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const y = useSharedValue(reduced ? 0 : 600);
  const fade = useSharedValue(0);
  useEffect(() => {
    fade.value = withTiming(1, { duration: durations.sheetFade });
    y.value = reduced ? 0 : withSpring(0, motion.sheet);
  }, [fade, y, reduced]);
  const close = () => {
    fade.value = withTiming(0, { duration: durations.sheetFade });
    y.value = withTiming(700, { duration: durations.sheetFade }, (ok) => { if (ok) runOnJS(onClose)(); });
  };
  const drag = Gesture.Pan()
    .onChange((e) => { y.value = Math.max(0, y.value + e.changeY); })
    .onEnd((e) => {
      if (y.value > 120 || e.velocityY > 900) runOnJS(close)();
      else y.value = withSpring(0, motion.sheet);
    });
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, scrimStyle]}>
        <BlurView intensity={18} tint="light" style={StyleSheet.absoluteFill} />
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(252,251,255,0.5)' }]} onPress={close} accessibilityLabel="Close" />
      </Animated.View>
      <GestureDetector gesture={drag}>
        <Animated.View style={[styles.sheet, elevation.sheet, { paddingBottom: Math.max(42, insets.bottom + 16) }, sheetStyle]} accessibilityViewIsModal>
          <View style={styles.grabber} />
          {(title || sub) && <View style={{ gap: 4 }}>
            {title && <Txt v="Heading/Section" accessibilityRole="header">{title}</Txt>}
            {sub && <Txt v="Body/Default" c={color.text.secondary}>{sub}</Txt>}
          </View>}
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  snack: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'center', maxWidth: 360, paddingVertical: 8, paddingLeft: 18, paddingRight: 8, borderRadius: radius.full, backgroundColor: color.text.primary },
  snackAction: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.full, backgroundColor: 'rgba(252,251,255,0.12)' },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch', paddingVertical: 12, paddingLeft: 14, paddingRight: 16, borderRadius: 16, backgroundColor: color.text.primary },
  tick: { width: 22, height: 22, borderRadius: 11, backgroundColor: color.action.primary, alignItems: 'center', justifyContent: 'center' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: color.bg.surface, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, borderWidth: 1, borderColor: '#E9E6F5', paddingTop: 12, paddingHorizontal: 24, gap: 20 },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: 'rgba(31,27,58,0.18)', marginBottom: 4 },
});
