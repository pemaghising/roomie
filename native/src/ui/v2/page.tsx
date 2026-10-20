// Screen scaffold for every v2 screen: the Figma mesh background, safe areas, an optional back + step-bar
// header, staggered entrances, and the primary action ~40 pt under the content (pinned only when asked).
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Children, isValidElement, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { enter, useReducedMotion } from '../motion';
import { color, layout } from '../tokens';
import { BackButton } from './buttons';
import { Txt } from './primitives';
import { StepBar } from './fields';

export const MESH = require('../../../assets/art/mesh.jpg');

export function MeshBackground() {
  return <Image source={MESH} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} />;
}

/** Children enter one after another (fade + 10 pt rise), so the screen assembles instead of popping. */
export function Stagger({ children, gap = 0, from = 0 }: { children: ReactNode; gap?: number; from?: number }) {
  const reduced = useReducedMotion();
  let i = from;
  return (
    <View style={{ gap }}>
      {Children.map(children, (c) => (isValidElement(c) ? <Animated.View entering={enter(i++, reduced)}>{c}</Animated.View> : c))}
    </View>
  );
}

export function Page({ children, back, step, footer, pinFooter, scroll = true, gap = 24, top, onScroll }: {
  children: ReactNode; back?: boolean | (() => void); step?: number; footer?: ReactNode; pinFooter?: boolean;
  scroll?: boolean; gap?: number; top?: ReactNode; onScroll?: ScrollViewProps['onScroll'];
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const goBack = typeof back === 'function' ? back : () => router.back();
  const header = (back || step !== undefined) && (
    <View style={styles.header}>
      {back ? <BackButton onPress={goBack} /> : <View style={{ width: 40 }} />}
      {step !== undefined && <StepBar step={step} />}
      <View style={{ width: 40 }} />
    </View>
  );
  const body = (
    <View style={{ gap }}>
      <Stagger gap={gap}>{children}</Stagger>
      {footer && !pinFooter && <View style={{ marginTop: 16 }}><Stagger from={6}>{footer}</Stagger></View>}
    </View>
  );
  return (
    <View style={styles.root}>
      <MeshBackground />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ paddingTop: insets.top + 8, paddingHorizontal: layout.margin }}>{header}{top}</View>
        {scroll ? (
          <ScrollView style={{ flex: 1 }} onScroll={onScroll} scrollEventThrottle={16} keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.content, { paddingBottom: (pinFooter ? 24 : insets.bottom + 32) }]}>
            {body}
          </ScrollView>
        ) : <View style={[styles.content, { flex: 1 }]}>{body}</View>}
        {footer && pinFooter && <View style={[styles.pinned, { paddingBottom: insets.bottom + 12 }]}>{footer}</View>}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  header: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  content: { paddingHorizontal: layout.margin, paddingTop: 16 },
  pinned: { paddingHorizontal: layout.margin, paddingTop: 12 },
  bar: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(135,107,222,0.16)' },
});

/**
 * Large-title collapse for the tab screens: the 34 pt title scrolls away with the page and, between 24 and 64 pt
 * of scroll, a frosted bar with the 20 pt title fades in at the top. Spread `onScroll` on an Animated.ScrollView.
 */
export function useTitleBar(title: string) {
  const insets = useSafeAreaInsets();
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => { y.value = e.contentOffset.y; });
  const style = useAnimatedStyle(() => ({ opacity: interpolate(y.value, [24, 64], [0, 1], Extrapolation.CLAMP) }));
  const text = useAnimatedStyle(() => ({ transform: [{ translateY: interpolate(y.value, [24, 64], [8, 0], Extrapolation.CLAMP) }] }));
  const bar = (
    <Animated.View pointerEvents="none" style={[styles.bar, { height: insets.top + 44, paddingTop: insets.top }, style]}>
      <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(248,246,252,0.72)' }]} />
      <Animated.View style={text}><Txt v="Title/Greeting" accessibilityElementsHidden>{title}</Txt></Animated.View>
    </Animated.View>
  );
  return { onScroll, bar };
}
