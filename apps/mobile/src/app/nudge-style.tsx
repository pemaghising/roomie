// R8 · Nudge style: how Roomie reminds you.
import { useState } from 'react';
import { View } from 'react-native';
import type { NudgeStyle } from '@domain/types.ts';
import { rpc, useMe, withHousehold } from '@/lib/state';
import { useSave } from '@/lib/use-save';
import { color } from '@/ui/tokens';
import { Button, Heading, NudgeCard, Page, Txt } from '@/ui/v2';

export default withHousehold(NudgeStylePage);

function NudgeStylePage() {
  const { state } = useMe();
  const [style, setStyle] = useState<NudgeStyle>(state.profile.nudge_style);
  const save = useSave(() => rpc('update_profile', { p_nudge: style }), 'Nudges updated.');
  return (
    <Page back footer={<Button title="Save" onPress={save.run} loading={save.busy} />}>
      <Heading title="Nudge style" size="page" sub="How Roomie reminds you about chores." />
      <View style={{ gap: 12 }}>
        <NudgeCard title="Motivate me" preview="Dishes are yours tonight. Keep the streak going!" selected={style === 'motivate'} onPress={() => setStyle('motivate')} />
        <NudgeCard title="Just the facts" preview="Wash dishes is due today at 7 pm." selected={style === 'facts'} onPress={() => setStyle('facts')} />
      </View>
      {save.error && <Txt v="Meta" c={color.text.danger}>{save.error}</Txt>}
    </Page>
  );
}
