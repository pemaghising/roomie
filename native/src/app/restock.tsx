// P1f · Restock request: from an item's menu (`?item=<id>`) or from the + menu. It goes to the shared pool.
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useBack } from '@/lib/use-back';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { Effort } from '@domain/types.ts';
import { cleanName, iconFor, openRestockFor, sameName, STOCK_LABEL, type PantryItem } from '@domain/pantry.ts';
import { matchIcons } from '@/lib/icons';
import { messageOf, rpc, STATE_KEY, useMe, withHousehold } from '@/lib/state';
import { useToast } from '@/ui/toast';
import { color } from '@/ui/tokens';
import { Button, Chip, ChoiceSwitch, IconNameField, Sheet, Txt } from '@/ui/v2';

const E = color.effort;
const EFFORTS: { value: Effort; label: string; bg: string; fg: string }[] = [
  { value: 1, label: 'Light', bg: E.lightBg, fg: E.lightFg },
  { value: 2, label: 'Medium', bg: E.mediumBg, fg: E.mediumFg },
  { value: 3, label: 'Heavy', bg: E.heavyBg, fg: E.heavyFg },
];
const iconOf = (i: PantryItem) => i.icon ?? (iconFor(i.name) === '🛒' ? null : iconFor(i.name));

export default withHousehold(Restock);

function Restock() {
  const params = useLocalSearchParams<{ item?: string }>();
  const router = useRouter();
  const back = useBack();
  const qc = useQueryClient();
  const toast = useToast();
  const { state } = useMe();
  const [itemId, setItemId] = useState(params.item ?? null);
  const item = itemId ? state.pantry.find((i) => i.id === itemId) : undefined;
  const [name, setName] = useState(item?.name ?? '');
  const [effort, setEffort] = useState<Effort>(1);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const clean = cleanName(name);
  const shared = state.pantry.filter((i) => i.owner_id === null);
  // a typed name that matches something on the shared shelf restocks that item
  const target = item && sameName(item.name, clean) ? item : shared.find((i) => sameName(i.name, clean));
  const others = shared.filter((i) => i.id !== target?.id && !openRestockFor(state.restocks, i.id))
    .sort((a, b) => Number(b.stock !== 'in_stock') - Number(a.stock !== 'in_stock')).slice(0, 3);
  const icon = target ? iconOf(target) : clean ? matchIcons(clean).exact?.name ?? null : 'Shopping cart';
  const sub = target ? (target.stock === 'in_stock' ? 'Shared · in stock' : `Shared · ${STOCK_LABEL[target.stock].toLowerCase()}`) : 'Something the house needs';
  const close = () => back();

  const send = async () => {
    if (!clean || busy) return;
    if (target && openRestockFor(state.restocks, target.id)) return setError('Already requested.');
    setBusy(true);
    try {
      await rpc('request_restock', target ? { p_item: target.id, p_effort: effort } : { p_name: clean, p_effort: effort });
      await qc.invalidateQueries({ queryKey: STATE_KEY });
      toast.show(`${target?.name ?? clean} is in the shared pool.`, { tick: true });
      close();
    } catch (e) {
      setError(messageOf(e));
      setBusy(false);
    }
  };

  return (
    <Sheet onClose={close}>
      <Txt v="Body/Label" c={color.text.link}>Restock request</Txt>
      <IconNameField icon={icon} name={name} onName={(t) => { setName(t); setItemId(null); setError(null); }} placeholder="What do we need?" sub={sub} />
      {others.length > 0 && (
        <View style={{ gap: 10 }}>
          <Txt v="Meta/Medium" c={color.text.secondary}>Or restock something else</Txt>
          <View style={styles.chips}>{others.map((i) => <Chip key={i.id} label={i.name} onPress={() => { setItemId(i.id); setName(i.name); setError(null); }} />)}</View>
        </View>
      )}
      <View style={{ gap: 10 }}>
        <Txt v="Meta/Medium" c={color.text.secondary}>Effort</Txt>
        <ChoiceSwitch label="Effort" options={EFFORTS} value={effort} onChange={setEffort} />
        <Txt v="Meta" c={color.text.secondary}>Goes to the shared pool. Whoever buys it gets the credit.</Txt>
      </View>
      {error && <Txt v="Meta" c={color.action.danger} accessibilityRole="alert">{error}</Txt>}
      <Button title="Request restock" onPress={send} loading={busy} disabled={!clean} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
