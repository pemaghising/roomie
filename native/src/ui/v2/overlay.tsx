import { BlurView } from 'expo-blur';
import { Check as CheckIcon, MoreHorizontal, type LucideIcon } from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Keyboard, Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedKeyboard, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { durations, motion, useReducedMotion } from '../motion';
import { color, elevation, radius } from '../tokens';
import { Button } from './buttons';
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
/** `floating` lifts a sheet opened inside a tab screen above the nav (route sheets already sit above it). */
export function Sheet({ children, onClose, title, sub, floating }: { children: ReactNode; onClose: () => void; title?: string; sub?: string; floating?: boolean }) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { height: screen } = useWindowDimensions();
  // the sheet rides on top of the keyboard, and its body scrolls when the two don't fit
  const kb = useAnimatedKeyboard();
  const y = useSharedValue(reduced ? 0 : 600);
  const fade = useSharedValue(0);
  useEffect(() => {
    fade.value = withTiming(1, { duration: durations.sheetFade });
    y.value = reduced ? 0 : withSpring(0, motion.sheet);
  }, [fade, y, reduced]);
  const close = () => {
    Keyboard.dismiss();
    fade.value = withTiming(0, { duration: durations.sheetFade });
    y.value = withTiming(700, { duration: durations.sheetFade }, (ok) => { if (ok) runOnJS(onClose)(); });
  };
  const drag = Gesture.Pan()
    .onChange((e) => { y.value = Math.max(0, y.value + e.changeY); })
    .onEnd((e) => {
      if (y.value > 120 || e.velocityY > 900) runOnJS(close)();
      else y.value = withSpring(0, motion.sheet);
    });
  const rest = Math.max(42, insets.bottom + 16);
  const sheetStyle = useAnimatedStyle(() => ({
    bottom: kb.height.value,
    paddingBottom: kb.height.value > 0 ? 16 : rest,
    maxHeight: screen - insets.top - 12 - kb.height.value,
    transform: [{ translateY: y.value }],
  }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const body = (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, scrimStyle]}>
        <BlurView intensity={18} tint="light" style={StyleSheet.absoluteFill} />
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(252,251,255,0.5)' }]} onPress={close} accessibilityLabel="Close" />
      </Animated.View>
      <Animated.View style={[styles.sheet, elevation.sheet, sheetStyle]} accessibilityViewIsModal>
        <GestureDetector gesture={drag}>
          <View style={styles.sheetHead}>
            <View style={styles.grabber} />
            {(title || sub) && <View style={{ gap: 4 }}>
              {title && <Txt v="Heading/Section" accessibilityRole="header">{title}</Txt>}
              {sub && <Txt v="Body/Default" c={color.text.secondary}>{sub}</Txt>}
            </View>}
          </View>
        </GestureDetector>
        <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" showsVerticalScrollIndicator={false} bounces={false}
          contentContainerStyle={styles.sheetBody} style={{ flexGrow: 0 }}>
          {children}
        </ScrollView>
      </Animated.View>
    </View>
  );
  return floating ? <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={close}>{body}</Modal> : body;
}

/** R13–R15: a short sheet that asks once. Icon in a tinted disc, a question, what happens, then act or cancel. */
export function ConfirmSheet({ icon: Icon, tone = 'default', title, body, action, onConfirm, onClose, busy }: {
  icon: LucideIcon; tone?: 'default' | 'danger'; title: string; body: string; action: string; onConfirm: () => void; onClose: () => void; busy?: boolean;
}) {
  const danger = tone === 'danger';
  return (
    <Sheet onClose={onClose} floating>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <View style={[styles.disc, { backgroundColor: danger ? '#FFE6DC' : color.action.selectedTint }]}>
          <Icon size={22} color={danger ? color.text.danger : color.text.link} strokeWidth={1.9} />
        </View>
        <Txt v="Heading/Section" accessibilityRole="header" style={{ textAlign: 'center' }}>{title}</Txt>
        <Txt v="Body/Default" c={color.text.secondary} style={{ textAlign: 'center', paddingHorizontal: 8 }}>{body}</Txt>
      </View>
      <View style={{ gap: 10 }}>
        <Button title={action} kind={danger ? 'destructive' : 'primary'} onPress={onConfirm} loading={busy} />
        <Button title="Cancel" kind="secondary" onPress={onClose} />
      </View>
    </Sheet>
  );
}

export type MenuItem = { label: string; onPress: () => void; danger?: boolean; icon?: LucideIcon };

/** v2/Item menu (frames P1e, P2b): the ••• button and the card that springs out under it. */
export function MoreMenu({ items, label, size = 32, plain }: { items: MenuItem[]; label: string; size?: number; plain?: boolean }) {
  const ref = useRef<View>(null);
  const { height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const [at, setAt] = useState<{ right: number; top: number; up: boolean } | null>(null);
  const t = useSharedValue(0);
  const open = () => ref.current?.measureInWindow((x, y, w, h) => {
    const up = y + h + 60 + items.length * 52 > height - 90;
    setAt({ right: x + w, top: up ? y - 6 : y + h + 6, up });
    t.value = 0;
    t.value = reduced ? 1 : withSpring(1, motion.pop);
  });
  // iOS won't present an Alert while a Modal is dismissing, so the action waits for the Modal to go
  const close = (then?: () => void) => { setAt(null); if (then) setTimeout(then, 320); };
  const card = useAnimatedStyle(() => ({ opacity: Math.min(1, t.value * 1.6), transform: [{ scale: 0.9 + 0.1 * t.value }] }));
  const veil = useAnimatedStyle(() => ({ opacity: Math.min(1, t.value * 1.4) }));
  const { width } = useWindowDimensions();
  return (
    <>
      <View ref={ref} collapsable={false}>
      <Tap onPress={open} feel="select" accessibilityLabel={label} accessibilityState={{ expanded: !!at }} hitSlop={8}>
        <View style={[{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }, !plain && { backgroundColor: '#F1EFF6' }, at && styles.moreOn]}>
          <MoreHorizontal size={18} color={at ? color.text.link : color.text.secondary} strokeWidth={2.25} />
        </View>
      </Tap>
      </View>
      <Modal transparent visible={!!at} animationType="none" onRequestClose={() => close()} statusBarTranslucent>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(248,246,252,0.6)' }, veil]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => close()} accessibilityLabel="Close menu" />
        </Animated.View>
        {at && (
          <Animated.View style={[styles.menu, elevation.sheet, { right: width - at.right, transformOrigin: at.up ? 'bottom right' : 'top right' },
            at.up ? { bottom: height - at.top } : { top: at.top }, card]} accessibilityRole="menu">
            {items.map((m, i) => (
              <Tap key={m.label} onPress={() => close(m.onPress)} feel={m.danger ? 'none' : 'select'} accessibilityRole="menuitem">
                <View style={[styles.menuRow, i < items.length - 1 && styles.menuLine]}>
                  <Txt v="Body/Default" c={m.danger ? color.text.danger : color.text.primary}>{m.label}</Txt>
                  {m.icon && <m.icon size={16} color={m.danger ? color.text.danger : color.text.secondary} strokeWidth={2} />}
                </View>
              </Tap>
            ))}
          </Animated.View>
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  disc: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  moreOn: { backgroundColor: color.bg.surface, borderWidth: 1.5, borderColor: color.action.primary },
  menu: { position: 'absolute', minWidth: 220, borderRadius: 18, backgroundColor: color.bg.surface, borderWidth: 1, borderColor: '#ECE8F6', overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingVertical: 15, paddingHorizontal: 16, minHeight: 50 },
  menuLine: { borderBottomWidth: 1, borderBottomColor: 'rgba(135,107,222,0.12)' },
  snack: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'center', maxWidth: 360, paddingVertical: 8, paddingLeft: 18, paddingRight: 8, borderRadius: radius.full, backgroundColor: color.text.primary },
  snackAction: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.full, backgroundColor: 'rgba(252,251,255,0.12)' },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch', paddingVertical: 12, paddingLeft: 14, paddingRight: 16, borderRadius: 16, backgroundColor: color.text.primary },
  tick: { width: 22, height: 22, borderRadius: 11, backgroundColor: color.action.primary, alignItems: 'center', justifyContent: 'center' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: color.bg.surface, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, borderWidth: 1, borderColor: '#E9E6F5', paddingTop: 12 },
  sheetHead: { paddingHorizontal: 24, gap: 16, paddingBottom: 4 },
  sheetBody: { paddingHorizontal: 24, paddingTop: 16, gap: 20 },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: 'rgba(31,27,58,0.18)', marginBottom: 4 },
});
