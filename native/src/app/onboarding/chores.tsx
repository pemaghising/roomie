// 09 · Pick chores.
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import type { Effort } from '@domain/types.ts';
import { updateDraft, useDraft } from '@/lib/draft';
import { color } from '@/ui/tokens';
import { AddRow, Button, ChoreOption, effortKind, Glass, Heading, Page, SegmentedControl, TextField, Txt } from '@/ui/v2';

const CADENCE: Record<string, string> = { daily: 'Daily', weekly: 'Weekly', biweekly: 'Every 2 weeks' };

export default function ChoresStep() {
  const router = useRouter();
  const { chores } = useDraft();
  const [adding, setAdding] = useState(false);
  const [custom, setCustom] = useState('');
  const [effort, setEffort] = useState<'1' | '2' | '3'>('2');
  const picked = chores.filter((c) => c.selected).length;

  const toggle = (key: string) => updateDraft({ chores: chores.map((c) => (c.key === key ? { ...c, selected: !c.selected } : c)) });
  const add = () => {
    const name = custom.trim();
    if (name) updateDraft({ chores: [...chores, { key: `custom-${Date.now()}`, name, icon: '✨', effort: Number(effort) as Effort, cadence: 'weekly', selected: true }] });
    setCustom(''); setAdding(false);
  };

  return (
    <Page back step={3} pinFooter footer={<Button title={picked ? `Continue · ${picked} chore${picked === 1 ? '' : 's'}` : 'Pick at least one'} disabled={!picked} onPress={() => router.push('/onboarding/busy')} />}>
      <Heading title="Pick your chores" sub="We rotate them by effort, so nobody’s stuck with the bathroom." />
      <View style={{ gap: 10 }}>
        <Txt v="Body/Label" c={color.text.secondary}>Most homes start with these</Txt>
        {chores.map((c) => (
          <Animated.View key={c.key} layout={LinearTransition.springify().damping(26).stiffness(480)} entering={FadeIn.duration(160)}>
            <ChoreOption icon={c.icon} title={c.name} tag={effortKind(c.effort)} meta={CADENCE[c.cadence]} selected={c.selected} onPress={() => toggle(c.key)} />
          </Animated.View>
        ))}
        {adding ? (
          <Animated.View entering={FadeIn.duration(160)}>
            <Glass fill={0.62}>
              <View style={{ padding: 14, gap: 12 }}>
                <TextField autoFocus value={custom} onChangeText={setCustom} placeholder="Water the plants" maxLength={40} returnKeyType="done" onSubmitEditing={add} accessibilityLabel="Chore name" />
                <SegmentedControl value={effort} onChange={setEffort} options={[{ value: '1', label: 'Light' }, { value: '2', label: 'Medium' }, { value: '3', label: 'Heavy' }]} />
                <Button title={custom.trim() ? 'Add chore' : 'Cancel'} kind="secondary" onPress={add} />
              </View>
            </Glass>
          </Animated.View>
        ) : <AddRow label="Add your own chore" dashed onPress={() => setAdding(true)} />}
      </View>
    </Page>
  );
}
