// C4 · New chore: a sheet over Chores. The icon is picked from the name; tap it to choose another.
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useBack } from '@/lib/use-back';
import { RefreshCw } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import type { Cadence, Effort } from '@domain/types.ts';
import { choreIcon } from '@/lib/chore-icon';
import type { Chore } from '@/lib/types';
import { messageOf, planNow, rpc, STATE_KEY, useAppState } from '@/lib/state';
import { durations } from '@/ui/motion';
import { useToast } from '@/ui/toast';
import { color } from '@/ui/tokens';
import { Button, Chip, ChoiceSwitch, EmojiBadge, IconNameField, Sheet, Tap, Txt } from '@/ui/v2';

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
export default function AddChoreRoute() {
  const { data } = useAppState();
  const { id } = useLocalSearchParams<{ id?: string }>();
  if (!data) return null;
  return <AddChore editing={id ? data.chores.find((c) => c.id === id) : undefined} />;
}

/** New chore (C4), or Edit chore (R5c) when opened with ?id. */
function AddChore({ editing }: { editing?: Chore }) {
  const router = useRouter();
  const back = useBack();
  const qc = useQueryClient();
  const toast = useToast();
  const { data } = useAppState();
  const [name, setName] = useState(editing?.name ?? '');
  const [chosen, setChosen] = useState<string | null>(editing?.icon ?? null);
  const [picking, setPicking] = useState(false);
  const [effort, setEffort] = useState<Effort>(editing?.effort ?? 2);
  const [cadence, setCadence] = useState<Cadence>(editing?.cadence ?? 'weekly');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const icon = chosen ?? choreIcon(name);
  const taken = new Set((data?.chores ?? []).map((c) => c.name.toLowerCase()));
  const picks = editing ? [] : PICKS.filter((p) => !taken.has(p.toLowerCase()));
  const close = () => back();

  const save = async () => {
    if (busy || !name.trim()) return;
    setBusy(true);
    try {
      if (editing) await rpc('update_chore', { p_id: editing.id, p_name: name.trim(), p_icon: icon, p_effort: effort, p_cadence: cadence });
      else {
        const id = await rpc<string>('add_chore', { p_name: name.trim(), p_icon: icon, p_effort: effort, p_cadence: cadence });
        // planning the new chore into this week can take a few seconds on the server: don't hold the sheet for it
        void planNow(id).then(() => qc.invalidateQueries({ queryKey: STATE_KEY })).catch(() => {});
      }
      await qc.invalidateQueries({ queryKey: STATE_KEY });
      toast.show(editing ? 'Changes saved. They shape next week’s plan.' : `${name.trim()} is in the rotation.`, { tick: true });
      close();
    } catch (e) {
      setError(messageOf(e));
      setBusy(false);
    }
  };

  const remove = () => Alert.alert(`Delete ${editing?.name}?`, 'It leaves the rotation and its upcoming turns are cleared.', [
    { text: 'Keep it', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      try {
        await rpc('archive_chore', { p_id: editing?.id });
        await qc.invalidateQueries({ queryKey: STATE_KEY });
        toast.show(`${editing?.name} removed.`);
        close();
      } catch (e) { setError(messageOf(e)); }
    } },
  ]);

  return (
    <Sheet onClose={close}>
      <Txt v="Body/Label" c={color.text.link}>{editing ? 'Edit chore' : 'New chore'}</Txt>
      <IconNameField icon={icon} name={name} onName={(t) => { setName(t); setError(null); }} placeholder="Name the chore"
        sub={editing ? 'Tap the icon to change it' : chosen ? 'Your pick · tap to change' : 'Icon picked for you · tap to change'} onIcon={() => setPicking((p) => !p)} />

      {picking && (
        <Animated.View entering={FadeIn.duration(durations.fade)} exiting={FadeOut.duration(durations.fade)} style={styles.icons}>
          {ICONS.map((e) => (
            <Tap key={e} onPress={() => { setChosen(e); setPicking(false); }} feel="select" accessibilityLabel={`Icon ${e}`} accessibilityState={{ selected: e === icon }}>
              <View style={[styles.iconCell, e === icon && styles.iconOn]}><EmojiBadge value={e} size={40} /></View>
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
        <ChoiceSwitch label="Effort" options={EFFORTS} value={effort} onChange={setEffort} />
        <Txt v="Meta" c={color.text.secondary}>Heavy chores skip your busy days.</Txt>
      </View>

      <View style={{ gap: 10 }}>
        <Txt v="Meta/Medium" c={color.text.secondary}>Repeats</Txt>
        <ChoiceSwitch label="Repeats" options={CADENCES} value={cadence} onChange={setCadence} />
      </View>

      <View style={styles.note}>
        <RefreshCw size={16} color={color.text.link} strokeWidth={2} />
        <Txt v="Body/Default" c={color.text.numeral}>Roomie rotates it fairly for you.</Txt>
      </View>
      {error && <Txt v="Meta" c={color.action.danger} accessibilityRole="alert">{error}</Txt>}
      <Button title={editing ? 'Save changes' : 'Add chore'} onPress={save} loading={busy} disabled={!name.trim()} />
      {editing && (
        <Tap onPress={remove} disabled={busy} style={{ alignSelf: 'center', marginTop: -8 }} hitSlop={10} accessibilityLabel="Delete chore">
          <Txt v="Body/Label" c={color.text.danger}>Delete chore</Txt>
        </Tap>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  icons: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  iconCell: { padding: 2, borderRadius: 16, borderWidth: 1.5, borderColor: 'transparent' },
  iconOn: { borderColor: color.action.primary },
  note: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, backgroundColor: 'rgba(135,107,222,0.1)' },
});
