// R3 · Home name: the name everyone in the house sees.
import { useState } from 'react';
import { View } from 'react-native';
import { rpc, useMe, withHousehold } from '@/lib/state';
import { useSave } from '@/lib/use-save';
import { color } from '@/ui/tokens';
import { Button, Heading, Page, TextField, Txt } from '@/ui/v2';

export default withHousehold(HomeName);

function HomeName() {
  const { state } = useMe();
  const home = state.household!;
  const [name, setName] = useState(home.name);
  const clean = name.trim().replace(/\s+/g, ' ');
  const save = useSave(() => (clean !== home.name ? rpc('update_household', { p_name: clean }) : Promise.resolve()));
  return (
    <Page back footer={<Button title="Save" onPress={save.run} loading={save.busy} disabled={!clean} />}>
      <Heading title="Home name" size="page" sub="Everyone in the house sees this." />
      <View style={{ gap: 10 }}>
        <Txt v="Body/Label">Home name</Txt>
        <TextField value={name} onChangeText={setName} maxLength={40} autoCapitalize="words" accessibilityLabel="Home name" error={!!save.error} />
        {save.error && <Txt v="Meta" c={color.text.danger}>{save.error}</Txt>}
      </View>
    </Page>
  );
}
