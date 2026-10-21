// 13 · All set: the first win after setup.
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { haptic } from '@/ui/haptics';
import { useAppState } from '@/lib/state';
import { useReducedMotion } from '@/ui/motion';
import { color } from '@/ui/tokens';
import { Avatar, Button, ChoreOption, effortKind, Page, Txt } from '@/ui/v2';

export default function Ready() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const { data } = useAppState();
  useEffect(() => { haptic.allDone(); }, []);
  const me = data?.profile.id;
  const mine = (data?.assignments ?? []).filter((a) => a.user_id === me && a.status === 'todo').sort((a, b) => a.day.localeCompare(b.day))[0];
  const chore = mine && data?.chores.find((c) => c.id === mine.chore_id);
  const when = mine && data ? (mine.day === data.today ? 'tonight' : new Date(`${mine.day}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'long' })) : '';
  const members = data?.members ?? [];
  return (
    <Page footer={<Button title="Take me home" onPress={() => router.replace('/')} />} gap={20}>
      <Animated.View entering={reduced ? undefined : ZoomIn.springify().damping(16).stiffness(420)} style={{ alignItems: 'center' }}>
        <Image source={require('../../../assets/art/all-set.png')} style={styles.art} contentFit="contain" />
      </Animated.View>
      <View style={{ gap: 8, alignItems: 'center' }}>
        <Txt v="Title/Onboarding" style={{ textAlign: 'center' }} accessibilityRole="header">{`Welcome home, ${data?.profile.name ?? ''}`}</Txt>
        <Txt v="Body/Default" c={color.text.secondary} style={{ textAlign: 'center' }}>Here’s your first chore. The rest can wait.</Txt>
      </View>
      {chore ? (
        <ChoreOption icon={chore.icon} title={chore.name} tag={effortKind(chore.effort)} meta={`Your turn · ${when}`} selected={false} onPress={() => router.replace('/')} />
      ) : (
        <View style={{ alignItems: 'center', gap: 8 }}>
          <ActivityIndicator color={color.action.primary} />
          <Txt v="Meta" c={color.text.secondary}>Your first week is being planned.</Txt>
        </View>
      )}
      <View style={styles.mates}>
        <View style={{ flexDirection: 'row' }}>
          {members.slice(0, 3).map((m, i) => <View key={m.user_id} style={{ marginLeft: i ? -8 : 0 }}><Avatar name={m.name} size={36} tint={color.bg.tint} /></View>)}
          {members.length < 3 && Array.from({ length: 3 - members.length }, (_, i) => <View key={i} style={styles.empty} />)}
        </View>
        <Txt v="Body/Default" c={color.text.secondary} style={{ flex: 1 }}>
          {members.length <= 1 ? 'Your roommates can move in with your code' : `${members.length} of you here so far`}
        </Txt>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  art: { width: 345, height: 230 },
  mates: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  empty: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(122,95,214,0.45)', marginLeft: -8 },
});
