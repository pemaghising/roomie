// P2d / P2e · Add to pantry, with P2f / P2g · Pick an icon as a second step inside the same sheet.
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CircleHelp, Lock, Search } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { BASICS, cleanName, sameName, type PantryRule } from '@domain/pantry.ts';
import { iconByChar, iconsIn, matchIcons, type IconCategory, type IconRef } from '@/lib/icons';
import { messageOf, rpc, STATE_KEY, useMe, withHousehold } from '@/lib/state';
import { durations } from '@/ui/motion';
import { useToast } from '@/ui/toast';
import { color } from '@/ui/tokens';
import { Button, Chip, ChoiceSwitch, Emoji, Glass, IconNameField, letterTile, Sheet, Tap, TextField, Txt } from '@/ui/v2';

const LETTER = 'Letter';
const CATS: IconCategory[] = ['Pantry', 'Fruit and veg', 'Drinks', 'Cleaning'];
const PERSONAL_PICKS = ['Greek yogurt', 'Eggs', 'Coffee', 'Oat milk', 'Protein shake', 'Granola'];
const E = color.effort;
const RULES: { value: PantryRule; label: string; bg: string; fg: string; icon: typeof Lock }[] = [
  { value: 'do_not_touch', label: 'Do not touch', bg: E.heavyBg, fg: E.heavyFg, icon: Lock },
  { value: 'ask_first', label: 'Ask first', bg: E.mediumBg, fg: E.mediumFg, icon: CircleHelp },
];
const KINDS = [
  { value: 'shared' as const, label: 'Shared', bg: color.bg.surface, fg: color.text.link },
  { value: 'personal' as const, label: 'Personal', bg: color.bg.surface, fg: color.text.link },
];

function IconCell({ icon, on, onPress }: { icon: IconRef; on: boolean; onPress: () => void }) {
  return (
    <Tap onPress={onPress} feel="select" accessibilityLabel={icon.name} accessibilityState={{ selected: on }} style={styles.cell}>
      {on ? <Glass outline fill={0.9} r={16} strokeWidth={1.5} lift={false}><View style={styles.cellIn}><Emoji value={icon.name} size={34} /></View></Glass>
        : <View style={styles.cellIn}><Emoji value={icon.name} size={34} /></View>}
    </Tap>
  );
}

export default withHousehold(AddItem);

function AddItem() {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const params = useLocalSearchParams<{ kind?: string }>();
  const { me, state } = useMe();
  const [kind, setKind] = useState<'shared' | 'personal'>(params.kind === 'personal' ? 'personal' : 'shared');
  const [rule, setRule] = useState<PantryRule>('ask_first');
  const [name, setName] = useState('');
  const [chosen, setChosen] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<IconCategory>('Pantry');
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const clean = cleanName(name);
  const match = matchIcons(clean);
  const guess = match.exact?.name ?? match.closest[0]?.name ?? null;
  const icon = chosen ?? guess;
  const shelf = state.pantry.filter((i) => (kind === 'shared' ? i.owner_id === null : i.owner_id === me));
  const picks = (kind === 'shared' ? [...BASICS] : PERSONAL_PICKS).filter((p) => !shelf.some((i) => sameName(i.name, p))).slice(0, 3);
  const close = () => router.back();

  const save = async () => {
    if (!clean || busy) return;
    if (shelf.some((i) => sameName(i.name, clean))) return setError('Already in the pantry.');
    setBusy(true);
    try {
      await rpc('add_pantry_item', { p_name: clean, p_owner_personal: kind === 'personal', ...(kind === 'personal' ? { p_rule: rule } : {}), p_icon: icon ?? LETTER });
      await qc.invalidateQueries({ queryKey: STATE_KEY });
      toast.show(kind === 'shared' ? `${clean} is on the shared shelf.` : `${clean} is on your shelf.`, { tick: true });
      close();
    } catch (e) {
      setError(messageOf(e));
      setBusy(false);
    }
  };

  if (picking) {
    const q = matchIcons(query);
    const none = query.trim().length > 0 && !q.exact;
    const closest = none ? [...new Set([...q.closest, ...iconsIn(q.closest[0]?.category ?? 'Pantry')])].slice(0, 5) : [];
    const grid = query.trim() && !none ? q.closest : iconsIn(cat);
    const current = draft ?? icon;
    const label = clean || 'this item';
    const tile = letterTile(clean || query || '?');
    return (
      <Sheet onClose={close} title="Pick an icon" sub={none ? `We picked the closest one for ${label}. Tap another to change it.` : `We picked one for ${label}. Tap another to change it.`}>
        <TextField icon={Search} value={query} onChangeText={setQuery} placeholder="Search icons" accessibilityLabel="Search icons" autoCorrect={false} />
        {none ? (
          <Animated.View entering={FadeIn.duration(durations.fade)} style={{ gap: 16 }}>
            <View style={{ gap: 4 }}>
              <Txt v="Body/Row">{`No icon for “${query.trim()}” yet`}</Txt>
              <Txt v="Meta" c={color.text.secondary}>Here are the closest ones, or use a letter tile.</Txt>
            </View>
            <Txt v="Meta/Medium" c={color.text.secondary}>Closest matches</Txt>
            <View style={styles.grid}>{closest.map((i) => <IconCell key={i.name} icon={i} on={current === i.name} onPress={() => setDraft(i.name)} />)}</View>
            <Txt v="Meta/Medium" c={color.text.secondary}>Or a letter tile</Txt>
            <Tap onPress={() => setDraft(LETTER)} feel="select" accessibilityState={{ selected: current === LETTER }} accessibilityLabel={`${tile.letter} for ${clean || query}`}>
              <View style={styles.letterRow}>
                <View style={[styles.letter, { backgroundColor: tile.bg }, current === LETTER && styles.letterOn]}><Txt v="Title/Onboarding" c={tile.fg}>{tile.letter}</Txt></View>
                <View style={{ gap: 2 }}>
                  <Txt v="Body/Row">{`${tile.letter} for ${clean || query.trim()}`}</Txt>
                  <Txt v="Meta" c={color.text.secondary}>Uses the first letter of the name</Txt>
                </View>
              </View>
            </Tap>
          </Animated.View>
        ) : (
          <>
            {!query.trim() && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginHorizontal: -24 }}>
                <View style={{ width: 16 }} />
                {CATS.map((c) => <Chip key={c} label={c} selected={cat === c} onPress={() => setCat(c)} />)}
                <View style={{ width: 16 }} />
              </ScrollView>
            )}
            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              <Animated.View key={query.trim() ? 'q' : cat} entering={FadeIn.duration(durations.fade)} style={styles.grid}>
                {grid.map((i) => <IconCell key={i.name} icon={i} on={current === i.name} onPress={() => setDraft(i.name)} />)}
              </Animated.View>
            </ScrollView>
          </>
        )}
        <Button title="Use this icon" onPress={() => { if (draft) setChosen(draft); setPicking(false); setQuery(''); setDraft(null); }} />
      </Sheet>
    );
  }

  const shown = !clean && !chosen ? 'Shopping cart' : icon === LETTER ? null : (iconByChar(icon)?.name ?? icon);
  return (
    <Sheet onClose={close}>
      <Txt v="Body/Label" c={color.text.link}>Add to pantry</Txt>
      <ChoiceSwitch label="Shelf" options={KINDS} value={kind} onChange={(v) => { setKind(v); setError(null); }} />
      <IconNameField icon={shown} name={name} onName={(t) => { setName(t); setError(null); }} placeholder="Name the item"
        sub={chosen ? 'Your pick · tap to change' : 'Icon picked for you · tap to change'} onIcon={() => { setQuery(match.exact ? '' : clean); setPicking(true); }} />
      {picks.length > 0 && (
        <View style={{ gap: 10 }}>
          <Txt v="Meta/Medium" c={color.text.secondary}>Quick picks</Txt>
          <View style={styles.chips}>{picks.map((p) => <Chip key={p} label={p} selected={name === p} onPress={() => { setName(p); setChosen(null); setError(null); }} />)}</View>
        </View>
      )}
      {kind === 'personal' ? (
        <View style={{ gap: 10 }}>
          <Txt v="Meta/Medium" c={color.text.secondary}>Who can use it</Txt>
          <ChoiceSwitch label="Who can use it" options={RULES} value={rule} onChange={setRule} />
          <Txt v="Meta" c={color.text.secondary}>{rule === 'ask_first' ? 'Roommates will ask you before using it.' : 'Roommates will leave it alone.'}</Txt>
        </View>
      ) : (
        <Txt v="Meta" c={color.text.secondary}>Everyone can use it and flag it when it runs low.</Txt>
      )}
      {error && <Txt v="Meta" c={color.action.danger} accessibilityRole="alert">{error}</Txt>}
      <Button title="Add item" onPress={save} loading={busy} disabled={!clean} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10 },
  cell: { width: '20%', alignItems: 'center' },
  cellIn: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  letterRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  letter: { width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  letterOn: { borderColor: color.action.primary },
});
