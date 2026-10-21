// R5 · House chores, with the R5b menu (edit, delete) and R5c edit in the chore sheet.
import { useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';
import { rpc, useMe, withHousehold } from '@/lib/state';
import type { Chore } from '@/lib/types';
import { useSave } from '@/lib/use-save';
import { color } from '@/ui/tokens';
import { AddRow, ConfirmSheet, effortKind, Heading, ItemCard, MoreMenu, Page, Txt } from '@/ui/v2';

export const CADENCE: Record<string, string> = { daily: 'Daily', weekly: 'Weekly', biweekly: 'Every 2 weeks' };

export default withHousehold(ManageChores);

function ManageChores() {
  const router = useRouter();
  const { state } = useMe();
  const [deleting, setDeleting] = useState<Chore | null>(null);
  const del = useSave(() => rpc('archive_chore', { p_id: deleting?.id }), `${deleting?.name ?? 'Chore'} removed.`, { stay: true });
  const chores = state.chores.filter((c) => c.active);
  return (
    <>
      <Page back>
        <Heading title="House chores" size="page" sub="Edit or remove any chore." />
        <View style={{ gap: 12 }}>
          {chores.length === 0 && <Txt v="Meta" c={color.text.secondary}>No chores yet. Add the first one.</Txt>}
          {chores.map((c) => (
            <Animated.View key={c.id} exiting={FadeOut} layout={LinearTransition}>
              <ItemCard icon={c.icon} name={c.name} tags={[effortKind(c.effort)]} meta={CADENCE[c.cadence] ?? c.cadence} action={
                <MoreMenu label={`More for ${c.name}`} items={[
                  { label: 'Edit chore', onPress: () => router.push({ pathname: '/add-chore', params: { id: c.id } }) },
                  { label: 'Delete chore', danger: true, icon: Trash2, onPress: () => setDeleting(c) },
                ]} />} />
            </Animated.View>
          ))}
          <AddRow label="Add a chore" onPress={() => router.push('/add-chore')} />
        </View>
      </Page>
      {deleting && <ConfirmSheet icon={Trash2} tone="danger" title={`Delete ${deleting.name}?`} body="It leaves the rotation and its upcoming turns are cleared. Done chores stay in the history."
        action="Delete chore" onConfirm={() => void del.run().then(() => setDeleting(null))} onClose={() => setDeleting(null)} busy={del.busy} />}
    </>
  );
}
