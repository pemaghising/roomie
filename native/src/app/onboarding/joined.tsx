// J4 · You're in: the code matched a home; set up your days next.
import { Image } from 'expo-image';
import { Redirect, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { haptic } from '@/ui/haptics';
import { useDraft } from '@/lib/draft';
import { useAppState } from '@/lib/state';
import { useReducedMotion } from '@/ui/motion';
import { color } from '@/ui/tokens';
import { Avatar, Button, Page, Txt } from '@/ui/v2';

const TINTS = ['#FFEDE5', '#E6F0FA', '#EFE9FD', '#E9F6E1'];
const names = (list: string[]) => (list.length <= 1 ? (list[0] ?? '') : `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`);

export default function Joined() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const { preview } = useDraft();
  const me = useAppState().data?.profile.name ?? '';
  useEffect(() => { haptic.allDone(); }, []);
  if (!preview) return <Redirect href="/onboarding/join" />;
  const others = preview.members;
  return (
    <Page footer={<Button title="Set up my days" onPress={() => router.push('/onboarding/busy')} />} gap={20}>
      <Animated.View entering={reduced ? undefined : ZoomIn.springify().damping(16).stiffness(420)} style={{ alignItems: 'center' }}>
        <Image source={require('../../../assets/art/joined.png')} style={styles.art} contentFit="contain" />
      </Animated.View>
      <View style={{ gap: 8, alignItems: 'center' }}>
        <Txt v="Title/Onboarding" style={{ textAlign: 'center' }} accessibilityRole="header">{`You’re in, ${me}`}</Txt>
        <Txt v="Body/Default" c={color.text.secondary} style={{ textAlign: 'center' }}>{`Welcome to ${preview.name}.\nMake yourself at home.`}</Txt>
      </View>
      {others.length > 0 && (
        <View style={styles.mates}>
          <View style={{ flexDirection: 'row' }}>
            {[...others.slice(0, 3), me].map((n, i) => <View key={`${n}${i}`} style={{ marginLeft: i ? -8 : 0 }}><Avatar name={n} size={36} tint={TINTS[i % TINTS.length]} /></View>)}
          </View>
          <Txt v="Body/Default" c={color.text.secondary}>{`${names(others)} ${others.length === 1 ? 'is' : 'are'} here`}</Txt>
        </View>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  art: { width: 345, height: 230 },
  mates: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
});
