// C4 · New chore: a sheet over Chores. The icon is picked from the name; tap it to choose another.
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Pencil, RefreshCw } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import type { Cadence, Effort } from '@domain/types.ts';
import { choreIcon } from '@/lib/chore-icon';
import { messageOf, planNow, rpc, STATE_KEY, useAppState } from '@/lib/state';
import { durations, motion } from '@/ui/motion';
import { useToast } from '@/ui/toast';
import { color, font } from '@/ui/tokens';
import { Button, Chip, EmojiBadge, Sheet, Tap, Txt } from '@/ui/v2';

const PICKS = ['Water plants', 'Wipe stove', 'Defrost freezer', 'Clean windows', 'Change bedsheets', 'Do the laundry'];
const ICONS = ['🧽', '🧹', '🪣', '🧺', '🗑️', '♻️', '🍽️', '🍳', '🚿', '🚽', '🪟', '🛏️', '🪴', '🛒'];
const E = color.effort;
const EFFORTS: { value: Effort; label: string; bg: string; fg: string }[] = [
  { value: 1, label: 'Light', bg: E.lightBg, fg: E.lightFg },
  { value: 2, label: 'Medium', bg: E.mediumBg, fg: E.mediumFg },
  { value: 3, label: 'Heavy', bg: E.heavyBg, fg: E.heavyFg },
];
const CADENCES: { value: Cadence; label: string; bg: string; fg: string }[] = [
  { value: 'daily', label: 'Daily', bg: color.bg.surface, fg: color.text.link },
  { value: 'weekly', label: 'Weekly', bg: color.bg.surface, fg: color.text.link },
  { value: 'biweekly', label: 'Bi-weekly', bg: color.bg.surface, fg: color.text.link },
];
const spring = LinearTransition.springify().damping(motion.tab.damping).stiffness(motion.tab.stiffness);

/** The tinted three-way switch from C4: the chosen segment takes its own colour (effort) or lifts white (repeats). */
function Seg<T extends string | number>({ label, options, value, onChange }: { label: string; options: { value: T; label: string; bg: string; fg: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.seg} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Tap key={o.label} onPress={() => onChange(o.value)} feel="select" style={{ flex: 1 }} accessibilityRole="radio" accessibilityState={{ selected: on }}>
            <Animated.View layout={spring} style={[styles.segItem, on && { backgroundColor: o.bg }, on && o.bg === color.bg.surface && styles.lift]}>
              <Txt v="Body/Label" c={on ? o.fg : color.text.secondary}>{o.label}</Txt>
            </Animated.View>
          </Tap>
        );
      })}
    </View>
  );
}

export default function AddChore() {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const { data } = useAppState();
  const [name, setName] = useState('');
  const [chosen, setChosen] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [effort, setEffort] = useState<Effort>(2);
  const [cadence, setCadence] = useState<Cadence>('weekly');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const icon = chosen ?? choreIcon(name);
  const taken = new Set((data?.chores ?? []).map((c) => c.name.toLowerCase()));
  const picks = PICKS.filter((p) => !taken.has(p.toLowerCase()));
  const close = () => router.back();

  const save = async () => {
    if (busy || !name.trim()) return;
    setBusy(true);
    try {
      const id = await rpc<string>('add_chore', { p_name: name.trim(), p_icon: icon, p_effort: effort, p_cadence: cadence });
      await planNow(id).catch(() => {});
      await qc.invalidateQueries({ queryKey: STATE_KEY });
      toast.show(`${name.trim()} is in the rotation.`, { tick: true });
      close();
    } catch (e) {
      setError(messageOf(e));
      setBusy(false);
    }
  };

  return (
    <Sheet onClose={close}>
      <Txt v="Body/Label" c={color.text.link}>New chore</Txt>
      <View style={styles.nameRow}>
        <Tap onPress={() => setPicking((p) => !p)} feel="select" accessibilityLabel="Change icon" accessibilityState={{ expanded: picking }}>
          <View>
            <EmojiBadge value={icon} name={name || 'Chore'} size={64} round tint="#F1ECFD" />
            <View style={styles.pencil}><Pencil size={10} color={color.text.link} strokeWidth={2.25} /></View>
          </View>
        </Tap>
        <View style={{ flex: 1, gap: 2 }}>
          <TextInput value={name} onChangeText={(t) => { setName(t); setError(null); }} placeholder="Name the chore" placeholderTextColor={color.text.secondary}
            maxLength={40} autoFocus accessibilityLabel="Chore name" selectionColor={color.action.primary} style={styles.name} returnKeyType="done" />
          <Txt v="Meta" c={color.text.secondary}>{chosen ? 'Your pick · tap to change' : 'Icon picked for you · tap to change'}</Txt>
        </View>
      </View>

      {picking && (
        <Animated.View entering={FadeIn.duration(durations.fade)} exiting={FadeOut.duration(durations.fade)} style={styles.icons}>
          {ICONS.map((e) => (
            <Tap key={e} onPress={() => { setChosen(e); setPicking(false); }} feel="select" accessibilityLabel={`Icon ${e}`} accessibilityState={{ selected: e === icon }}>
              <View style={[styles.iconCell, e === icon && styles.iconOn]}><EmojiBadge value={e} size={40} round /></View>
            </Tap>
          ))}
        </Animated.View>
      )}

      {picks.length > 0 && (
        <View style={{ gap: 10 }}>
          <Txt v="Meta/Medium" c={color.text.secondary}>Quick picks</Txt>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }} style={{ marginHorizontal: -24 }}>
            <View style={{ width: 24 }} />
            {picks.map((p) => <Chip key={p} label={p} selected={name === p} onPress={() => { setName(p); setChosen(null); }} />)}
            <View style={{ width: 16 }} />
          </ScrollView>
        </View>
      )}

      <View style={{ gap: 10 }}>
        <Txt v="Meta/Medium" c={color.text.secondary}>Effort</Txt>
        <Seg label="Effort" options={EFFORTS} value={effort} onChange={setEffort} />
        <Txt v="Meta" c={color.text.secondary}>Heavy chores skip your busy days.</Txt>
      </View>

      <View style={{ gap: 10 }}>
        <Txt v="Meta/Medium" c={color.text.secondary}>Repeats</Txt>
        <Seg label="Repeats" options={CADENCES} value={cadence} onChange={setCadence} />
      </View>

      <View style={styles.note}>
        <RefreshCw size={16} color={color.text.link} strokeWidth={2} />
        <Txt v="Body/Default" c={color.text.numeral}>Roomie rotates it fairly for you.</Txt>
      </View>
      {error && <Txt v="Meta" c={color.action.danger} accessibilityRole="alert">{error}</Txt>}
      <Button title="Add chore" onPress={save} loading={busy} disabled={!name.trim()} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  pencil: { position: 'absolute', right: -2, bottom: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: color.bg.surface, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#3B2470', shadowOpacity: 0.14, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  name: { fontFamily: font.semibold, fontSize: 20, lineHeight: 25, color: color.text.primary, padding: 0 },
  icons: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  iconCell: { padding: 2, borderRadius: 24, borderWidth: 1.5, borderColor: 'transparent' },
  iconOn: { borderColor: color.action.primary },
  seg: { flexDirection: 'row', padding: 4, borderRadius: 22, backgroundColor: 'rgba(135,107,222,0.1)' },
  segItem: { height: 40, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  lift: { shadowColor: '#7A5FD6', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  note: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, backgroundColor: 'rgba(135,107,222,0.1)' },
});
