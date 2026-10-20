// R9 · Notifications: what Roomie tells you about, and when to stay quiet.
import { useState } from 'react';
import { View } from 'react-native';
import { getQuiet, QUIET, setQuiet, type Quiet } from '@/lib/quiet-hours';
import { useAction, useMe, withHousehold } from '@/lib/state';
import type { NotifyPrefs } from '@/lib/types';
import { color } from '@/ui/tokens';
import { Heading, Page, PlainRow, SettingsCard, Sheet, Tap, Toggle, Txt } from '@/ui/v2';

const ROWS: { key: keyof NotifyPrefs; title: string; sub: string }[] = [
  { key: 'chores', title: 'Chore reminders', sub: '7 pm on your chore days' },
  { key: 'pool', title: 'Shared pool', sub: 'When a chore is up for grabs' },
  { key: 'pantry', title: 'Pantry', sub: 'When something runs low' },
  { key: 'recap', title: 'Weekly recap', sub: 'Sunday evening summary' },
];
const DEFAULTS: NotifyPrefs = { chores: true, pool: true, pantry: true, recap: false };

export default withHousehold(Notifications);

function Notifications() {
  const { state } = useMe();
  const prefs = { ...DEFAULTS, ...state.profile.notify };
  const [quiet, setQ] = useState<Quiet>(getQuiet());
  const [picking, setPicking] = useState(false);
  const set = useAction<{ p_notify: Partial<NotifyPrefs> }>('set_notify', {
    optimistic: (s, { p_notify }) => ({ ...s, profile: { ...s.profile, notify: { ...DEFAULTS, ...s.profile.notify, ...p_notify } } }),
  });
  return (
    <>
      <Page back>
        <Heading title="Notifications" size="page" sub="Choose what Roomie tells you about." />
        <SettingsCard>
          {ROWS.map((r, i) => (
            <PlainRow key={r.key} title={r.title} sub={r.sub} last={i === ROWS.length - 1}
              right={<Toggle value={prefs[r.key]} label={r.title} onChange={(v) => set.mutate({ p_notify: { [r.key]: v } })} />} />
          ))}
        </SettingsCard>
        <SettingsCard>
          <PlainRow title="Quiet hours" sub="No nudges while you sleep" value={quiet.label} onPress={() => setPicking(true)} last />
        </SettingsCard>
      </Page>
      {picking && (
        <Sheet onClose={() => setPicking(false)} title="Quiet hours" sub="Roomie holds reminders until the window ends.">
          <SettingsCard>
            {QUIET.map((q, i) => (
              <Tap key={q.id} onPress={() => { setQuiet(q); setQ(q); setPicking(false); }} feel="select" accessibilityRole="radio" accessibilityState={{ selected: q.id === quiet.id }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: i < QUIET.length - 1 ? 1 : 0, borderBottomColor: 'rgba(135,107,222,0.12)' }}>
                  <Txt v="Body/Row">{q.label}</Txt>
                  {q.id === quiet.id && <Txt v="Body/Label" c={color.text.link}>Selected</Txt>}
                </View>
              </Tap>
            ))}
          </SettingsCard>
        </Sheet>
      )}
    </>
  );
}
