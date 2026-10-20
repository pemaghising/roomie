import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { canAsk, iconFor, myAsk, openRestockFor, requestedLine, tintFor, type PantryRule, type StockLevel } from '@domain/pantry.ts';
import { F } from '@/constants/theme';
import { TAG, tintHex, usePantryActions } from '@/lib/pantry';
import { namesOf } from '@/lib/selectors';
import { useMe } from '@/lib/state';
import { Button, C } from '@/ui/kit';
import { Segmented, TonePills } from '@/ui/segmented';

const STOCKS: { value: StockLevel; label: string }[] = [{ value: 'in_stock', label: 'In stock' }, { value: 'low', label: 'Running low' }, { value: 'out', label: 'Out' }];
const RULES: { value: PantryRule; label: string; tone: { bg: string; fg: string } }[] = [
  { value: 'ask_first', label: 'Ask first', tone: TAG.ask_first },
  { value: 'do_not_touch', label: 'Do not touch', tone: TAG.do_not_touch },
];

export default function PantryItemSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { me, state } = useMe();
  const act = usePantryActions();
  const item = state.pantry.find((i) => i.id === id);
  useEffect(() => { if (!item) router.back(); }, [item, router]);
  if (!item) return null;

  const names = namesOf(state);
  const shared = item.owner_id === null;
  const mine = item.owner_id === me;
  const owner = item.owner_id ? names[item.owner_id] ?? 'A roommate' : '';
  const request = openRestockFor(state.restocks, item.id);
  const ask = myAsk(state.asks, item.id, me);
  const icon = iconFor(item.name);

  const confirmRemove = () => Alert.alert(`Remove ${item.name}?`, shared ? 'It comes off the shared shelf for everyone.' : 'It comes off your shelf.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: () => { act.remove(item); router.back(); } },
  ]);

  return (
    <ScrollView style={{ backgroundColor: '#FFF' }} contentContainerStyle={styles.body}>
      <View style={styles.head}>
        <View style={[styles.tile, { backgroundColor: tintHex(tintFor(icon)) }]}><Text style={{ fontSize: 28 }}>{icon}</Text></View>
        <Text style={styles.title} numberOfLines={2}>{item.name}</Text>
      </View>

      {shared && (
        <>
          <Text style={styles.label}>STOCK</Text>
          <Segmented options={STOCKS} value={item.stock} onChange={(v) => act.setStock(item, v)} />
        </>
      )}

      {shared && (
        <View style={styles.block}>
          <Button title={request ? requestedLine(request, names, me) : 'Request restock'} disabled={Boolean(request)}
            onPress={() => router.replace({ pathname: '/restock', params: { item: item.id } })} />
        </View>
      )}

      {mine && (
        <>
          <Text style={styles.label}>SHARING RULE</Text>
          <TonePills options={RULES} value={item.rule ?? 'ask_first'} onChange={(v) => act.setRule(item, v)} />
        </>
      )}

      {!shared && !mine && (
        <View style={styles.block}>
          {item.rule === 'do_not_touch' ? (
            <Text style={styles.note}>This is {owner}'s. Do not touch.</Text>
          ) : canAsk(item, me, state.asks) ? (
            <Button title={`Ask ${owner.split(' ')[0]}`} onPress={() => { act.ask(item, owner.split(' ')[0]); router.back(); }} />
          ) : ask?.status === 'pending' ? (
            <Button title="Asked · waiting" disabled onPress={() => {}} />
          ) : (
            <Text style={styles.note}>{ask?.status === 'yes' ? `${owner} said sure.` : ask?.status === 'no' ? `${owner} said not this time.` : ''}</Text>
          )}
        </View>
      )}

      {(shared || mine) && <Button title="Remove item" variant="danger" onPress={confirmRemove} style={{ marginTop: 20 }} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 24, paddingTop: 36, paddingBottom: 32 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 },
  tile: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 30, lineHeight: 38, color: C.text, fontFamily: F.display },
  label: { fontSize: 12, letterSpacing: 0.8, color: C.sub, fontFamily: F.bold, marginTop: 24, marginBottom: 12 },
  block: { marginTop: 20 },
  note: { fontSize: 16, lineHeight: 23, color: C.sub, fontFamily: F.medium, textAlign: 'center' },
});
