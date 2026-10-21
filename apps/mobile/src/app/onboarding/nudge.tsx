// 11 · Nudge style. Continue finishes setup: starts the home (→ 12) or joins it (→ Home).
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { errorText } from '@domain/copy.ts';
import { haptic } from '@/ui/haptics';
import { resetDraft, updateDraft, useDraft } from '@/lib/draft';
import { messageOf, planNow, rpc, STATE_KEY } from '@/lib/state';
import { useToast } from '@/ui/toast';
import { Button, Heading, NudgeCard, Page } from '@/ui/v2';

export default function NudgeStep() {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const draft = useDraft();
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    setBusy(true);
    try {
      if (draft.mode === 'join') {
        const h = await rpc<string | null>('join_household', { p_code: draft.code, p_busy: draft.busyDays });
        if (!h) { toast.show(errorText('invalid_code')); router.replace('/onboarding/join'); return; }
      } else {
        await rpc('create_household', {
          p_name: draft.homeName, p_busy: draft.busyDays,
          p_chores: draft.chores.filter((c) => c.selected).map(({ name, icon, effort, cadence }) => ({ name, icon, effort, cadence })),
        });
      }
      await rpc('update_profile', { p_nudge: draft.nudge }).catch(() => {});
      // planning the first week can take a few seconds: run it behind the invite screen, not in front of it
      void planNow().then(() => qc.invalidateQueries({ queryKey: STATE_KEY })).catch(() => {}); // the 10-minute tick catches up if this fails
      haptic.allDone();
      const joined = draft.mode === 'join';
      // go to invite before the refetch flips the gate to 'ready', which would otherwise send us Home
      router.replace(joined ? '/' : '/onboarding/invite');
      await qc.invalidateQueries({ queryKey: STATE_KEY });
      if (joined && draft.preview) toast.show(`Welcome to ${draft.preview.name}`);
      resetDraft();
    } catch (e) {
      toast.show(messageOf(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page back step={5} footer={<Button title="Continue" onPress={finish} loading={busy} />}>
      <Heading title="Pick your nudges" sub="How should we remind you it’s your turn?" />
      <View style={{ gap: 12 }}>
        <NudgeCard title="Motivate me" preview="Dishes are yours tonight. Keep the streak going!" selected={draft.nudge === 'motivate'} onPress={() => updateDraft({ nudge: 'motivate' })} />
        <NudgeCard title="Just the facts" preview="Wash dishes is due today at 7 pm." selected={draft.nudge === 'facts'} onPress={() => updateDraft({ nudge: 'facts' })} />
      </View>
    </Page>
  );
}
