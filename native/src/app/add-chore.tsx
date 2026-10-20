import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Cadence, Effort } from '@domain/types.ts';
import { F } from '@/constants/theme';
import { messageOf, planNow, rpc, STATE_KEY } from '@/lib/state';
import { Button, C, ErrorText, Field } from '@/ui/kit';
import { useToast } from '@/ui/toast';

const ICONS = ['🧽', '🧹', '🪣', '🧺', '🗑️', '♻️', '🍽️', '🫙', '🚿', '🪴'];

/** The last emoji typed or pasted; plain letters and digits are ignored. */
function lastEmoji(text: string): string | null {
  const seg = (Intl as { Segmenter?: new () => { segment(s: string): Iterable<{ segment: string }> } }).Segmenter;
  const parts = seg ? [...new seg().segment(text)].map((x) => x.segment) : Array.from(text);
  const emoji = parts.filter((p) => /[^\u0000-\u007F]/.test(p));
  return emoji.length ? emoji[emoji.length - 1] : null;
}
type Tone = { bg: string; fg: string };
const EFFORTS: { value: Effort; label: string; tone: Tone }[] = [
  { value: 1, label: 'Light', tone: { bg: '#D1FAE5', fg: '#065F46' } },
  { value: 2, label: 'Medium', tone: { bg: '#FEF3C7', fg: '#92400E' } },
  { value: 3, label: 'Heavy', tone: { bg: '#FEE2E2', fg: '#991B1B' } },
];
const CADENCES: { value: Cadence; label: string; tone: Tone }[] = [
  { value: 'daily', label: 'Daily', tone: { bg: '#DBEAFE', fg: '#0369A1' } },
  { value: 'weekly', label: 'Weekly', tone: { bg: '#F3E8FF', fg: '#5C3B9B' } },
  { value: 'biweekly', label: 'Bi-weekly', tone: { bg: '#FFEDD5', fg: '#9A3412' } },
];

function Pills<T>({ options, value, onChange }: { options: { value: T; label: string; tone: Tone }[]; value: T | null; onChange: (v: T) => void }) {
  return (
    <View style={styles.pills}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.label} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => { Haptics.selectionAsync(); onChange(o.value); }}
            style={({ pressed }) => [styles.pill, { backgroundColor: o.tone.bg, borderColor: on ? o.tone.fg : 'transparent' }, pressed && { transform: [{ scale: 0.97 }] }]}>
            <Text style={[styles.pillText, { color: o.tone.fg }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function AddChore() {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ICONS[0]);
  const [custom, setCustom] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [typed, setTyped] = useState('');
  const [effort, setEffort] = useState<Effort | null>(null);
  const [cadence, setCadence] = useState<Cadence>('weekly');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const tone = EFFORTS.find((x) => x.value === effort)?.tone;

  const save = async () => {
    if (busy || !effort || !name.trim()) return;
    setBusy(true);
    try {
      const id = await rpc<string>('add_chore', { p_name: name.trim(), p_icon: icon, p_effort: effort, p_cadence: cadence });
      await planNow(id).catch(() => {});
      await qc.invalidateQueries({ queryKey: STATE_KEY });
      toast.show('Added to the rotation.');
      router.back();
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: '#FFF' }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Add new chore</Text>
      <Field style={styles.input} placeholder="e.g., Vacuum rugs" value={name} maxLength={40} accessibilityLabel="Chore name"
        onChangeText={(t) => { setName(t); setError(null); }} />

      <Text style={styles.label}>EFFORT LEVEL</Text>
      <Pills options={EFFORTS} value={effort} onChange={setEffort} />

      <Text style={styles.label}>CHOOSE ICON</Text>
      <View style={styles.icons}>
        {[...ICONS, ...(custom && !ICONS.includes(custom) ? [custom] : [])].map((e) => (
          <Pressable key={e} accessibilityRole="radio" accessibilityLabel={`Icon ${e}`} accessibilityState={{ selected: e === icon }}
            onPress={() => { Haptics.selectionAsync(); setIcon(e); }}
            style={[styles.icon, { backgroundColor: tone?.bg ?? '#F3F4F6' }, e === icon && { borderColor: tone?.fg ?? '#4C1D95' }]}>
            <Text style={{ fontSize: 22 }}>{e}</Text>
          </Pressable>
        ))}
        <Pressable accessibilityRole="button" accessibilityLabel="Add your own emoji" onPress={() => { Haptics.selectionAsync(); setPicking((p) => !p); }}
          style={[styles.icon, styles.add, picking && { borderColor: '#4C1D95' }]}>
          <Text style={styles.plus}>+</Text>
        </Pressable>
      </View>
      {picking && (
        <View style={{ marginTop: 12, gap: 6 }}>
          <Field style={styles.input} autoFocus placeholder="Type or paste an emoji" value={typed} accessibilityLabel="Your own emoji"
            onChangeText={(t) => {
              const e = lastEmoji(t);
              setTyped(e ? '' : t);
              if (e) { setCustom(e); setIcon(e); setPicking(false); }
            }} />
          <Text style={styles.note}>Open your keyboard's emoji list (the smiley or globe key) and tap one.</Text>
        </View>
      )}

      <Text style={styles.label}>ROTATION</Text>
      <Pills options={CADENCES} value={cadence} onChange={setCadence} />

      <Text style={styles.note}>Roomie assigns it fairly — heavy chores never land on someone's busy day.</Text>
      <ErrorText>{error}</ErrorText>
      <Button title="Add to rotation" onPress={save} loading={busy} disabled={!effort || !name.trim()} style={{ marginTop: 18 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 24, paddingTop: 36, paddingBottom: 32 },
  title: { fontSize: 32, lineHeight: 40, color: C.text, fontFamily: F.display, marginBottom: 20 },
  input: { height: 54, borderRadius: 16, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' },
  label: { fontSize: 12, letterSpacing: 0.8, color: C.sub, fontFamily: F.bold, marginTop: 24, marginBottom: 12 },
  pills: { flexDirection: 'row', gap: 10 },
  pill: { flex: 1, height: 46, borderRadius: 23, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  pillText: { fontSize: 15, fontFamily: F.bold },
  icons: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  icon: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  add: { backgroundColor: 'transparent', borderStyle: 'dashed', borderColor: '#D1D5DB' },
  plus: { fontSize: 24, lineHeight: 28, color: C.sub, fontFamily: F.regular },
  note: { fontSize: 13, lineHeight: 19, color: C.sub, fontFamily: F.regular, marginTop: 20 },
});
