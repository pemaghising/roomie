import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { F } from '@/constants/theme';
import { pickAndUploadAvatar, removeAvatar } from '@/lib/avatar';
import { messageOf, rpc, STATE_KEY, useMe } from '@/lib/state';
import { Avatar } from '@/ui/avatar';
import { Button, C, ErrorText, Field } from '@/ui/kit';
import { useToast } from '@/ui/toast';

export default function EditProfile() {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const { me, state } = useMe();
  const home = state.household!;
  const [name, setName] = useState(state.profile.name);
  const [homeName, setHomeName] = useState(home.name);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const path = state.profile.avatar_path;

  const refresh = () => qc.invalidateQueries({ queryKey: STATE_KEY });

  const changePhoto = async () => {
    Haptics.selectionAsync();
    setPhotoBusy(true);
    try {
      const r = await pickAndUploadAvatar(me, path);
      if (r === 'denied') toast.show('Allow photo access in your phone settings to pick a picture.');
      if (r === 'saved') { await refresh(); toast.show('Photo updated.'); }
    } catch {
      toast.show("Couldn't upload that photo. Try a smaller one.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const dropPhoto = async () => {
    if (!path) return;
    setPhotoBusy(true);
    try { await removeAvatar(path); await refresh(); } catch (e) { toast.show(messageOf(e)); } finally { setPhotoBusy(false); }
  };

  const save = async () => {
    const n = name.trim().replace(/\s+/g, ' ');
    const h = homeName.trim().replace(/\s+/g, ' ');
    if (!n) return setError('Your name can’t be empty.');
    if (!h) return setError('Give your apartment a name.');
    setBusy(true);
    try {
      if (n !== state.profile.name) await rpc('update_profile', { p_name: n });
      if (h !== home.name) await rpc('update_household', { p_name: h });
      await refresh();
      toast.show('Saved.');
      router.back();
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: '#FFF' }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Edit profile</Text>

      <View style={styles.photo}>
        <Pressable accessibilityRole="button" accessibilityLabel="Change profile photo" onPress={changePhoto} disabled={photoBusy} style={({ pressed }) => [pressed && { opacity: 0.8 }, photoBusy && { opacity: 0.5 }]}>
          <Avatar name={name || state.profile.name} color={state.profile.color} path={path} size={104} ring />
          <View style={styles.cam}><Text style={{ fontSize: 14 }}>📷</Text></View>
        </Pressable>
        <View style={styles.photoActions}>
          <Pressable onPress={changePhoto} disabled={photoBusy} hitSlop={8}><Text style={styles.link}>{path ? 'Change photo' : 'Add a photo'}</Text></Pressable>
          {path && <Pressable onPress={dropPhoto} disabled={photoBusy} hitSlop={8}><Text style={[styles.link, { color: C.danger }]}>Remove</Text></Pressable>}
        </View>
      </View>

      <Text style={styles.label}>YOUR NAME</Text>
      <Field style={styles.input} value={name} maxLength={30} autoCapitalize="words" accessibilityLabel="Your name" onChangeText={(t) => { setName(t); setError(null); }} />

      <Text style={styles.label}>APARTMENT NAME</Text>
      <Field style={styles.input} value={homeName} maxLength={40} autoCapitalize="words" accessibilityLabel="Apartment name" onChangeText={(t) => { setHomeName(t); setError(null); }} />
      <Text style={styles.hint}>Everyone in {home.name} sees this name.</Text>

      <ErrorText>{error}</ErrorText>
      <Button title="Save" onPress={save} loading={busy} disabled={photoBusy} style={{ marginTop: 22 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 24, paddingTop: 36, paddingBottom: 32 },
  title: { fontSize: 32, lineHeight: 40, color: C.text, fontFamily: F.display, marginBottom: 18 },
  photo: { alignItems: 'center', gap: 12, marginBottom: 8 },
  cam: { position: 'absolute', right: -2, bottom: -2, width: 34, height: 34, borderRadius: 17, backgroundColor: C.lavender, borderWidth: 3, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  photoActions: { flexDirection: 'row', gap: 20 },
  link: { fontSize: 15, color: C.lavenderText, fontFamily: F.semibold },
  label: { fontSize: 12, letterSpacing: 0.8, color: C.sub, fontFamily: F.bold, marginTop: 22, marginBottom: 10 },
  input: { height: 54, borderRadius: 16, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' },
  hint: { fontSize: 13, color: C.sub, fontFamily: F.regular, marginTop: 8 },
});
