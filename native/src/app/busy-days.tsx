// R7 · My busy days: heavy chores stay off these.
import { useState } from 'react';
import { View } from 'react-native';
import type { Weekday } from '@domain/time.ts';
import { busyLabel } from '@/lib/busy';
import { rpc, useMe, withHousehold } from '@/lib/state';
import { useSave } from '@/lib/use-save';
import { color } from '@/ui/tokens';
import { Button, DayPicker, EmojiBadge, Glass, Heading, Page, Txt } from '@/ui/v2';

export default withHousehold(BusyDays);

function BusyDays() {
  const { me, state } = useMe();
  const [days, setDays] = useState<number[]>(state.members.find((m) => m.user_id === me)?.busy_days ?? []);
  const save = useSave(() => rpc('update_busy_days', { p_days: days as Weekday[] }), 'Busy days saved.');
  return (
    <Page back footer={<Button title="Save" onPress={save.run} loading={save.busy} />}>
      <Heading title="My busy days" size="page" sub="We won’t give you heavy chores on these." />
      <DayPicker value={days} onChange={setDays} />
      <Glass fill={0.9}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
          <EmojiBadge value="📅" size={44} round tint={color.bg.surface} />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt v="Body/Row">{days.length ? busyLabel(days) : 'No busy days'}</Txt>
            <Txt v="Meta" c={color.text.secondary}>{days.length ? 'Heavy chores stay off these days' : 'Any chore can land on any day'}</Txt>
          </View>
        </View>
      </Glass>
      {save.error && <Txt v="Meta" c={color.text.danger}>{save.error}</Txt>}
    </Page>
  );
}
