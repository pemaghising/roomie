import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { F } from '@/constants/theme';
import { C } from './kit';

export function Segmented<T extends string>({ options, value, onChange, disabled }: {
  options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; disabled?: boolean;
}) {
  return (
    <View style={[styles.seg, disabled && { opacity: 0.5 }]}>
      {options.map((o) => (
        <Pressable key={o.value} accessibilityRole="radio" accessibilityState={{ selected: o.value === value }} disabled={disabled}
          onPress={() => { if (o.value !== value) { Haptics.selectionAsync(); onChange(o.value); } }}
          style={[styles.item, o.value === value && styles.on]}>
          <Text style={[styles.text, o.value === value && styles.textOn]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Coloured pill choices: the picked one is full colour with an outline, the others are faded. */
export function TonePills<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string; tone: { bg: string; fg: string } }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <View style={styles.pills}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} accessibilityRole="radio" accessibilityState={{ selected: on }}
            onPress={() => { if (!on) { Haptics.selectionAsync(); onChange(o.value); } }}
            style={({ pressed }) => [styles.pill, { backgroundColor: o.tone.bg, borderColor: on ? o.tone.fg : 'transparent', opacity: on ? 1 : 0.55 }, pressed && { transform: [{ scale: 0.97 }] }]}>
            <Text style={[styles.pillText, { color: o.tone.fg }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pills: { flexDirection: 'row', gap: 10 },
  pill: { flex: 1, height: 46, borderRadius: 23, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  pillText: { fontSize: 15, fontFamily: F.bold },
  seg: { flexDirection: 'row', backgroundColor: C.field, borderRadius: 24, padding: 4 },
  item: { flex: 1, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  on: { backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  text: { fontSize: 14, color: C.sub, fontFamily: F.medium },
  textOn: { color: C.text, fontFamily: F.semibold },
});
