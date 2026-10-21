import { BlurView } from 'expo-blur';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { haptic } from '../haptics';
import { motion, useReducedMotion } from '../motion';
import { color, elevation, font } from '../tokens';
import { NAV_ICONS } from './nav-icons';
import { AddButton } from './buttons';
import { Tap, Txt } from './primitives';

export type TabName = 'index' | 'chores' | 'pantry' | 'profile';
const TABS: { name: TabName; label: string; icon: keyof typeof NAV_ICONS }[] = [
  { name: 'index', label: 'Home', icon: 'house' },
  { name: 'chores', label: 'Chores', icon: 'clipboard' },
  { name: 'pantry', label: 'Pantry', icon: 'bag' },
  { name: 'profile', label: 'Profile', icon: 'user' },
];
// from the Figma nav: active violet SemiBold, the rest #4B4566 Medium; one 1.75 stroke for both
const ON = color.text.link;
const OFF = '#4B4566';
const TAB_W = 68;
// Final app v2 nav (resized 2026-10-22 after a Mobbin check): 26 pt icons drawn with a 2 pt stroke, 58 pt tabs, 11 pt labels
const ICON = 26;
const ICON_STROKE = (2 * 22) / 26; // the paths are drawn on a 22 grid, so this renders 2 pt at 26 pt
const TAB_H = 58;
// capsule padding 10 + gaps 6 + border 2, then the 8 gap and the 56 add button, and 16 a side
const tabWidth = (screen: number) => Math.min(TAB_W, Math.floor((screen - 32 - 18 - 70) / 4));
const GAP = 2;

/** v2/Nav: a 72 % glass capsule of four tabs (the active pill slides between them) plus the gradient + button. */
export function Nav({ active, onTab, onAdd }: { active: TabName; onTab: (t: TabName) => void; onAdd: () => void }) {
  const reduced = useReducedMotion();
  const w = tabWidth(useWindowDimensions().width);
  const index = Math.max(0, TABS.findIndex((t) => t.name === active));
  const pill = useAnimatedStyle(() => ({
    transform: [{ translateX: reduced ? index * (w + GAP) : withSpring(index * (w + GAP), motion.tab) }],
  }), [index, reduced, w]);
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={[styles.capsule, elevation.glass]}>
        <View style={styles.clip}>
          <BlurView intensity={40} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: 999, overflow: 'hidden' }]} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(252,251,255,0.72)' }]} />
          <Animated.View style={[styles.pill, { width: w }, pill]} />
          <View style={styles.tabs} accessibilityRole="tablist">
            {TABS.map(({ name, label, icon }) => {
              const on = name === active;
              return (
                <Tap key={name} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={label}
                  onPress={() => { if (!on) { haptic.select(); onTab(name); } }}>
                  <View style={[styles.tab, { width: w }]}>
                    <SvgXml xml={NAV_ICONS[icon].replaceAll('{c}', on ? ON : OFF).replaceAll('stroke-width="1.75"', `stroke-width="${ICON_STROKE}"`)} width={ICON} height={ICON} />
                    <Txt v="Nav" c={on ? ON : OFF} style={on && { fontFamily: font.semibold }}>{label}</Txt>
                  </View>
                </Tap>
              );
            })}
          </View>
        </View>
      </View>
      <AddButton onPress={onAdd} label="Add a chore, pantry item, restock or invite" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center' },
  capsule: { borderRadius: 999, borderWidth: 1, borderColor: 'rgba(252,251,255,0.95)' },
  clip: { borderRadius: 999, overflow: 'hidden', padding: 5 },
  tabs: { flexDirection: 'row', gap: GAP },
  tab: { width: TAB_W, height: TAB_H, alignItems: 'center', justifyContent: 'center', gap: 3 },
  pill: { position: 'absolute', left: 5, top: 5, width: TAB_W, height: TAB_H, borderRadius: 999, backgroundColor: color.action.selectedTint },
});
