// R2 · Edit profile: photo and the name roommates see on chores.
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';
import { avatarUrl, pickAndUploadAvatar, removeAvatar } from '@/lib/avatar';
import { messageOf, rpc, STATE_KEY, useMe, withHousehold } from '@/lib/state';
import { useSave } from '@/lib/use-save';
import { useToast } from '@/ui/toast';
import { color } from '@/ui/tokens';
import { Avatar, Button, Heading, Page, Tap, TextField, Txt } from '@/ui/v2';

export default withHousehold(EditProfile);

function EditProfile() {
  const qc = useQueryClient();
  const toast = useToast();
  const { me, state } = useMe();
  const [name, setName] = useState(state.profile.name);
  const [photoBusy, setPhotoBusy] = useState(false);
  const path = state.profile.avatar_path;
  const clean = name.trim().replace(/\s+/g, ' ');
  const save = useSave(() => (clean !== state.profile.name ? rpc('update_profile', { p_name: clean }) : Promise.resolve()));

  const photo = async (remove?: boolean) => {
    setPhotoBusy(true);
    try {
      if (remove && path) await removeAvatar(path);
      else {
        const r = await pickAndUploadAvatar(me, path);
        if (r === 'denied') toast.show('Allow photo access in your phone settings to pick a picture.');
        if (r !== 'saved') return;
      }
      await qc.invalidateQueries({ queryKey: STATE_KEY });
    } catch (e) {
      toast.show(remove ? messageOf(e) : 'Couldn’t upload that photo. Try a smaller one.');
    } finally {
      setPhotoBusy(false);
    }
  };

  return (
    <Page back footer={<Button title="Save" onPress={save.run} loading={save.busy} disabled={!clean || photoBusy} />}>
      <Heading title="Edit profile" size="page" />
      <View style={{ alignItems: 'center', gap: 10 }}>
        <Tap onPress={() => photo()} disabled={photoBusy} accessibilityLabel="Change photo" style={{ opacity: photoBusy ? 0.5 : 1 }}>
          <Avatar name={clean || state.profile.name} uri={path ? avatarUrl(path) : null} tint={state.profile.color} size={104} />
        </Tap>
        <View style={{ flexDirection: 'row', gap: 20 }}>
          <Tap onPress={() => photo()} disabled={photoBusy} hitSlop={8}><Txt v="Body/Label" c={color.text.link}>{path ? 'Change photo' : 'Add a photo'}</Txt></Tap>
          {path && <Tap onPress={() => photo(true)} disabled={photoBusy} hitSlop={8}><Txt v="Body/Label" c={color.text.danger}>Remove</Txt></Tap>}
        </View>
      </View>
      <View style={{ gap: 10 }}>
        <Txt v="Body/Label">Your name</Txt>
        <TextField value={name} onChangeText={(t) => { setName(t); save.setError(null); }} maxLength={30} autoCapitalize="words" accessibilityLabel="Your name" error={!!save.error} />
        <Txt v="Meta" c={save.error ? color.text.danger : color.text.secondary}>{save.error ?? 'This is what roommates see on chores.'}</Txt>
      </View>
    </Page>
  );
}
