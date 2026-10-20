import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, FadeOut, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BASICS, iconFor, openRestockFor, requestedLine, RULE_LABEL, sameName, sortShelf, type PantryItem, type ShelfTab } from '@domain/pantry.ts';
import { F } from '@/constants/theme';
import { pantryHealth } from '@/lib/pantry-health';
import { TAG } from '@/lib/pantry';
import { scrollShrink } from '@/lib/tab-shrink';
import { namesOf } from '@/lib/selectors';
import { messageOf, rpc, STATE_KEY, useAppState, useMe } from '@/lib/state';
import { Art } from '@/ui/art';
import { Avatar } from '@/ui/avatar';
import { C, usePull } from '@/ui/kit';
import { PantryTile } from '@/ui/pantry-tile';
import { Segmented } from '@/ui/segmented';
import { useToast } from '@/ui/toast';
import { usePantryActions } from '@/lib/pantry';

const ACCENT = '#7C3AED';
const SLIDE = { duration: 200, easing: Easing.out(Easing.cubic) };
const TABS: { value: ShelfTab; label: string }[] = [{ value: 'shared', label: 'Shared' }, { value: 'mine', label: 'My items' }, { value: 'roommates', label: 'Roommates' }];

const Grid = ({ children }: { children: React.ReactNode }) => <View style={styles.grid}>{children}</View>;
const Section = ({ title, count }: { title: string; count: number }) => <Text style={styles.section}>{title} · {count}</Text>;

export default function Pantry() {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { me, state } = useMe();
  const pull = usePull(useAppState().refetch);
  const act = usePantryActions();
  const names = namesOf(state);
  const [tab, setTab] = useState<ShelfTab>(params.tab === 'mine' || params.tab === 'roommates' ? params.tab : 'shared');
  const [menu, setMenu] = useState(false);
  const [adding, setAdding] = useState<string[]>([]);

  const shared = state.pantry.filter((i) => i.owner_id === null);
  const health = pantryHealth(shared);
  const mine = sortShelf(state.pantry.filter((i) => i.owner_id === me), 'mine');
  const others = state.members.filter((m) => m.user_id !== me)
    .map((m) => ({ m, items: sortShelf(state.pantry.filter((i) => i.owner_id === m.user_id), 'roommates') }))
    .filter((g) => g.items.length > 0);
  const incoming = state.asks.filter((a) => a.to_user === me && a.status === 'pending');
  const open = (i: PantryItem) => router.push({ pathname: '/pantry-item', params: { id: i.id } });

  const addBasic = async (name: string) => {
    if (adding.includes(name) || state.pantry.some((i) => i.owner_id === null && sameName(i.name, name))) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  const ruleTag = (i: PantryItem) => (i.rule ? { label: RULE_LABEL[i.rule], tone: TAG[i.rule] } : undefined);
  const note = (i: PantryItem) => { const r = openRestockFor(state.restocks, i.id); return r ? requestedLine(r, names, me) : undefined; };
  const plus = useAnimatedStyle(() => ({ transform: [{ rotate: withTiming(menu ? '45deg' : '0deg', SLIDE) }] }));

  const subtitle = tab !== 'shared' || health.total === 0 ? 'Everything your home keeps in stock' : health.needs.length === 0 ? 'Fully stocked' : `${health.needs.length} need${health.needs.length === 1 ? 's' : ''} restocking`;
  const preview = health.needs.slice(0, 2).map((i) => i.name).join(', ') + (health.needs.length > 2 ? ` and ${health.needs.length - 2} more` : '');

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScrollView {...scrollShrink} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} refreshControl={<RefreshControl {...pull} />}>
        <View style={styles.header}>
          <Text style={styles.title}>Pantry</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <Segmented options={TABS} value={tab} onChange={setTab} />

        <Animated.View key={tab} entering={FadeIn.duration(180)} style={{ marginTop: 18 }}>
          {tab === 'shared' && (shared.length === 0 ? (
            <View style={styles.empty}>
              <Art name="emptyBox" width={210} />
              <Text style={styles.emptyTitle}>Nothing on the shelf yet</Text>
              <Text style={styles.emptyBody}>Add the basics your home always needs.</Text>
              <View style={styles.chips}>
                {BASICS.map((b) => (
                  <Pressable key={b} disabled={adding.includes(b)} onPress={() => addBasic(b)}
                    style={({ pressed }) => [styles.chip, adding.includes(b) && { opacity: 0.4 }, pressed && { transform: [{ scale: 0.96 }] }]}>
                    <Text style={styles.chipText}>{iconFor(b)}  {b}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            <>
              {health.needs.length > 0 ? (
                <View style={styles.banner}>
                  <Text style={{ fontSize: 30 }}>🛒</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bannerTitle}>Time to restock</Text>
                    <Text style={styles.bannerBody} numberOfLines={2}>{preview}</Text>
                  </View>
                  <Pressable accessibilityRole="button" onPress={() => router.push('/restock')} style={({ pressed }) => [styles.bannerBtn, pressed && { opacity: 0.8 }]}>
                    <Text style={styles.bannerBtnText}>Request</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.okStrip}><Ionicons name="checkmark-circle" size={20} color="#15803D" /><Text style={styles.okText}>Fully stocked. Nice.</Text></View>
              )}
              {health.needs.length > 0 && (
                <>
                  <Section title="RUNNING LOW" count={health.needs.length} />
                  <Grid>{health.needs.map((i) => <PantryTile key={i.id} name={i.name} stock={i.stock} sub={note(i)} onPress={() => open(i)} />)}</Grid>
                </>
              )}
              {health.ok.length > 0 && (
                <>
                  <Section title="IN STOCK" count={health.ok.length} />
                  <Grid>{health.ok.map((i) => <PantryTile key={i.id} name={i.name} stock={i.stock} sub={note(i)} onPress={() => open(i)} />)}</Grid>
                </>
              )}
            </>
          ))}

          {tab === 'mine' && (
            <>
              {incoming.map((a) => {
                const item = state.pantry.find((i) => i.id === a.item_id);
                if (!item) return null;
                return (
                  <Animated.View key={a.id} entering={FadeIn} exiting={FadeOut} style={styles.ask}>
                    <Text style={styles.askText}><Text style={{ fontFamily: F.bold }}>{names[a.from_user] ?? 'A roommate'}</Text> wants to use your {item.name}.</Text>
                    <View style={styles.askButtons}>
                      <Pressable onPress={() => act.answer(a, false)} style={({ pressed }) => [styles.askNo, pressed && { opacity: 0.7 }]}><Text style={styles.askNoText}>Not this time</Text></Pressable>
                      <Pressable onPress={() => act.answer(a, true)} style={({ pressed }) => [styles.askYes, pressed && { opacity: 0.85 }]}><Text style={styles.askYesText}>Sure</Text></Pressable>
                    </View>
                  </Animated.View>
                );
              })}
              {mine.length === 0
                ? <View style={styles.empty}><Art name="quiet" width={170} /><Text style={styles.emptyBody}>Your shelf is empty. Add things that are yours.</Text></View>
                : <Grid>{mine.map((i) => <PantryTile key={i.id} name={i.name} tag={ruleTag(i)} onPress={() => open(i)} />)}</Grid>}
            </>
          )}

          {tab === 'roommates' && (others.length === 0
            ? <View style={styles.empty}><Art name="together" width={170} /><Text style={styles.emptyBody}>No one has a personal shelf yet.</Text></View>
            : others.map(({ m, items }) => (
              <View key={m.user_id} style={{ marginBottom: 8 }}>
                <View style={styles.who}>
                  <Avatar name={m.name} color={m.color} path={m.avatar_path} size={28} />
                  <Text style={styles.whoText}>{m.name}</Text>
                  <Text style={styles.whoCount}>{items.length}</Text>
                </View>
                <Grid>{items.map((i) => <PantryTile key={i.id} name={i.name} tag={ruleTag(i)} onPress={() => open(i)} />)}</Grid>
              </View>
            )))}
        </Animated.View>
        <View style={{ height: 170 }} />
      </ScrollView>

      {menu && <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} style={styles.scrim}><Pressable style={{ flex: 1 }} onPress={() => setMenu(false)} accessibilityLabel="Close menu" /></Animated.View>}
      {menu && (
        <View style={styles.menu} pointerEvents="box-none">
          <Animated.View entering={FadeInDown.delay(60).duration(200)} exiting={FadeOut.duration(100)}>
            <Pressable onPress={() => { setMenu(false); router.push('/restock'); }} style={({ pressed }) => [styles.pill, pressed && { transform: [{ scale: 0.97 }] }]}><Text style={styles.pillText}>🛒  Request restock</Text></Pressable>
          </Animated.View>
          <Animated.View entering={FadeInDown.duration(200)} exiting={FadeOut.duration(100)}>
            <Pressable onPress={() => { setMenu(false); router.push('/add-item'); }} style={({ pressed }) => [styles.pill, pressed && { transform: [{ scale: 0.97 }] }]}><Text style={styles.pillText}>＋  Add to pantry</Text></Pressable>
          </Animated.View>
        </View>
      )}
      <Pressable accessibilityRole="button" accessibilityLabel={menu ? 'Close menu' : 'Add to pantry or request restock'}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMenu((m) => !m); }}
        style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.95 }] }]}>
        <Animated.View style={plus}><Ionicons name="add" size={24} color="#FFF" /></Animated.View>
        <Text style={styles.fabText}>{menu ? 'Close' : 'Add'}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.page },
  scroll: { paddingHorizontal: 24 },
  header: { paddingTop: 20, paddingBottom: 16 },
  title: { fontSize: 32, color: C.text, fontFamily: F.display },
  subtitle: { fontSize: 14, color: C.sub, fontFamily: F.medium, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  section: { fontSize: 12, letterSpacing: 0.8, color: C.sub, fontFamily: F.bold, marginTop: 22, marginBottom: 12 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFEDD5', borderRadius: 24, padding: 16 },
  bannerTitle: { fontSize: 16, color: '#9A3412', fontFamily: F.bold },
  bannerBody: { fontSize: 13, lineHeight: 18, color: '#9A3412', fontFamily: F.regular, opacity: 0.85, marginTop: 2 },
  bannerBtn: { backgroundColor: C.text, borderRadius: 18, paddingHorizontal: 16, height: 38, alignItems: 'center', justifyContent: 'center' },
  bannerBtnText: { color: '#FFF', fontSize: 14, fontFamily: F.bold },
  okStrip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#DCFCE7', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12 },
  okText: { fontSize: 14, color: '#15803D', fontFamily: F.bold },
  empty: { alignItems: 'center', gap: 6, paddingTop: 16 },
  emptyTitle: { fontSize: 22, color: C.text, fontFamily: F.display, marginTop: 8 },
  emptyBody: { fontSize: 15, color: C.sub, fontFamily: F.regular, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 18 },
  chip: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD6FE', paddingHorizontal: 16, paddingVertical: 11, borderRadius: 22 },
  chipText: { fontSize: 15, color: C.lavenderText, fontFamily: F.semibold },
  who: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, marginBottom: 12 },
  whoText: { fontSize: 16, color: C.text, fontFamily: F.bold },
  whoCount: { fontSize: 13, color: C.sub, fontFamily: F.semibold },
  ask: { backgroundColor: C.lavender, borderRadius: 22, padding: 16, gap: 12, marginBottom: 14 },
  askText: { fontSize: 15, lineHeight: 21, color: C.lavenderText, fontFamily: F.regular },
  askButtons: { flexDirection: 'row', gap: 10 },
  askNo: { flex: 1, height: 42, borderRadius: 21, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  askNoText: { fontSize: 14, color: C.text, fontFamily: F.semibold },
  askYes: { flex: 1, height: 42, borderRadius: 21, backgroundColor: C.text, alignItems: 'center', justifyContent: 'center' },
  askYesText: { fontSize: 14, color: '#FFF', fontFamily: F.semibold },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(17,24,39,0.35)' },
  menu: { position: 'absolute', right: 24, bottom: 176, gap: 10, alignItems: 'flex-end' },
  pill: { backgroundColor: '#FFF', paddingHorizontal: 20, height: 48, borderRadius: 24, justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  pillText: { fontSize: 15, color: C.text, fontFamily: F.semibold },
  fab: { position: 'absolute', bottom: 110, right: 24, height: 54, paddingHorizontal: 18, borderRadius: 27, backgroundColor: ACCENT, flexDirection: 'row', alignItems: 'center', gap: 6,
    shadowColor: ACCENT, shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  fabText: { color: '#FFF', fontSize: 16, fontFamily: F.bold },
});
