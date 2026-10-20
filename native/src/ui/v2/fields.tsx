import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Animated, { LinearTransition, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { haptic } from '../haptics';
import { motion } from '../motion';
import { color, radius, type } from '../tokens';
import { Glass, Tap, Txt } from './primitives';

/** v2/Field: 52 tall glass pill, radius 26. Focus draws the lilac→peach 2 px stroke; error is red 1.5 px. */
export function TextField({ error, ...props }: TextInputProps & { error?: boolean }) {
  const [focused, setFocused] = useState(false);
  const input = (
    <TextInput
      placeholderTextColor={color.text.tertiary}
      selectionColor={color.action.primary}
      {...props}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
      style={[type['Body/Input'], styles.input, { color: color.text.primary }, props.style]}
    />
  );
  if (error) return <View style={[styles.field, styles.error]}>{input}</View>;
  return (
    <Glass r={radius.field} fill={0.62} outline={focused} strokeWidth={2} lift={false} style={{ height: 52 }}>
      <View style={{ height: focused ? 48 : 50, justifyContent: 'center' }}>{input}</View>
    </Glass>
  );
}

/** Six code boxes in two groups of three, as in frames 05 / J1. Typing fills left to right. */
export function CodeInput({ value, onChange, error, keyboard = 'number-pad', autoFocus, accessibilityLabel = 'Code' }: {
  value: string; onChange: (v: string) => void; error?: boolean; keyboard?: 'number-pad' | 'default'; autoFocus?: boolean; accessibilityLabel?: string;
}) {
  const ref = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const chars = value.padEnd(6, ' ').slice(0, 6).split('');
  const box = (i: number) => {
    const active = focused && i === Math.min(value.length, 5);
    const ch = chars[i].trim();
    return (
      <View key={i} style={[styles.box, error && styles.boxError, active && !error && styles.boxActive]}>
        <Txt v="Title/Onboarding" c={color.text.primary} style={{ fontFamily: type['Heading/Section'].fontFamily, fontSize: 26 }}>{ch}</Txt>
      </View>
    );
  };
  return (
    <Pressable onPress={() => ref.current?.focus()} accessibilityLabel={accessibilityLabel} style={styles.codeRow}>
      {[0, 1, 2].map(box)}
      <View style={styles.dash} />
      {[3, 4, 5].map(box)}
      <TextInput
        ref={ref} value={value} autoFocus={autoFocus} maxLength={6} keyboardType={keyboard} autoCapitalize="characters"
        textContentType="oneTimeCode" autoComplete="one-time-code" caretHidden
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        onChangeText={(t) => onChange((keyboard === 'number-pad' ? t.replace(/\D/g, '') : t.toUpperCase().replace(/[^A-Z0-9]/g, '')).slice(0, 6))}
        style={styles.hidden}
      />
    </Pressable>
  );
}

/** v2/Segmented control: glass capsule; the active segment is a violet 14 % pill that slides. */
export function SegmentedControl<T extends string>({ options, value, onChange }: { options: { value: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void }) {
  return (
    <Glass r={22} fill={0.62} style={{ alignSelf: 'stretch' }}>
      <View style={styles.segRow}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Tap key={o.value} onPress={() => onChange(o.value)} feel="select" style={{ flexGrow: 1 }} accessibilityState={{ selected: on }}>
              <Animated.View layout={LinearTransition.springify().damping(motion.tab.damping).stiffness(motion.tab.stiffness)} style={[styles.seg, on && styles.segOn]}>
                <Txt v="Body/Label" c={on ? color.text.link : color.text.secondary}>{o.label}</Txt>
                {o.count ? <View style={styles.count}><Txt v="Tag" c={color.text.link}>{o.count}</Txt></View> : null}
              </Animated.View>
            </Tap>
          );
        })}
      </View>
    </Glass>
  );
}

/** v2/View switch: the small Week / Month capsule. */
export function ViewSwitch<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <Glass r={20} fill={0.62}>
      <View style={[styles.segRow, { padding: 4 }]}>
        {options.map((o) => (
          <Tap key={o.value} onPress={() => onChange(o.value)} feel="select" accessibilityState={{ selected: o.value === value }}>
            <View style={[styles.switchItem, o.value === value && styles.segOn]}>
              <Txt v="Meta/Medium" c={o.value === value ? color.text.link : color.text.secondary}>{o.label}</Txt>
            </View>
          </Tap>
        ))}
      </View>
    </Glass>
  );
}

/** Onboarding step bar: six short bars, done and current violet, upcoming violet 18 %. */
export function StepBar({ step, total = 6 }: { step: number; total?: number }) {
  return (
    <View style={styles.steps} accessibilityLabel={`Step ${step} of ${total}`}>
      {Array.from({ length: total }, (_, i) => <View key={i} style={[styles.step, { backgroundColor: i < step ? color.action.primary : 'rgba(135,107,222,0.18)' }]} />)}
    </View>
  );
}

export const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

/** Busy-day picker: seven 42 circles, Sunday first; selected days fill violet. */
export function DayPicker({ value, onChange }: { value: number[]; onChange: (days: number[]) => void }) {
  return (
    <View style={styles.days}>
      {DAY_LETTERS.map((l, d) => {
        const on = value.includes(d);
        return (
          <Tap key={d} feel="select" accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={DAY_NAMES[d]}
            onPress={() => onChange(on ? value.filter((x) => x !== d) : [...value, d].sort())}>
            <View style={[styles.day, on ? styles.dayOn : styles.dayOff]}>
              <Txt v="Body/Label" c={on ? color.text.onAccent : color.text.primary}>{l}</Txt>
            </View>
          </Tap>
        );
      })}
    </View>
  );
}

/** v2/Chip: pill choice (home-name suggestions, reminder times). */
export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Tap onPress={onPress} feel="select" accessibilityState={{ selected }}>
      <View style={[styles.chip, selected ? styles.chipOn : styles.chipOff]}>
        <Txt v="Body/Label" c={selected ? color.text.link : color.text.primary}>{label}</Txt>
      </View>
    </Tap>
  );
}

/** v2/Toggle: 51 × 31, violet when on, knob springs across. */
export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: withSpring(value ? 20 : 0, motion.press.spring) }] }), [value]);
  return (
    <Pressable onPress={() => { haptic.select(); onChange(!value); }} accessibilityRole="switch" accessibilityState={{ checked: value }} accessibilityLabel={label} hitSlop={8}>
      <View style={[styles.toggle, { backgroundColor: value ? color.action.primary : '#E5E1EE' }]}>
        <Animated.View style={[styles.knob, knob]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  input: { paddingHorizontal: 22, height: 48 },
  field: { height: 52, borderRadius: radius.field, backgroundColor: 'rgba(252,251,255,0.62)', justifyContent: 'center' },
  error: { borderWidth: 1.5, borderColor: color.border.error },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'stretch', justifyContent: 'space-between' },
  box: { flex: 1, maxWidth: 52, height: 56, borderRadius: 14, backgroundColor: 'rgba(252,251,255,0.8)', borderWidth: 1.5, borderColor: 'rgba(135,107,222,0.14)', alignItems: 'center', justifyContent: 'center' },
  boxActive: { borderColor: color.accent.selectedStart, borderWidth: 2 },
  boxError: { borderColor: color.border.error },
  dash: { width: 8, height: 2, borderRadius: 1, backgroundColor: 'rgba(31,27,58,0.2)' },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  segRow: { flexDirection: 'row', padding: 4, gap: 2 },
  seg: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 18 },
  segOn: { backgroundColor: color.action.selectedTint },
  count: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, backgroundColor: 'rgba(135,107,222,0.14)', alignItems: 'center', justifyContent: 'center' },
  switchItem: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 18 },
  steps: { flexDirection: 'row', gap: 4 },
  step: { width: 32, height: 4, borderRadius: 2 },
  days: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch' },
  day: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  dayOn: { backgroundColor: color.action.primary, shadowColor: '#3B2470', shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  dayOff: { backgroundColor: color.bg.surface, borderWidth: 1, borderColor: '#ECEAF3' },
  chip: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: radius.full },
  chipOn: { backgroundColor: '#F4F0FF', borderWidth: 2, borderColor: '#8670F0' },
  chipOff: { backgroundColor: color.bg.surface, borderWidth: 1, borderColor: '#ECEAF3' },
  toggle: { width: 51, height: 31, borderRadius: 15.5, padding: 2, justifyContent: 'center' },
  knob: { width: 27, height: 27, borderRadius: 13.5, backgroundColor: color.bg.surface, shadowColor: '#3B2470', shadowOpacity: 0.18, shadowRadius: 3, shadowOffset: { width: 0, height: 2 } },
});

