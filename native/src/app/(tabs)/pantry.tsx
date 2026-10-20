// Pantry (frames P1 Shared · P2 My items · P3 Roommates, menus P1e / P2b, W3 "Priya's getting it").
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BASICS, canAsk, iconFor, myAsk, openRestockFor, sameName, sortShelf, type PantryItem, type ShelfTab } from '@domain/pantry.ts';
import { avatarUrl } from '@/lib/avatar';
import { usePantryActions } from '@/lib/pantry';
import { lowRow, shelfMeta } from '@/lib/pantry-view';
import { namesOf } from '@/lib/selectors';
import { messageOf, rpc, STATE_KEY, useAppState, useMe } from '@/lib/state';
import { durations, enter, motion, useReducedMotion } from '@/ui/motion';
import { useToast } from '@/ui/toast';
import { color, layout } from '@/ui/tokens';
import { AddRow, Avatar, Button, Chip, EmojiBadge, Glass, ItemCard, MeshBackground, MoreMenu, SegmentedControl, ShelfTile, Tag, Tap, Txt, type TagKind, useTitleBar } from '@/ui/v2';

const spring = LinearTransition.springify().damping(motion.tab.damping).stiffness(motion.tab.stiffness).mass(motion.tab.mass);
const TABS: { value: ShelfTab; label: string }[] = [{ value: 'shared', label: 'Shared' }, { value: 'mine', label: 'My items' }, { value: 'roommates', label: 'Roommates' }];
/** The stored icon, else one guessed from the name; null lets the tile show a letter. */
const iconOf = (i: PantryItem) => i.icon ?? (iconFor(i.name) === '🛒' ? null : iconFor(i.name));
const ruleTag = (i: PantryItem): TagKind[] => (i.rule === 'do_not_touch' ? ['doNotTouch'] : i.rule === 'ask_first' ? ['askFirst'] : []);

function Heading({ title, count, note }: { title: string; count?: number; note?: string }) {
  return (
    <View style={styles.heading}>
      <View style={styles.headingLeft}>
        <Txt v="Heading/Section" accessibilityRole="header">{title}</Txt>
        {count ? <View style={styles.count}><Txt v="Tag" c={color.text.link}>{count}</Txt></View> : null}
      </View>
      {note && <Txt v="Meta" c={color.text.secondary}>{note}</Txt>}
    </View>
  );
}

const Pill = ({ label, onPress, tone = 'violet' }: { label: string; onPress?: () => void; tone?: 'violet' | 'green' }) => (
  <Tap onPress={onPress} disabled={!onPress} feel="complete" accessibilityLabel={label} style={{ flexShrink: 1 }}>
    <View style={[styles.pill, tone === 'green' ? { backgroundColor: color.effort.lightBg } : { backgroundColor: color.action.primary }]}>
      <Txt v="Meta/Medium" c={tone === 'green' ? color.effort.lightFg : color.text.onAccent} numberOfLines={1}>{label}</Txt>
    </View>
  </Tap>
);

export default function Pantry() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const titleBar = useTitleBar('Pantry');
  const reduced = useReducedMotion();
  const qc = useQueryClient();
  const toast = useToast();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { me, state } = useMe();
  const { refetch, isRefetching } = useAppState();
  const act = usePantryActions();
  const names = namesOf(state);
  const [tab, setTab] = useState<ShelfTab>(params.tab === 'mine' || params.tab === 'roommates' ? params.tab : 'shared');
  const [adding, setAdding] = useState<string[]>([]);

  const shared = sortShelf(state.pantry.filter((i) => i.owner_id === null), 'shared');
  const low = shared.filter((i) => i.stock !== 'in_stock');
  const stocked = shared.filter((i) => i.stock === 'in_stock');
  const mine = sortShelf(state.pantry.filter((i) => i.owner_id === me), 'mine');
  const roommates = state.members.filter((m) => m.user_id !== me);
  const [who, setWho] = useState<string | null>(null);
  const pick = who ?? roommates.find((m) => state.pantry.some((i) => i.owner_id === m.user_id))?.user_id ?? roommates[0]?.user_id ?? null;
  const theirs = sortShelf(state.pantry.filter((i) => i.owner_id === pick), 'roommates');
  const picked = roommates.find((m) => m.user_id === pick);
  const incoming = state.asks.filter((a) => a.to_user === me && a.status === 'pending');
  let n = 0;
  const E = () => (reduced ? undefined : enter(n++, reduced));

  const confirmRemove = (i: PantryItem) => Alert.alert(`Remove ${i.name}?`, i.owner_id ? 'It comes off your shelf.' : 'It comes off the shared shelf for everyone.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: () => act.remove(i) },
  ]);
  const addBasic = async (name: string) => {
    if (adding.includes(name) || shared.some((i) => sameName(i.name, name))) return;
    setAdding((a) => [...a, name]);
    try {
      await rpc('add_pantry_basics', { p_names: [name] });
      await qc.invalidateQueries({ queryKey: STATE_KEY });
    } catch (e) {
      toast.show(messageOf(e));
    } finally {
      setAdding((a) => a.filter((x) => x !== name));
    }
  };

  const lowItem = (i: PantryItem) => {
    const row = lowRow(i, state.restocks, me, names);
    const requested = Boolean(openRestockFor(state.restocks, i.id));
    return (
      <Animated.View key={i.id} layout={spring} entering={E()} exiting={FadeOut.duration(durations.fade)}>
        <Glass fill={0.9} lift={false} r={22}>
          <View style={styles.lowRow}>
            <View style={styles.disc}><EmojiBadge value={iconOf(i)} name={i.name} size={40} round tint={color.bg.surface} /></View>
            <Txt v="Body/Row" numberOfLines={1} style={{ flexShrink: 1, minWidth: 48 }}>{i.name}</Txt>
            {row.kind === 'claim' && <View style={{ alignSelf: 'center' }}><Tag kind={i.stock === 'out' ? 'out' : 'low'} /></View>}
            <View style={{ flex: 1 }} />
            {row.kind === 'claim' ? <Pill label="I’ll get it" onPress={() => act.getIt(state, i, me)} /> : <Pill label={row.label} tone="green" />}
            <MoreMenu plain label={`More for ${i.name}`} items={[
              { label: i.stock === 'out' ? 'Change to Low' : 'Change to Out', onPress: () => act.flag(i, i.stock === 'out' ? 'low' : 'out') },
              { label: 'I bought it', onPress: () => act.bought(state, i, me) },
              ...(requested ? [] : [{ label: 'Ask the house', onPress: () => router.push({ pathname: '/restock', params: { item: i.id } }) }]),
              { label: 'Remove from list', danger: true, icon: Trash2, onPress: () => confirmRemove(i) },
            ]} />
          </View>
        </Glass>
      </Animated.View>
    );
  };

  const pairs = <T,>(xs: T[]) => Array.from({ length: Math.ceil(xs.length / 2) }, (_, k) => xs.slice(k * 2, k * 2 + 2));

  return (
    <View style={styles.root}>
      <MeshBackground />
      <Animated.ScrollView onScroll={titleBar.onScroll} scrollEventThrottle={16} contentContainerStyle={[styles.page, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 130 }]} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={color.action.primary} />}>
        <Txt v="Title/Page" accessibilityRole="header">Pantry</Txt>
        <SegmentedControl value={tab} onChange={setTab} options={TABS} />

        {tab === 'shared' && (
          <Animated.View key="shared" entering={FadeIn.duration(durations.fade)} style={{ gap: 28 }}>
            {shared.length === 0 ? (
              <Glass fill={0.62} pad={20} style={{ gap: 12 }}>
                <View style={{ gap: 12 }}>
                  <Txt v="Body/Row">Nothing on the shelf yet</Txt>
                  <Txt v="Meta" c={color.text.secondary}>Start with the basics your home always needs.</Txt>
                  <View style={styles.chips}>
                    {BASICS.map((b) => <Chip key={b} label={b} selected={adding.includes(b)} onPress={() => addBasic(b)} />)}
                  </View>
                </View>
              </Glass>
            ) : (
              <>
                {low.length > 0 && (
                  <Animated.View layout={spring} entering={E()}>
                    <Glass fill={0.62} pad={12}>
                      <View style={{ gap: 10 }}>
                        <View style={{ paddingHorizontal: 6, paddingTop: 6 }}><Heading title="Running low" count={low.length} /></View>
                        {low.map(lowItem)}
                      </View>
                    </Glass>
                  </Animated.View>
                )}
                {stocked.length > 0 && (
                  <Animated.View layout={spring} style={{ gap: layout.itemGap }}>
                    <Heading title="In stock" note="Tap an item to flag it" />
                    {pairs(stocked).map((row) => (
                      <View key={row[0].id} style={styles.pair}>
                        {row.map((i) => (
                          <Animated.View key={i.id} entering={E()} exiting={FadeOut.duration(durations.fade)} style={{ flex: 1 }}>
                            <ShelfTile icon={iconOf(i)} name={i.name} meta={shelfMeta(i, state.restocks, me, names, state.today)} onPress={() => act.flag(i, 'low')} />
                          </Animated.View>
                        ))}
                        {row.length === 1 && <View style={{ flex: 1 }} />}
                      </View>
                    ))}
                  </Animated.View>
                )}
              </>
            )}
            <AddRow label="Add a shared item" onPress={() => router.push({ pathname: '/add-item', params: { kind: 'shared' } })} />
          </Animated.View>
        )}

        {tab === 'mine' && (
          <Animated.View key="mine" entering={FadeIn.duration(durations.fade)} style={{ gap: 20 }}>
            <Txt v="Body/Default" c={color.text.secondary}>Tags tell roommates what’s okay to use.</Txt>
            {incoming.map((a) => {
              const item = state.pantry.find((i) => i.id === a.item_id);
              if (!item) return null;
              return (
                <Animated.View key={a.id} entering={E()} exiting={FadeOut.duration(durations.fade)} layout={spring}>
                  <Glass outline fill={0.9} pad={16}>
                    <View style={{ gap: 12 }}>
                      <Txt v="Body/Default">{`${(names[a.from_user] ?? 'A roommate').split(' ')[0]} wants to use your ${item.name}.`}</Txt>
                      <View style={styles.pair}>
                        <Button kind="secondary" title="Not this time" onPress={() => act.answer(a, false)} style={{ flex: 1 }} />
                        <Button title="Sure" onPress={() => act.answer(a, true)} style={{ flex: 1 }} />
                      </View>
                    </View>
                  </Glass>
                </Animated.View>
              );
            })}
            <View style={{ gap: layout.itemGap }}>
              <Heading title="Your items" count={mine.length} />
              {mine.map((i) => (
                <Animated.View key={i.id} layout={spring} entering={E()} exiting={FadeOut.duration(durations.fade)}>
                  <ItemCard icon={iconOf(i)} name={i.name} tags={ruleTag(i)} action={
                    <MoreMenu label={`More for ${i.name}`} items={[
                      i.rule === 'do_not_touch'
                        ? { label: 'Move to Ask first', onPress: () => act.setRule(i, 'ask_first') }
                        : { label: 'Move to Do not touch', onPress: () => act.setRule(i, 'do_not_touch') },
                      { label: 'Delete item', danger: true, icon: Trash2, onPress: () => confirmRemove(i) },
                    ]} />} />
                </Animated.View>
              ))}
              <AddRow label="Add a personal item" onPress={() => router.push({ pathname: '/add-item', params: { kind: 'personal' } })} />
            </View>
          </Animated.View>
        )}

        {tab === 'roommates' && (
          <Animated.View key="roommates" entering={FadeIn.duration(durations.fade)} style={{ gap: 20 }}>
            <Txt v="Body/Default" c={color.text.secondary}>What’s theirs, and how to treat it.</Txt>
            {roommates.length === 0 ? <Txt v="Meta" c={color.text.secondary}>No roommates here yet.</Txt> : (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 2 }}>
                  {roommates.map((m) => {
                    const on = m.user_id === pick;
                    return (
                      <Tap key={m.user_id} onPress={() => setWho(m.user_id)} feel="select" accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={m.name}>
                        <Glass outline={on} r={26} fill={0.9} strokeWidth={1.5}>
                          <View style={styles.person}>
                            <Avatar name={m.name} uri={m.avatar_path ? avatarUrl(m.avatar_path) : null} tint={m.color} size={32} />
                            <Txt v="Body/Label" c={on ? color.text.link : color.text.primary}>{m.name.split(' ')[0]}</Txt>
                          </View>
                        </Glass>
                      </Tap>
                    );
                  })}
                </ScrollView>
                {picked && (
                  <Animated.View key={picked.user_id} entering={FadeIn.duration(durations.fade)} style={{ gap: layout.itemGap }}>
                    <Heading title={`${picked.name.split(' ')[0]}’s shelf`} count={theirs.length} />
                    {theirs.length === 0 && <Txt v="Meta" c={color.text.secondary}>Nothing on their shelf yet.</Txt>}
                    {theirs.map((i) => {
                      const ask = myAsk(state.asks, i.id, me);
                      const askable = canAsk(i, me, state.asks);
                      const meta = ask?.status === 'pending' ? 'Asked · waiting' : ask?.status === 'yes' ? 'Said sure' : ask?.status === 'no' ? 'Not this time' : askable ? 'Tap to ask' : undefined;
                      return (
                        <Animated.View key={i.id} entering={E()} layout={spring}>
                          <Tap onPress={askable ? () => act.ask(i, picked.name.split(' ')[0]) : undefined} disabled={!askable} accessibilityLabel={askable ? `Ask to use ${i.name}` : i.name}>
                            <ItemCard icon={iconOf(i)} name={i.name} tags={ruleTag(i)} meta={meta} />
                          </Tap>
                        </Animated.View>
                      );
                    })}
                  </Animated.View>
                )}
              </>
            )}
          </Animated.View>
        )}
      </Animated.ScrollView>
      {titleBar.bar}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  page: { paddingHorizontal: layout.margin, gap: 20 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  count: { minWidth: 24, height: 22, paddingHorizontal: 7, borderRadius: 11, backgroundColor: color.action.selectedTint, alignItems: 'center', justifyContent: 'center' },
  lowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingLeft: 10, paddingRight: 4 },
  disc: { borderRadius: 20, backgroundColor: color.bg.surface, shadowColor: '#3B2470', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  pill: { height: 34, paddingHorizontal: 12, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  pair: { flexDirection: 'row', gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingLeft: 6, paddingRight: 16 },
});
