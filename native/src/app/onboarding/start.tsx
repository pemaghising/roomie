// 07 · New or join.
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { signOut } from '@/lib/auth';
import { updateDraft } from '@/lib/draft';
import { takePendingInvite } from '@/lib/invite';
import { color } from '@/ui/tokens';
import { Glass, Heading, Page, Tap, Txt } from '@/ui/v2';

function Path({ art, tile, title, body, chevron, onPress }: { art: number; tile: string; title: string; body: string; chevron: string; onPress: () => void }) {
  return (
    <Tap onPress={onPress} accessibilityLabel={`${title}. ${body.replace('\n', ' ')}`}>
      <Glass fill={0.62}>
        <View style={styles.path}>
          <View style={[styles.tile, { backgroundColor: tile }]}><Image source={art} style={styles.art} contentFit="contain" /></View>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt v="Body/Button">{title}</Txt>
            <Txt v="Body/Default" c={color.text.secondary}>{body}</Txt>
          </View>
          <ChevronRight size={18} color={chevron} strokeWidth={2} />
        </View>
      </Glass>
    </Tap>
  );
}

export default function Start() {
  const router = useRouter();
  // arrived through an invite link: skip the choice and go straight to joining with that code
  useEffect(() => {
    const code = takePendingInvite();
    if (code) { updateDraft({ mode: 'join', code }); router.replace('/onboarding/join'); }
  }, [router]);
  const go = (mode: 'create' | 'join') => {
    updateDraft({ mode });
    router.push(mode === 'create' ? '/onboarding/home-name' : '/onboarding/join');
  };
  return (
    <Page back={signOut} step={1}>
      <Heading title="Start or join a home" sub="Set up a new one, or move into theirs." />
      <View style={{ gap: 12 }}>
        <Path art={require('../../../assets/art/start-home.png')} tile="#EFE9FD" title="Start a home" body={'Set it up your way,\nwe keep it fair.'} chevron={color.icon.default} onPress={() => go('create')} />
        <Path art={require('../../../assets/art/join-home.png')} tile="#FFE3D3" title="Join a home" body={'Got an invite code?\nPop it in here.'} chevron={color.text.danger} onPress={() => go('join')} />
      </View>
      <Txt v="Body/Default" c={color.text.secondary} style={{ textAlign: 'center', marginTop: 8 }}>Not sure yet? You can switch homes later.</Txt>
    </Page>
  );
}

const styles = StyleSheet.create({
  path: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  tile: { width: 72, height: 72, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  art: { width: 58, height: 58 },
});
