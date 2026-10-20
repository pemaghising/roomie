import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { F } from '@/constants/theme';
import { useTabShrunk } from '@/lib/tab-shrink';

type Icon = keyof typeof Ionicons.glyphMap;
const TABS: Record<string, { label: string; icon: Icon; active: Icon }> = {
  index: { label: 'Home', icon: 'home-outline', active: 'home' },
  chores: { label: 'Chores', icon: 'clipboard-outline', active: 'clipboard' },
  pantry: { label: 'Pantry', icon: 'bag-handle-outline', active: 'bag-handle' },
  profile: { label: 'Profile', icon: 'person-outline', active: 'person' },
};

const PAD = 8;
const SLIDE = { duration: 200, easing: Easing.out(Easing.cubic) };

/** The hi-fi floating dark pill with a white pill sliding under the active tab. */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const slot = (width - PAD * 2) / state.routes.length;
  const x = useSharedValue(0);
  const placed = useRef(false);
  useEffect(() => {
    if (slot <= 0) return;
    // first measurement jumps into place; after that, a short ease-out slide with no overshoot
    x.value = placed.current ? withTiming(state.index * slot, SLIDE) : state.index * slot;
    placed.current = true;
  }, [state.index, slot, x]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  // while the page scrolls the bar shrinks to icons only; it opens again when scrolling stops
  const shrunk = useTabShrunk();
  const k = useSharedValue(0);
  useEffect(() => { k.value = withTiming(shrunk ? 1 : 0, { duration: 220, easing: Easing.out(Easing.cubic) }); }, [shrunk, k]);
  const barSize = useAnimatedStyle(() => ({ height: interpolate(k.value, [0, 1], [68, 52]) }));
  const labelSize = useAnimatedStyle(() => ({ height: interpolate(k.value, [0, 1], [14, 0]), opacity: 1 - k.value }));

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <Animated.View style={[styles.bar, barSize]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {slot > 0 && <Animated.View style={[styles.pill, { width: slot }, pill]} />}
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const t = TABS[route.name];
          if (!t) return null;
          const press = () => {
            const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !e.defaultPrevented) { Haptics.selectionAsync(); navigation.navigate(route.name, route.params); }
          };
          return (
            <Pressable key={route.key} accessibilityRole="tab" accessibilityLabel={t.label} accessibilityState={{ selected: focused }}
              onPress={press} style={styles.tab}>
              <Ionicons name={focused ? t.active : t.icon} size={22} color={focused ? '#111827' : 'rgba(255,255,255,0.6)'} />
              <Animated.View style={[{ overflow: 'hidden' }, labelSize]}><Text style={[styles.label, { color: focused ? '#111827' : 'rgba(255,255,255,0.6)' }]}>{t.label}</Text></Animated.View>
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24 },
  bar: { flexDirection: 'row', backgroundColor: '#111827', borderRadius: 34, padding: PAD, height: 68,
    shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  pill: { position: 'absolute', left: PAD, top: PAD, bottom: PAD, borderRadius: 26, backgroundColor: '#FFFFFF' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontSize: 11, fontFamily: F.semibold },
});
