import { BlurView } from 'expo-blur';
import { ClipboardList, House, ShoppingBag, UserRound, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { haptic } from '../haptics';
import { motion, useReducedMotion } from '../motion';
import { color, elevation } from '../tokens';
import { AddButton } from './buttons';
import { Tap, Txt } from './primitives';

export type TabName = 'index' | 'chores' | 'pantry' | 'profile';
const TABS: { name: TabName; label: string; icon: LucideIcon }[] = [
  { name: 'index', label: 'Home', icon: House },
  { name: 'chores', label: 'Chores', icon: ClipboardList },
  { name: 'pantry', label: 'Pantry', icon: ShoppingBag },
  { name: 'profile', label: 'Profile', icon: UserRound },
];
const TAB_W = 68;
// capsule padding 10 + gaps 6 + border 2, then the 8 gap and the 56 add button, and 16 a side
const tabWidth = (screen: number) => Math.min(TAB_W, Math.floor((screen - 32 - 18 - 64) / 4));
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
          <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(252,251,255,0.72)' }]} />
          <Animated.View style={[styles.pill, { width: w }, pill]} />
          <View style={styles.tabs} accessibilityRole="tablist">
            {TABS.map(({ name, label, icon: Icon }) => {
              const on = name === active;
              return (
                <Tap key={name} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={label}
                  onPress={() => { if (!on) { haptic.select(); onTab(name); } }}>
                  <View style={[styles.tab, { width: w }]}>
                    <Icon size={20} color={on ? color.text.link : color.text.primary} strokeWidth={on ? 2 : 1.6} />
                    <Txt v="Nav" c={on ? color.text.link : color.text.primary}>{label}</Txt>
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
  tab: { width: TAB_W, height: 52, alignItems: 'center', justifyContent: 'center', gap: 2 },
  pill: { position: 'absolute', left: 5, top: 5, width: TAB_W, height: 52, borderRadius: 999, backgroundColor: color.action.selectedTint },
});
